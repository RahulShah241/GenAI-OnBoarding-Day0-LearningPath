"""
json_db.py
──────────
Database abstraction layer.
Seamlessly routes legacy read_json, write_json, and append_json calls directly to the SQLite database (app.db).
No JSON flat-file operations are performed.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from database import (
    get_all_employees,
    get_all_projects,
    get_chat_history,
    get_profile,
    save_chat_history,
    save_employee,
    save_profile,
    save_project,
)

logger = logging.getLogger(__name__)

BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"


def _resolve(filename: str | Path) -> Path:
    p = Path(filename)
    return p if p.is_absolute() else DATA_DIR / p


def read_json(filename: str | Path) -> Any:
    """Read data directly from SQLite database based on target resource path."""
    path = _resolve(filename)
    name = path.name

    if name == "employees.json":
        return get_all_employees()
    elif name == "projectDetails.json":
        return get_all_projects()
    elif "employee_responses" in path.parts:
        emp_id = path.stem
        return get_chat_history(emp_id)
    elif "profiles" in path.parts:
        emp_id = path.stem
        prof = get_profile(emp_id)
        if prof is None:
            raise FileNotFoundError(f"No profile found in SQLite for {emp_id}")
        return prof

    logger.warning("Unrecognised read_json target: %s", path)
    return []


def write_json(filename: str | Path, data: Any) -> None:
    """Save data directly to SQLite database based on target resource path."""
    path = _resolve(filename)
    name = path.name

    if name == "employees.json":
        if isinstance(data, list):
            for emp in data:
                save_employee(emp)
    elif name == "projectDetails.json":
        if isinstance(data, list):
            for proj in data:
                save_project(proj)
    elif "employee_responses" in path.parts:
        emp_id = data.get("employee_id") or path.stem
        save_chat_history(emp_id, data)
    elif "profiles" in path.parts:
        emp_id = data.get("employee_id") or path.stem
        save_profile(emp_id, data)
    else:
        logger.warning("Unrecognised write_json target: %s", path)


def append_json(filename: str | Path, new_item: Any) -> None:
    """Append element to SQLite table."""
    path = _resolve(filename)
    name = path.name

    if name == "employees.json":
        save_employee(new_item)
    elif name == "projectDetails.json":
        save_project(new_item)
    elif "employee_responses" in path.parts:
        emp_id = new_item.get("employee_id") or path.stem
        save_chat_history(emp_id, new_item)
    else:
        logger.warning("Unrecognised append_json target: %s", path)
