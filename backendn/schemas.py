from typing import List

from pydantic import BaseModel, Field

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TopicResponseCreate(BaseModel):
    employee_email: str
    role: str

    topic: str
    question: str
    answer: str


class TopicResponseStored(TopicResponseCreate):
    score: Optional[int] = None
    feedback: Optional[str] = None
    timestamp: datetime

class Source(BaseModel):
    """Schema for a source used by the agent"""

    url: str = Field(description="The URL of the source")


class AgentResponse(BaseModel):
    """Schema for agent response with answer and sources"""

    answer: str = Field(description="The agent's answer to the query")
    sources: List[Source] = Field(
        default_factory=list, description="List of sources used to generate the answer"
    )

class UserProfile(BaseModel):
    """Schema for user profile"""

    user_id: str = Field(description="Unique identifier for the user")
    role_title: str = Field(description="Title of the user's role")
    business_unit: str = Field(description="Business unit of the user")
    professional_summary_raw: str = Field(description="Raw professional summary of the user")
    skills: List[dict] = Field(
        default_factory=list,
        description="List of skills with details such as skill name, level, confidence, last used, and source",
    )
    projects: List[dict] = Field(
        default_factory=list,
        description="List of projects associated with the user",
    )
    security_experience: List[dict] = Field(
        default_factory=list,
        description="List of security experiences of the user",
    )
    learning_preferences: dict = Field(
        default_factory=dict,
        description="Learning preferences of the user",
    )
    deployment_readiness: dict = Field(
        default_factory=dict,
        description="Deployment readiness information of the user",
    )
    profile_version: int = Field(default=1, description="Version of the user profile")
    skill_tags: List[str] = Field(
        default_factory=list,
        description="Tags associated with the user's skills",
    )
    confirmed: bool = Field(default=False, description="Indicates if the profile is confirmed")
# UserProfile Template
# {
#   "user_id": "",
#   "role_title": "",
#   "business_unit": "",
#   "professional_summary_raw": "",
#   "skills": [
#     {
#       "skill_name": "",
#       "level": "",
#       "confidence": 0.0,
#       "last_used": "",
#       "source": ["chat", "summary", "manual"]
#     }
#   ],
#   "projects": [],
#   "security_experience": [],
#   "learning_preferences": {},
#   "deployment_readiness": {},
#   "profile_version": 1,
#   "skill_tags":[]
#   "confirmed": true
# }
# ProjectDescription Template
# {
#   "project_id": "PRJ-00123",
#   "project_name": "Enterprise GenAI Workforce Platform",
#   "project_type": "Internal / Client",
#   "business_unit": "Digital Engineering",
#   "domain": "Enterprise AI / HR Tech",

#   "project_overview": {
#     "objective": "Build a scalable GenAI platform to enable day-1 deployable employees",
#     "problem_statement": "High bench time and delayed project readiness",
#     "expected_outcomes": [
#       "Reduced bench time",
#       "Improved deployment readiness",
#       "Skill-demand alignment"
#     ]
#   },

#   "project_duration": {
#     "start_date": "2026-01-15",
#     "expected_end_date": "2026-06-30",
#     "engagement_type": "Full-time / Hybrid"
#   },

#   "required_roles": [
#     {
#       "role_name": "Backend Developer",
#       "role_level": "Mid-Level",
#       "headcount": 2,
#       "deployment_priority": "High"
#     }
#   ],

#   "required_skills": [
#     {
#       "skill_name": "Python",
#       "required_level": "Intermediate",
#       "mandatory": true
#     },
#     {
#       "skill_name": "FastAPI",
#       "required_level": "Intermediate",
#       "mandatory": true
#     },
#     {
#       "skill_name": "GenAI / RAG",
#       "required_level": "Basic",
#       "mandatory": false
#     }
#   ],

#   "responsibilities": [
#     "Design and develop secure backend APIs",
#     "Integrate GenAI agents and RAG pipelines",
#     "Collaborate with frontend and AI teams",
#     "Ensure performance and security standards"
#   ],

#   "non_functional_requirements": [
#     "Security",
#     "Scalability",
#     "Observability",
#     "Compliance"
#   ],

#   "delivery_model": {
#     "methodology": "Agile / Scrum",
#     "sprint_length_weeks": 2,
#     "communication_mode": "Daily standups, Sprint reviews"
#   },

#   "stakeholders": [
#     {
#       "stakeholder_role": "Project Manager",
#       "engagement_level": "High"
#     },
#     {
#       "stakeholder_role": "Client Representative",
#       "engagement_level": "Medium"
#     }
#   ],

#   "deployment_readiness_criteria": {
#     "minimum_skill_match_percentage": 75,
#     "required_certifications": [
#       "Deployable Readiness – Backend"
#     ],
#     "simulation_score_threshold": 70
#   },

#   "bench_optimization": {
#     "allows_partial_allocation": true,
#     "upskilling_during_project": true
#   },

#   "risk_factors": [
#     "New technology adoption",
#     "Tight delivery timeline"
#   ],

#   "ai_matching_metadata": {
#     "priority_weight": 0.9,
#     "critical_skills_weight": 0.8,
#     "availability_weight": 0.7
#   },

#   "status": {
#     "current_status": "Open",
#     "deployment_stage": "Demand Raised",
#     "created_by": "HR / PM",
#     "last_updated": "2026-01-15"
#   }
# }
# DeploymentReadiness Template
# {
#   "employee_id": "EMP-101",
#   "role": "Backend Developer",
#   "skills": [
#     {"name": "Python", "level": "Intermediate", "confidence": 0.85},
#     {"name": "FastAPI", "level": "Intermediate", "confidence": 0.80},
#     {"name": "Docker", "level": "Basic", "confidence": 0.65}
#   ],
#   "readiness_score": 72,
#   "availability_date": "2026-01-20",
#   "learning_velocity": "High"
# }
from pydantic import BaseModel, Field
from typing import List, Optional


class Course(BaseModel):
    title: str
    platform: str = "Udemy"
    instructor: Optional[str]
    rating: Optional[float]
    students: Optional[int]
    skills_covered: List[str]
    level: str
    best_for: str


class CourseRecommendation(BaseModel):
    employee_role: str
    required_skills: List[str]
    recommended_courses: List[Course]

class DeploymentReadiness(BaseModel):
    """Schema for deployment readiness"""

    employee_id: str = Field(description="Unique identifier for the employee")
    role: str = Field(description="Role of the employee")
    skills: List[dict] = Field(
        default_factory=list,
        description="List of skills with name, level, and confidence",
    )
    readiness_score: int = Field(description="Deployment readiness score")
    availability_date: str = Field(description="Date when the employee is available")
    learning_velocity: str = Field(description="Learning velocity of the employee")