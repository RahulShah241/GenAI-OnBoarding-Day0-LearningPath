"""
services/course_recommender.py
───────────────────────────────
LLM-based skill course recommendation service.
Dynamically fetches online learning courses and direct links for skill match gap using google-genai SDK.
If no API key is set or LLM call fails, returns [].
"""

from __future__ import annotations

import json
import logging
import os
import requests

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False


def _get_api_key() -> str:
    return (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or "").strip()


def get_course_recommendations(gap_skills: list[str]) -> list[dict]:
    """
    Fetches online learning course recommendations via Gemini LLM API for the specified skill match gap.
    If no API key is registered or gap_skills is empty, returns [].
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

    # Approach 1: Use google-genai SDK if available
    if HAS_GENAI_SDK:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
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
            logger.warning("google-genai SDK call error: %s. Falling back to HTTP REST request.", exc)

    # Approach 2: HTTP REST API fallback
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if raw:
                clean_raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                parsed = json.loads(clean_raw)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
        else:
            logger.warning("Gemini REST API call failed with status %s: %s", res.status_code, res.text)
    except Exception as exc:
        logger.warning("Gemini REST API call error: %s", exc)

    return []
