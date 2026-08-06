from __future__ import annotations

import hmac
import ipaddress
import os
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, SecretStr, StrictInt, StrictStr, field_validator
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .errors import HitlError
from .hardware import SigningBackend, backend_from_environment
from .service import HitlService, default_state_path
from .store import SQLiteStore


MAX_API_REQUEST_BYTES = 256 * 1024


class PinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pin: SecretStr

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, value: SecretStr) -> SecretStr:
        length = len(value.get_secret_value())
        if not 4 <= length <= 63:
            raise ValueError("PIN must be 4–63 characters")
        return value


class InitialPinRequest(PinRequest):
    confirm_pin: SecretStr

    @field_validator("confirm_pin")
    @classmethod
    def validate_confirm_pin(cls, value: SecretStr) -> SecretStr:
        length = len(value.get_secret_value())
        if not 4 <= length <= 63:
            raise ValueError("PIN confirmation must be 4–63 characters")
        return value


class GhostSignRequest(PinRequest):
    model_config = ConfigDict(extra="forbid")

    course_id: StrictStr = Field(min_length=1, max_length=64)
    tick_ms: StrictInt
    finish_tick: StrictInt
    press_ticks: list[StrictInt] = Field(max_length=256)


class GhostVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ghost: Any


def _is_same_origin(request: Request, source: str) -> bool:
    try:
        parsed = urlsplit(source)
        request_host = request.headers.get("host", "").lower()
        source_host = parsed.netloc.lower()
        return (
            parsed.scheme == request.url.scheme
            and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
            and source_host == request_host
        )
    except Exception:
        return False


def create_app(
    *,
    service: HitlService | None = None,
    backend: SigningBackend | None = None,
    state_path: Path | None = None,
    allow_initial_pin_setup: bool | None = None,
) -> FastAPI:
    if service is None:
        selected_backend = backend or backend_from_environment()
        selected_path = state_path or default_state_path()
        service = HitlService(SQLiteStore(selected_path), selected_backend)
    if allow_initial_pin_setup is None:
        allow_initial_pin_setup = bool(
            service.backend.mode == "mock"
            or os.getenv("HITL2_ALLOW_INITIAL_PIN", "").strip().lower() in {"1", "true", "yes"}
        )

    app = FastAPI(
        title="Ghost Lap",
        description="Locally previewSign-mediated ghost racing with repeatable carrot heats.",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.ghost_lap = service
    app.state.allow_initial_pin_setup = allow_initial_pin_setup
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "[::1]"],
    )

    @app.middleware("http")
    async def local_request_guard(request: Request, call_next):
        def secure(response):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self'; style-src 'self'; "
                "img-src 'self' data:; connect-src 'self'; object-src 'none'; "
                "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
            )
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Referrer-Policy"] = "no-referrer"
            response.headers["Permissions-Policy"] = (
                "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
            )
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
            response.headers["X-Frame-Options"] = "DENY"
            # This is an actively changing local control surface. Avoid stale JS
            # and never cache PIN-adjacent API responses.
            response.headers["Cache-Control"] = "no-store"
            return response

        peer = request.client.host if request.client else ""
        peer_without_zone = peer.split("%", 1)[0]
        try:
            loopback_peer = ipaddress.ip_address(peer_without_zone).is_loopback
        except ValueError:
            loopback_peer = False
        if not loopback_peer:
            return secure(
                JSONResponse(
                    status_code=403,
                    content={
                        "detail": {
                            "code": "LOOPBACK_CLIENT_REQUIRED",
                            "message": "Ghost Lap accepts connections only from this device.",
                        }
                    },
                )
            )

        guarded_api = request.url.path.startswith("/api/")
        if guarded_api:
            marker_ok = request.headers.get("X-Ghost-Lap-Request") == "1"
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            foreign_source = bool(
                (origin and not _is_same_origin(request, origin))
                or (referer and not _is_same_origin(request, referer))
            )
            if foreign_source or not marker_ok:
                return secure(
                    JSONResponse(
                        status_code=403,
                        content={
                            "detail": {
                                "code": "LOCAL_REQUEST_REQUIRED",
                                "message": (
                                    "Ghost Lap API calls require the local app request marker "
                                    "and must not come from a foreign origin."
                                ),
                            }
                        },
                    )
                )

        if guarded_api and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            content_length = request.headers.get("content-length")
            if content_length is None:
                return secure(
                    JSONResponse(
                        status_code=411,
                        content={
                            "detail": {
                                "code": "CONTENT_LENGTH_REQUIRED",
                                "message": "State-changing API requests require a Content-Length header.",
                            }
                        },
                    )
                )
            try:
                parsed_content_length = int(content_length, 10)
            except ValueError:
                parsed_content_length = -1
            if parsed_content_length < 0:
                return secure(
                    JSONResponse(
                        status_code=400,
                        content={
                            "detail": {
                                "code": "INVALID_CONTENT_LENGTH",
                                "message": "The Content-Length header is invalid.",
                            }
                        },
                    )
                )
            if parsed_content_length > MAX_API_REQUEST_BYTES:
                return secure(
                    JSONResponse(
                        status_code=413,
                        content={
                            "detail": {
                                "code": "REQUEST_BODY_TOO_LARGE",
                                "message": "The API request body exceeds the 256 KiB limit.",
                            }
                        },
                    )
                )
        return secure(await call_next(request))

    @app.exception_handler(HitlError)
    async def hitl_error_handler(request: Request, exc: HitlError):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail()})

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        # Never echo submitted values: PINs and request data do not belong in error bodies.
        errors = [
            {
                "location": list(error.get("loc", ())),
                "message": error.get("msg", "Invalid value"),
                "type": error.get("type", "value_error"),
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "detail": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed.",
                    "errors": errors,
                }
            },
        )

    @app.get("/api/status")
    def status():
        result = service.status()
        result.setdefault("security", {})["initial_pin_setup_enabled"] = allow_initial_pin_setup
        return result

    @app.post("/api/pin")
    def set_pin(body: InitialPinRequest):
        if not allow_initial_pin_setup:
            raise HitlError(
                "INITIAL_PIN_SETUP_DISABLED",
                "Browser-driven initial PIN setup is disabled for this hardware launch.",
                status_code=403,
                hint=(
                    "Configure the FIDO PIN with your authenticator tool, or deliberately restart "
                    "once with HITL2_ALLOW_INITIAL_PIN=1 while only the intended key is connected."
                ),
            )
        pin = body.pin.get_secret_value()
        confirm_pin = body.confirm_pin.get_secret_value()
        if not hmac.compare_digest(pin.encode("utf-8"), confirm_pin.encode("utf-8")):
            raise HitlError(
                "PIN_CONFIRMATION_MISMATCH",
                "PIN and confirmation do not match; the key was not changed.",
                status_code=422,
            )
        return {"pin": service.set_initial_pin(pin)}

    @app.post("/api/enroll")
    def enroll(body: PinRequest):
        return {"identity": service.enroll(body.pin.get_secret_value())}

    @app.post("/api/ghost/sign")
    def sign_ghost(body: GhostSignRequest):
        return service.sign_ghost(
            pin=body.pin.get_secret_value(),
            course_id=body.course_id,
            tick_ms=body.tick_ms,
            finish_tick=body.finish_tick,
            press_ticks=body.press_ticks,
        )

    @app.post("/api/ghost/verify")
    def verify_ghost(body: GhostVerifyRequest):
        return service.verify_ghost(body.ghost)

    static_dir = Path(__file__).with_name("static")
    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="dashboard")

    return app


def _terminal_field(value: Any, fallback: str) -> str:
    raw = str(value) if value is not None else ""
    safe = "".join(character if " " <= character <= "~" else "?" for character in raw)
    return safe[:120] or fallback


def _startup_device_messages(
    service: HitlService, *, allow_initial_pin_setup: bool = False
) -> list[str]:
    """Return a secret-free, read-only summary of automatic authenticator discovery."""
    status = service.status()
    local_trust_note = (
        "[Ghost Lap] SECURITY: The loopback broker blocks browser CSRF but does not "
        "authenticate other native processes. Use it only on a trusted single-user machine."
    )
    if status.get("mock"):
        return [
            "[Ghost Lap] Software practice mode; no physical authenticator will be used.",
            local_trust_note,
        ]

    hardware = status.get("hardware") or {}
    if hardware.get("connected"):
        product = _terminal_field(hardware.get("product_name"), "USB FIDO authenticator")
        firmware = _terminal_field(hardware.get("firmware_version"), "unknown")
        messages = [f"[Ghost Lap] Auto-detected exactly one {product} (firmware {firmware})."]
        if not status.get("enrolled"):
            if not (status.get("pin") or {}).get("configured") and allow_initial_pin_setup:
                messages.append(
                    "[Ghost Lap] WARNING: Choosing Set PIN configures the initial FIDO PIN "
                    "on this selected key, and enrollment adds one FIDO credential. Leave "
                    "only the intended key connected. Ghost Lap never resets the key, changes "
                    "an existing PIN, or deletes credentials."
                )
            elif not (status.get("pin") or {}).get("configured"):
                messages.append(
                    "[Ghost Lap] SAFETY: Browser-driven initial PIN setup is disabled. "
                    "Configure the intended key with its authenticator tool, or deliberately "
                    "restart once with HITL2_ALLOW_INITIAL_PIN=1 while no other keys are attached."
                )
            else:
                messages.append(
                    "[Ghost Lap] WARNING: Enrollment adds one FIDO credential to this selected "
                    "key. Leave only the intended key connected. Ghost Lap never resets the key, "
                    "changes its PIN, or deletes credentials."
                )
        elif not status.get("backend_mode_matches_identity", True):
            messages.append(
                "[Ghost Lap] WARNING: This data directory was enrolled in a different signer "
                "mode. Start the matching hardware or practice configuration."
            )
        if status.get("enrolled"):
            messages.append(
                "[Ghost Lap] NOTE: Discovery checks capabilities, not enrollment identity. "
                "Verify the connected device before entering its PIN; the saved credential is "
                "confirmed only when signing succeeds."
            )
        messages.append(local_trust_note)
        return messages

    error = hardware.get("error") or {}
    if error.get("code") == "MULTIPLE_AUTHENTICATORS":
        return [
            "[Ghost Lap] WARNING: Multiple USB FIDO authenticators were detected. "
            "Disconnect every key except the intended key; Ghost Lap refuses to choose one.",
            local_trust_note,
        ]
    detail = error.get("message") or "No usable USB FIDO authenticator was detected."
    return [f"[Ghost Lap] WARNING: {detail}", local_trust_note]


def run() -> None:
    host = os.getenv("HITL2_HOST", "localhost")
    if host not in {"127.0.0.1", "localhost", "::1"}:
        raise SystemExit("HITL2_HOST must be a loopback address")
    try:
        port = int(os.getenv("HITL2_PORT", "8788"))
    except ValueError as exc:
        raise SystemExit("HITL2_PORT must be an integer") from exc
    runtime_app = create_app()
    for message in _startup_device_messages(
        runtime_app.state.ghost_lap,
        allow_initial_pin_setup=runtime_app.state.allow_initial_pin_setup,
    ):
        print(message, flush=True)
    uvicorn.run(runtime_app, host=host, port=port, reload=False)
