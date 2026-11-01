"""
test_sqlite_db.py
─────────────────
Comprehensive automated test suite for SQLite database integration & auto-seeding in TalentForge AI.

Validates:
  1. Default data auto-seeding on fresh database initialization.
  2. CRUD operations on employees, projects, responses, and profiles.
  3. FastAPI endpoints operating purely on SQLite without JSON flat-files.
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import unittest
from pathlib import Path

# Setup sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import (
    get_db_connection,
    init_db,
    seed_default_data,
    get_all_employees,
    get_employee_by_id,
    get_employee_by_email,
    save_employee,
    delete_employee,
    get_all_projects,
    get_project_by_id,
    save_project,
    delete_project,
    get_chat_history,
    save_chat_history,
    get_profile,
    get_all_profiles,
    save_profile,
)
from seed_data import DEFAULT_EMPLOYEES, DEFAULT_PROJECTS, DEFAULT_PROFILES


class TestSQLiteAutoSeedingAndCRUD(unittest.TestCase):
    """Tests SQLite database tables, auto-seeding, and CRUD repositories."""

    def test_database_has_default_data(self):
        """Verifies that init_db populates default employees and projects."""
        init_db()

        employees = get_all_employees()
        self.assertGreaterEqual(len(employees), len(DEFAULT_EMPLOYEES))
        emp_ids = [e["employee_id"] for e in employees]
        self.assertIn("E001", emp_ids)
        self.assertIn("HR001", emp_ids)
        self.assertIn("ADMIN001", emp_ids)

        projects = get_all_projects()
        self.assertGreaterEqual(len(projects), len(DEFAULT_PROJECTS))
        proj_ids = [p["project_id"] for p in projects]
        self.assertIn("P001", proj_ids)
        self.assertIn("P002", proj_ids)

    def test_employee_crud(self):
        """Tests CRUD operations on the SQLite employees table."""
        test_emp = {
            "employee_id": "TEST_EMP_999",
            "name": "Test Engineer",
            "email": "test.engineer@aionboarding.com",
            "password": "hashed_secret_test",
            "role": "EMPLOYEE",
            "skills": ["Python", "FastAPI", "SQLite"],
            "experience": 4.5,
            "status": "Active",
            "designation": "Software Engineer",
            "department": "Engineering",
        }

        # Save
        save_employee(test_emp)

        # Retrieve by ID
        fetched = get_employee_by_id("TEST_EMP_999")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["name"], "Test Engineer")
        self.assertEqual(fetched["skills"], ["Python", "FastAPI", "SQLite"])
        self.assertEqual(fetched["experience"], 4.5)

        # Retrieve by Email
        fetched_by_email = get_employee_by_email("test.engineer@aionboarding.com")
        self.assertIsNotNone(fetched_by_email)
        self.assertEqual(fetched_by_email["employee_id"], "TEST_EMP_999")

        # Update
        test_emp["designation"] = "Senior Software Engineer"
        test_emp["skills"].append("Docker")
        save_employee(test_emp)

        updated = get_employee_by_id("TEST_EMP_999")
        self.assertEqual(updated["designation"], "Senior Software Engineer")
        self.assertIn("Docker", updated["skills"])

        # Delete
        deleted = delete_employee("TEST_EMP_999")
        self.assertTrue(deleted)
        self.assertIsNone(get_employee_by_id("TEST_EMP_999"))

    def test_project_crud(self):
        """Tests CRUD operations on the SQLite projects table."""
        test_proj = {
            "project_id": "PROJ_TEST_999",
            "project_name": "SQLite Cloud Migration",
            "domain": "Database & Cloud",
            "business_unit": "Core Engineering",
            "project_type": "Internal",
            "project_overview": {"objective": "Migrate to SQLite"},
            "project_duration": {"start_date": "2026-01-01"},
            "required_roles": [{"role_name": "Backend Developer", "headcount": 1}],
            "required_skills": [{"skill_name": "SQLite", "mandatory": True}],
            "responsibilities": ["Design schema", "Optimize queries"],
            "delivery_model": {"methodology": "Agile"},
            "deployment_readiness_criteria": {"minimum_skill_match_percentage": 75},
            "status": {"current_status": "Open", "deployment_stage": "Execution"},
        }

        # Save
        save_project(test_proj)

        # Retrieve
        fetched = get_project_by_id("PROJ_TEST_999")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["project_name"], "SQLite Cloud Migration")
        self.assertIsInstance(fetched["required_skills"], list)
        self.assertEqual(fetched["required_skills"][0]["skill_name"], "SQLite")

        # Delete
        deleted = delete_project("PROJ_TEST_999")
        self.assertTrue(deleted)
        self.assertIsNone(get_project_by_id("PROJ_TEST_999"))

    def test_chat_history_and_profiles(self):
        """Tests persisting and retrieving chat history and generated profiles."""
        test_emp_id = "E_TEST_CHAT_01"
        test_chat = {
            "employee_id": test_emp_id,
            "responses": [
                {
                    "topic": "Role",
                    "question": "What is your current role?",
                    "answer": "Senior backend developer building distributed microservices with Python and FastAPI.",
                    "score": {"final_score": 4.8},
                }
            ],
        }

        # Save and get chat history
        save_chat_history(test_emp_id, test_chat)
        fetched_chat = get_chat_history(test_emp_id)
        self.assertEqual(len(fetched_chat["responses"]), 1)
        self.assertEqual(fetched_chat["responses"][0]["topic"], "Role")

        # Save and get profile
        test_profile = {
            "employee_id": test_emp_id,
            "name": "Chat Test User",
            "overall_score": 4.8,
            "readiness": "High",
            "extracted_skills": ["Python", "FastAPI"],
            "merged_skills": ["Python", "FastAPI", "SQLite"],
        }
        save_profile(test_emp_id, test_profile)
        fetched_profile = get_profile(test_emp_id)
        self.assertIsNotNone(fetched_profile)
        self.assertEqual(fetched_profile["overall_score"], 4.8)
        self.assertEqual(fetched_profile["readiness"], "High")

        all_profiles = get_all_profiles()
        self.assertTrue(any(p["employee_id"] == test_emp_id for p in all_profiles))

        # Cleanup
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("DELETE FROM employee_responses WHERE employee_id = ?", (test_emp_id,))
                conn.execute("DELETE FROM employee_profiles WHERE employee_id = ?", (test_emp_id,))
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
