"""
json_db.py
──────────
Thin helpers for reading and writing JSON flat-files that act as the database.

All paths are resolved relative to this file's directory so the server
can be started from any working directory.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi.encoders import jsonable_encoder

BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"


def _resolve(filename: str | Path) -> Path:
    """
    Return an absolute path.

    If *filename* is already absolute (e.g. a Path passed directly from a
    route handler) it is returned as-is.  Otherwise it is joined to DATA_DIR.
    """
    p = Path(filename)
    return p if p.is_absolute() else DATA_DIR / p


# ── Public API ────────────────────────────────────────────────────────────────

def read_json(filename: str | Path) -> Any:
    """Read and parse a JSON file. Returns the decoded Python object."""
    path = _resolve(filename)
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def write_json(filename: str | Path, data: Any) -> None:
    """Serialise *data* to JSON and overwrite *filename*."""
    path = _resolve(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=4, ensure_ascii=False)


def append_json(filename: str | Path, new_item: Any) -> None:
    """
    Append *new_item* to the JSON list stored in *filename*.

    - Creates the file with an empty list if it does not exist.
    - Calls jsonable_encoder so datetime / UUID objects serialise correctly.
    - Raises ValueError if the root element is not a list.
    """
    path = _resolve(filename)

    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("[]", encoding="utf-8")

    with open(path, "r", encoding="utf-8") as fh:
        try:
            data: list = json.load(fh)
        except json.JSONDecodeError:
            data = []

    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON list, not {type(data).__name__}")

    data.append(jsonable_encoder(new_item))

    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=4, ensure_ascii=False)
