from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import uuid


# ---------- Nested Project Schemas ----------

class ProjectOverview(BaseModel):
    expected_outcomes:List[str]
    objective: str
    problem_statement: str


from datetime import date

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


# ---------- Project Schemas ----------

# 🔥 Used when creating project (NO project_id required)
class ProjectCreate(BaseModel):
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


# 🔥 Used when returning project (project_id included)
class ProjectDescription(BaseModel):
    project_id: str
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


class ProjectSummary(BaseModel):
    project_id: str
    project_name: str
    domain: str
    business_unit: str
    project_type: str
    current_status: Optional[str]='open'
    deployment_stage: str


# ---------- Employee Schemas ----------

class Employee(BaseModel):
    employee_id: str
    password:str
    email:str
    name: str
    skills: List[str]
    experience: int
    name: str
    role: str
    skills: List[str]
    experience: float
    status: str
    designation: Optional[str]=None
    department: Optional[str]=None

class SuggestedEmployee(Employee):
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]




from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal


# ---------------------------
# NLP Score Model
# ---------------------------
class NLPScore(BaseModel):
    word_count: int
    keyword_hits: int
    nlp_score: float


# ---------------------------
# LLM Score Model
# ---------------------------
class LLMScore(BaseModel):
    relevance: int
    depth: int
    clarity: int
    feedback: str


# ---------------------------
# Overall Score Model
# ---------------------------
class Score(BaseModel):
    final_score: float
    nlp: NLPScore
    llm: LLMScore


# ---------------------------
# Response Item Model
# ---------------------------
class ResponseItem(BaseModel):
    topic: str
    question: str
    answer: str
    score: Score


# ---------------------------
# Main Employee Response Schema
# ---------------------------
class EmployeeResponse(BaseModel):
    employee_email: EmailStr
    role: Literal["EMPLOYEE", "HR", "ADMIN"]
    responses: List[ResponseItem] = Field(default_factory=list)
    

class TopicResponseCreate(BaseModel):
    employee_id:str
    employee_email: str
    role: str
    topic: str
    question: str
    answer: str