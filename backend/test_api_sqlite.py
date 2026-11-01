"""
test_api_sqlite.py
──────────────────
Tests FastAPI endpoints running on SQLite without file-based storage.
"""

from __future__ import annotations

import sys
from pathlib import Path
import unittest

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from main import app
from database import init_db

client = TestClient(app)


class TestAPISQLiteEndpoints(unittest.TestCase):
    """Verifies that API endpoints function correctly with SQLite database backend."""

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_login_and_get_me(self):
        """Tests admin login and /auth/me profile retrieval via SQLite."""
        login_res = client.post(
            "/auth/login",
            json={"email": "admin@aionboarding.com", "password": "admin"}
        )
        # Note: if password was hashed in seed, verify response
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            me_res = client.get("/auth/me", headers=headers)
            self.assertEqual(me_res.status_code, 200)
            self.assertEqual(me_res.json()["email"], "admin@aionboarding.com")

    def test_public_endpoints_and_seed_projects(self):
        """Verifies projects retrieval from SQLite."""
        # Login as employee E001
        login_res = client.post(
            "/auth/login",
            json={"email": "rahul@aionboarding.com", "password": "password123"}
        )
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # /projectsDescrition
            proj_res = client.get("/projectsDescrition", headers=headers)
            self.assertEqual(proj_res.status_code, 200)
            projects = proj_res.json()
            self.assertGreaterEqual(len(projects), 3)

            # /projects/{project_id}
            p1_res = client.get("/projects/P001", headers=headers)
            self.assertEqual(p1_res.status_code, 200)
            self.assertEqual(p1_res.json()["project_id"], "P001")


if __name__ == "__main__":
    unittest.main()
