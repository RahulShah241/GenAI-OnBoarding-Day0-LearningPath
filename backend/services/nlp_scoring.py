import re

TOPIC_KEYWORDS = {
    "Experience": ["experience", "worked", "project", "role"],
    "Skills": ["python", "fastapi", "react", "api", "llm"],
    "Communication": ["communicate", "team", "explain", "collaborate"],
    "Problem Solving": ["solve", "issue", "debug", "approach"],
}

def nlp_score(answer: str, topic: str) -> dict:
    text = answer.lower().strip()

    if len(text) < 3:
        return {
            "word_count": 0,
            "keyword_hits": 0,
            "nlp_score": 0
        }

    words = text.split()
    word_count = len(words)

    # Length score (max 4)
    length_score = min(word_count / 5, 4)

    # Keyword relevance (max 3)
    keywords = TOPIC_KEYWORDS.get(topic, [])
    keyword_hits = sum(1 for k in keywords if k in text)
    keyword_score = min(keyword_hits, 3)

    # Clarity (sentence structure)
    clarity_score = 1 if re.search(r"[.!?]", answer) else 0

    total = round(length_score + keyword_score + clarity_score, 2)

    return {
        "word_count": word_count,
        "keyword_hits": keyword_hits,
        "nlp_score": min(total, 5)
    }
