## 2025-03-05 - Leaked Exception Details in API

**Vulnerability:** Raw exception details (`str(e)`) were being returned directly to the client in the `party_state` response when an error occurred, potentially leaking internal implementation details or sensitive state.
**Learning:** This occurred because a bare `Exception` was caught, and its string representation was used as the error message instead of generic fallback text.
**Prevention:** Always log the full exception server-side for debugging (e.g., `logger.exception`), but return a static, generic error message to the client.
