"""
main.py
───────
FastAPI application entry point.

New in v3
─────────
  • NLP threshold enforcement — answers scoring below SCORE_THRESHOLD return
    threshold_passed=False and a retry message; the answer is NOT stored.
  • Profile generation — after every topic submission the full EmployeeProfile
    is regenerated and saved to SQLite employee_profiles table
  • Skill sync — merged_skills from the profile are written back to
    the SQLite employees table so job-matching always uses the richest skill set.
  • GET /employee/profile/{employee_id}       — own profile (EMPLOYEE) or any (HR/ADMIN)
  • GET /hr/employee-profiles                 — HR/ADMIN list of all profiles
  • POST /employee/finalize-profile           — explicitly regenerate + store profile
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import os

_BACKEND_ENV = Path(__file__).resolve().parent / ".env"
_ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
if _BACKEND_ENV.exists():
    load_dotenv(_BACKEND_ENV, override=True)
elif _ROOT_ENV.exists():
    load_dotenv(_ROOT_ENV, override=True)
else:
    load_dotenv(override=True)

from auth.dependencies import get_current_user, require_roles
from auth.router import router as auth_router
from database import (
    init_db,
    get_all_employees,
    get_employee_by_id,
    get_employee_by_email,
    save_employee,
    delete_employee,
    get_all_projects,
    get_project_by_id,
    save_project,
    delete_project,
    get_chat_history,
    save_chat_history,
    get_profile,
    get_all_profiles,
    save_profile,
)
from matching import calculate_match
from schemas import (
    Employee,
    EmployeePublic,
    EmployeeUpdate,
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
from services.course_recommender import get_course_recommendations

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Employee–Project Matching Platform",
    description=(
        "AI-assisted HR platform for matching employees to projects. "
        "All endpoints (except /auth/login) require a valid JWT Bearer token."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if origins_env.strip() == "*":
    ALLOWED_ORIGINS = ["*"]
else:
    raw_list = origins_env.replace('"', '').replace("'", '').split(",")
    ALLOWED_ORIGINS = [o.strip() for o in raw_list if o.strip()]

if "*" not in ALLOWED_ORIGINS:
    for domain in [
        "http://localhost:8080",
        "http://localhost:8081",
        "https://talentforgeai.onrender.com",
        "https://genai-onboarding-day0-learningpath.onrender.com",
    ]:
        if domain not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _employee_to_public(emp: dict) -> dict:
    return {k: v for k, v in emp.items() if k != "password"}


def _get_base_employee(employee_id: str) -> dict | None:
    return get_employee_by_id(employee_id)


def _sync_skills_to_employee(employee_id: str, merged_skills: list[str]) -> None:
    """Update the skills array in SQLite employees table with NLP-extracted skills."""
    emp = get_employee_by_id(employee_id)
    if emp:
        existing = set(s.lower() for s in emp.get("skills", []))
        new_skills = [s for s in merged_skills if s.lower() not in existing]
        if new_skills:
            emp["skills"] = emp.get("skills", []) + new_skills
            save_employee(emp)


def _regenerate_and_save_profile(response_data: dict) -> dict:
    """Generate profile, save directly to SQLite, sync skills. Returns the profile dict."""
    employee_id = response_data.get("employee_id", "")
    base_emp = _get_base_employee(employee_id)
    profile = generate_profile(response_data, base_employee=base_emp)

    # Save profile directly to SQLite
    save_profile(employee_id, profile)

    # Sync skills back to employee in SQLite
    merged = profile.get("merged_skills", [])
    if merged:
        _sync_skills_to_employee(employee_id, merged)

    logger.info("Profile regenerated and saved in SQLite for %s (score=%.2f)", employee_id, profile.get("overall_score", 0.0))
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

    # ── Persist to SQLite ──────────────────────────────────────────────────
    chat_data = get_chat_history(payload.employee_id)
    if not chat_data or not chat_data.get("responses"):
        chat_data = {
            "employee_id": payload.employee_id,
            "employee_email": payload.employee_email,
            "role": payload.role,
            "responses": [],
        }
    else:
        chat_data["employee_email"] = payload.employee_email
        chat_data["role"] = payload.role

    chat_data["responses"].append(
        {
            "topic": payload.topic,
            "question": payload.question,
            "answer": payload.answer,
            "score": scoring,
        }
    )

    save_chat_history(payload.employee_id, chat_data)

    # ── Regenerate profile in SQLite ───────────────────────────────────────
    profile = _regenerate_and_save_profile(chat_data)

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

    base_emp = _get_base_employee(employee_id)
    if not base_emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    chat_data = get_chat_history(employee_id)
    if not chat_data.get("responses"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No chatbot responses found")

    profile = _regenerate_and_save_profile(chat_data)

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

    chat_data = get_chat_history(employee_id)
    responses: list[dict] = chat_data.get("responses", [])

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
    profile = get_profile(employee_id)
    if profile:
        profile_snapshot = {
            "overall_score": profile.get("overall_score", 0),
            "readiness": profile.get("readiness", "Needs Development"),
            "extracted_skills": profile.get("extracted_skills", []),
        }

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

    profile = get_profile(employee_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return profile


@app.get(
    "/hr/employee-profiles",
    summary="List all generated employee profiles (HR / ADMIN)",
    tags=["HR"],
)
def list_employee_profiles(
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> list[dict]:
    """Return all profiles from SQLite."""
    return get_all_profiles()


@app.get(
    "/employee/{email}",
    summary="Get chatbot response data by employee email",
    tags=["Chatbot"],
)
def get_employee_data(
    email: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> dict:
    emp = get_employee_by_email(email)
    emp_id = emp["employee_id"] if emp else email
    chat_data = get_chat_history(emp_id)
    if not chat_data.get("responses"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee responses not found")
    return chat_data


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
    projects: list[dict] = get_all_projects()
    return [
        {
            "project_id": p["project_id"],
            "project_name": p.get("project_name", ""),
            "domain": p.get("domain", ""),
            "business_unit": p.get("business_unit", ""),
            "project_type": p.get("project_type", ""),
            "current_status": p.get("status", {}).get("current_status", "Open") if isinstance(p.get("status"), dict) else "Open",
            "deployment_stage": p.get("status", {}).get("deployment_stage", "Planning") if isinstance(p.get("status"), dict) else "Planning",
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
    return get_all_projects()


@app.get(
    "/projects/{project_id}",
    summary="Get full details for a single project",
    tags=["Projects"],
)
def get_project(
    project_id: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN", "EMPLOYEE")),
) -> dict:
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@app.get(
    "/projects/{project_id}/recommended-courses",
    summary="Get LLM recommended skill courses for a project",
    tags=["Projects"],
)
def get_project_recommended_courses(
    project_id: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN", "EMPLOYEE")),
) -> dict:
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    skills = [s["skill_name"] for s in project.get("required_skills", []) if isinstance(s, dict) and s.get("skill_name")]
    courses = get_course_recommendations(skills)
    return {"project_id": project_id, "skills": skills, "recommended_courses": courses}


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
    save_project(new_project.model_dump())
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
    employees: list[dict] = get_all_employees()
    return [_employee_to_public(e) for e in employees]


@app.get(
    "/employees/{employee_id}",
    response_model=EmployeePublic,
    summary="Get a single employee by ID",
    tags=["Employees"],
)
def get_employee_by_id_endpoint(
    employee_id: str,
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    if current_user.role == "EMPLOYEE" and current_user.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees may only view their own record",
        )
    emp = get_employee_by_id(employee_id)
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
    chat_data = get_chat_history(employee_id)
    if not chat_data.get("responses"):
        base_emp = _get_base_employee(employee_id)
        if base_emp and base_emp.get("email"):
            chat_data = get_chat_history(base_emp["email"])
    if not chat_data.get("responses"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat data not found")
    return chat_data


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
    emp_id = employee.get("employee_id")
    if not emp_id or get_employee_by_id(emp_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already exists",
        )
    if employee.get("email") and get_employee_by_email(employee["email"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if employee.get("password"):
        from auth.security import hash_password
        if not (employee["password"].startswith("$2b$") or employee["password"].startswith("$2a$")):
            employee["password"] = hash_password(employee["password"])
    save_employee(employee)
    logger.info("Employee added via /employees: %s", emp_id)
    return _employee_to_public(employee)


@app.put(
    "/employees/{employee_id}",
    response_model=EmployeePublic,
    summary="Update employee details (ADMIN only)",
    tags=["Employees"],
)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    _current: TokenData = Depends(require_roles("ADMIN")),
) -> dict:
    emp = get_employee_by_id(employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if payload.email and payload.email.lower() != emp["email"].lower():
        existing_emp = get_employee_by_email(payload.email)
        if existing_emp and existing_emp["employee_id"] != employee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{payload.email}' is already registered to another user",
            )

    if payload.name is not None:
        emp["name"] = payload.name
    if payload.email is not None:
        emp["email"] = payload.email
    if payload.role is not None:
        emp["role"] = payload.role
    if payload.skills is not None:
        emp["skills"] = payload.skills
    if payload.experience is not None:
        emp["experience"] = payload.experience
    if payload.status is not None:
        emp["status"] = payload.status
    if payload.designation is not None:
        emp["designation"] = payload.designation
    if payload.department is not None:
        emp["department"] = payload.department
    if payload.password and payload.password.strip():
        from auth.security import hash_password
        emp["password"] = hash_password(payload.password)

    save_employee(emp)
    logger.info("Updated employee %s", employee_id)

    prof = get_profile(employee_id)
    if prof:
        if payload.name is not None:
            prof["name"] = payload.name
        if payload.email is not None:
            prof["email"] = payload.email
        save_profile(employee_id, prof)

    return _employee_to_public(emp)


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
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    employees: list[dict] = get_all_employees()
    suggestions = [calculate_match(project, emp) for emp in employees]
    suggestions.sort(key=lambda x: x.match_percentage, reverse=True)
    return suggestions


# ══════════════════════════════════════════════════════════════════════════════
# LLM SKILL GAP COURSE RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/projects/{project_id}/recommended-courses",
    summary="Get LLM course recommendations for skill match gap",
    tags=["Matching"],
)
def get_recommended_courses(
    project_id: str,
    missing_skills: Optional[str] = Query(None, description="Comma-separated list of missing skills gap"),
    current: TokenData = Depends(get_current_user),
) -> dict:
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    gap_skills: list[str] = []

    if missing_skills is not None:
        gap_skills = [s.strip() for s in missing_skills.split(",") if s.strip()]
    else:
        emp_skills: list[str] = getattr(current, "skills", []) or []
        prof = get_profile(current.employee_id)
        if prof and isinstance(prof.get("merged_skills"), list):
            emp_skills = prof["merged_skills"]

        req_skills = [s.get("skill_name", "") for s in project.get("required_skills", []) if isinstance(s, dict) and s.get("skill_name")]
        for req in req_skills:
            matched = any(
                emp_s.lower() in req.lower() or req.lower() in emp_s.lower()
                for emp_s in emp_skills
            )
            if not matched:
                gap_skills.append(req)

    from services.course_recommender import get_course_recommendations
    courses = get_course_recommendations(gap_skills)

    return {
        "project_id": project_id,
        "gap_skills": gap_skills,
        "recommended_courses": courses,
    }


# ══════════════════════════════════════════════════════════════════════════════
# AI TUTOR LEARNING PATH GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/projects/{project_id}/learning-path",
    summary="Get AI Professional Tutor learning path ordered by high-to-low priority with practical code demos",
    tags=["Matching"],
)
def get_tutor_learning_path(
    project_id: str,
    current: TokenData = Depends(get_current_user),
) -> dict:
    from database import get_project_by_id, get_profile
    from services.learning_path import generate_learning_path

    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    emp_skills: list[str] = getattr(current, "skills", []) or []
    prof = get_profile(current.employee_id)
    if prof and isinstance(prof.get("merged_skills"), list):
        emp_skills = prof["merged_skills"]

    path_data = generate_learning_path(project, emp_skills)
    path_data["project_id"] = project_id
    return path_data


# ══════════════════════════════════════════════════════════════════════════════
# CAG (CACHE-AUGMENTED GENERATION) ANALYTICS & CACHE MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/cag/stats",
    summary="Get real-time Cache-Augmented Generation (CAG) cost and token reduction metrics",
    tags=["CAG Optimization"],
)
def get_cag_metrics() -> dict:
    from services.cag_cache import get_cag_cache
    return get_cag_cache().get_stats()


@app.post(
    "/cag/clear",
    summary="Clear CAG cached generations",
    tags=["CAG Optimization"],
)
def clear_cag_cache() -> dict:
    from services.cag_cache import get_cag_cache
    cag = get_cag_cache()
    cleared = cag.invalidate("learning_path") + cag.invalidate("course_recs")
    return {
        "status": "success",
        "message": "CAG cache successfully cleared",
        "cleared_items": cleared,
    }



