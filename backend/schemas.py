"""
schemas.py
──────────
All Pydantic models for request validation and response serialisation.
Enhanced with EmployeeProfile for full chatbot-derived profile storage.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

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
    employee_id: str
    name: str
    email: str
    role: str
    skills: List[str]
    experience: float
    status: str
    designation: Optional[str] = None
    department: Optional[str] = None
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
# EMPLOYEE PROFILE  (generated from chatbot responses)
# ══════════════════════════════════════════════════════════════════════════════

class SoftSkillScores(BaseModel):
    communication: Optional[float] = None
    collaboration: Optional[float] = None
    problem_solving: Optional[float] = None
    ownership: Optional[float] = None


class WorkstyleProfile(BaseModel):
    preferred_work_style: Optional[str] = None
    motivations: Optional[str] = None


class EmployeeProfile(BaseModel):
    """
    Rich profile derived from chatbot responses.
    Stored as  data/profiles/{employee_id}.json
    """
    employee_id: str
    email: str
    name: Optional[str] = None

    # Role & experience summary
    current_role_summary: Optional[str] = None
    desired_role_summary: Optional[str] = None
    experience_summary: Optional[str] = None
    years_of_experience: Optional[float] = None

    # Skills extracted from NLP (merged with base employee skills)
    extracted_skills: List[str] = Field(default_factory=list)

    # Soft skills scored 0–5
    soft_skills: SoftSkillScores = Field(default_factory=SoftSkillScores)

    # Learning & workstyle
    learning_interests: List[str] = Field(default_factory=list)
    workstyle: WorkstyleProfile = Field(default_factory=WorkstyleProfile)

    # Assessment quality
    overall_score: float = 0.0
    readiness: str = "Needs Development"   # High | Moderate | Needs Development

    # Metadata
    profile_version: int = 1
    completed_topics: List[str] = Field(default_factory=list)
    submitted_at: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# CHATBOT / SCORING
# ══════════════════════════════════════════════════════════════════════════════

class NLPScore(BaseModel):
    word_count: int
    keyword_hits: int
    nlp_score: float
    threshold_passed: bool = True


class LLMScore(BaseModel):
    relevance: int
    depth: int
    clarity: int
    feedback: str


class Score(BaseModel):
    final_score: float
    nlp: NLPScore
    llm: LLMScore
    threshold_passed: bool = True


class ResponseItem(BaseModel):
    topic: str
    question: str
    answer: str
    score: Score


class EmployeeResponse(BaseModel):
    employee_id: str
    employee_email: EmailStr
    role: Literal["EMPLOYEE", "HR", "ADMIN"]
    responses: List[ResponseItem] = Field(default_factory=list)
    profile: Optional[Dict[str, Any]] = None  # latest generated profile snapshot


class TopicResponseCreate(BaseModel):
    """Payload sent by the chatbot when submitting an answer."""
    employee_id: str
    employee_email: str
    role: str
    topic: str
    question: str
    answer: str


# ══════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION
# ══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee: EmployeePublic


class TokenData(BaseModel):
    employee_id: str
    email: str
    role: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class RegisterRequest(BaseModel):
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
