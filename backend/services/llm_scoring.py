"""
services/llm_scoring.py
───────────────────────
Calls a local Ollama instance to evaluate an employee chatbot answer.
Returns a dict with keys: relevance, depth, clarity (all 0–5), feedback (str).

On any error (Ollama unavailable, JSON parse failure, timeout) the function
returns a graceful fallback dict instead of raising so the chatbot flow
always completes.
"""

from __future__ import annotations

import json
import logging
import os
import re

import requests

logger = logging.getLogger(__name__)

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")

_FALLBACK: dict = {
    "relevance": 0,
    "depth": 0,
    "clarity": 0,
    "feedback": "LLM evaluation unavailable",
}

_PROMPT_TEMPLATE = """\
You are an HR evaluator assessing an employee's interview answer.

Topic: {topic}
Question: {question}
Answer: {answer}

Evaluate the answer and return ONLY a valid JSON object — no extra text, no markdown:
{{
  "relevance": <integer 0-5>,
  "depth":     <integer 0-5>,
  "clarity":   <integer 0-5>,
  "feedback":  "<one sentence of constructive feedback>"
}}
"""


def _extract_json(text: str) -> dict | None:
    """Try to find and parse the first JSON object in *text*."""
    match = re.search(r"\{.*?\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


def llm_score(topic: str, question: str, answer: str) -> dict:
    """
    Ask the local LLM to score one chatbot answer.

    Returns
    -------
    dict with keys: relevance, depth, clarity (int 0–5), feedback (str).
    Falls back to _FALLBACK if Ollama is unreachable or returns bad JSON.
    """
    prompt = _PROMPT_TEMPLATE.format(topic=topic, question=question, answer=answer)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL, "prompt": prompt, "stream": False},
            timeout=30,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        logger.warning("Ollama request failed: %s", exc)
        return _FALLBACK

    # Ollama wraps the model output inside {"response": "..."}
    try:
        outer = response.json()
        raw_text: str = outer.get("response", "")
    except json.JSONDecodeError:
        logger.warning("Ollama returned non-JSON outer wrapper")
        return _FALLBACK

    # Attempt 1: the model returned a clean JSON string
    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, dict) and "relevance" in parsed:
            return parsed
    except json.JSONDecodeError:
        pass

    # Attempt 2: extract JSON from the middle of a text response
    extracted = _extract_json(raw_text)
    if extracted and "relevance" in extracted:
        return extracted

    logger.warning("Could not parse LLM response as scoring JSON: %.200s", raw_text)
    return _FALLBACK
