from __future__ import annotations


class HitlError(Exception):
    """An expected, safe-to-display application error."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        status_code: int = 400,
        hint: str | None = None,
        extra: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.hint = hint
        self.extra = extra or {}

    def detail(self) -> dict:
        value = {"code": self.code, "message": self.message, **self.extra}
        if self.hint:
            value["hint"] = self.hint
        return value
