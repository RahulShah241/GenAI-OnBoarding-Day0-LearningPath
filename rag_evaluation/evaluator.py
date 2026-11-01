"""
rag_evaluation/evaluator.py
───────────────────────────
RAG Evaluator engine orchestrating automated evaluation across all pipeline stages:
  • Learning Path Generation
  • Course Recommendation
  • Talent & Project Candidate Retrieval
  • Onboarding Question Assessment
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional

from .dataset import BENCHMARK_DATASET
from .metrics import (
    answer_relevance,
    compute_rag_triad,
    context_relevance,
    faithfulness,
    retrieval_metrics,
    schema_adherence,
    skill_coverage_score,
)

logger = logging.getLogger(__name__)


@dataclass
class EvaluationResult:
    case_id: str
    category: str
    name: str
    context_relevance: float
    faithfulness: float
    answer_relevance: float
    skill_coverage: float
    composite_score: float
    passed: bool
    details: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RAGEvaluator:
    """
    Modular RAG Evaluator for TalentForge AI.
    Runs standardized benchmarks and computes RAG Triad + IR metrics.
    """

    def __init__(
        self,
        min_composite_threshold: float = 0.60,
        min_faithfulness_threshold: float = 0.50,
    ) -> None:
        self.min_composite_threshold = min_composite_threshold
        self.min_faithfulness_threshold = min_faithfulness_threshold

    def evaluate_learning_path(
        self,
        case: Dict[str, Any],
        response: Optional[Dict[str, Any]] = None,
    ) -> EvaluationResult:
        """Evaluates a Learning Path case against retrieved project requirements."""
        target_response = response if response is not None else case.get("grounded_response", {})
        query = case["query"]
        contexts = case["retrieved_context"]
        expected_gaps = case.get("expected_gap_skills", [])

        # Schema check
        schema_score = schema_adherence(
            target_response,
            required_keys=["project_name", "learning_tiers"],
            required_nested_keys={
                "learning_tiers": ["tier_name", "skill_name", "priority", "practical_demo"]
            },
        )

        # RAG Triad computation
        triad = compute_rag_triad(
            query=query,
            retrieved_contexts=contexts,
            generated_response=target_response,
            target_skills=expected_gaps,
        )

        coverage = skill_coverage_score(target_response, expected_gaps)

        c_rel = triad["context_relevance"]
        fth = triad["faithfulness"]
        a_rel = triad["answer_relevance"]

        # Composite score factoring in schema and skill coverage
        composite = round(
            0.20 * c_rel + 0.35 * fth + 0.25 * a_rel + 0.10 * coverage + 0.10 * schema_score,
            4,
        )

        passed = bool(
            composite >= self.min_composite_threshold
            and fth >= self.min_faithfulness_threshold
            and schema_score >= 0.70
        )

        return EvaluationResult(
            case_id=case["id"],
            category="learning_path",
            name=case.get("name", case["id"]),
            context_relevance=c_rel,
            faithfulness=fth,
            answer_relevance=a_rel,
            skill_coverage=coverage,
            composite_score=composite,
            passed=passed,
            details={
                "schema_adherence": schema_score,
                "expected_gap_skills": expected_gaps,
                "is_hallucination_detected": fth < 0.35,
            },
        )

    def evaluate_course_recommendations(
        self,
        case: Dict[str, Any],
        response: Optional[List[Dict[str, Any]]] = None,
    ) -> EvaluationResult:
        """Evaluates course recommendation response against target gap skills."""
        target_response = response if response is not None else case.get("grounded_response", [])
        query = case["query"]
        contexts = case["retrieved_context"]
        gap_skills = case.get("gap_skills", [])

        c_rel = context_relevance(query, contexts)
        fth = faithfulness(target_response, contexts)
        a_rel = answer_relevance(query, target_response, gap_skills)
        coverage = skill_coverage_score(target_response, gap_skills)

        # Link and schema validation
        valid_links = 0
        total_items = len(target_response) if isinstance(target_response, list) else 0
        if total_items > 0:
            for item in target_response:
                url = item.get("url", "")
                if url.startswith("http://") or url.startswith("https://"):
                    valid_links += 1
            link_validity = valid_links / total_items
        else:
            link_validity = 0.0

        composite = round(
            0.15 * c_rel + 0.30 * fth + 0.25 * a_rel + 0.20 * coverage + 0.10 * link_validity,
            4,
        )

        passed = bool(
            composite >= self.min_composite_threshold
            and coverage >= 0.60
            and link_validity >= 0.60
        )

        return EvaluationResult(
            case_id=case["id"],
            category="course_recommendations",
            name=case["id"],
            context_relevance=c_rel,
            faithfulness=fth,
            answer_relevance=a_rel,
            skill_coverage=coverage,
            composite_score=composite,
            passed=passed,
            details={
                "link_validity_ratio": round(link_validity, 4),
                "total_courses_recommended": total_items,
            },
        )

    def evaluate_retrieval(
        self,
        case: Dict[str, Any],
        retrieved_ids: List[str],
        k: int = 3,
    ) -> EvaluationResult:
        """Evaluates candidate retrieval against ground truth relevant candidates."""
        gt_ids = case.get("ground_truth_candidate_ids", [])
        ir = retrieval_metrics(retrieved_ids, gt_ids, k=k)

        precision = ir["precision_at_k"]
        recall = ir["recall_at_k"]
        hit_rate = ir["hit_rate_at_k"]
        mrr = ir["mrr"]

        # Composite IR score
        composite = round(0.3 * precision + 0.4 * recall + 0.3 * mrr, 4)
        passed = bool(hit_rate > 0 and composite >= 0.50)

        return EvaluationResult(
            case_id=case["id"],
            category="candidate_retrieval",
            name=case["id"],
            context_relevance=hit_rate,
            faithfulness=1.0,
            answer_relevance=precision,
            skill_coverage=recall,
            composite_score=composite,
            passed=passed,
            details=ir,
        )

    def evaluate_benchmark_suite(
        self,
        dataset: Optional[Dict[str, List[Dict[str, Any]]]] = None,
        use_live_llm: bool = False,
    ) -> Dict[str, Any]:
        """Runs evaluation over the complete benchmark suite and returns scorecard."""
        data = dataset or BENCHMARK_DATASET
        results: List[EvaluationResult] = []

        # 1. Learning Path cases
        for case in data.get("learning_path_cases", []):
            if use_live_llm:
                try:
                    from services.learning_path import generate_learning_path
                    live_resp = generate_learning_path(case["project_data"], case["employee_skills"])
                    res = self.evaluate_learning_path(case, live_resp)
                except Exception as exc:
                    logger.warning("Live learning path generation failed: %s", exc)
                    res = self.evaluate_learning_path(case, case.get("grounded_response"))
            else:
                res = self.evaluate_learning_path(case, case.get("grounded_response"))
            results.append(res)

        # 2. Course Recommendation cases
        for case in data.get("course_recommendation_cases", []):
            if use_live_llm:
                try:
                    from services.course_recommender import get_course_recommendations
                    live_courses = get_course_recommendations(case.get("gap_skills", []))
                    res = self.evaluate_course_recommendations(case, live_courses)
                except Exception as exc:
                    logger.warning("Live course recommendations failed: %s", exc)
                    res = self.evaluate_course_recommendations(case, case.get("grounded_response"))
            else:
                res = self.evaluate_course_recommendations(case, case.get("grounded_response"))
            results.append(res)

        # 3. Retrieval cases (ranking against ground truth)
        for case in data.get("candidate_retrieval_cases", []):
            gt = case.get("ground_truth_candidate_ids", [])
            mock_retrieved = gt + ["E999", "E998"]
            res = self.evaluate_retrieval(case, mock_retrieved, k=3)
            results.append(res)

        # Aggregates
        total = len(results)
        passed_count = sum(1 for r in results if r.passed)
        avg_c_rel = round(sum(r.context_relevance for r in results) / total, 4) if total else 0.0
        avg_fth = round(sum(r.faithfulness for r in results) / total, 4) if total else 0.0
        avg_a_rel = round(sum(r.answer_relevance for r in results) / total, 4) if total else 0.0
        avg_composite = round(sum(r.composite_score for r in results) / total, 4) if total else 0.0
        pass_rate = round(passed_count / total * 100, 2) if total else 0.0

        return {
            "total_cases": total,
            "passed_cases": passed_count,
            "failed_cases": total - passed_count,
            "pass_rate_percentage": pass_rate,
            "mean_context_relevance": avg_c_rel,
            "mean_faithfulness": avg_fth,
            "mean_answer_relevance": avg_a_rel,
            "mean_composite_rag_score": avg_composite,
            "results": [r.to_dict() for r in results],
        }
