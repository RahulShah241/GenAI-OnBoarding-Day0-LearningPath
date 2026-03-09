"""
main.py
───────
FastAPI application entry point.

All original API routes are preserved with the same URLs and response shapes.
JWT authentication is added via Depends(get_current_user) / Depends(require_roles(...)).

Route protection summary
────────────────────────
  POST /auth/login                          — open (no token required)
  POST /auth/register                       — ADMIN only
  GET  /auth/me                             — any authenticated user
  POST /auth/change-password                — any authenticated user

  GET  /projects                            — HR, ADMIN
  GET  /projectsDescrition                  — HR, ADMIN          (original typo kept for frontend compat)
  GET  /projects/{project_id}               — HR, ADMIN, EMPLOYEE
  POST /project                             — HR, ADMIN

  GET  /employees                           — HR, ADMIN
  GET  /employees/{employee_id}             — HR, ADMIN
  GET  /employees/chatdata/{employee_id}    — HR, ADMIN, EMPLOYEE (own data only for EMPLOYEE)
  POST /employees                           — ADMIN only

  POST /employee/topic-response             — EMPLOYEE, HR, ADMIN
  GET  /employee/{email}                    — HR, ADMIN

  GET  /projects/{project_id}/suggested-employees — HR, ADMIN
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

# ── Load .env before any os.getenv() calls ────────────────────────────────────
load_dotenv()

# ── Internal imports ──────────────────────────────────────────────────────────
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
from services.nlp_scoring import nlp_score
from services.scoring_engine import combine_scores

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Employee–Project Matching Platform",
    description=(
        "AI-assisted HR platform for matching employees to projects. "
        "All endpoints (except /auth/login) require a valid JWT Bearer token."
    ),
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = os.getenv("ALLOWED_ORIGINS", '''"http://localhost:8080","https://genai-onboarding-day0-learningpath-1.onrender.com"''')
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,  # for dev only
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
ALLOWED_ORIGINS: list[str] = [o.strip() for o in origins.split(",") if o.strip()]

ALLOWED_ORIGINS=origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount auth router ─────────────────────────────────────────────────────────
app.include_router(auth_router)

# ── Ensure employee-response directory exists ─────────────────────────────────
_RESPONSE_DIR = Path(__file__).resolve().parent / "data" / "employee_responses"
_RESPONSE_DIR.mkdir(parents=True, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _safe_email_to_filename(email: str) -> str:
    """
    Convert an email address to a safe filename stem.
    Strips everything except alphanumeric, @, . and - before substituting.
    Prevents path-traversal attacks.
    """
    sanitised = re.sub(r"[^a-zA-Z0-9@._-]", "", email)
    return sanitised.replace("@", "_AT_").replace(".", "_")


def get_employee_file(email: str) -> Path:
    stem = _safe_email_to_filename(email)
    if not stem:
        raise ValueError("Invalid email address")
    return _RESPONSE_DIR / f"{stem}.json"


def _employee_to_public(emp: dict) -> dict:
    """Return employee dict with the password field removed."""
    return {k: v for k, v in emp.items() if k != "password"}


# ══════════════════════════════════════════════════════════════════════════════
# CHATBOT — topic responses
# ══════════════════════════════════════════════════════════════════════════════
def generate_employee_profile(data):

    responses = data["responses"]

    scores = []
    soft_skills = {}
    learning = []
    role_summary = ""

    for r in responses:
        scores.append(r["score"]["final_score"])

        topic = r["topic"]
        answer = r["answer"]

        if topic == "Role":
            role_summary = answer

        if topic == "Learning":
            learning.append(answer)

        if topic in ["Communication", "Collaboration", "Problem-Solving", "Ownership"]:
            soft_skills[topic.lower()] = r["score"]["final_score"]

    overall = sum(scores) / len(scores)

    return {
        "employee_id": data["employee_id"],
        "email": data["employee_email"],
        "role_summary": role_summary,
        "soft_skills": soft_skills,
        "learning_interests": learning,
        "overall_score": round(overall, 2),
        "readiness": (
            "High" if overall >= 4.5
            else "Moderate" if overall >= 3
            else "Needs Development"
        )
    }
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
    Save a chatbot answer, run NLP + LLM scoring, persist the result.

    Available to EMPLOYEE, HR, and ADMIN.
    """
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

    # Score the answer
    nlp_result = nlp_score(payload.answer, payload.topic)
    llm_result = llm_score(payload.topic, payload.question, payload.answer)
    scoring = combine_scores(nlp_result, llm_result)

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
    
    return {
        "message": "Response saved & evaluated",
        "topic": payload.topic,
        "final_score": scoring["final_score"],
        "feedback": llm_result["feedback"],
    }


@app.get(
    "/employee/{email}",
    summary="Get chatbot response data by employee email",
    tags=["Chatbot"],
)
def get_employee_data(
    email: str,
    _current: TokenData = Depends(require_roles("HR", "ADMIN")),
) -> dict:
    """Return all stored chatbot responses for the employee with the given email."""
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
    """Return a lightweight summary list of all projects."""
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
    "/projectsDescrition",           # original typo preserved for frontend compatibility
    summary="List all projects with full details",
    tags=["Projects"],
)
def get_projects_description(
    _current: TokenData = Depends(require_roles("HR", "ADMIN", "EMPLOYEE")),
) -> list[dict]:
    """Return full project objects for all projects."""
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
    """Return the complete project record for *project_id*."""
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
    """Add a new project to the database. Returns the generated project_id."""
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
    """Return all employee records (password excluded)."""
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
    """
    Return one employee record.

    - HR / ADMIN: can fetch any employee.
    - EMPLOYEE: can only fetch their own record.
    """
    # Role gate
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
    """
    Return stored chatbot responses for a specific employee_id.

    - HR / ADMIN: can fetch any employee's data.
    - EMPLOYEE: can only fetch their own chatbot data.
    """
    if current_user.role == "EMPLOYEE" and current_user.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees may only view their own chatbot data",
        )

    file_path = _RESPONSE_DIR / f"{employee_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat data not found")
    return read_json(file_path)


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
    """
    Add a raw employee dict.
    For a typed, password-hashing version use POST /auth/register instead.
    """
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
    """
    Run the skill + experience matching algorithm against all employees and
    return them ranked by match_percentage descending.
    """
    projects: list[dict] = read_json("projectDetails.json")
    project = next((p for p in projects if p["project_id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    employees: list[dict] = read_json("employees.json")
    suggestions = [calculate_match(project, emp) for emp in employees]
    suggestions.sort(key=lambda x: x.match_percentage, reverse=True)
    return suggestions
