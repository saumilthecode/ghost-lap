from __future__ import annotations

import base64
import hashlib
from typing import Any

import cbor2

from .errors import HitlError


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def unb64u(value: str) -> bytes:
    if not isinstance(value, str):
        raise HitlError("INVALID_BASE64", "Expected a base64url string.")
    try:
        return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
    except Exception as exc:
        raise HitlError("INVALID_BASE64", "Invalid base64url data.") from exc


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_cbor(value: Any) -> bytes:
    """Encode one deterministic representation suitable for byte-exact signing."""
    return cbor2.dumps(value, canonical=True)


def decode_canonical_cbor(data: bytes) -> Any:
    try:
        value = cbor2.loads(data)
    except Exception as exc:
        raise HitlError("INVALID_CBOR", "The signed payload is not valid CBOR.") from exc
    if canonical_cbor(value) != data:
        raise HitlError(
            "NON_CANONICAL_CBOR",
            "The signed payload is not deterministically encoded.",
        )
    return value
