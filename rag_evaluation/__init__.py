"""
rag_evaluation package
──────────────────────
Comprehensive RAG (Retrieval-Augmented Generation) Evaluation Suite for TalentForge AI.

Evaluates:
  • Context Retrieval Relevance (Query <-> Retrieved Project/Employee Context)
  • Faithfulness / Groundedness (Retrieved Context <-> Generated Output)
  • Answer Relevance (Query / Skill Gap <-> Generated Recommendations/Learning Paths)
  • Candidate Retrieval IR Metrics (Precision@K, Recall@K, Hit Rate, MRR)
  • Schema & Structural Adherence
"""

from .metrics import (
    context_relevance,
    faithfulness,
    answer_relevance,
    skill_coverage_score,
    retrieval_metrics,
    schema_adherence,
    compute_rag_triad,
)
from .evaluator import RAGEvaluator, EvaluationResult
from .dataset import BENCHMARK_DATASET

__all__ = [
    "context_relevance",
    "faithfulness",
    "answer_relevance",
    "skill_coverage_score",
    "retrieval_metrics",
    "schema_adherence",
    "compute_rag_triad",
    "RAGEvaluator",
    "EvaluationResult",
    "BENCHMARK_DATASET",
]
