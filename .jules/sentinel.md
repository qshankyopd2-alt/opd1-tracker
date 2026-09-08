## 2026-09-08 - Exception Leakage in API Response
**Vulnerability:** The API returned raw exception strings (`str(e)`) to the client when failing to get the party state in `backend/riot_client.py`.
**Learning:** Generic exception handlers that catch `Exception as e` and return it directly can unintentionally expose sensitive internal details or stack traces to users.
**Prevention:** Always fail securely by returning generic error messages in API responses while logging the original raw exception on the server for debugging.
