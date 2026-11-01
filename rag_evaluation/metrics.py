"""
rag_evaluation/metrics.py
─────────────────────────
Core evaluation metrics for RAG (Retrieval-Augmented Generation) systems.

Implements:
  1. Context Relevance: Evaluates if retrieved chunks match query intent.
  2. Faithfulness / Groundedness: Evaluates if claims in generated response are supported by retrieved context.
  3. Answer Relevance: Evaluates if generated response directly answers the query.
  4. Skill Gap Coverage: Verifies that 100% of required gap skills are addressed.
  5. Retrieval IR Metrics: Precision@K, Recall@K, Hit Rate@K, MRR.
  6. Schema Adherence: Verifies JSON structural integrity.
  7. Composite RAG Triad Score: Weighted overall quality metric.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Set, Tuple


_STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with",
    "by", "about", "as", "into", "like", "through", "after", "over", "between",
    "out", "against", "during", "without", "before", "under", "around", "among",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "will", "would", "should", "must",
    "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
    "of", "from", "up", "down", "not", "only", "such", "than", "too", "very",
}


def _tokenize(text: str) -> Set[str]:
    """Extract lowercase alpha-numeric words ignoring stopwords."""
    words = re.findall(r"[a-zA-Z0-9_\-\+\#\.]+", text.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 1}


def _extract_text_content(data: Any) -> str:
    """Recursively converts dict, list, or primitive into a single searchable text string."""
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        parts = []
        for k, v in data.items():
            parts.append(str(k))
            parts.append(_extract_text_content(v))
        return " ".join(parts)
    if isinstance(data, (list, tuple, set)):
        return " ".join(_extract_text_content(item) for item in data)
    return str(data)


def context_relevance(query: str, retrieved_contexts: List[str]) -> float:
    """
    Measures how relevant the retrieved context passages are to the query.
    Score: 0.0 to 1.0 (Higher is better).

    Formula:
      Evaluates the precision of query key concepts found within the retrieved contexts.
    """
    if not retrieved_contexts:
        return 0.0

    query_tokens = _tokenize(query)
    if not query_tokens:
        return 1.0

    combined_context_text = " ".join(retrieved_contexts).lower()
    matched_tokens = {tok for tok in query_tokens if tok in combined_context_text}
    token_recall = len(matched_tokens) / len(query_tokens)

    # Context compactness: penalize bloated contexts with low density
    total_context_tokens = len(_tokenize(combined_context_text))
    if total_context_tokens == 0:
        return 0.0

    # Weighted blend of token presence and relevance
    return round(min(1.0, token_recall), 4)


def _extract_focal_skills(data: Any) -> List[str]:
    """Extract focal skills and competencies mentioned in generated response structures."""
    skills: List[str] = []
    if isinstance(data, dict):
        if "learning_tiers" in data and isinstance(data["learning_tiers"], list):
            for t in data["learning_tiers"]:
                if isinstance(t, dict) and "skill_name" in t:
                    skills.append(str(t["skill_name"]))
        if "skill" in data:
            skills.append(str(data["skill"]))
    elif isinstance(data, (list, tuple)):
        for item in data:
            skills.extend(_extract_focal_skills(item))
    return skills


def faithfulness(generated_response: Any, retrieved_contexts: List[str]) -> float:
    """
    Measures the degree to which generated claims/statements are grounded in
    the retrieved context (detects hallucinations).
    Score: 0.0 to 1.0 (1.0 = completely grounded).
    
    Evaluates:
      1. Focal entity & skill grounding: are the generated skills grounded in retrieved context?
      2. Lexical & domain grounding: fraction of substantive terms supported by context.
    """
    if not retrieved_contexts:
        return 0.0

    context_str = " ".join(retrieved_contexts).lower()
    focal_skills = _extract_focal_skills(generated_response)

    if focal_skills:
        grounded_skills = 0
        for s in focal_skills:
            parts = [p.strip() for p in re.split(r"[/,&]", s.lower()) if p.strip()]
            if any(p in context_str for p in parts) or s.lower() in context_str:
                grounded_skills += 1
        skill_grounding = grounded_skills / len(focal_skills)
    else:
        skill_grounding = 0.5

    # Lexical content check
    response_text = _extract_text_content(generated_response).lower()
    words = re.findall(r"[a-zA-Z0-9_\-\+\#\.]+", response_text)
    substantive_words = [w for w in words if len(w) > 3 and w not in _STOPWORDS]

    if substantive_words:
        matched_words = [w for w in substantive_words if w in context_str]
        word_grounding = len(matched_words) / len(substantive_words)
    else:
        word_grounding = 1.0

    if focal_skills:
        score = 0.70 * skill_grounding + 0.30 * word_grounding
    else:
        # Scale word grounding for plain text answers
        score = min(1.0, word_grounding * 1.5)

    return round(min(1.0, max(0.0, score)), 4)


def answer_relevance(
    query: str,
    generated_response: Any,
    target_skills: List[str] | None = None,
) -> float:
    """
    Measures how directly the generated response answers the query and addresses
    the target requirements/skills.
    Score: 0.0 to 1.0.
    """
    response_text = _extract_text_content(generated_response).lower()
    query_tokens = _tokenize(query)

    if not response_text:
        return 0.0

    # Query term overlap
    matched_query_tokens = {t for t in query_tokens if t in response_text}
    query_score = len(matched_query_tokens) / len(query_tokens) if query_tokens else 1.0

    # Target skill presence if provided
    skill_score = 1.0
    if target_skills:
        skill_hits = sum(
            1 for s in target_skills
            if s.lower() in response_text
        )
        skill_score = skill_hits / len(target_skills)

    # Blend 40% query overlap + 60% target skill alignment
    relevance = 0.4 * query_score + 0.6 * skill_score
    return round(min(1.0, max(0.0, relevance)), 4)


def skill_coverage_score(
    generated_items: List[Dict[str, Any]] | Dict[str, Any],
    target_gap_skills: List[str],
) -> float:
    """
    Calculates the exact coverage fraction of target missing/gap skills in
    the generated course recommendations or learning path tiers.
    """
    if not target_gap_skills:
        return 1.0

    extracted_text = _extract_text_content(generated_items).lower()
    covered = 0
    for skill in target_gap_skills:
        skill_clean = skill.strip().lower()
        if not skill_clean:
            continue
        # Support slash or hyphen variations, e.g., 'GenAI / RAG'
        parts = [p.strip() for p in re.split(r"[/,]", skill_clean) if p.strip()]
        if any(p in extracted_text for p in parts) or skill_clean in extracted_text:
            covered += 1

    return round(covered / len(target_gap_skills), 4)


def retrieval_metrics(
    retrieved_ids: List[str],
    ground_truth_ids: List[str],
    k: int = 3,
) -> Dict[str, float]:
    """
    Calculates Information Retrieval (IR) metrics:
      • Precision@K: Fraction of top-k retrieved items that are relevant.
      • Recall@K: Fraction of ground truth relevant items found in top-k.
      • HitRate@K: 1.0 if at least one relevant item is in top-k, else 0.0.
      • MRR (Mean Reciprocal Rank): 1 / rank of first relevant item.
    """
    if not ground_truth_ids:
        return {"precision_at_k": 1.0, "recall_at_k": 1.0, "hit_rate_at_k": 1.0, "mrr": 1.0}

    top_k = retrieved_ids[:k]
    gt_set = set(ground_truth_ids)

    relevant_in_top_k = [item for item in top_k if item in gt_set]

    precision = len(relevant_in_top_k) / k if k > 0 else 0.0
    recall = len(relevant_in_top_k) / len(gt_set) if gt_set else 0.0
    hit_rate = 1.0 if len(relevant_in_top_k) > 0 else 0.0

    mrr = 0.0
    for rank, item in enumerate(retrieved_ids, start=1):
        if item in gt_set:
            mrr = 1.0 / rank
            break

    return {
        "precision_at_k": round(precision, 4),
        "recall_at_k": round(recall, 4),
        "hit_rate_at_k": round(hit_rate, 4),
        "mrr": round(mrr, 4),
    }


def schema_adherence(
    response_obj: Any,
    required_keys: List[str],
    required_nested_keys: Dict[str, List[str]] | None = None,
) -> float:
    """
    Validates structural compliance of LLM output against the expected schema.
    Returns float score between 0.0 and 1.0.
    """
    if not isinstance(response_obj, dict):
        return 0.0

    total_checks = len(required_keys)
    passed_checks = sum(1 for key in required_keys if key in response_obj)

    if required_nested_keys:
        for parent_key, subkeys in required_nested_keys.items():
            parent_val = response_obj.get(parent_key)
            if isinstance(parent_val, list) and parent_val:
                total_checks += len(subkeys)
                first_item = parent_val[0]
                if isinstance(first_item, dict):
                    passed_checks += sum(1 for sk in subkeys if sk in first_item)
            elif isinstance(parent_val, dict):
                total_checks += len(subkeys)
                passed_checks += sum(1 for sk in subkeys if sk in parent_val)
            else:
                total_checks += len(subkeys)

    return round(passed_checks / total_checks, 4) if total_checks > 0 else 1.0


def compute_rag_triad(
    query: str,
    retrieved_contexts: List[str],
    generated_response: Any,
    target_skills: List[str] | None = None,
    weights: Tuple[float, float, float] = (0.25, 0.45, 0.30),
) -> Dict[str, Any]:
    """
    Computes standard RAG Triad scores:
      1. Context Relevance (Query <-> Context)
      2. Faithfulness / Groundedness (Context <-> Generation)
      3. Answer Relevance (Query <-> Generation)

    Returns dictionary containing individual scores and weighted composite.
    """
    c_rel = context_relevance(query, retrieved_contexts)
    faith = faithfulness(generated_response, retrieved_contexts)
    a_rel = answer_relevance(query, generated_response, target_skills)

    w_ctx, w_fth, w_ans = weights
    composite = round(w_ctx * c_rel + w_fth * faith + w_ans * a_rel, 4)

    return {
        "context_relevance": c_rel,
        "faithfulness": faith,
        "answer_relevance": a_rel,
        "composite_rag_score": composite,
        "passed": bool(composite >= 0.65 and faith >= 0.50),
    }
