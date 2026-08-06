from __future__ import annotations

import copy
import hmac
import os
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

from fido2.webauthn import AttestedCredentialData

from .encoding import (
    b64u,
    canonical_cbor,
    decode_canonical_cbor,
    sha256_hex,
    unb64u,
)
from .errors import HitlError
from .hardware import (
    DERIVED_SIGN_ALGORITHM,
    GHOST_MOCK_CONTEXT,
    MOCK_SIGN_ALGORITHM,
    PREVIEW_SIGN_ALGORITHM,
    PREVIEW_SIGN_ALGORITHM_NAME,
    SigningBackend,
    derive_arkg_public,
    get_local_origin,
    ghost_arkg_context,
    ghost_challenge,
    validate_arkg_master_seed,
    verify_cose_signature,
    validate_webauthn_assertion_evidence,
)
from .store import SQLiteStore

# Ghost Lap is a deliberately tiny deterministic replay profile. The server owns
# all physics metadata; clients submit only accepted ground-jump or airborne-flap presses.
GHOST_ARTIFACT_SCHEMA = "hitl2.ghost.v1"
GHOST_PAYLOAD_SCHEMA = "hitl2.ghost-replay.v1"
GHOST_PAYLOAD_DOMAIN = "hitl2.ghost-lap.replay"
GHOST_ROUTE_COURSE_IDS = frozenset(
    {
        "original-trail.v1",
        "moonlit-marsh.v1",
        "orchard-bounce.v1",
        "snowcap-slide.v1",
        "haywire-farm.v1",
        "firefly-hollow.v1",
    }
)
GHOST_COURSE_ID = "original-trail.v1"
GHOST_SUPPORTED_COURSE_IDS = GHOST_ROUTE_COURSE_IDS
GHOST_PHYSICS_VERSION = "ghost-lap.physics.v3"
GHOST_TICK_MS = 20
GHOST_MIN_FINISH_TICK = 250
GHOST_MAX_FINISH_TICK = 3_000
GHOST_MAX_PRESS_TICKS = 256
MAX_GHOST_PAYLOAD_BYTES = 4 * 1024
CURRENT_HARDWARE_ASSURANCE = "LOCAL_PREVIEW_SIGN_UP_UV"

GHOST_REPLAY_FIELDS = frozenset(
    {"course_id", "physics_version", "tick_ms", "finish_tick", "press_ticks"}
)
GHOST_PAYLOAD_FIELDS = frozenset(
    {"schema", "version", "domain", "run_id", "issued_at", "replay", "signer"}
)
GHOST_ARTIFACT_FIELDS = frozenset(
    {
        "schema",
        "run_id",
        "issued_at",
        "replay",
        "mode",
        "assurance",
        "identity_fingerprint",
        "aaguid",
        "credential_id",
        "preview_sign_version",
        "algorithm",
        "algorithm_name",
        "derived_algorithm",
        "derived_algorithm_name",
        "derivation_scheme",
        "master_public_key_cose",
        "derived_public_key_cose",
        "derived_key_fingerprint",
        "derivation_ikm",
        "derivation_context",
        "additional_args",
        "assertion_credential_id",
        "assertion_authenticator_data",
        "assertion_client_data_json",
        "assertion_signature",
        "signature",
        "user_present",
        "user_verified",
        "sign_count",
        "payload_cbor",
        "payload_sha256",
    }
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def isoformat(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _validated_ghost_replay(replay: Any) -> dict[str, Any]:
    if not isinstance(replay, dict) or set(replay) != GHOST_REPLAY_FIELDS:
        raise HitlError(
            "GHOST_REPLAY_INVALID",
            "Replay data must contain exactly the supported Ghost Lap fields.",
            status_code=422,
        )
    course_id = replay.get("course_id")
    if type(course_id) is not str or course_id not in GHOST_SUPPORTED_COURSE_IDS:
        raise HitlError(
            "GHOST_COURSE_UNSUPPORTED",
            "The capture course is not a supported, versioned Ghost Lap route.",
            status_code=422,
            extra={"course_ids": sorted(GHOST_SUPPORTED_COURSE_IDS)},
        )
    if replay.get("physics_version") != GHOST_PHYSICS_VERSION:
        raise HitlError(
            "GHOST_PHYSICS_UNSUPPORTED",
            f"Only physics profile '{GHOST_PHYSICS_VERSION}' is supported.",
            status_code=422,
        )
    tick_ms = replay.get("tick_ms")
    finish_tick = replay.get("finish_tick")
    press_ticks = replay.get("press_ticks")
    if type(tick_ms) is not int or tick_ms != GHOST_TICK_MS:
        raise HitlError(
            "GHOST_TICK_RATE_UNSUPPORTED",
            f"Ghost Lap replays must use exactly {GHOST_TICK_MS} ms ticks (50 Hz).",
            status_code=422,
        )
    if type(finish_tick) is not int or not (
        GHOST_MIN_FINISH_TICK <= finish_tick <= GHOST_MAX_FINISH_TICK
    ):
        raise HitlError(
            "GHOST_DURATION_INVALID",
            f"finish_tick must be {GHOST_MIN_FINISH_TICK}–{GHOST_MAX_FINISH_TICK}.",
            status_code=422,
        )
    if not isinstance(press_ticks, list) or len(press_ticks) > GHOST_MAX_PRESS_TICKS:
        raise HitlError(
            "GHOST_PRESSES_INVALID",
            f"press_ticks must be a list containing at most {GHOST_MAX_PRESS_TICKS} events.",
            status_code=422,
        )
    if any(type(tick) is not int for tick in press_ticks):
        raise HitlError(
            "GHOST_PRESSES_INVALID",
            "Every accepted press tick must be an integer (booleans are not accepted).",
            status_code=422,
        )
    if any(tick < 0 or tick >= finish_tick for tick in press_ticks):
        raise HitlError(
            "GHOST_PRESSES_INVALID",
            "Every accepted press tick must fall inside the recorded lap.",
            status_code=422,
        )
    if any(left >= right for left, right in zip(press_ticks, press_ticks[1:])):
        raise HitlError(
            "GHOST_PRESSES_INVALID",
            "press_ticks must be strictly increasing and contain no duplicates.",
            status_code=422,
        )
    return {
        "course_id": course_id,
        "physics_version": GHOST_PHYSICS_VERSION,
        "tick_ms": GHOST_TICK_MS,
        "finish_tick": finish_tick,
        "press_ticks": list(press_ticks),
    }


def _decode_ghost_b64(value: Any, *, field: str, maximum: int) -> bytes:
    if not isinstance(value, str) or len(value) > ((maximum + 2) // 3) * 4:
        raise HitlError("GHOST_ENCODING_INVALID", f"{field} has an invalid encoding.")
    decoded = unb64u(value)
    if len(decoded) > maximum or b64u(decoded) != value:
        raise HitlError("GHOST_ENCODING_INVALID", f"{field} has an invalid encoding.")
    return decoded


def _ghost_signer(identity: dict[str, Any]) -> dict[str, Any]:
    return {
        "identity_fingerprint": identity["fingerprint"],
        "mode": identity["mode"],
        "assurance": identity["assurance"],
        "rp_id": identity["rp_id"],
        "origin": identity["origin"],
        "algorithm": identity["preview_sign"]["algorithm"],
    }


def _public_identity(identity: dict[str, Any] | None) -> dict[str, Any] | None:
    if not identity:
        return None
    return {
        "schema": identity["schema"],
        "mode": identity["mode"],
        "assurance": identity["assurance"],
        "created_at": identity["created_at"],
        "rp_id": identity["rp_id"],
        "origin": identity.get("origin"),
        "fingerprint": identity["fingerprint"],
        "preview_sign": {
            "algorithm": identity["preview_sign"]["algorithm"],
            "algorithm_name": identity["preview_sign"]["algorithm_name"],
            "generation_flags": identity["preview_sign"]["generation_flags"],
            "required_flags": identity["preview_sign"]["required_flags"],
            "version": identity["preview_sign"]["version"],
        },
        **({"warning": identity["warning"]} if identity.get("warning") else {}),
    }


def _identity_policy_ok(identity: dict[str, Any] | None, backend_mode: str) -> bool:
    if not identity or identity.get("mode") != backend_mode:
        return False
    preview = identity.get("preview_sign", {})
    expected_algorithm = (
        PREVIEW_SIGN_ALGORITHM if backend_mode == "hardware" else MOCK_SIGN_ALGORITHM
    )
    if preview.get("algorithm") != expected_algorithm:
        return False
    if backend_mode == "hardware":
        flags = preview.get("required_flags", {})
        basics_ok = bool(
            identity.get("schema") == "hitl2.identity.v1"
            and identity.get("assurance") == CURRENT_HARDWARE_ASSURANCE
            and identity.get("rp_id") == "localhost"
            and identity.get("origin") == get_local_origin()
            and preview.get("generation_flags") == 0b101
            and flags.get("user_presence") is True
            and flags.get("user_verification") is True
        )
        if not basics_ok:
            return False
        try:
            master_public_key = unb64u(preview["public_key_cose"])
            credential_id = unb64u(identity["credential_id"])
            credential = AttestedCredentialData(unb64u(identity["credential_data"]))
            validate_arkg_master_seed(master_public_key)
            expected_fingerprint = sha256_hex(
                b"hitl2-identity-v1\x00" + master_public_key + credential_id
            )
            return bool(
                hmac.compare_digest(credential.credential_id, credential_id)
                and bytes(credential.aaguid).hex() == identity.get("aaguid")
                and hmac.compare_digest(expected_fingerprint, identity["fingerprint"])
            )
        except (HitlError, KeyError, TypeError, ValueError):
            return False
    return bool(
        identity.get("assurance") == "MOCK_SOFTWARE_DO_NOT_TRUST"
        and identity.get("origin") == get_local_origin()
    )


class HitlService:
    def __init__(
        self,
        store: SQLiteStore,
        backend: SigningBackend,
        *,
        clock: Callable[[], datetime] = utc_now,
    ) -> None:
        self.store = store
        self.backend = backend
        self.clock = clock
        # Keep the identity check, hardware enrollment, and persistence in one
        # in-process critical section. Otherwise two simultaneous requests can
        # create an unused extra credential before SQLite rejects the loser.
        self._enrollment_lock = threading.Lock()

    def status(self) -> dict[str, Any]:
        state = self.store.snapshot()
        hardware = self.backend.status()
        identity = _public_identity(state["identity"])
        preview_supported = hardware.get("capabilities", {}).get("preview_sign", False)
        ctap_23_supported = hardware.get("capabilities", {}).get("ctap_2_3", False)
        pin_configured = hardware.get("pin", {}).get("configured", False)
        backend_mode_matches_identity = bool(identity and identity["mode"] == self.backend.mode)
        signing_policy_ok = _identity_policy_ok(state["identity"], self.backend.mode)
        ready = bool(
            hardware.get("connected")
            and preview_supported
            and ctap_23_supported
            and pin_configured
            and identity
            and backend_mode_matches_identity
            and signing_policy_ok
        )
        public_hardware = {
            key: copy.deepcopy(hardware[key])
            for key in (
                "connected",
                "transport",
                "product_name",
                "firmware_version",
                "capabilities",
                "pin",
                "error",
            )
            if key in hardware
        }
        status_identity = (
            {
                "mode": identity["mode"],
                "assurance": identity["assurance"],
                "created_at": identity["created_at"],
            }
            if identity
            else None
        )
        return {
            "name": "Ghost Lap",
            "version": "0.1.0",
            "mode": self.backend.mode,
            "assurance": self.backend.assurance,
            "mock": self.backend.mode == "mock",
            "hardware": public_hardware,
            "pin": hardware.get("pin", {}),
            "enrolled": identity is not None,
            "identity": status_identity,
            "ready": ready,
            "backend_mode_matches_identity": (backend_mode_matches_identity if identity else None),
            "signing_policy_ok": signing_policy_ok if identity else None,
            "security": {
                "require_user_verification": self.backend.mode == "hardware",
                "require_user_presence": self.backend.mode == "hardware",
                "algorithm": (
                    PREVIEW_SIGN_ALGORITHM
                    if self.backend.mode == "hardware"
                    else MOCK_SIGN_ALGORITHM
                ),
                "algorithm_name": (
                    PREVIEW_SIGN_ALGORITHM_NAME if self.backend.mode == "hardware" else "ES256-mock"
                ),
                "exact_payload_signing": True,
                "trust_model": "local-tofu",
                "manufacturer_attested": False,
                "connected_key_identity_preflight": False,
            },
        }

    def set_initial_pin(self, pin: str) -> dict[str, Any]:
        # PIN is passed directly to the backend and is never persisted or logged.
        return self.backend.set_initial_pin(pin)

    def enroll(self, pin: str) -> dict[str, Any]:
        with self._enrollment_lock:

            def persist(state: dict[str, Any]):
                if state["identity"] is not None:
                    raise HitlError(
                        "IDENTITY_ALREADY_ENROLLED",
                        "A persistent Ghost Lap identity already exists; it will not be overwritten.",
                        status_code=409,
                    )
                # Keep the SQLite write transaction open across the ceremony.
                # That makes a second broker wait before it can create another
                # authenticator credential, not merely race at commit time.
                identity = self.backend.enroll(pin)
                state["identity"] = identity
                return _public_identity(identity)

            return self.store.update(persist)

    def sign_ghost(
        self,
        *,
        pin: str,
        course_id: str,
        tick_ms: int,
        finish_tick: int,
        press_ticks: list[int],
    ) -> dict[str, Any]:
        """Issue an intentionally replayable artifact pinned to this local identity."""
        identity = self.store.snapshot()["identity"]
        if identity is None:
            raise HitlError(
                "NOT_ENROLLED",
                "Enroll a signing identity before signing a ghost replay.",
                status_code=409,
            )
        if identity["mode"] != self.backend.mode:
            raise HitlError(
                "SIGNER_MODE_MISMATCH",
                "The persisted identity belongs to a different signer mode.",
                status_code=409,
            )
        if not _identity_policy_ok(identity, self.backend.mode):
            raise HitlError(
                "SIGNING_POLICY_MISMATCH",
                "The persisted identity does not satisfy the required signing policy.",
                status_code=409,
            )

        replay = _validated_ghost_replay(
            {
                "course_id": course_id,
                "physics_version": GHOST_PHYSICS_VERSION,
                "tick_ms": tick_ms,
                "finish_tick": finish_tick,
                "press_ticks": press_ticks,
            }
        )
        now = self.clock()
        run_id = str(uuid.uuid4())
        issued_at = isoformat(now)
        signed_payload = {
            "schema": GHOST_PAYLOAD_SCHEMA,
            "version": 1,
            "domain": GHOST_PAYLOAD_DOMAIN,
            "run_id": run_id,
            "issued_at": issued_at,
            "replay": replay,
            "signer": _ghost_signer(identity),
        }
        payload_bytes = canonical_cbor(signed_payload)
        if len(payload_bytes) > MAX_GHOST_PAYLOAD_BYTES:
            raise HitlError(
                "GHOST_PAYLOAD_TOO_LARGE",
                "The canonical ghost payload exceeds the 4 KiB limit.",
                status_code=413,
            )

        evidence = self.backend.sign_ghost(identity, payload_bytes, pin)
        self._validate_new_ghost_evidence(identity, payload_bytes, evidence)
        derived_algorithm = (
            DERIVED_SIGN_ALGORITHM if identity["mode"] == "hardware" else MOCK_SIGN_ALGORITHM
        )
        ghost = {
            "schema": GHOST_ARTIFACT_SCHEMA,
            "run_id": run_id,
            "issued_at": issued_at,
            "replay": replay,
            "mode": identity["mode"],
            "assurance": identity["assurance"],
            "identity_fingerprint": identity["fingerprint"],
            "aaguid": identity["aaguid"],
            "credential_id": identity["credential_id"],
            "preview_sign_version": identity["preview_sign"]["version"],
            "algorithm": evidence.algorithm,
            "algorithm_name": identity["preview_sign"]["algorithm_name"],
            "derived_algorithm": derived_algorithm,
            "derived_algorithm_name": (
                "ESP256" if identity["mode"] == "hardware" else "ES256-mock"
            ),
            "derivation_scheme": (
                "ARKG-P256-v1" if identity["mode"] == "hardware" else "mock-direct"
            ),
            "master_public_key_cose": identity["preview_sign"]["public_key_cose"],
            "derived_public_key_cose": b64u(evidence.derived_public_key_cose),
            "derived_key_fingerprint": sha256_hex(evidence.derived_public_key_cose),
            "derivation_ikm": b64u(evidence.derivation_ikm),
            "derivation_context": b64u(evidence.derivation_context),
            "additional_args": b64u(evidence.additional_args),
            "assertion_credential_id": b64u(evidence.assertion_credential_id),
            "assertion_authenticator_data": b64u(evidence.authenticator_data),
            "assertion_client_data_json": b64u(evidence.client_data_json),
            "assertion_signature": b64u(evidence.assertion_signature),
            "signature": b64u(evidence.signature),
            "user_present": evidence.user_present,
            "user_verified": evidence.user_verified,
            "sign_count": evidence.sign_count,
            "payload_cbor": b64u(payload_bytes),
            "payload_sha256": sha256_hex(payload_bytes),
        }
        verification = self.verify_ghost(ghost)
        if not verification["valid"]:
            raise HitlError(
                "GHOST_SELF_CHECK_FAILED",
                "The signed ghost failed the server's byte-exact verification.",
                status_code=500,
            )
        return {"ghost": ghost, "verification": verification}

    def _validate_new_ghost_evidence(
        self,
        identity: dict[str, Any],
        payload_bytes: bytes,
        evidence: Any,
    ) -> None:
        trusted_master_key = unb64u(identity["preview_sign"]["public_key_cose"])
        if evidence.algorithm != identity["preview_sign"]["algorithm"]:
            raise HitlError("SIGNATURE_PROFILE_MISMATCH", "Unexpected signature algorithm.")
        if not hmac.compare_digest(evidence.master_public_key_cose, trusted_master_key):
            raise HitlError("SIGNING_KEY_MISMATCH", "The signer did not use the enrolled key.")

        if identity["mode"] == "hardware":
            expected_context = ghost_arkg_context(identity["fingerprint"], payload_bytes)
            if not hmac.compare_digest(evidence.derivation_context, expected_context):
                raise HitlError("DERIVATION_CONTEXT_MISMATCH", "Unexpected ghost ARKG context.")
            derived_key, additional_args = derive_arkg_public(
                trusted_master_key, evidence.derivation_ikm, expected_context
            )
            if not hmac.compare_digest(
                evidence.derived_public_key_cose, derived_key
            ) or not hmac.compare_digest(evidence.additional_args, additional_args):
                raise HitlError(
                    "DERIVATION_EVIDENCE_MISMATCH",
                    "Ghost ARKG evidence does not match the enrolled master key.",
                )
            signature_valid = verify_cose_signature(
                derived_key,
                payload_bytes,
                evidence.signature,
                expected_algorithm=DERIVED_SIGN_ALGORITHM,
            )
            if not signature_valid:
                raise HitlError(
                    "SIGNATURE_SELF_CHECK_FAILED",
                    "The returned ghost signature failed verification.",
                )
            validate_webauthn_assertion_evidence(
                identity=identity,
                preview_signature=evidence.signature,
                credential_id=evidence.assertion_credential_id,
                authenticator_data=evidence.authenticator_data,
                client_data_json=evidence.client_data_json,
                assertion_signature=evidence.assertion_signature,
                sign_count=evidence.sign_count,
                expected_challenge=ghost_challenge(payload_bytes),
            )
            if not (evidence.user_present and evidence.user_verified):
                raise HitlError(
                    "USER_VERIFICATION_MISSING",
                    "Hardware ghost signing requires both user presence and PIN verification.",
                )
            return

        signature_valid = bool(
            hmac.compare_digest(evidence.derived_public_key_cose, trusted_master_key)
            and evidence.derivation_ikm == b""
            and evidence.additional_args == b""
            and evidence.derivation_context == GHOST_MOCK_CONTEXT
            and evidence.assertion_credential_id == b""
            and evidence.authenticator_data == b""
            and evidence.client_data_json == b""
            and evidence.assertion_signature == b""
            and evidence.user_present is False
            and evidence.user_verified is False
            and evidence.sign_count == 0
            and verify_cose_signature(
                trusted_master_key,
                payload_bytes,
                evidence.signature,
                expected_algorithm=MOCK_SIGN_ALGORITHM,
            )
        )
        if not signature_valid:
            raise HitlError(
                "SIGNATURE_SELF_CHECK_FAILED",
                "The returned mock ghost signature failed verification.",
            )

    def verify_ghost(self, ghost: Any) -> dict[str, Any]:
        """Verify a local-identity-pinned rival artifact without mutating broker state."""
        checks: dict[str, bool] = {}
        assertion_error_code: str | None = None
        stored_identity = self.store.snapshot()["identity"]
        identity = stored_identity
        replay: dict[str, Any] | None = None
        mode = ghost.get("mode") if isinstance(ghost, dict) else None

        try:
            checks["artifact_shape"] = bool(
                isinstance(ghost, dict) and set(ghost) == GHOST_ARTIFACT_FIELDS
            )
            if not checks["artifact_shape"]:
                raise ValueError("unexpected ghost artifact fields")
            checks["artifact_schema"] = ghost["schema"] == GHOST_ARTIFACT_SCHEMA

            payload_bytes = _decode_ghost_b64(
                ghost["payload_cbor"], field="payload_cbor", maximum=MAX_GHOST_PAYLOAD_BYTES
            )
            checks["payload_size"] = len(payload_bytes) <= MAX_GHOST_PAYLOAD_BYTES
            payload = decode_canonical_cbor(payload_bytes)
            checks["payload_canonical"] = True
            checks["payload_digest"] = bool(
                isinstance(ghost["payload_sha256"], str)
                and hmac.compare_digest(ghost["payload_sha256"], sha256_hex(payload_bytes))
            )
            checks["payload_shape"] = bool(
                isinstance(payload, dict) and set(payload) == GHOST_PAYLOAD_FIELDS
            )
            if not checks["payload_shape"]:
                raise ValueError("unexpected signed payload fields")
            checks["payload_profile"] = bool(
                payload["schema"] == GHOST_PAYLOAD_SCHEMA
                and type(payload["version"]) is int
                and payload["version"] == 1
                and payload["domain"] == GHOST_PAYLOAD_DOMAIN
            )

            run_id = payload["run_id"]
            try:
                parsed_run_id = uuid.UUID(run_id)
                checks["run_id"] = bool(parsed_run_id.version == 4 and str(parsed_run_id) == run_id)
            except (AttributeError, TypeError, ValueError):
                checks["run_id"] = False
            issued_at = payload["issued_at"]
            try:
                parsed_issued_at = datetime.fromisoformat(issued_at.replace("Z", "+00:00"))
                checks["issued_at"] = bool(
                    parsed_issued_at.utcoffset() == timedelta(0)
                    and isoformat(parsed_issued_at) == issued_at
                )
            except (AttributeError, TypeError, ValueError):
                checks["issued_at"] = False
            try:
                replay = _validated_ghost_replay(payload["replay"])
                checks["replay_profile"] = replay == payload["replay"]
            except HitlError:
                checks["replay_profile"] = False
            try:
                artifact_replay = _validated_ghost_replay(ghost["replay"])
                checks["artifact_replay_profile"] = artifact_replay == ghost["replay"]
            except HitlError:
                artifact_replay = None
                checks["artifact_replay_profile"] = False
            checks["artifact_binding"] = bool(
                replay is not None
                and artifact_replay is not None
                and ghost["run_id"] == run_id
                and ghost["issued_at"] == issued_at
                and artifact_replay == replay
            )

            checks["identity_enrolled"] = identity is not None
            checks["identity_policy"] = bool(
                identity and _identity_policy_ok(identity, self.backend.mode)
            )
            checks["trusted_identity"] = bool(
                identity
                and identity["mode"] == self.backend.mode
                and hmac.compare_digest(ghost["identity_fingerprint"], identity["fingerprint"])
                and hmac.compare_digest(
                    ghost["master_public_key_cose"],
                    identity["preview_sign"]["public_key_cose"],
                )
            )
            checks["identity_metadata"] = bool(
                identity
                and ghost["mode"] == identity["mode"]
                and ghost["assurance"] == identity["assurance"]
                and ghost["aaguid"] == identity["aaguid"]
                and ghost["credential_id"] == identity["credential_id"]
                and ghost["preview_sign_version"] == identity["preview_sign"]["version"]
                and ghost["algorithm_name"] == identity["preview_sign"]["algorithm_name"]
            )
            checks["signed_signer_metadata"] = bool(
                identity and payload["signer"] == _ghost_signer(identity)
            )
            expected_derived_algorithm = (
                DERIVED_SIGN_ALGORITHM
                if identity and identity["mode"] == "hardware"
                else MOCK_SIGN_ALGORITHM
            )
            checks["algorithm_profile"] = bool(
                identity
                and type(ghost["algorithm"]) is int
                and ghost["algorithm"] == identity["preview_sign"]["algorithm"]
                and type(ghost["derived_algorithm"]) is int
                and ghost["derived_algorithm"] == expected_derived_algorithm
                and ghost["derived_algorithm_name"]
                == ("ESP256" if identity["mode"] == "hardware" else "ES256-mock")
                and ghost["derivation_scheme"]
                == ("ARKG-P256-v1" if identity["mode"] == "hardware" else "mock-direct")
            )

            trusted_master_key = (
                unb64u(identity["preview_sign"]["public_key_cose"]) if identity else b""
            )
            derived_public_key = _decode_ghost_b64(
                ghost["derived_public_key_cose"],
                field="derived_public_key_cose",
                maximum=1_024,
            )
            derivation_ikm = _decode_ghost_b64(
                ghost["derivation_ikm"], field="derivation_ikm", maximum=64
            )
            derivation_context = _decode_ghost_b64(
                ghost["derivation_context"], field="derivation_context", maximum=64
            )
            additional_args = _decode_ghost_b64(
                ghost["additional_args"], field="additional_args", maximum=1_024
            )
            signature = _decode_ghost_b64(ghost["signature"], field="signature", maximum=256)
            checks["counter_profile"] = bool(
                type(ghost["sign_count"]) is int and 0 <= ghost["sign_count"] <= 0xFFFFFFFF
            )
            checks["derived_key_fingerprint"] = bool(
                isinstance(ghost["derived_key_fingerprint"], str)
                and hmac.compare_digest(
                    ghost["derived_key_fingerprint"], sha256_hex(derived_public_key)
                )
            )

            if identity and identity["mode"] == "hardware":
                expected_context = ghost_arkg_context(identity["fingerprint"], payload_bytes)
                checks["derivation_context"] = hmac.compare_digest(
                    derivation_context, expected_context
                )
                checks["ikm_profile"] = len(derivation_ikm) == 32
                expected_derived_key, expected_additional_args = derive_arkg_public(
                    trusted_master_key, derivation_ikm, expected_context
                )
                checks["derivation_evidence"] = bool(
                    hmac.compare_digest(derived_public_key, expected_derived_key)
                    and hmac.compare_digest(additional_args, expected_additional_args)
                )
                checks["signature"] = verify_cose_signature(
                    expected_derived_key,
                    payload_bytes,
                    signature,
                    expected_algorithm=DERIVED_SIGN_ALGORITHM,
                )
                assertion_credential_id = _decode_ghost_b64(
                    ghost["assertion_credential_id"],
                    field="assertion_credential_id",
                    maximum=1_024,
                )
                authenticator_data = _decode_ghost_b64(
                    ghost["assertion_authenticator_data"],
                    field="assertion_authenticator_data",
                    maximum=4_096,
                )
                client_data_json = _decode_ghost_b64(
                    ghost["assertion_client_data_json"],
                    field="assertion_client_data_json",
                    maximum=4_096,
                )
                assertion_signature = _decode_ghost_b64(
                    ghost["assertion_signature"],
                    field="assertion_signature",
                    maximum=256,
                )
                try:
                    validate_webauthn_assertion_evidence(
                        identity=identity,
                        preview_signature=signature,
                        credential_id=assertion_credential_id,
                        authenticator_data=authenticator_data,
                        client_data_json=client_data_json,
                        assertion_signature=assertion_signature,
                        sign_count=ghost["sign_count"],
                        expected_challenge=ghost_challenge(payload_bytes),
                    )
                    checks["webauthn_assertion"] = True
                except HitlError as assertion_error:
                    checks["webauthn_assertion"] = False
                    assertion_error_code = assertion_error.code
                checks["user_presence"] = ghost["user_present"] is True
                checks["user_verification"] = ghost["user_verified"] is True
            else:
                checks["derivation_context"] = derivation_context == GHOST_MOCK_CONTEXT
                checks["ikm_profile"] = derivation_ikm == b""
                checks["derivation_evidence"] = bool(
                    identity
                    and additional_args == b""
                    and hmac.compare_digest(derived_public_key, trusted_master_key)
                )
                checks["signature"] = bool(
                    identity
                    and verify_cose_signature(
                        trusted_master_key,
                        payload_bytes,
                        signature,
                        expected_algorithm=MOCK_SIGN_ALGORITHM,
                    )
                )
                checks["mock_evidence_profile"] = bool(
                    _decode_ghost_b64(
                        ghost["assertion_credential_id"],
                        field="assertion_credential_id",
                        maximum=1_024,
                    )
                    == b""
                    and _decode_ghost_b64(
                        ghost["assertion_authenticator_data"],
                        field="assertion_authenticator_data",
                        maximum=4_096,
                    )
                    == b""
                    and _decode_ghost_b64(
                        ghost["assertion_client_data_json"],
                        field="assertion_client_data_json",
                        maximum=4_096,
                    )
                    == b""
                    and _decode_ghost_b64(
                        ghost["assertion_signature"],
                        field="assertion_signature",
                        maximum=256,
                    )
                    == b""
                    and ghost["user_present"] is False
                    and ghost["user_verified"] is False
                    and type(ghost["sign_count"]) is int
                    and ghost["sign_count"] == 0
                )
        except Exception:
            checks.setdefault("structure_and_encoding", False)

        valid = bool(checks) and all(checks.values())
        failed = sorted(name for name, passed in checks.items() if not passed)
        if valid:
            reason = (
                "Ghost signature and replay bytes are authentic. This artifact is intentionally "
                "replayable and is not an anti-cheat proof."
            )
        else:
            reason = "Ghost rejected: " + ", ".join(failed or ["invalid structure"]) + "."
        return {
            "valid": valid,
            "replayable": valid,
            "anti_cheat": False,
            "claim": "Tamper-evident deterministic input replay; not proof of honest gameplay.",
            "hardware_mode_valid": valid and mode == "hardware",
            "trust_model": "local-tofu" if mode == "hardware" else "software-practice",
            "manufacturer_attested": False,
            "mode": mode,
            "checks": checks,
            "reason": reason,
            "identity_fingerprint": (identity["fingerprint"] if identity and valid else None),
            "replay": replay if valid else None,
            **({"assertion_error": assertion_error_code} if assertion_error_code else {}),
        }


def default_state_path() -> Path:
    data_dir = Path(os.getenv("HITL2_DATA_DIR", str(Path.home() / ".hitl2"))).expanduser()
    return data_dir / "state.sqlite3"
