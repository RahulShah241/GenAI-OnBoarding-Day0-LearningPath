"""
services/scoring_engine.py
──────────────────────────
Combines NLP and LLM scores into a single final_score.

Both sub-scores are on a 0–5 scale:
  nlp_score  — from nlp_scoring.nlp_score()     (0–5)
  llm_avg    — mean of relevance, depth, clarity  (0–5)

final_score = mean(nlp_score, llm_avg)          → range 0–5
"""

from __future__ import annotations

import json
from services.nlp_scoring import SCORE_THRESHOLD


def combine_scores(nlp: dict, llm: dict) -> dict:
    if isinstance(llm, str):
        llm = json.loads(llm)

    llm_avg: float = (
        llm.get("relevance", 0) + llm.get("depth", 0) + llm.get("clarity", 0)
    ) / 3.0

    final_score = round((nlp["nlp_score"] + llm_avg) / 2.0, 2)
    capped = min(final_score, 5.0)

    return {
        "final_score": capped,
        "threshold_passed": nlp.get("threshold_passed", capped >= SCORE_THRESHOLD),
        "nlp": nlp,
        "llm": llm,
    }
