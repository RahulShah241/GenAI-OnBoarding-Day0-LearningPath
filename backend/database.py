"""
database.py
───────────
SQLite Database access layer for TalentForge AI application.
Replaces JSON flat-files with an embedded SQLite database (`backend/data/app.db`).
"""

from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path
from typing import Any, List, Optional

logger = logging.getLogger(__name__)

BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"
DB_PATH: Path = DATA_DIR / "app.db"


def get_db_connection() -> sqlite3.Connection:
    """Create and return a SQLite database connection with row_factory set."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialise SQLite tables if they do not exist."""
    conn = get_db_connection()
    try:
        with conn:
            # 1. Employees table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS employees (
                    employee_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    skills TEXT NOT NULL DEFAULT '[]',
                    experience REAL NOT NULL DEFAULT 0.0,
                    status TEXT NOT NULL DEFAULT 'Active',
                    designation TEXT,
                    department TEXT
                )
            """)

            # 2. Projects table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    project_id TEXT PRIMARY KEY,
                    project_name TEXT NOT NULL,
                    domain TEXT,
                    business_unit TEXT,
                    project_type TEXT,
                    project_overview TEXT NOT NULL DEFAULT '{}',
                    project_duration TEXT NOT NULL DEFAULT '{}',
                    required_roles TEXT NOT NULL DEFAULT '[]',
                    required_skills TEXT NOT NULL DEFAULT '[]',
                    responsibilities TEXT NOT NULL DEFAULT '[]',
                    delivery_model TEXT NOT NULL DEFAULT '{}',
                    deployment_readiness_criteria TEXT NOT NULL DEFAULT '{}',
                    status TEXT NOT NULL DEFAULT '{}'
                )
            """)

            # 3. Employee Chat Responses table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS employee_responses (
                    employee_id TEXT PRIMARY KEY,
                    responses TEXT NOT NULL DEFAULT '[]'
                )
            """)

            # 4. Employee Profiles table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS employee_profiles (
                    employee_id TEXT PRIMARY KEY,
                    overall_score REAL NOT NULL DEFAULT 0.0,
                    readiness TEXT NOT NULL DEFAULT 'Low',
                    tech_readiness REAL NOT NULL DEFAULT 0.0,
                    domain_knowledge REAL NOT NULL DEFAULT 0.0,
                    extracted_skills TEXT NOT NULL DEFAULT '[]',
                    merged_skills TEXT NOT NULL DEFAULT '[]',
                    current_role_summary TEXT,
                    soft_skills TEXT NOT NULL DEFAULT '{}',
                    learning_interests TEXT NOT NULL DEFAULT '[]',
                    suggested_next_steps TEXT NOT NULL DEFAULT '[]',
                    name TEXT,
                    email TEXT,
                    experience REAL NOT NULL DEFAULT 0.0
                )
            """)
        logger.info("SQLite database tables initialised at %s", DB_PATH)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEES REPOSITORY
# ══════════════════════════════════════════════════════════════════════════════

def _row_to_employee(row: sqlite3.Row) -> dict:
    d = dict(row)
    if isinstance(d.get("skills"), str):
        try:
            d["skills"] = json.loads(d["skills"])
        except Exception:
            d["skills"] = []
    return d


def get_all_employees() -> list[dict]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM employees").fetchall()
        return [_row_to_employee(r) for r in rows]
    finally:
        conn.close()


def get_employee_by_id(employee_id: str) -> Optional[dict]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM employees WHERE employee_id = ?", (employee_id,)).fetchone()
        return _row_to_employee(row) if row else None
    finally:
        conn.close()


def get_employee_by_email(email: str) -> Optional[dict]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM employees WHERE LOWER(email) = LOWER(?)", (email,)).fetchone()
        return _row_to_employee(row) if row else None
    finally:
        conn.close()


def save_employee(emp: dict) -> None:
    conn = get_db_connection()
    try:
        skills_str = json.dumps(emp.get("skills", []), ensure_ascii=False) if isinstance(emp.get("skills"), list) else "[]"
        with conn:
            conn.execute("""
                INSERT INTO employees (
                    employee_id, name, email, password, role, skills, experience, status, designation, department
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET
                    name=excluded.name,
                    email=excluded.email,
                    password=excluded.password,
                    role=excluded.role,
                    skills=excluded.skills,
                    experience=excluded.experience,
                    status=excluded.status,
                    designation=excluded.designation,
                    department=excluded.department
            """, (
                emp["employee_id"],
                emp["name"],
                emp["email"],
                emp.get("password", ""),
                emp["role"],
                skills_str,
                emp.get("experience", 0.0),
                emp.get("status", "Active"),
                emp.get("designation"),
                emp.get("department")
            ))
    finally:
        conn.close()


def delete_employee(employee_id: str) -> bool:
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.execute("DELETE FROM employees WHERE employee_id = ?", (employee_id,))
            return cursor.rowcount > 0
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# PROJECTS REPOSITORY
# ══════════════════════════════════════════════════════════════════════════════

def _row_to_project(row: sqlite3.Row) -> dict:
    d = dict(row)
    for key in (
        "project_overview", "project_duration", "required_roles",
        "required_skills", "responsibilities", "delivery_model",
        "deployment_readiness_criteria", "status"
    ):
        if isinstance(d.get(key), str):
            try:
                d[key] = json.loads(d[key])
            except Exception:
                d[key] = [] if "roles" in key or "skills" in key or key == "responsibilities" else {}
    return d


def get_all_projects() -> list[dict]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM projects").fetchall()
        return [_row_to_project(r) for r in rows]
    finally:
        conn.close()


def get_project_by_id(project_id: str) -> Optional[dict]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        return _row_to_project(row) if row else None
    finally:
        conn.close()


def save_project(proj: dict) -> None:
    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO projects (
                    project_id, project_name, domain, business_unit, project_type,
                    project_overview, project_duration, required_roles, required_skills,
                    responsibilities, delivery_model, deployment_readiness_criteria, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(project_id) DO UPDATE SET
                    project_name=excluded.project_name,
                    domain=excluded.domain,
                    business_unit=excluded.business_unit,
                    project_type=excluded.project_type,
                    project_overview=excluded.project_overview,
                    project_duration=excluded.project_duration,
                    required_roles=excluded.required_roles,
                    required_skills=excluded.required_skills,
                    responsibilities=excluded.responsibilities,
                    delivery_model=excluded.delivery_model,
                    deployment_readiness_criteria=excluded.deployment_readiness_criteria,
                    status=excluded.status
            """, (
                proj["project_id"],
                proj.get("project_name", ""),
                proj.get("domain", ""),
                proj.get("business_unit", ""),
                proj.get("project_type", ""),
                json.dumps(proj.get("project_overview", {}), ensure_ascii=False),
                json.dumps(proj.get("project_duration", {}), ensure_ascii=False),
                json.dumps(proj.get("required_roles", []), ensure_ascii=False),
                json.dumps(proj.get("required_skills", []), ensure_ascii=False),
                json.dumps(proj.get("responsibilities", []), ensure_ascii=False),
                json.dumps(proj.get("delivery_model", {}), ensure_ascii=False),
                json.dumps(proj.get("deployment_readiness_criteria", {}), ensure_ascii=False),
                json.dumps(proj.get("status", {}), ensure_ascii=False),
            ))
    finally:
        conn.close()


def delete_project(project_id: str) -> bool:
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.execute("DELETE FROM projects WHERE project_id = ?", (project_id,))
            return cursor.rowcount > 0
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEE CHAT RESPONSES REPOSITORY
# ══════════════════════════════════════════════════════════════════════════════

def get_chat_history(employee_id: str) -> dict:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM employee_responses WHERE employee_id = ?", (employee_id,)).fetchone()
        if not row:
            return {"employee_id": employee_id, "responses": []}
        d = dict(row)
        try:
            responses = json.loads(d["responses"])
        except Exception:
            responses = []
        return {"employee_id": employee_id, "responses": responses}
    finally:
        conn.close()


def save_chat_history(employee_id: str, data: dict) -> None:
    conn = get_db_connection()
    try:
        responses_str = json.dumps(data.get("responses", []), ensure_ascii=False)
        with conn:
            conn.execute("""
                INSERT INTO employee_responses (employee_id, responses)
                VALUES (?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET responses=excluded.responses
            """, (employee_id, responses_str))
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEE PROFILES REPOSITORY
# ══════════════════════════════════════════════════════════════════════════════

def _row_to_profile(row: sqlite3.Row) -> dict:
    d = dict(row)
    for key in ("extracted_skills", "merged_skills", "soft_skills", "learning_interests", "suggested_next_steps"):
        if isinstance(d.get(key), str):
            try:
                d[key] = json.loads(d[key])
            except Exception:
                d[key] = {} if key == "soft_skills" else []
    return d


def get_profile(employee_id: str) -> Optional[dict]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM employee_profiles WHERE employee_id = ?", (employee_id,)).fetchone()
        return _row_to_profile(row) if row else None
    finally:
        conn.close()


def get_all_profiles() -> list[dict]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM employee_profiles").fetchall()
        return [_row_to_profile(r) for r in rows]
    finally:
        conn.close()


def save_profile(employee_id: str, profile: dict) -> None:
    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO employee_profiles (
                    employee_id, overall_score, readiness, tech_readiness, domain_knowledge,
                    extracted_skills, merged_skills, current_role_summary, soft_skills,
                    learning_interests, suggested_next_steps, name, email, experience
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET
                    overall_score=excluded.overall_score,
                    readiness=excluded.readiness,
                    tech_readiness=excluded.tech_readiness,
                    domain_knowledge=excluded.domain_knowledge,
                    extracted_skills=excluded.extracted_skills,
                    merged_skills=excluded.merged_skills,
                    current_role_summary=excluded.current_role_summary,
                    soft_skills=excluded.soft_skills,
                    learning_interests=excluded.learning_interests,
                    suggested_next_steps=excluded.suggested_next_steps,
                    name=excluded.name,
                    email=excluded.email,
                    experience=excluded.experience
            """, (
                employee_id,
                profile.get("overall_score", 0.0),
                profile.get("readiness", "Low"),
                profile.get("tech_readiness", 0.0),
                profile.get("domain_knowledge", 0.0),
                json.dumps(profile.get("extracted_skills", []), ensure_ascii=False),
                json.dumps(profile.get("merged_skills", []), ensure_ascii=False),
                profile.get("current_role_summary"),
                json.dumps(profile.get("soft_skills", {}), ensure_ascii=False),
                json.dumps(profile.get("learning_interests", []), ensure_ascii=False),
                json.dumps(profile.get("suggested_next_steps", []), ensure_ascii=False),
                profile.get("name"),
                profile.get("email"),
                profile.get("experience", 0.0),
            ))
    finally:
        conn.close()
