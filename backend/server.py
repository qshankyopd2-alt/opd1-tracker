"""ASGI shim so the cloud preview supervisor (uvicorn server:app) can serve
the Flask API. The Windows desktop app uses desktop.py instead."""
from __future__ import annotations

try:
    from a2wsgi import WSGIMiddleware
except ImportError:  # pragma: no cover
    from uvicorn.middleware.wsgi import WSGIMiddleware  # type: ignore

from app import app as flask_app

app = WSGIMiddleware(flask_app)
