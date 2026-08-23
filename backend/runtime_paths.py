from __future__ import annotations

import os
from pathlib import Path


_BACKEND_DIR = Path(__file__).resolve().parent


def data_dir() -> Path:
    configured = os.getenv("OPD1_DATA_DIR", "").strip()
    return Path(configured) if configured else _BACKEND_DIR / "data"


def log_dir() -> Path:
    configured = os.getenv("OPD1_LOG_DIR", "").strip()
    return Path(configured) if configured else _BACKEND_DIR.parent / ".scout"
