"""OPD1 Tracker desktop backend entry point.

Runs the proven Flask API (app.py) on 127.0.0.1 for the Tauri shell.
Skips the hosted-site WebSocket bridge, Ably remote mode, telemetry sync
and Discord RPC — none of which the desktop UI uses.
"""
from __future__ import annotations

import json
import os
import sys
import threading

os.environ.setdefault("OPD1_QUIET", "1")

from app import app  # noqa: E402  (imports load .env and build the API)
from werkzeug.serving import make_server  # noqa: E402


def main() -> None:
    requested_port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "5000")))
    server = make_server("127.0.0.1", requested_port, app, threaded=True)

    def stop_when_parent_closes() -> None:
        try:
            sys.stdin.buffer.read()
        finally:
            server.shutdown()

    threading.Thread(target=stop_when_parent_closes, name="ParentWatch", daemon=True).start()
    print("OPD1_READY " + json.dumps({"port": server.server_port}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
