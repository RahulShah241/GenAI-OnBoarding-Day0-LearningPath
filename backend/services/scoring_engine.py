"""
services/scoring_engine.py
──────────────────────────
Combines NLP and LLM scores into a single final_score.

Both sub-scores are on a 0–5 scale:
  nlp_score  — from nlp_scoring.nlp_score()     (0–5)
  llm_avg    — mean of relevance, depth, clarity  (0–5)

final_score = mean(nlp_score, llm_avg)          → range 0–5
The result is capped at 5.0 to guard against edge cases.
"""

from __future__ import annotations

import json


def combine_scores(nlp: dict, llm: dict) -> dict:
    """
    Merge NLP and LLM sub-scores into a single evaluation result.

    Parameters
    ----------
    nlp : dict  — output of nlp_scoring.nlp_score()
    llm : dict  — output of llm_scoring.llm_score()

    Returns
    -------
    dict with keys: final_score (float 0–5), nlp (dict), llm (dict).
    """
    # Defensive: accept a JSON string as well as a dict
    if isinstance(llm, str):
        llm = json.loads(llm)

    llm_avg: float = (
        llm.get("relevance", 0) + llm.get("depth", 0) + llm.get("clarity", 0)
    ) / 3.0

    final_score = round((nlp["nlp_score"] + llm_avg) / 2.0, 2)

    return {
        "final_score": min(final_score, 5.0),
        "nlp": nlp,
        "llm": llm,
    }
