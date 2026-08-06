from __future__ import annotations

import hashlib
import hmac
import os
import threading
import time
from abc import ABC, abstractmethod
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import cbor2
from fido2 import cbor as fido_cbor
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fido2.client import ClientError, DefaultClientDataCollector, Fido2Client, UserInteraction
from fido2.cose import ESP256_SPLIT_ARKG_PLACEHOLDER, CoseKey, ES256
from fido2.ctap import CtapError
from fido2.ctap2 import Ctap2
from fido2.ctap2.extensions import PreviewSignExtension
from fido2.ctap2.pin import ClientPin
from fido2.hid import list_devices
from fido2.server import Fido2Server
from fido2.utils import websafe_encode
from fido2.webauthn import AttestedCredentialData, AuthenticatorData, CollectedClientData

from .encoding import b64u, sha256_hex, unb64u
from .errors import HitlError

RP_ID = "localhost"
RP_NAME = "Ghost Lap"
PREVIEW_SIGN_ALGORITHM = ESP256_SPLIT_ARKG_PLACEHOLDER
PREVIEW_SIGN_ALGORITHM_NAME = "ESP256-split-ARKG"
DERIVED_SIGN_ALGORITHM = -9  # ESP256
MOCK_SIGN_ALGORITHM = -7  # Explicit software-only ES256; never hardware-labeled.
# ARKG-P256 limits ctx to 64 bytes. Ghost Lap hashes the identity and payload
# before placing them in this domain-separated context.
GHOST_ARKG_CONTEXT_PREFIX = b"hitl2://ghost-lap/replay/v1\x00"
GHOST_CHALLENGE_PREFIX = b"hitl2-webauthn-ghost-lap-v1\x00"
GHOST_MOCK_CONTEXT = b"hitl2.mock-ghost-lap.v1"
ENROLLMENT_TIMEOUT_MS = 60_000
GHOST_SIGNING_TIMEOUT_MS = 60_000


def _origin() -> str:
    raw_port = os.getenv("HITL2_PORT", "8788")
    try:
        port = int(raw_port)
    except ValueError as exc:
        raise HitlError("INVALID_PORT", "HITL2_PORT must be an integer.", status_code=500) from exc
    if not 1 <= port <= 65535:
        raise HitlError("INVALID_PORT", "HITL2_PORT is outside the valid range.", status_code=500)
    return f"http://localhost:{port}"


def get_local_origin() -> str:
    return _origin()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class SignEvidence:
    signature: bytes
    algorithm: int
    master_public_key_cose: bytes
    derived_public_key_cose: bytes
    derivation_ikm: bytes
    derivation_context: bytes
    additional_args: bytes
    assertion_credential_id: bytes
    authenticator_data: bytes
    client_data_json: bytes
    assertion_signature: bytes
    user_present: bool
    user_verified: bool
    sign_count: int


def _arkg_context(prefix: bytes, identity_fingerprint: str) -> bytes:
    try:
        fingerprint = bytes.fromhex(identity_fingerprint)
    except ValueError as exc:
        raise HitlError("IDENTITY_INVALID", "The identity fingerprint is invalid.") from exc
    if len(fingerprint) != 32:
        raise HitlError("IDENTITY_INVALID", "The identity fingerprint has the wrong length.")
    context = prefix + fingerprint
    if len(context) > 64:
        raise HitlError("DERIVATION_INVALID", "The ARKG context exceeds the 64-byte limit.")
    return context


def ghost_arkg_context(identity_fingerprint: str, payload: bytes) -> bytes:
    """Domain-separate each replay derivation from every other run."""
    try:
        fingerprint = bytes.fromhex(identity_fingerprint)
    except ValueError as exc:
        raise HitlError("IDENTITY_INVALID", "The identity fingerprint is invalid.") from exc
    if len(fingerprint) != 32:
        raise HitlError("IDENTITY_INVALID", "The identity fingerprint has the wrong length.")
    payload_bound_fingerprint = hashlib.sha256(
        b"hitl2-ghost-arkg-context-v1\x00" + fingerprint + hashlib.sha256(payload).digest()
    ).hexdigest()
    return _arkg_context(GHOST_ARKG_CONTEXT_PREFIX, payload_bound_fingerprint)


def ghost_challenge(payload: bytes) -> bytes:
    """Bind the normal WebAuthn assertion to the exact ghost payload bytes."""
    return hashlib.sha256(GHOST_CHALLENGE_PREFIX + payload).digest()


def derive_arkg_public(
    master_public_key_cose: bytes, derivation_ikm: bytes, context: bytes
) -> tuple[bytes, bytes]:
    if len(derivation_ikm) != 32:
        raise HitlError("DERIVATION_INVALID", "ARKG IKM must contain 32 random bytes.")
    try:
        master_key = validate_arkg_master_seed(master_public_key_cose)
        derived_key, additional_args = master_key.derive_public_key(derivation_ikm, context)
        if derived_key.get(3) != DERIVED_SIGN_ALGORITHM:
            raise ValueError("unexpected derived algorithm")
        return (
            fido_cbor.encode(derived_key),
            fido_cbor.encode(additional_args),
        )
    except HitlError:
        raise
    except Exception as exc:
        raise HitlError(
            "DERIVATION_INVALID",
            "ARKG public-key derivation failed.",
            status_code=409,
        ) from exc


def _attestation_error(message: str) -> HitlError:
    return HitlError(
        "PREVIEW_SIGN_ATTESTATION_INVALID",
        message,
        status_code=409,
        hint="No Ghost Lap identity was persisted.",
    )


def _validate_p256_ec2_key(value: Any, *, algorithm: int, label: str) -> None:
    if not isinstance(value, dict) or set(value) != {1, 3, -1, -2, -3}:
        raise _attestation_error(f"The {label} key has an unexpected COSE shape.")
    if value[1] != 2 or value[3] != algorithm or value[-1] != 1:
        raise _attestation_error(f"The {label} key has an unexpected COSE profile.")
    x, y = value[-2], value[-3]
    if not isinstance(x, bytes) or not isinstance(y, bytes) or len(x) != 32 or len(y) != 32:
        raise _attestation_error(f"The {label} key has invalid P-256 coordinates.")
    try:
        ec.EllipticCurvePublicNumbers(
            int.from_bytes(x, "big"), int.from_bytes(y, "big"), ec.SECP256R1()
        ).public_key()
    except ValueError as exc:
        raise _attestation_error(f"The {label} key is not a valid P-256 point.") from exc


def validate_arkg_master_seed(public_key_cose: bytes) -> CoseKey:
    """Validate the exact draft ARKG-P256 master public-seed profile."""
    try:
        value = fido_cbor.decode(public_key_cose)
    except Exception as exc:
        raise _attestation_error("The generated ARKG master key is not valid CBOR.") from exc
    if not isinstance(value, dict) or set(value) != {1, 3, -1, -2, -3}:
        raise _attestation_error("The generated ARKG master key has an unexpected COSE shape.")
    if value[1] != -65537 or value[3] != -65700 or value[-3] != DERIVED_SIGN_ALGORITHM:
        raise _attestation_error(
            "The generated ARKG master key has an unexpected algorithm profile."
        )
    _validate_p256_ec2_key(value[-1], algorithm=-7, label="ARKG blinding")
    _validate_p256_ec2_key(value[-2], algorithm=-25, label="ARKG KEM")
    try:
        return CoseKey.parse(value)
    except Exception as exc:
        raise _attestation_error("The generated ARKG master key cannot be parsed.") from exc


def validate_preview_sign_enrollment(outer_auth_data: AuthenticatorData, generated: Any) -> int:
    """Validate the nested previewSign attestation before persisting an identity."""
    if generated.algorithm != PREVIEW_SIGN_ALGORITHM:
        raise _attestation_error("The authenticator selected an unexpected signing algorithm.")
    outer_credential = outer_auth_data.credential_data
    inner_attestation = generated.attestation_object
    if inner_attestation.fmt != "none" or inner_attestation.att_stmt != {}:
        raise _attestation_error("The inner signing attestation has an unexpected format.")
    inner_auth_data = inner_attestation.auth_data
    inner_credential = inner_auth_data.credential_data
    if outer_credential is None or inner_credential is None:
        raise _attestation_error("The enrollment attestation is missing credential data.")

    expected_rp_hash = hashlib.sha256(RP_ID.encode("utf-8")).digest()
    if not hmac.compare_digest(inner_auth_data.rp_id_hash, expected_rp_hash):
        raise _attestation_error("The inner signing attestation has the wrong RP ID hash.")
    required_flags = (
        AuthenticatorData.FLAG.UP
        | AuthenticatorData.FLAG.UV
        | AuthenticatorData.FLAG.AT
        | AuthenticatorData.FLAG.ED
    )
    if inner_auth_data.flags & required_flags != required_flags:
        raise _attestation_error("The inner signing attestation lacks required UP/UV/AT/ED flags.")
    if inner_auth_data.flags != outer_auth_data.flags:
        raise _attestation_error("Inner and outer attestation flags do not match exactly.")
    backup_flags = AuthenticatorData.FLAG.BE | AuthenticatorData.FLAG.BS
    if inner_auth_data.flags & backup_flags:
        raise _attestation_error("The signing credential must not be backup eligible or backed up.")
    if inner_auth_data.counter != 0:
        raise _attestation_error("The inner signing attestation counter is not zero.")

    inner_extensions = inner_auth_data.extensions or {}
    generation_flags = inner_extensions.get(PreviewSignExtension.NAME, {}).get(4)
    if generation_flags != 0b101:
        raise _attestation_error("The signing key does not require presence plus verification.")
    outer_extensions = outer_auth_data.extensions or {}
    outer_algorithm = outer_extensions.get(PreviewSignExtension.NAME, {}).get(3)
    if outer_algorithm != generated.algorithm:
        raise _attestation_error("The outer extension algorithm does not match the generated key.")

    if inner_credential.aaguid != outer_credential.aaguid:
        raise _attestation_error("Inner and outer attestation AAGUID values do not match.")
    if not hmac.compare_digest(inner_credential.credential_id, generated.key_handle):
        raise _attestation_error("The generated key handle does not match the inner credential ID.")
    encoded_inner_key = fido_cbor.encode(inner_credential.public_key)
    if not hmac.compare_digest(encoded_inner_key, bytes(generated.public_key)):
        raise _attestation_error("The generated public key does not match the inner attestation.")
    validate_arkg_master_seed(bytes(generated.public_key))
    return generation_flags


def validate_webauthn_assertion_evidence(
    *,
    identity: dict[str, Any],
    preview_signature: bytes,
    credential_id: bytes,
    authenticator_data: bytes,
    client_data_json: bytes,
    assertion_signature: bytes,
    sign_count: int,
    expected_challenge: bytes,
) -> None:
    """Verify retained UP/UV evidence with the locally enrolled WebAuthn key."""
    try:
        credential = AttestedCredentialData(unb64u(identity["credential_data"]))
        auth_data = AuthenticatorData(authenticator_data)
        client_data = CollectedClientData(client_data_json)
    except Exception as exc:
        raise HitlError(
            "ASSERTION_EVIDENCE_INVALID",
            "The WebAuthn assertion evidence cannot be parsed.",
            status_code=409,
        ) from exc

    if not hmac.compare_digest(credential_id, credential.credential_id):
        raise HitlError(
            "ASSERTION_CREDENTIAL_MISMATCH",
            "The assertion credential does not match the enrolled identity.",
            status_code=409,
        )
    expected_rp_hash = hashlib.sha256(identity["rp_id"].encode("utf-8")).digest()
    if not hmac.compare_digest(auth_data.rp_id_hash, expected_rp_hash):
        raise HitlError(
            "ASSERTION_RP_MISMATCH", "The assertion has the wrong RP ID.", status_code=409
        )
    if not auth_data.is_user_present() or not auth_data.is_user_verified():
        raise HitlError(
            "ASSERTION_UV_MISSING",
            "The assertion lacks user presence or user verification.",
            status_code=409,
        )
    if not auth_data.flags & AuthenticatorData.FLAG.ED:
        raise HitlError(
            "ASSERTION_EXTENSION_MISSING",
            "The signed assertion has no extension data.",
            status_code=409,
        )
    if auth_data.counter != sign_count:
        raise HitlError(
            "ASSERTION_COUNTER_MISMATCH",
            "The rival counter does not match signed authenticator data.",
            status_code=409,
        )
    extensions = auth_data.extensions or {}
    signed_preview_signature = extensions.get(PreviewSignExtension.NAME, {}).get(6)
    if not isinstance(signed_preview_signature, bytes) or not hmac.compare_digest(
        signed_preview_signature, preview_signature
    ):
        raise HitlError(
            "ASSERTION_PREVIEW_SIGNATURE_MISMATCH",
            "The signed authenticator data does not contain the rival previewSign signature.",
            status_code=409,
        )

    if client_data.type != CollectedClientData.TYPE.GET:
        raise HitlError(
            "ASSERTION_TYPE_MISMATCH",
            "The client data is not a WebAuthn assertion.",
            status_code=409,
        )
    expected_origin = identity.get("origin")
    if not expected_origin or expected_origin != _origin() or client_data.origin != expected_origin:
        raise HitlError(
            "ASSERTION_ORIGIN_MISMATCH",
            "The assertion has the wrong local origin.",
            status_code=409,
        )
    if client_data.cross_origin:
        raise HitlError(
            "ASSERTION_CROSS_ORIGIN",
            "Cross-origin assertion evidence is not accepted.",
            status_code=409,
        )
    if not hmac.compare_digest(client_data.challenge, expected_challenge):
        raise HitlError(
            "ASSERTION_CHALLENGE_MISMATCH",
            "The normal WebAuthn assertion is not bound to the exact signed payload bytes.",
            status_code=409,
        )
    try:
        credential.public_key.verify(bytes(auth_data) + client_data.hash, assertion_signature)
    except Exception as exc:
        raise HitlError(
            "ASSERTION_SIGNATURE_INVALID",
            "The normal WebAuthn credential signature is invalid.",
            status_code=409,
        ) from exc


class SigningBackend(ABC):
    mode: str
    assurance: str

    @abstractmethod
    def status(self) -> dict[str, Any]: ...

    @abstractmethod
    def set_initial_pin(self, pin: str) -> dict[str, Any]: ...

    @abstractmethod
    def enroll(self, pin: str) -> dict[str, Any]: ...

    @abstractmethod
    def sign_ghost(self, identity: dict[str, Any], payload: bytes, pin: str) -> SignEvidence:
        """Sign a domain-separated Ghost Lap replay."""
        ...


class _FixedPinInteraction(UserInteraction):
    def __init__(self, pin: str) -> None:
        self._pin = pin

    def prompt_up(self) -> None:
        # The HTTP request is intentionally left pending while the UI instructs touch.
        return None

    def request_pin(self, permissions, rp_id):
        return self._pin

    def request_uv(self, permissions, rp_id):
        return True


def _fido_error(exc: Exception) -> HitlError:
    if isinstance(exc, ClientError):
        if isinstance(exc.cause, Exception):
            return _fido_error(exc.cause)
        if exc.code == ClientError.ERR.TIMEOUT:
            return HitlError(
                "TOUCH_TIMEOUT",
                "The YubiKey operation timed out before confirmation.",
                status_code=408,
                hint="Try again and touch the flashing key.",
            )
        if exc.code == ClientError.ERR.DEVICE_INELIGIBLE:
            return HitlError(
                "CREDENTIAL_NOT_ON_KEY",
                "The connected YubiKey does not contain the enrolled credential.",
                status_code=409,
                hint="Reconnect the YubiKey used for enrollment.",
            )
        return HitlError(
            "FIDO_CLIENT_FAILED",
            f"The local FIDO client rejected the operation ({exc.code.name}).",
            status_code=409,
        )
    if isinstance(exc, CtapError):
        name = getattr(exc.code, "name", str(exc.code))
        if name == "PIN_INVALID":
            return HitlError(
                "INVALID_PIN",
                "The YubiKey rejected that PIN.",
                status_code=401,
                hint="Do not retry blindly; check the remaining retry count in status.",
            )
        if name in {"PIN_BLOCKED", "PIN_AUTH_BLOCKED", "UV_BLOCKED"}:
            return HitlError(
                "PIN_BLOCKED",
                "YubiKey user verification is blocked.",
                status_code=423,
                hint="Power-cycle the key if temporarily blocked. A fully blocked PIN requires vendor recovery guidance.",
            )
        if name in {"KEEPALIVE_CANCEL", "ACTION_TIMEOUT", "USER_ACTION_TIMEOUT"}:
            return HitlError(
                "TOUCH_TIMEOUT",
                "The YubiKey operation timed out before confirmation.",
                status_code=408,
                hint="Try again and touch the flashing key.",
            )
        if name in {"UNSUPPORTED_ALGORITHM", "UNSUPPORTED_EXTENSION"}:
            return HitlError(
                "PREVIEW_SIGN_UNSUPPORTED",
                "This authenticator does not support the required previewSign ARKG profile.",
                status_code=409,
            )
        return HitlError(
            "YUBIKEY_OPERATION_FAILED",
            f"The YubiKey rejected the operation ({name}).",
            status_code=409,
        )
    if isinstance(exc, HitlError):
        return exc
    return HitlError(
        "YUBIKEY_OPERATION_FAILED",
        "The YubiKey operation failed.",
        status_code=500,
        hint="Reconnect the key and inspect status. Sensitive device errors are not echoed.",
    )


class YubiKeyPreviewSignBackend(SigningBackend):
    """python-fido2 2.2.1 adapter for the draft previewSign v4 extension."""

    mode = "hardware"
    assurance = "LOCAL_PREVIEW_SIGN_UP_UV"

    def __init__(self) -> None:
        self._hardware_lock = threading.Lock()
        self._pin_cooldown_until = 0.0

    @contextmanager
    def _claim_hardware(self):
        if not self._hardware_lock.acquire(blocking=False):
            raise HitlError(
                "DEVICE_BUSY",
                "Another Ghost Lap request is already using the authenticator.",
                status_code=409,
                hint="Wait for the current touch ceremony or status check to finish, then retry.",
            )
        try:
            yield
        finally:
            self._hardware_lock.release()

    def _check_pin_cooldown(self) -> None:
        remaining = self._pin_cooldown_until - time.monotonic()
        if remaining > 0:
            raise HitlError(
                "PIN_COOLDOWN",
                "Wait briefly before another PIN-bearing hardware request.",
                status_code=429,
                hint=f"Retry in about {max(1, int(remaining + 0.999))} seconds.",
            )

    def _translated_hardware_error(self, exc: Exception) -> HitlError:
        error = _fido_error(exc)
        if error.code == "INVALID_PIN":
            self._pin_cooldown_until = max(self._pin_cooldown_until, time.monotonic() + 5.0)
        elif error.code == "PIN_BLOCKED":
            self._pin_cooldown_until = max(self._pin_cooldown_until, time.monotonic() + 30.0)
        return error

    def _open_one(self):
        try:
            devices = list(list_devices())
        except Exception as exc:
            raise HitlError(
                "YUBIKEY_UNAVAILABLE",
                "Could not access a FIDO authenticator over USB.",
                status_code=503,
                hint="Reconnect the YubiKey and check this process's USB/FIDO HID permissions.",
            ) from exc
        if not devices:
            raise HitlError(
                "YUBIKEY_NOT_FOUND",
                "No USB FIDO authenticator is connected.",
                status_code=503,
                hint="Insert the YubiKey 5.8 and try again.",
            )
        if len(devices) > 1:
            for device in devices:
                device.close()
            raise HitlError(
                "MULTIPLE_AUTHENTICATORS",
                "More than one USB FIDO authenticator is connected.",
                status_code=409,
                hint="Leave only the YubiKey intended for this Ghost Lap identity connected.",
            )
        return devices[0]

    @staticmethod
    def _client(device, pin: str, origin: str) -> Fido2Client:
        return Fido2Client(
            device,
            client_data_collector=DefaultClientDataCollector(origin),
            user_interaction=_FixedPinInteraction(pin),
            extensions=[PreviewSignExtension()],
        )

    @staticmethod
    def _server(timeout_ms: int) -> Fido2Server:
        server = Fido2Server({"id": RP_ID, "name": RP_NAME}, attestation="none")
        server.timeout = timeout_ms
        return server

    def status(self) -> dict[str, Any]:
        try:
            with self._claim_hardware():
                device = self._open_one()
                try:
                    ctap = Ctap2(device)
                    info = ctap.info
                    configured = info.options.get("clientPin") is True
                    retries = None
                    if configured:
                        try:
                            retries = ClientPin(ctap).get_pin_retries()[0]
                        except Exception:
                            retries = None
                    version_tuple = getattr(device, "device_version", None)
                    firmware = (
                        ".".join(str(part) for part in version_tuple) if version_tuple else None
                    )
                    return {
                        "connected": True,
                        "transport": "usb",
                        "product_name": getattr(device, "product_name", None),
                        "firmware_version": firmware,
                        "aaguid": bytes(info.aaguid).hex(),
                        "versions": list(info.versions),
                        "extensions": list(info.extensions),
                        "options": dict(info.options),
                        "capabilities": {
                            "ctap_2_3": "FIDO_2_3" in info.versions,
                            "preview_sign": PreviewSignExtension.NAME in info.extensions,
                            "third_party_payment": "thirdPartyPayment" in info.extensions,
                            "hmac_secret_mc": "hmac-secret-mc" in info.extensions,
                        },
                        "pin": {
                            "supported": "clientPin" in info.options,
                            "configured": configured,
                            "minimum_length": info.min_pin_length,
                            "maximum_length": info.max_pin_length,
                            "retries": retries,
                        },
                    }
                finally:
                    device.close()
        except HitlError as exc:
            return {
                "connected": False,
                "error": exc.detail(),
                "capabilities": {
                    "ctap_2_3": False,
                    "preview_sign": False,
                    "third_party_payment": False,
                    # This CTAP option is a capability boolean, not stored key material.
                    "hmac_secret_mc": False,  # nosec B105
                },
                "pin": {"supported": False, "configured": False, "retries": None},
            }
        except Exception:
            unavailable = HitlError(
                "YUBIKEY_UNAVAILABLE",
                "The USB FIDO authenticator became unavailable during discovery.",
                status_code=503,
                hint="Reconnect the key and check this process's USB/FIDO HID permissions.",
            )
            return {
                "connected": False,
                "error": unavailable.detail(),
                "capabilities": {
                    "ctap_2_3": False,
                    "preview_sign": False,
                    "third_party_payment": False,
                    # This CTAP option is a capability boolean, not stored key material.
                    "hmac_secret_mc": False,  # nosec B105
                },
                "pin": {"supported": False, "configured": False, "retries": None},
            }

    def set_initial_pin(self, pin: str) -> dict[str, Any]:
        with self._claim_hardware():
            device = self._open_one()
            try:
                ctap = Ctap2(device)
                info = ctap.info
                if "FIDO_2_3" not in info.versions:
                    raise HitlError(
                        "CTAP_2_3_UNSUPPORTED",
                        "The connected authenticator does not advertise FIDO 2.3; its PIN was not changed.",
                        status_code=409,
                    )
                if PreviewSignExtension.NAME not in info.extensions:
                    raise HitlError(
                        "PREVIEW_SIGN_UNSUPPORTED",
                        "The connected authenticator does not advertise previewSign; its PIN was not changed.",
                        status_code=409,
                    )
                if info.options.get("clientPin") is True:
                    raise HitlError(
                        "PIN_ALREADY_SET",
                        "A FIDO PIN is already configured; Ghost Lap will never reset or change it.",
                        status_code=409,
                    )
                if "clientPin" not in info.options:
                    raise HitlError(
                        "PIN_UNSUPPORTED",
                        "This authenticator does not support a FIDO PIN.",
                        status_code=409,
                    )
                if len(pin) < info.min_pin_length or len(pin) > info.max_pin_length:
                    raise HitlError(
                        "PIN_LENGTH",
                        f"PIN must be {info.min_pin_length}–{info.max_pin_length} characters.",
                    )
                ClientPin(ctap).set_pin(pin)
                return {"configured": True, "minimum_length": info.min_pin_length}
            except Exception as exc:
                raise _fido_error(exc) from exc
            finally:
                device.close()

    def enroll(self, pin: str) -> dict[str, Any]:
        with self._claim_hardware():
            self._check_pin_cooldown()
            device = self._open_one()
            try:
                ctap = Ctap2(device)
                if "FIDO_2_3" not in ctap.info.versions:
                    raise HitlError(
                        "CTAP_2_3_UNSUPPORTED",
                        "The connected authenticator does not advertise FIDO 2.3.",
                        status_code=409,
                    )
                if PreviewSignExtension.NAME not in ctap.info.extensions:
                    raise HitlError(
                        "PREVIEW_SIGN_UNSUPPORTED",
                        "The connected authenticator does not advertise previewSign.",
                        status_code=409,
                    )
                if ctap.info.options.get("clientPin") is not True:
                    raise HitlError(
                        "PIN_REQUIRED",
                        "Configure a FIDO PIN before enrolling a require-UV signing key.",
                        status_code=409,
                    )

                server = self._server(ENROLLMENT_TIMEOUT_MS)
                user_id = os.urandom(32)
                options, state = server.register_begin(
                    {"id": user_id, "name": "hitl2-local-operator"},
                    resident_key_requirement="discouraged",
                    user_verification="required",
                    authenticator_attachment="cross-platform",
                )
                origin = _origin()
                result = self._client(device, pin, origin).make_credential(
                    {
                        **options["publicKey"],
                        "extensions": {
                            PreviewSignExtension.NAME: {
                                "generateKey": {"algorithms": [PREVIEW_SIGN_ALGORITHM]}
                            }
                        },
                    }
                )
                auth_data = server.register_complete(state, result)
                credential = auth_data.credential_data
                if credential is None:
                    raise HitlError(
                        "ENROLLMENT_INVALID", "The authenticator returned no credential."
                    )

                # Attribute access preserves the rich extension dataclasses and bytes;
                # Mapping access intentionally JSON-serializes them.
                ext_output = result.client_extension_results.previewSign
                generated = getattr(ext_output, "generated_key", None)
                if generated is None:
                    raise HitlError(
                        "PREVIEW_SIGN_ENROLLMENT_FAILED",
                        "The credential was created without a previewSign key.",
                        status_code=409,
                    )
                generation_flags = validate_preview_sign_enrollment(auth_data, generated)

                public_key_cose = bytes(generated.public_key)
                # Parse once at enrollment so an unusable ARKG seed is never persisted.
                derive_arkg_public(public_key_cose, os.urandom(32), b"hitl2.enrollment-check.v1")
                fingerprint = sha256_hex(
                    b"hitl2-identity-v1\x00" + public_key_cose + credential.credential_id
                )
                return {
                    "schema": "hitl2.identity.v1",
                    "mode": self.mode,
                    "assurance": self.assurance,
                    "created_at": _now_iso(),
                    "rp_id": RP_ID,
                    "origin": origin,
                    "user_id": b64u(user_id),
                    "fingerprint": fingerprint,
                    "aaguid": bytes(credential.aaguid).hex(),
                    "credential_id": b64u(credential.credential_id),
                    "credential_data": b64u(bytes(credential)),
                    "preview_sign": {
                        "version": "4-SNAPSHOT-2025-08-21T15:00",
                        "algorithm": PREVIEW_SIGN_ALGORITHM,
                        "algorithm_name": PREVIEW_SIGN_ALGORITHM_NAME,
                        "key_handle": b64u(generated.key_handle),
                        "public_key_cose": b64u(public_key_cose),
                        "attestation_object": b64u(bytes(generated.attestation_object)),
                        "generation_flags": generation_flags,
                        "required_flags": {"user_presence": True, "user_verification": True},
                    },
                }
            except Exception as exc:
                raise self._translated_hardware_error(exc) from exc
            finally:
                device.close()

    def sign_ghost(self, identity: dict[str, Any], payload: bytes, pin: str) -> SignEvidence:
        return self._sign(
            identity,
            payload,
            pin,
            derivation_context=ghost_arkg_context(identity["fingerprint"], payload),
            challenge=ghost_challenge(payload),
        )

    def _sign(
        self,
        identity: dict[str, Any],
        payload: bytes,
        pin: str,
        *,
        derivation_context: bytes,
        challenge: bytes,
    ) -> SignEvidence:
        with self._claim_hardware():
            self._check_pin_cooldown()
            device = self._open_one()
            try:
                ctap = Ctap2(device)
                if PreviewSignExtension.NAME not in ctap.info.extensions:
                    raise HitlError(
                        "PREVIEW_SIGN_UNSUPPORTED",
                        "The connected authenticator does not advertise previewSign.",
                        status_code=409,
                    )
                credential = AttestedCredentialData(unb64u(identity["credential_data"]))
                preview = identity["preview_sign"]
                if preview["algorithm"] != PREVIEW_SIGN_ALGORITHM:
                    raise HitlError(
                        "IDENTITY_PROFILE_UNSUPPORTED",
                        "The enrolled identity does not use the require-UV ARKG profile.",
                        status_code=409,
                    )

                master_public_key_cose = unb64u(preview["public_key_cose"])
                derivation_ikm = os.urandom(32)
                derived_public_key_cose, additional_args = derive_arkg_public(
                    master_public_key_cose, derivation_ikm, derivation_context
                )

                server = self._server(GHOST_SIGNING_TIMEOUT_MS)
                options, state = server.authenticate_begin(
                    [credential],
                    user_verification="required",
                    challenge=challenge,
                )
                selection = self._client(device, pin, identity["origin"]).get_assertion(
                    {
                        **options["publicKey"],
                        "extensions": {
                            PreviewSignExtension.NAME: {
                                "signByCredential": {
                                    websafe_encode(credential.credential_id): {
                                        "keyHandle": unb64u(preview["key_handle"]),
                                        "tbs": hashlib.sha256(payload).digest(),
                                        "additionalArgs": additional_args,
                                    }
                                }
                            }
                        },
                    }
                )
                response = selection.get_response(0)
                server.authenticate_complete(state, [credential], response)
                ext_output = response.client_extension_results.previewSign
                signature = getattr(ext_output, "signature", None)
                if signature is None:
                    raise HitlError(
                        "PREVIEW_SIGN_OUTPUT_MISSING",
                        "The YubiKey assertion did not contain a previewSign signature.",
                        status_code=409,
                    )
                auth_data = response.response.authenticator_data
                if not auth_data.is_user_present() or not auth_data.is_user_verified():
                    raise HitlError(
                        "USER_VERIFICATION_MISSING",
                        "The assertion did not prove both user presence and verification.",
                        status_code=409,
                    )
                return SignEvidence(
                    signature=bytes(signature),
                    algorithm=PREVIEW_SIGN_ALGORITHM,
                    master_public_key_cose=master_public_key_cose,
                    derived_public_key_cose=derived_public_key_cose,
                    derivation_ikm=derivation_ikm,
                    derivation_context=derivation_context,
                    additional_args=additional_args,
                    assertion_credential_id=bytes(response.raw_id),
                    authenticator_data=bytes(auth_data),
                    client_data_json=bytes(response.response.client_data),
                    assertion_signature=bytes(response.response.signature),
                    user_present=True,
                    user_verified=True,
                    sign_count=auth_data.counter,
                )
            except Exception as exc:
                raise self._translated_hardware_error(exc) from exc
            finally:
                device.close()


class SoftwareMockBackend(SigningBackend):
    """Explicitly insecure development mode. Never selected as an automatic fallback."""

    mode = "mock"
    assurance = "MOCK_SOFTWARE_DO_NOT_TRUST"

    def __init__(self) -> None:
        self._hardware_lock = threading.RLock()
        self._pin_configured = False
        self._pin_salt: bytes | None = None
        self._pin_verifier: bytes | None = None

    def _check_pin(self, pin: str) -> None:
        if not self._pin_configured or self._pin_salt is None or self._pin_verifier is None:
            raise HitlError("PIN_REQUIRED", "Configure the mock PIN first.", status_code=409)
        supplied = hashlib.scrypt(
            pin.encode("utf-8"), salt=self._pin_salt, n=2**14, r=8, p=1, dklen=32
        )
        if not hmac.compare_digest(supplied, self._pin_verifier):
            raise HitlError("INVALID_PIN", "The mock signer rejected that PIN.", status_code=401)

    def status(self) -> dict[str, Any]:
        return {
            "connected": True,
            "transport": "software",
            "product_name": "Ghost Lap explicit software mock",
            "firmware_version": "mock",
            "aaguid": "00" * 16,
            "versions": ["MOCK_CTAP_2_3"],
            "extensions": [PreviewSignExtension.NAME],
            "options": {"clientPin": self._pin_configured},
            "capabilities": {
                "ctap_2_3": True,
                "preview_sign": True,
                "third_party_payment": False,
                # This CTAP option is a capability boolean, not stored key material.
                "hmac_secret_mc": False,  # nosec B105
            },
            "pin": {
                "supported": True,
                "configured": self._pin_configured,
                "minimum_length": 4,
                "maximum_length": 63,
                "retries": 8,
            },
        }

    def set_initial_pin(self, pin: str) -> dict[str, Any]:
        with self._hardware_lock:
            if self._pin_configured:
                raise HitlError(
                    "PIN_ALREADY_SET", "The mock PIN is already configured.", status_code=409
                )
            if not 4 <= len(pin) <= 63:
                raise HitlError("PIN_LENGTH", "PIN must be 4–63 characters.")
            self._pin_salt = os.urandom(16)
            self._pin_verifier = hashlib.scrypt(
                pin.encode("utf-8"), salt=self._pin_salt, n=2**14, r=8, p=1, dklen=32
            )
            self._pin_configured = True
            return {"configured": True, "minimum_length": 4}

    def enroll(self, pin: str) -> dict[str, Any]:
        with self._hardware_lock:
            self._check_pin(pin)
            private_key = ec.generate_private_key(ec.SECP256R1())
            private_bytes = private_key.private_bytes(
                serialization.Encoding.DER,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
            public_cose = cbor2.dumps(
                ES256.from_cryptography_key(private_key.public_key()), canonical=True
            )
            credential_id = os.urandom(32)
            fingerprint = sha256_hex(b"hitl2-identity-v1\x00" + public_cose + credential_id)
            return {
                "schema": "hitl2.identity.v1",
                "mode": self.mode,
                "assurance": self.assurance,
                "created_at": _now_iso(),
                "rp_id": RP_ID,
                "origin": _origin(),
                "user_id": b64u(os.urandom(32)),
                "fingerprint": fingerprint,
                "aaguid": "00" * 16,
                "credential_id": b64u(credential_id),
                "credential_data": b64u(credential_id),
                "preview_sign": {
                    "version": "MOCK-v4",
                    "algorithm": MOCK_SIGN_ALGORITHM,
                    "algorithm_name": "ES256-mock",
                    "key_handle": b64u(os.urandom(32)),
                    "public_key_cose": b64u(public_cose),
                    "attestation_object": "",
                    "generation_flags": 0,
                    "required_flags": {"user_presence": False, "user_verification": False},
                },
                "mock_private_key": b64u(private_bytes),
                "warning": "Software key material is persisted locally. This is not hardware assurance.",
            }

    def sign_ghost(self, identity: dict[str, Any], payload: bytes, pin: str) -> SignEvidence:
        return self._sign(identity, payload, pin)

    def _sign(
        self,
        identity: dict[str, Any],
        payload: bytes,
        pin: str,
    ) -> SignEvidence:
        with self._hardware_lock:
            self._check_pin(pin)
            private_key = serialization.load_der_private_key(
                unb64u(identity["mock_private_key"]), password=None
            )
            if not isinstance(private_key, ec.EllipticCurvePrivateKey):
                raise HitlError(
                    "MOCK_KEY_INVALID", "The persisted mock key is invalid.", status_code=500
                )
            signature = private_key.sign(payload, ec.ECDSA(hashes.SHA256()))
            return SignEvidence(
                signature=signature,
                algorithm=MOCK_SIGN_ALGORITHM,
                master_public_key_cose=unb64u(identity["preview_sign"]["public_key_cose"]),
                derived_public_key_cose=unb64u(identity["preview_sign"]["public_key_cose"]),
                derivation_ikm=b"",
                derivation_context=GHOST_MOCK_CONTEXT,
                additional_args=b"",
                assertion_credential_id=b"",
                authenticator_data=b"",
                client_data_json=b"",
                assertion_signature=b"",
                user_present=False,
                user_verified=False,
                sign_count=0,
            )


def verify_cose_signature(
    public_key_cose: bytes,
    payload: bytes,
    signature: bytes,
    *,
    expected_algorithm: int,
) -> bool:
    try:
        public_key = CoseKey.parse(cbor2.loads(public_key_cose))
        if public_key.get(3) != expected_algorithm:
            return False
        public_key.verify(payload, signature)
        return True
    except Exception:
        return False


def backend_from_environment() -> SigningBackend:
    mode = os.getenv("HITL2_MODE", "hardware").strip().lower()
    if mode == "hardware":
        return YubiKeyPreviewSignBackend()
    if mode == "mock":
        return SoftwareMockBackend()
    raise RuntimeError(
        "HITL2_MODE must be 'hardware' or explicit 'mock'; no automatic fallback exists"
    )
