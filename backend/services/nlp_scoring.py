"""
services/nlp_scoring.py
───────────────────────
Lightweight keyword + length + punctuation scorer.

Score breakdown (max 5.0):
  length_score  = min(word_count / 5, 4.0)   — rewards longer answers
  keyword_score = min(hits, 3)                — rewards on-topic vocabulary
  clarity_score = 1.0 if ends with [.!?]     — rewards sentence structure
"""

from __future__ import annotations

import re

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "Role": ["role", "responsibilities", "work", "handle", "manage", "lead"],
    "Experience": ["experience", "worked", "project", "role", "years"],
    "Skills": ["python", "fastapi", "react", "api", "llm", "sql", "java", "aws"],
    "Communication": ["communicate", "team", "explain", "collaborate", "discuss"],
    "Problem Solving": ["solve", "issue", "debug", "approach", "fix", "analyse"],
}


def nlp_score(answer: str, topic: str) -> dict:
    """
    Score *answer* for *topic* using simple NLP heuristics.

    Returns
    -------
    dict with keys: word_count, keyword_hits, nlp_score (0–5).
    """
    text = answer.lower().strip()

    if len(text) < 3:
        return {"word_count": 0, "keyword_hits": 0, "nlp_score": 0.0}

    words = text.split()
    word_count = len(words)

    # Length score — saturates at 20 words (4 points)
    length_score = min(word_count / 5, 4.0)

    # Keyword relevance — check all topic keyword lists for partial matches
    keywords = TOPIC_KEYWORDS.get(topic, [])
    keyword_hits = sum(1 for k in keywords if k in text)
    keyword_score = min(keyword_hits, 3)

    # Clarity — presence of sentence-ending punctuation
    clarity_score = 1.0 if re.search(r"[.!?]", answer) else 0.0

    total = round(length_score + keyword_score + clarity_score, 2)

    return {
        "word_count": word_count,
        "keyword_hits": keyword_hits,
        "nlp_score": min(total, 5.0),
    }
