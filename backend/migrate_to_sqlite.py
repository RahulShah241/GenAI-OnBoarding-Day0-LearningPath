"""
migrate_to_sqlite.py
────────────────────
Migrates existing JSON flat-file data into SQLite database (`backend/data/app.db`).
Imports:
  - employees.json -> employees table
  - projectDetails.json -> projects table
  - data/employee_responses/*.json -> employee_responses table
  - data/profiles/*.json -> employee_profiles table
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from database import init_db, save_employee, save_project, save_chat_history, save_profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"


def migrate() -> None:
    logger.info("Starting JSON to SQLite migration...")
    init_db()

    # 1. Migrate employees.json
    emp_file = DATA_DIR / "employees.json"
    if emp_file.exists():
        try:
            employees = json.loads(emp_file.read_text(encoding="utf-8"))
            if isinstance(employees, list):
                for emp in employees:
                    save_employee(emp)
                logger.info("Migrated %d employees from %s", len(employees), emp_file)
        except Exception as e:
            logger.error("Failed to migrate employees.json: %s", e)

    # 2. Migrate projectDetails.json
    proj_file = DATA_DIR / "projectDetails.json"
    if proj_file.exists():
        try:
            projects = json.loads(proj_file.read_text(encoding="utf-8"))
            if isinstance(projects, list):
                for proj in projects:
                    save_project(proj)
                logger.info("Migrated %d projects from %s", len(projects), proj_file)
        except Exception as e:
            logger.error("Failed to migrate projectDetails.json: %s", e)

    # 3. Migrate employee_responses/*.json
    resp_dir = DATA_DIR / "employee_responses"
    if resp_dir.exists():
        count = 0
        for f in resp_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                emp_id = data.get("employee_id") or f.stem
                save_chat_history(emp_id, data)
                count += 1
            except Exception as e:
                logger.error("Failed to migrate chat response file %s: %s", f, e)
        logger.info("Migrated %d employee chat response files", count)

    # 4. Migrate profiles/*.json
    prof_dir = DATA_DIR / "profiles"
    if prof_dir.exists():
        count = 0
        for f in prof_dir.glob("*.json"):
            if f.name == ".gitkeep":
                continue
            try:
                profile = json.loads(f.read_text(encoding="utf-8"))
                emp_id = profile.get("employee_id") or f.stem
                save_profile(emp_id, profile)
                count += 1
            except Exception as e:
                logger.error("Failed to migrate profile file %s: %s", f, e)
        logger.info("Migrated %d employee profile files", count)

    logger.info("Migration completed successfully!")


if __name__ == "__main__":
    migrate()
