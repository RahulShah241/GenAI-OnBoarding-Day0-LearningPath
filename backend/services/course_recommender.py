"""
services/course_recommender.py
───────────────────────────────
LLM-based skill course recommendation service.
Dynamically fetches online learning courses and direct links for skill match gap using google-genai SDK.
Handles HTTP 400, 429 (Rate Limit), and 500 status codes cleanly.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Quiet verbose third-party loggers
logging.getLogger("google_genai").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False


def _get_api_key() -> str:
    """Load valid Gemini API key from backend/.env or root .env with override=True."""
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    root_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=True)
    elif root_env.exists():
        load_dotenv(root_env, override=True)
    else:
        load_dotenv(override=True)

    return (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or "").strip()


def get_course_recommendations(gap_skills: list[str]) -> list[dict]:
    """
    Fetches online learning course recommendations via Gemini LLM API for the specified skill match gap.
    If no API key is registered, returns [].
    """
    api_key = _get_api_key()
    if not api_key:
        logger.info("No Gemini API key registered. Returning empty course recommendations.")
        return []

    if not gap_skills:
        return []

    skills_str = ", ".join(gap_skills)
    prompt = (
        f"You are an expert technical career coach. An employee has a skill gap in the following required skills: {skills_str}.\n"
        "For EACH missing skill listed above, recommend 1 high-quality online course, tutorial, or documentation resource to help them bridge this gap.\n"
        "Return ONLY a valid JSON array of objects with exact keys: 'skill', 'course_title', 'url', 'platform'.\n"
        "Ensure the 'url' is a direct, valid web link to the course or official documentation for that skill (e.g., official docs, Coursera, Udemy, YouTube, freeCodeCamp, or DeepLearning.AI).\n"
        "Do NOT include markdown code block formatting or extra commentary outside the JSON array."
    )

    models_to_try = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"]

    # Approach 1: Use google-genai SDK if available
    if HAS_GENAI_SDK:
        for m_name in models_to_try:
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=m_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                raw = response.text
                if raw:
                    clean_raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(clean_raw)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return parsed
            except Exception as exc:
                err_str = str(exc)
                if "400" in err_str or "INVALID_ARGUMENT" in err_str or "API key" in err_str:
                    logger.warning("Gemini API Key rejected (HTTP 400 Bad Request): %s", exc)
                    break
                logger.debug("SDK call error for %s: %s", m_name, exc)

    # Approach 2: HTTP REST API fallback
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    for m_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=12)
            if res.status_code == 200:
                data = res.json()
                raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if raw:
                    clean_raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(clean_raw)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return parsed
            elif res.status_code == 400:
                logger.warning("Gemini REST API call rejected key (HTTP 400): %s", res.text[:150])
                break
        except Exception as exc:
            logger.debug("REST API error for %s: %s", m_name, exc)

    return []
