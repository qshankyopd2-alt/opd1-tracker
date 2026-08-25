## 2024-05-24 - [Insecure TLS Validation Pattern]
**Vulnerability:** External HTTP requests to Riot APIs (e.g., pd.a.pvp.net) had TLS validation disabled (`verify=False`).
**Learning:** Due to the local Riot client (127.0.0.1) requiring `verify=False` for its self-signed certificates, this insecure configuration was inadvertently propagated to external, public-facing Riot API calls, exposing them to Man-In-The-Middle (MITM) attacks.
**Prevention:** Strictly differentiate between local and external API client configurations. Only bypass TLS verification for explicit localhost requests.
