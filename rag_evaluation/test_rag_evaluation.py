"""
rag_evaluation/test_rag_evaluation.py
─────────────────────────────────────
Automated Test Suite for RAG Evaluation in TalentForge AI.

Compatible with both pytest and python -m unittest:
  • pytest rag_evaluation/test_rag_evaluation.py
  • python -m unittest discover -s rag_evaluation
"""

from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path

# Add project root and backend to sys.path so modules can be imported seamlessly
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_DIR = _PROJECT_ROOT / "backend"

if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from rag_evaluation.dataset import BENCHMARK_DATASET
from rag_evaluation.evaluator import RAGEvaluator
from rag_evaluation.metrics import (
    answer_relevance,
    compute_rag_triad,
    context_relevance,
    faithfulness,
    retrieval_metrics,
    schema_adherence,
    skill_coverage_score,
)

# Optional project backend imports
try:
    from services.nlp_scoring import SCORE_THRESHOLD, nlp_score
    from matching import calculate_match
    HAS_BACKEND_MODULES = True
except ImportError:
    HAS_BACKEND_MODULES = False


class TestRAGMetrics(unittest.TestCase):
    """Unit tests for individual RAG evaluation metrics."""

    def test_context_relevance_high(self):
        query = "React Node.js Python GenAI required skills for AI Talent Matching Platform"
        contexts = [
            "Project P001: AI Talent Matching Platform. Required skills: React, Node.js, Python, GenAI.",
            "Employee profile: Backend Developer with Java experience.",
        ]
        score = context_relevance(query, contexts)
        self.assertGreaterEqual(score, 0.70)

    def test_context_relevance_empty_or_low(self):
        query = "Kubernetes Docker AWS Terraform cloud deployment"
        contexts = [
            "Cooking recipes for homemade sourdough bread and pasta.",
        ]
        score = context_relevance(query, contexts)
        self.assertLess(score, 0.20)

    def test_faithfulness_grounded_vs_hallucinated(self):
        contexts = [
            "Project P001 requires React, Node.js, and Python FastAPI for building microservices.",
        ]
        grounded_resp = {
            "summary": "We will learn Python FastAPI and React for the microservices project.",
        }
        hallucinated_resp = {
            "summary": "We will write embedded z/OS Cobol and Fortran assembly routines.",
        }

        score_grounded = faithfulness(grounded_resp, contexts)
        score_hallucinated = faithfulness(hallucinated_resp, contexts)

        self.assertGreater(score_grounded, 0.50)
        self.assertLess(score_hallucinated, 0.25)
        self.assertGreater(score_grounded, score_hallucinated)

    def test_answer_relevance_with_target_skills(self):
        query = "Recommend courses to learn React and GenAI"
        resp_good = "Here is a React tutorial and a GenAI LangChain workshop."
        resp_bad = "Let's talk about accounting and budget management."

        score_good = answer_relevance(query, resp_good, target_skills=["React", "GenAI"])
        score_bad = answer_relevance(query, resp_bad, target_skills=["React", "GenAI"])

        self.assertGreater(score_good, 0.70)
        self.assertLess(score_bad, 0.30)

    def test_skill_coverage_score(self):
        generated = [
            {"skill": "React", "title": "React 18 Basics"},
            {"skill": "Python", "title": "FastAPI Masterclass"},
        ]
        target_gaps = ["React", "Python", "Docker"]
        # 2 out of 3 skills covered = 0.6667
        cov = skill_coverage_score(generated, target_gaps)
        self.assertAlmostEqual(cov, 2 / 3, places=2)

        # 100% coverage
        cov_full = skill_coverage_score(generated, ["React", "Python"])
        self.assertEqual(cov_full, 1.0)

    def test_retrieval_metrics_ir(self):
        retrieved = ["E003", "E001", "E002", "E004"]
        ground_truth = ["E003", "E004"]

        metrics = retrieval_metrics(retrieved, ground_truth, k=2)
        # In top 2: only E003 is present out of ["E003", "E001"]
        self.assertEqual(metrics["precision_at_k"], 0.5)
        self.assertEqual(metrics["recall_at_k"], 0.5)
        self.assertEqual(metrics["hit_rate_at_k"], 1.0)
        self.assertEqual(metrics["mrr"], 1.0)  # E003 is at rank 1

    def test_schema_adherence_valid_and_invalid(self):
        valid_obj = {
            "project_name": "P001",
            "learning_tiers": [
                {
                    "tier_name": "Tier 1",
                    "skill_name": "Python",
                    "priority": "High",
                    "practical_demo": {"title": "Demo"},
                }
            ],
        }
        invalid_obj = {"wrong_key": 123}

        score_valid = schema_adherence(
            valid_obj,
            required_keys=["project_name", "learning_tiers"],
            required_nested_keys={"learning_tiers": ["tier_name", "skill_name", "priority", "practical_demo"]},
        )
        score_invalid = schema_adherence(
            invalid_obj,
            required_keys=["project_name", "learning_tiers"],
        )

        self.assertEqual(score_valid, 1.0)
        self.assertEqual(score_invalid, 0.0)

    def test_compute_rag_triad(self):
        query = "Python FastAPI and GenAI for onboarding"
        contexts = ["Python FastAPI microservices with GenAI integration."]
        response = "We will learn Python, FastAPI, and GenAI techniques."

        triad = compute_rag_triad(query, contexts, response, target_skills=["Python", "FastAPI", "GenAI"])
        self.assertIn("context_relevance", triad)
        self.assertIn("faithfulness", triad)
        self.assertIn("answer_relevance", triad)
        self.assertIn("composite_rag_score", triad)
        self.assertTrue(triad["passed"])


class TestRAGEvaluatorSuite(unittest.TestCase):
    """End-to-end evaluation tests using RAGEvaluator engine on benchmark dataset."""

    def setUp(self):
        self.evaluator = RAGEvaluator(min_composite_threshold=0.60, min_faithfulness_threshold=0.50)

    def test_evaluate_grounded_learning_path(self):
        case = BENCHMARK_DATASET["learning_path_cases"][0]
        res = self.evaluator.evaluate_learning_path(case, case["grounded_response"])

        self.assertTrue(res.passed, f"Expected grounded response to pass, got: {res}")
        self.assertGreaterEqual(res.composite_score, 0.60)
        self.assertGreaterEqual(res.faithfulness, 0.50)
        self.assertFalse(res.details.get("is_hallucination_detected"))

    def test_detect_hallucinated_learning_path(self):
        case = BENCHMARK_DATASET["learning_path_cases"][0]
        res = self.evaluator.evaluate_learning_path(case, case["hallucinated_response"])

        self.assertFalse(res.passed, f"Expected hallucinated response to fail evaluation: {res}")
        self.assertTrue(
            res.details.get("is_hallucination_detected") or res.faithfulness < 0.40,
            "Hallucination should be detected by evaluator",
        )

    def test_evaluate_course_recommendations_grounded(self):
        case = BENCHMARK_DATASET["course_recommendation_cases"][0]
        res = self.evaluator.evaluate_course_recommendations(case, case["grounded_response"])

        self.assertTrue(res.passed)
        self.assertEqual(res.skill_coverage, 1.0)
        self.assertEqual(res.details.get("link_validity_ratio"), 1.0)

    def test_evaluate_course_recommendations_hallucinated(self):
        case = BENCHMARK_DATASET["course_recommendation_cases"][0]
        res = self.evaluator.evaluate_course_recommendations(case, case["hallucinated_response"])

        self.assertFalse(res.passed)
        self.assertLess(res.skill_coverage, 0.50)

    def test_evaluate_candidate_retrieval(self):
        case = BENCHMARK_DATASET["candidate_retrieval_cases"][0]
        # Top-ranked retrieval with ground truth candidate E003
        retrieved = ["E003", "E001", "E002"]
        res = self.evaluator.evaluate_retrieval(case, retrieved, k=3)

        self.assertTrue(res.passed)
        self.assertGreater(res.details["hit_rate_at_k"], 0.0)
        self.assertEqual(res.details["mrr"], 1.0)

    def test_benchmark_suite_aggregation(self):
        summary = self.evaluator.evaluate_benchmark_suite()
        self.assertGreater(summary["total_cases"], 0)
        self.assertEqual(summary["failed_cases"], 0)
        self.assertEqual(summary["pass_rate_percentage"], 100.0)
        self.assertGreaterEqual(summary["mean_composite_rag_score"], 0.65)


class TestProjectIntegration(unittest.TestCase):
    """Integration tests connecting RAG evaluation directly to backend services."""

    @unittest.skipUnless(HAS_BACKEND_MODULES, "Backend modules not loaded")
    def test_onboarding_threshold_gate_enforcement(self):
        """Validates that low-quality answers fail the threshold gate (SCORE_THRESHOLD = 2.5)."""
        good_ans = (
            "I have 3 years of experience with Python, FastAPI, and SQL. "
            "I built scalable microservices, handled Docker containers, and wrote unit tests."
        )
        score_good = nlp_score(good_ans, "Skills")
        self.assertTrue(score_good["threshold_passed"])
        self.assertGreaterEqual(score_good["nlp_score"], SCORE_THRESHOLD)

        poor_ans = "ok fine"
        score_poor = nlp_score(poor_ans, "Skills")
        self.assertFalse(score_poor["threshold_passed"])
        self.assertLess(score_poor["nlp_score"], SCORE_THRESHOLD)

    @unittest.skipUnless(HAS_BACKEND_MODULES, "Backend modules not loaded")
    def test_matching_retrieval_ranking(self):
        """Validates that matching retrieval ranks candidates according to project requirements."""
        # Load sample project and employees from SQLite database
        try:
            from database import init_db, get_all_projects, get_all_employees
            init_db()
            projects = get_all_projects()
            employees = get_all_employees()
        except Exception:
            projects, employees = [], []

        if not projects or not employees:
            self.skipTest("Data not found in database")

        p001 = next((p for p in projects if p["project_id"] == "P001"), None)
        self.assertIsNotNone(p001)

        # Match all employees against P001
        scored_candidates = []
        for emp in employees:
            matched = calculate_match(p001, emp)
            scored_candidates.append(matched)

        # Sort by match_percentage descending
        scored_candidates.sort(key=lambda x: x.match_percentage, reverse=True)
        top_candidate = scored_candidates[0]

        # Top candidate should have non-zero match and matched skills
        self.assertGreater(top_candidate.match_percentage, 0)
        self.assertGreater(len(top_candidate.matched_skills), 0)


if __name__ == "__main__":
    unittest.main()
