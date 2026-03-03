"""
schemas.py
──────────
All Pydantic models for request validation and response serialisation.

Original fields are fully preserved. Auth-related models are added at the
bottom without touching any existing model.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ══════════════════════════════════════════════════════════════════════════════
# PROJECT — nested sub-schemas
# ══════════════════════════════════════════════════════════════════════════════

class ProjectOverview(BaseModel):
    objective: str
    problem_statement: str
    expected_outcomes: List[str]


class ProjectDuration(BaseModel):
    start_date: date
    expected_end_date: date
    engagement_type: str


class Skill(BaseModel):
    skill_name: str
    required_level: str
    mandatory: bool


class Role(BaseModel):
    role_name: str
    role_level: str
    headcount: int
    deployment_priority: str


class DeliveryModel(BaseModel):
    methodology: str
    sprint_length_weeks: int
    communication_mode: str


class DeploymentReadinessCriteria(BaseModel):
    minimum_skill_match_percentage: int
    simulation_score_threshold: int


class StatusModel(BaseModel):
    current_status: str
    deployment_stage: str
    last_updated: datetime


# ══════════════════════════════════════════════════════════════════════════════
# PROJECT — top-level schemas
# ══════════════════════════════════════════════════════════════════════════════

class ProjectCreate(BaseModel):
    """Payload when creating a new project (no project_id yet)."""
    project_name: str
    project_type: str
    business_unit: str
    domain: str
    project_overview: ProjectOverview
    project_duration: ProjectDuration
    required_roles: List[Role]
    required_skills: List[Skill]
    responsibilities: List[str]
    delivery_model: DeliveryModel
    deployment_readiness_criteria: DeploymentReadinessCriteria
    status: StatusModel


class ProjectDescription(ProjectCreate):
    """Full project representation returned from the API (includes project_id)."""
    project_id: str


class ProjectSummary(BaseModel):
    """Lightweight project list item."""
    project_id: str
    project_name: str
    domain: str
    business_unit: str
    project_type: str
    current_status: Optional[str] = "open"
    deployment_stage: str


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEE
# ══════════════════════════════════════════════════════════════════════════════

class Employee(BaseModel):
    """
    Core employee model.
    password is excluded from all API responses via response_model or
    the exclude_password() helper on EmployeePublic.
    """
    employee_id: str
    name: str
    email: str
    role: str                          # "EMPLOYEE" | "HR" | "ADMIN"
    skills: List[str]
    experience: float
    status: str
    designation: Optional[str] = None
    department: Optional[str] = None
    # password stored hashed in employees.json — never returned in responses
    password: Optional[str] = None


class EmployeePublic(BaseModel):
    """Employee fields safe to return in API responses (password excluded)."""
    employee_id: str
    name: str
    email: str
    role: str
    skills: List[str]
    experience: float
    status: str
    designation: Optional[str] = None
    department: Optional[str] = None


class SuggestedEmployee(EmployeePublic):
    """EmployeePublic extended with matching metadata."""
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]


# ══════════════════════════════════════════════════════════════════════════════
# CHATBOT / SCORING
# ══════════════════════════════════════════════════════════════════════════════

class NLPScore(BaseModel):
    word_count: int
    keyword_hits: int
    nlp_score: float


class LLMScore(BaseModel):
    relevance: int
    depth: int
    clarity: int
    feedback: str


class Score(BaseModel):
    final_score: float
    nlp: NLPScore
    llm: LLMScore


class ResponseItem(BaseModel):
    topic: str
    question: str
    answer: str
    score: Score


class EmployeeResponse(BaseModel):
    employee_email: EmailStr
    role: Literal["EMPLOYEE", "HR", "ADMIN"]
    responses: List[ResponseItem] = Field(default_factory=list)


class TopicResponseCreate(BaseModel):
    """Payload sent by the chatbot when submitting an answer."""
    employee_id: str
    employee_email: str
    role: str
    topic: str
    question: str
    answer: str


# ══════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION  (new)
# ══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    """Body for POST /auth/login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """
    Returned by POST /auth/login and POST /auth/refresh.
    access_token  — short-lived JWT (Bearer) sent with every API call.
    token_type    — always "bearer".
    employee      — public profile of the authenticated user (no password).
    """
    access_token: str
    token_type: str = "bearer"
    employee: EmployeePublic


class TokenData(BaseModel):
    """
    Claims embedded inside the JWT payload.
    employee_id and role are used by get_current_user() for fast lookups.
    """
    employee_id: str
    email: str
    role: str


class ChangePasswordRequest(BaseModel):
    """Body for POST /auth/change-password"""
    current_password: str
    new_password: str


class RegisterRequest(BaseModel):
    """
    Body for POST /auth/register (ADMIN only).
    All fields mirror the Employee model; password is plain-text here
    and hashed before storage.
    """
    employee_id: str
    name: str
    email: EmailStr
    password: str
    role: Literal["EMPLOYEE", "HR", "ADMIN"] = "EMPLOYEE"
    skills: List[str] = Field(default_factory=list)
    experience: float = 0.0
    status: str = "Bench"
    designation: Optional[str] = None
    department: Optional[str] = None
