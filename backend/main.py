"""
main.py
───────
FastAPI application entry point.

New in v3
─────────
  • NLP threshold enforcement — answers scoring below SCORE_THRESHOLD return
    threshold_passed=False and a retry message; the answer is NOT stored.
  • Profile generation — after every topic submission the full EmployeeProfile
    is regenerated and saved to  data/profiles/{employee_id}.json
  • Skill sync — merged_skills from the profile are written back to
    employees.json so job-matching always uses the richest skill set.
  • GET /employee/profile/{employee_id}       — own profile (EMPLOYEE) or any (HR/ADMIN)
  • GET /hr/employee-profiles                 — HR/ADMIN list of all profiles
  • POST /employee/finalize-profile           — explicitly regenerate + store profile
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import os

load_dotenv()

from auth.dependencies import get_current_user, require_roles
from auth.router import router as auth_router
from json_db import append_json, read_json, write_json
from matching import calculate_match
from schemas import (
    Employee,
    EmployeePublic,
    ProjectCreate,
    ProjectDescription,
    ProjectSummary,
    SuggestedEmployee,
    TokenData,
    TopicResponseCreate,
)
from services.llm_scoring import llm_score
from services.nlp_scoring import nlp_score, SCORE_THRESHOLD
from services.scoring_engine import combine_scores
from services.profile_generator import generate_profile

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Employee–Project Matching Platform",
    description=(
        "AI-assisted HR platform for matching employees to projects. "
        "All endpoints (except /auth/login) require a valid JWT Bearer token."
    ),
    version="3.0.0",
)

origins = os.getenv(
    "ALLOWED_ORIGINS",
    '"http://localhost:8080","https://genai-onboarding-day0-learningpath-1.onrender.com"',
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in origins.split(",") if o.strip()]
ALLOWED_ORIGINS = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

_RESPONSE_DIR = Path(__file__).resolve().parent / "data" / "employee_responses"
_PROFILE_DIR = Path(__file__).resolve().parent / "data" / "profiles"
_RESPONSE_DIR.mkdir(parents=True, exist_ok=True)
_PROFILE_DIR.mkdir(parents=True, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _safe_email_to_filename(email: str) -> str:
    sanitised = re.sub(r"[^a-zA-Z0-9@._-]", "", email)
    return sanitised.replace("@", "_AT_").replace(".", "_")


def get_employee_file(email: str) -> Path:
    stem = _safe_email_to_filename(email)
    if not stem:
        raise ValueError("Invalid email address")
    return _RESPONSE_DIR / f"{stem}.json"


def get_profile_file(employee_id: str) -> Path:
    safe = re.sub(r"[^a-zA-Z0-9_-]", "_", employee_id)
    return _PROFILE_DIR / f"{safe}.json"


def _employee_to_public(emp: dict) -> dict:
    return {k: v for k, v in emp.items() if k != "password"}


def _get_base_employee(employee_id: str) -> dict | None:
    employees: list[dict] = read_json("employees.json")
    return next((e for e in employees if e["employee_id"] == employee_id), None)


def _sync_skills_to_employee(employee_id: str, merged_skills: list[str]) -> None:
    """Update the skills array in employees.json with NLP-extracted skills."""
    employees: list[dict] = read_json("employees.json")
    for emp in employees:
        if emp["employee_id"] == employee_id:
            existing = set(s.lower() for s in emp.get("skills", []))
            new_skills = [s for s in merged_skills if s.lower() not in existing]
            emp["skills"] = emp.get("skills", []) + new_skills
            break
    write_json("employees.json", employees)


def _regenerate_and_save_profile(response_data: dict) -> dict:
    """Generate profile, save it, sync skills. Returns the profile dict."""
    employee_id = response_data.get("employee_id", "")
    base_emp = _get_base_employee(employee_id)
    profile = generate_profile(response_data, base_employee=base_emp)

    profile_file = get_profile_file(employee_id)
    profile_file.write_text(
        json.dumps(profile, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Sync skills back to employees.json
    merged = profile.get("merged_skills", [])
    if merged:
        _sync_skills_to_employee(employee_id, merged)

    logger.info("Profile regenerated for %s (score=%.2f)", employee_id, profile["overall_score"])
    return profile


# ══════════════════════════════════════════════════════════════════════════════
# CHATBOT — topic responses
# ══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/employee/topic-response",
    summary="Submit a chatbot answer and receive an evaluation score",
    tags=["Chatbot"],
)
def save_topic_response(
    payload: TopicResponseCreate,
    _current: TokenData = Depends(get_current_user),
) -> dict:
    """
    Score the answer. If it passes the NLP threshold, persist and regenerate
    the employee profile. Otherwise return threshold_passed=False so the
    frontend can prompt for a better answer.
    """
    # Score the answer
    nlp_result = nlp_score(payload.answer, payload.topic)
    llm_result = llm_score(payload.topic, payload.question, payload.answer)
    scoring = combine_scores(nlp_result, llm_result)

    # ── Threshold gate ─────────────────────────────────────────────────────────
    if not nlp_result.get("threshold_passed", True):
        return {
            "message": "Answer did not meet the quality threshold. Please provide a more detailed response.",
            "topic": payload.topic,
            "final_score": scoring["final_score"],
            "feedback": llm_result.get("feedback", ""),
            "threshold_passed": False,
            "min_score_required": SCORE_THRESHOLD,
        }

    # ── Persist ────────────────────────────────────────────────────────────────
    file_path = get_employee_file(payload.employee_email)
    if file_path.exists():
        data: dict = json.loads(file_path.read_text(encoding="utf-8"))
    else:
        data = {
            "employee_id": payload.employee_id,
            "employee_email": payload.employee_email,
            "role": payload.role,
            "responses": [],
        }

    data["responses"].append(
        {
            "topic": payload.topic,
            "question": payload.question,
            "answer": payload.answer,
            "score": scoring,
        }
    )

    file_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # ── Regenerate profile ─────────────────────────────────────────────────────
    profile = _regenerate_and_save_profile(data)

    return {
        "message": "Response saved & evaluated",
        "topic": payload.topic,
        "final_score": scoring["final_score"],
        "feedback": llm_result.get("feedback", ""),
        "threshold_passed": True,
        "profile_snapshot": {
            "overall_score": profile["overall_score"],
            "readiness": profile["readiness"],
            "extracted_skills": profile.get("extracted_skills", []),
        },
    }


@app.post(
    "/employee/finalize-profile",
    summary="Explicitly regenerate and store the employee profile",
    tags=["Chatbot"],
)
def finalize_profile(
    payload: dict,
    current: TokenData = Depends(get_current_user),
) -> dict:
    """
    Called when the employee has completed all chatbot topics.
    Regenerates the full profile and returns it.
    """
    employee_id = payload.get("employee_id", current.employee_id)

    # Gate: employees can only finalize their own profile
    if current.role == "EMPLOYEE" and current.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Find the response file by scanning for matching employee_id
    base_emp = _get_base_employee(employee_id)
    if not base_emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    email = base_emp["email"]
    file_path = get_employee_file(email)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No chatbot responses found")

    data = json.loads(file_path.read_text(encoding="utf-8"))
    profile = _regenerate_and_save_profile(data)

    return {"message": "Profile finalized", "profile": profile}


@app.get(
    "/employee/progress/{employee_id}",
    summary="Get chatbot resume state — completed topics, next topic, next question index",
    tags=["Chatbot"],
)
def get_employee_progress(
    employee_id: str,
    current: TokenData = Depends(get_current_user),
) -> dict:
    """
    Returns a structured resume payload so the frontend can pick up exactly
    where the employee left off without re-asking answered questions.

    Response shape
    ──────────────
    {
      "has_progress": bool,
      "completed_topics": ["Role", "Skills", ...],
      "answered_questions": {
          "Role":   ["Q text 1", "Q text 2"],
          "Skills": ["Q text 1"],
          ...
      },
      "conversation_history": [
          {"topic": "Role", "question": "...", "answer": "...", "score": {...}},
          ...
      ],
      "profile_snapshot": { overall_score, readiness, extracted_skills } | null
    }
    """
    if current.role == "EMPLOYEE" and current.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    base_emp = _get_base_employee(employee_id)
    if not base_emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    file_path = get_employee_file(base_emp["email"])
    if not file_path.exists():
        return {
            "has_progress": False,
            "completed_topics": [],
            "answered_questions": {},
            "conversation_history": [],
            "profile_snapshot": None,
        }

    data = json.loads(file_path.read_text(encoding="utf-8"))
    responses: list[dict] = data.get("responses", [])

    # Build per-topic answered question sets (using question text as key)
    answered_questions: dict[str, list[str]] = {}
    for r in responses:
        topic = r.get("topic", "")
        q = r.get("question", "")
        answered_questions.setdefault(topic, [])
        if q not in answered_questions[topic]:
            answered_questions[topic].append(q)

    # Load profile snapshot if available
    profile_snapshot = None
    profile_file = get_profile_file(employee_id)
    if profile_file.exists():
        try:
            p = json.loads(profile_file.read_text(encoding="utf-8"))
            profile_snapshot = {
                "overall_score": p.get("overall_score", 0),
                "readiness": p.get("readiness", "Needs Development"),
                "extracted_skills": p.get("extracted_skills", []),
            }
        except Exception:
            pass

    return {
        "has_progress": len(responses) > 0,
        "completed_topics": list(answered_questions.keys()),
        "answered_questions": answered_questions,
        "conversation_history": responses,
        "profile_snapshot": profile_snapshot,
    }


@app.get(
    "/employee/profile/{employee_id}",
    summary="Get the generated profile for an employee",
    tags=["Chatbot"],
)
def get_employee_profile(
    employee_id: str,
    current: TokenData = Depends(get_current_user),
) -> dict:
    """
    Return the stored EmployeeProfile JSON.
    EMPLOYEE may only access their own; HR/ADMIN can access any.
    """
    if current.role == "EMPLOYEE" and current.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    profile_file = get_profile_file(employee_id)
    if not profile_file.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return json.loads(profile_file.read_text(encoding="utf-8"))


@app.get(
    "/hr/employee-profiles",
    summary="List all generated employee profiles (HR / ADMIN)",
    tags=["HR"],
)
def list_employee_profiles(
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> list[dict]:
    """Return all profiles from  data/profiles/"""
    profiles = []
    for f in sorted(_PROFILE_DIR.glob("*.json")):
        try:
            profiles.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception:
            pass
    return profiles


@app.get(
    "/employee/{email}",
    summary="Get chatbot response data by employee email",
    tags=["Chatbot"],
)
def get_employee_data(
    email: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> dict:
    file_path = get_employee_file(email)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee responses not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


# ══════════════════════════════════════════════════════════════════════════════
# PROJECTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/projects",
    response_model=List[dict],
    summary="List all projects (lightweight summary)",
    tags=["Projects"],
)
def get_projects(
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> list[dict]:
    projects: list[dict] = read_json("projectDetails.json")
    return [
        {
            "project_id": p["project_id"],
            "project_name": p["project_name"],
            "domain": p["domain"],
            "business_unit": p["business_unit"],
            "project_type": p["project_type"],
            "current_status": p["status"]["current_status"],
            "deployment_stage": p["status"]["deployment_stage"],
        }
        for p in projects
    ]


@app.get(
    "/projectsDescrition",
    summary="List all projects with full details",
    tags=["Projects"],
)
def get_projects_description(
    _current: TokenData = Depends(require_roles("HR", "ADMIN", "EMPLOYEE")),
) -> list[dict]:
    return read_json("projectDetails.json")


@app.get(
    "/projects/{project_id}",
    summary="Get full details for a single project",
    tags=["Projects"],
)
def get_project(
    project_id: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN", "EMPLOYEE")),
) -> dict:
    projects: list[dict] = read_json("projectDetails.json")
    project = next((p for p in projects if p["project_id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@app.post(
    "/project",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    tags=["Projects"],
)
def add_project(
    project: ProjectCreate,
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> dict:
    project_id = str(uuid.uuid4())
    new_project = ProjectDescription(project_id=project_id, **project.model_dump())
    append_json("projectDetails.json", jsonable_encoder(new_project.model_dump()))
    logger.info("Project created: %s (%s)", project_id, project.project_name)
    return {"message": "Project added successfully", "project_id": project_id}


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEES
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/employees",
    response_model=List[EmployeePublic],
    summary="List all employees",
    tags=["Employees"],
)
def get_employees(
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> list[dict]:
    employees: list[dict] = read_json("employees.json")
    return [_employee_to_public(e) for e in employees]


@app.get(
    "/employees/{employee_id}",
    response_model=EmployeePublic,
    summary="Get a single employee by ID",
    tags=["Employees"],
)
def get_employee_by_id(
    employee_id: str,
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    if current_user.role == "EMPLOYEE" and current_user.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees may only view their own record",
        )
    employees: list[dict] = read_json("employees.json")
    emp = next((e for e in employees if e["employee_id"] == employee_id), None)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return _employee_to_public(emp)


@app.get(
    "/employees/chatdata/{employee_id}",
    summary="Get chatbot response data by employee_id",
    tags=["Employees"],
)
def get_employee_chat_data(
    employee_id: str,
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    if current_user.role == "EMPLOYEE" and current_user.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees may only view their own chatbot data",
        )
    # Look up email from employees.json to find the correct response file
    base_emp = _get_base_employee(employee_id)
    if base_emp:
        file_path = get_employee_file(base_emp["email"])
    else:
        file_path = _RESPONSE_DIR / f"{employee_id}.json"

    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat data not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


@app.post(
    "/employees",
    response_model=EmployeePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new employee record (ADMIN only)",
    tags=["Employees"],
)
def add_employee(
    employee: dict,
    _current: TokenData = Depends(require_roles("ADMIN")),
) -> dict:
    employees: list[dict] = read_json("employees.json")
    if any(e["employee_id"] == employee.get("employee_id") for e in employees):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already exists",
        )
    employees.append(employee)
    write_json("employees.json", employees)
    logger.info("Employee added via /employees: %s", employee.get("employee_id"))
    return _employee_to_public(employee)


# ══════════════════════════════════════════════════════════════════════════════
# SUGGESTED EMPLOYEES PER PROJECT
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/projects/{project_id}/suggested-employees",
    response_model=List[SuggestedEmployee],
    summary="Get ranked employee suggestions for a project",
    tags=["Matching"],
)
def suggest_employees(
    project_id: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> list[SuggestedEmployee]:
    projects: list[dict] = read_json("projectDetails.json")
    project = next((p for p in projects if p["project_id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    employees: list[dict] = read_json("employees.json")
    suggestions = [calculate_match(project, emp) for emp in employees]
    suggestions.sort(key=lambda x: x.match_percentage, reverse=True)
    return suggestions
