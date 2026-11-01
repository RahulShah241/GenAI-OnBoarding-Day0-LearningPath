"""
services/learning_path.py
──────────────────────────
AI Professional Tutor service using Gemini API (models/gemini-3.8-flash / gemini-2.5-flash).
Generates a full summary learning path for an employee tailored to a project:
  • High Priority to Low Priority skill progression.
  • Specifies required frameworks and tools for each skill tier.
  • Avoids hardcoded course links; generates interactive practical demos & code snippets.
  • Handles HTTP 400, 429 (Rate Limit), and 500 error codes cleanly with warning status payload.
"""

from __future__ import annotations

import json
import logging
import os
import requests

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
    from pathlib import Path
    from dotenv import load_dotenv
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    root_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=True)
    elif root_env.exists():
        load_dotenv(root_env, override=True)
    else:
        load_dotenv(override=True)
    return (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or "").strip()


def generate_learning_path(project_data: dict, employee_skills: list[str]) -> dict:
    """
    Generates an expert learning path using Gemini API.
    Handles 400, 429, and 500 response codes gracefully.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("No Gemini API key registered.")
        return {
            "api_available": False,
            "status_code": 400,
            "warning_message": "Warning (HTTP 400): No Gemini API key registered in backend/.env.",
            "learning_tiers": []
        }

    project_name = project_data.get("project_name", "Target Project")
    domain = project_data.get("domain", "Software Engineering")
    req_skills = [s.get("skill_name", "") for s in project_data.get("required_skills", []) if s.get("skill_name")]
    
    # Missing skill gap
    gap_skills = [s for s in req_skills if not any(emp_s.lower() in s.lower() or s.lower() in emp_s.lower() for emp_s in employee_skills)]
    target_skills = gap_skills if gap_skills else req_skills

    # ── CAG: Cache-Augmented Generation Check ─────────────────────────────────
    from services.cag_cache import get_cag_cache
    cag = get_cag_cache()
    cag_key_data = {
        "project_id": project_data.get("project_id", project_name),
        "target_skills": sorted(s.strip().lower() for s in target_skills),
    }
    cached_path = cag.get("learning_path", cag_key_data)
    if cached_path and isinstance(cached_path, dict) and cached_path.get("learning_tiers"):
        logger.info("CAG Cache HIT: Reusing cached learning path for '%s' (0 LLM cost)", project_name)
        cached_copy = dict(cached_path)
        cached_copy["cag_cached"] = True
        return cached_copy

    prompt = f"""
You are a Professional Technical Tutor creating a customized summary learning path for an employee joining a project.

PROJECT DETAILS:
- Project Name: {project_name}
- Domain: {domain}
- Required Skills: {', '.join(req_skills)}
- Employee Current Skills: {', '.join(employee_skills)}
- Target Skills to Master: {', '.join(target_skills)}

INSTRUCTIONS:
1. DO NOT include generic course links or external URL links.
2. Structure the learning path strictly ordered from HIGH PRIORITY to LOW PRIORITY in 3 Tiers:
   - Tier 1: High Priority (Mandatory Core Skills & Essential Prerequisites)
   - Tier 2: Medium Priority (Required Frameworks, Libraries & Tools)
   - Tier 3: Low Priority (Advanced Architecture, Performance & Best Practices)
3. For EACH skill in the tiers, provide:
   - Skill Name & Required Frameworks/Libraries
   - Priority Level ("High", "Medium", "Low")
   - Estimated Learning Duration (e.g. "4-6 Hours", "1-2 Days")
   - Core Learning Objectives
   - Interactive Practical Demo / Code Snippet / Hands-on Task tailored specifically to this project's context.

Return ONLY a valid JSON object with exact structure:
{{
  "api_available": true,
  "project_name": "{project_name}",
  "tutor_summary": "Professional tutor summary overview for mastering the project tech stack.",
  "learning_tiers": [
    {{
      "tier_name": "Tier 1: High Priority (Core Prerequisites)",
      "priority": "High",
      "skill_name": "Skill Name",
      "required_frameworks": ["Framework 1", "Library 2"],
      "estimated_duration": "4-6 Hours",
      "learning_objectives": ["Objective 1", "Objective 2"],
      "practical_demo": {{
        "title": "Hands-on Practical Demo Title",
        "code_snippet": "// Practical code demo snippet or architectural blueprint",
        "hands_on_task": "Actionable task description for the employee"
      }}
    }}
  ]
}}
Do NOT include markdown formatting or commentary outside the JSON object.
"""

    models_to_try = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"]
    last_status_code = 400
    last_error_text = ""

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
                    if isinstance(parsed, dict) and "learning_tiers" in parsed:
                        parsed["api_available"] = True
                        cag.set("learning_path", cag_key_data, parsed, ttl_seconds=86400)
                        return parsed
            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    last_status_code = 429
                elif "500" in err_str or "INTERNAL" in err_str:
                    last_status_code = 500
                elif "400" in err_str or "INVALID_ARGUMENT" in err_str or "API key" in err_str:
                    last_status_code = 400
                logger.debug("SDK call error for model %s: %s", m_name, exc)

    # Approach 2: HTTP REST API fallback with precise status code extraction
    for m_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=12)
            if res.status_code == 200:
                data = res.json()
                raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if raw:
                    clean_raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(clean_raw)
                    if isinstance(parsed, dict) and "learning_tiers" in parsed:
                        parsed["api_available"] = True
                        cag.set("learning_path", cag_key_data, parsed, ttl_seconds=86400)
                        return parsed
            else:
                last_status_code = res.status_code
                try:
                    last_error_text = res.json().get("error", {}).get("message", res.text)
                except Exception:
                    last_error_text = res.text
                logger.warning("Gemini REST call failed (%s): %s", res.status_code, last_error_text)
        except Exception as exc:
            logger.debug("REST API call error for model %s: %s", m_name, exc)

    # Build user-friendly warning message based on HTTP status code
    if last_status_code == 429:
        msg = "Warning (HTTP 429 Rate Limit Exceeded): Gemini AI API quota reached. Please wait a moment before refreshing."
    elif last_status_code == 400:
        msg = f"Warning (HTTP 400 Bad Request): Gemini API Key is invalid or rejected by Google AI. Details: {last_error_text[:100] if last_error_text else 'Invalid API Key'}"
    elif last_status_code == 500:
        msg = "Warning (HTTP 500 Internal Error): Gemini AI service encountered a temporary server error. Please try again."
    else:
        msg = f"Warning (HTTP {last_status_code}): Gemini AI service is currently unavailable."

    return {
        "api_available": False,
        "status_code": last_status_code,
        "warning_message": msg,
        "learning_tiers": []
    }
