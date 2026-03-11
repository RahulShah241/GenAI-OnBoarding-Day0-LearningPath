"""
services/nlp_scoring.py
───────────────────────
Enhanced NLP scorer with:
  - Expanded keyword vocabulary per topic
  - Threshold enforcement  (pass if score >= THRESHOLD)
  - Skill extraction from Skills / Experience answers
  - Per-topic sub-analysis helpers used by profile generation
"""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

# ── Scoring threshold ──────────────────────────────────────────────────────────
SCORE_THRESHOLD: float = 2.5   # answers below this are flagged for re-attempt

# ── Topic keyword vocabulary ───────────────────────────────────────────────────
TOPIC_KEYWORDS: Dict[str, List[str]] = {
    "Role": [
        "role", "responsibilities", "work", "handle", "manage", "lead",
        "position", "job", "task", "daily", "currently", "function",
    ],
    "Skills": [
        # languages
        "python", "java", "javascript", "typescript", "go", "rust", "c++", "c#",
        "ruby", "kotlin", "swift",
        # frameworks / libs
        "react", "angular", "vue", "fastapi", "django", "flask", "spring",
        "express", "node", "nextjs", "tailwind",
        # data / AI
        "sql", "mysql", "postgres", "mongodb", "redis", "elasticsearch",
        "llm", "rag", "genai", "ml", "ai", "pandas", "numpy", "tensorflow",
        "pytorch", "sklearn",
        # infra / cloud
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
        "jenkins", "github actions", "linux",
        # generic skill words
        "api", "rest", "graphql", "microservice", "database", "testing",
        "debugging", "git",
    ],
    "Experience": [
        "experience", "worked", "project", "role", "years", "built",
        "developed", "implemented", "delivered", "team", "client",
        "production", "deployed", "maintained",
    ],
    "Communication": [
        "communicate", "team", "explain", "collaborate", "discuss",
        "meeting", "written", "verbal", "presentation", "update",
        "clarity", "stakeholder", "feedback", "share", "listen",
    ],
    "Ownership": [
        "ownership", "accountable", "responsible", "deliver", "deadline",
        "initiative", "proactive", "end-to-end", "follow up", "independent",
        "commit", "complete", "priority", "self-driven",
    ],
    "Collaboration": [
        "collaborate", "team", "cross-functional", "stakeholder", "align",
        "coordinate", "partner", "support", "shared", "together",
        "sprint", "agile", "scrum", "standup",
    ],
    "Problem-Solving": [
        "solve", "issue", "debug", "approach", "fix", "analyse", "analyze",
        "root cause", "investigate", "break down", "solution", "troubleshoot",
        "hypothesis", "experiment", "iterate",
    ],
    "Learning": [
        "learn", "course", "training", "upskill", "certification",
        "practice", "documentation", "tutorial", "explore", "study",
        "improve", "growth", "new", "adapt",
    ],
    "Workstyle": [
        "prefer", "like", "structure", "flexible", "remote", "hybrid",
        "async", "sync", "independent", "team", "routine", "focus",
        "motivate", "deep work", "organised",
    ],
    "Validation": [
        "profile", "accurate", "summary", "update", "add", "clarify",
        "correct", "change", "confirm", "yes", "no", "agree",
    ],
}

# ── Known tech skills list for extraction ─────────────────────────────────────
EXTRACTABLE_SKILLS: List[str] = [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C++", "C#",
    "Ruby", "Kotlin", "Swift",
    "React", "Angular", "Vue", "FastAPI", "Django", "Flask", "Spring Boot",
    "Express", "Node.js", "Next.js", "Tailwind",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
    "LLM", "RAG", "GenAI", "ML", "AI", "Pandas", "NumPy", "TensorFlow",
    "PyTorch", "Scikit-learn",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
    "CI/CD", "Jenkins", "GitHub Actions", "Linux",
    "REST API", "GraphQL", "Microservices", "Git",
    "Power BI", "Tableau", "Excel",
]

_SKILL_LOWER: Dict[str, str] = {s.lower(): s for s in EXTRACTABLE_SKILLS}


def nlp_score(answer: str, topic: str) -> dict:
    """
    Score *answer* for *topic* using heuristics.

    Returns
    -------
    dict — word_count, keyword_hits, nlp_score (0–5), threshold_passed (bool)
    """
    text = answer.lower().strip()

    if len(text) < 3:
        return {
            "word_count": 0,
            "keyword_hits": 0,
            "nlp_score": 0.0,
            "threshold_passed": False,
        }

    words = text.split()
    word_count = len(words)

    # Length score — saturates at 20 words (4 points)
    length_score = min(word_count / 5, 4.0)

    # Keyword relevance
    keywords = TOPIC_KEYWORDS.get(topic, [])
    keyword_hits = sum(1 for k in keywords if k in text)
    keyword_score = min(keyword_hits, 3)

    # Clarity — sentence-ending punctuation
    clarity_score = 1.0 if re.search(r"[.!?]", answer) else 0.0

    total = round(length_score + keyword_score + clarity_score, 2)
    final = min(total, 5.0)

    return {
        "word_count": word_count,
        "keyword_hits": keyword_hits,
        "nlp_score": final,
        "threshold_passed": final >= SCORE_THRESHOLD,
    }


def extract_skills_from_text(text: str) -> List[str]:
    """
    Return a de-duplicated list of known tech skills mentioned in *text*.
    Case-insensitive substring match.
    """
    lower = text.lower()
    found: List[str] = []
    for lower_skill, canonical in _SKILL_LOWER.items():
        # word-boundary check to avoid "go" matching "mongo"
        pattern = r"\b" + re.escape(lower_skill) + r"\b"
        if re.search(pattern, lower):
            found.append(canonical)
    return list(dict.fromkeys(found))  # preserve order, deduplicate


def extract_experience_years(text: str) -> float | None:
    """
    Try to parse a years-of-experience number from free text.
    Returns None if nothing found.
    """
    patterns = [
        r"(\d+(?:\.\d+)?)\s*\+?\s*years?",
        r"(\d+(?:\.\d+)?)\s*yrs?",
        r"over\s+(\d+)\s+years?",
        r"around\s+(\d+)\s+years?",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
    return None
