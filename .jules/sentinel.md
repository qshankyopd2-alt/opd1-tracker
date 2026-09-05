## 2026-08-29 - Suppress Bandit warnings for Local Riot Client

**Vulnerability:** Found `verify=False` occurrences in `backend/riot_client.py` during Python requests to the local Riot client.
**Learning:** The local Riot client uses a self-signed certificate on `127.0.0.1`, so verifying it is impossible and legitimately needs to be disabled. However, this causes false positives in static analysis tools like `bandit`, adding noise to security audits.
**Prevention:** Always append `# nosec` to deliberate and safe uses of `verify=False` to suppress the warnings and keep the security signal-to-noise ratio high.
