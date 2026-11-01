"""
backend/test_cag.py
───────────────────
Automated tests for Cache-Augmented Generation (CAG) with Redis and In-Memory fallback.
"""

import sys
import unittest
from pathlib import Path

# Setup paths
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from services.cag_cache import CAGCache, get_cag_cache


class TestCAGCache(unittest.TestCase):
    def setUp(self):
        # Create an isolated CAG cache instance
        self.cag = CAGCache(redis_url="redis://localhost:6379/15")
        self.cag.invalidate("test_ns")

    def test_cag_miss_then_hit(self):
        key_data = {"project": "P001", "skills": ["python", "react"]}
        payload = {"tiers": [{"title": "FastAPI Basics"}], "summary": "Great course"}

        # 1. First lookup: Cache Miss
        result = self.cag.get("test_ns", key_data)
        self.assertIsNone(result)
        self.assertEqual(self.cag.misses, 1)
        self.assertEqual(self.cag.hits, 0)

        # 2. Set to cache
        success = self.cag.set("test_ns", key_data, payload, ttl_seconds=3600)
        self.assertTrue(success)

        # 3. Second lookup: Cache Hit
        cached_result = self.cag.get("test_ns", key_data)
        self.assertIsNotNone(cached_result)
        self.assertEqual(cached_result["summary"], "Great course")
        self.assertEqual(self.cag.hits, 1)

    def test_deterministic_key_ordering(self):
        """Verify that differently ordered dictionary keys produce identical cache hits."""
        key1 = {"b": 2, "a": 1, "skills": ["react", "node"]}
        key2 = {"a": 1, "b": 2, "skills": ["react", "node"]}

        self.cag.set("test_ns", key1, {"val": 42})
        hit = self.cag.get("test_ns", key2)
        self.assertIsNotNone(hit)
        self.assertEqual(hit["val"], 42)

    def test_stats_and_cost_savings(self):
        key = {"query": "gap_skills"}
        self.cag.set("learning_path", key, {"ok": True})

        # Generate 3 hits
        self.cag.get("learning_path", key)
        self.cag.get("learning_path", key)
        self.cag.get("learning_path", key)

        stats = self.cag.get_stats()
        self.assertEqual(stats["cache_hits"], 3)
        self.assertGreater(stats["estimated_tokens_saved"], 0)
        self.assertGreater(stats["estimated_cost_saved_usd"], 0)
        self.assertTrue(stats["cag_enabled"])

    def test_invalidation(self):
        key = {"project": "P002"}
        self.cag.set("test_ns", key, {"data": "active"})
        self.assertIsNotNone(self.cag.get("test_ns", key))

        self.cag.invalidate("test_ns", key)
        self.assertIsNone(self.cag.get("test_ns", key))


if __name__ == "__main__":
    unittest.main()
