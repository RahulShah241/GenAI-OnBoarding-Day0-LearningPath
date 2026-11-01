"""
rag_evaluation/dataset.py
─────────────────────────
Benchmark evaluation dataset containing curated test cases for:
  1. Learning Path Generation (RAG Triad & Hallucination checks)
  2. Course Recommendations (Skill Gap Coverage & Link Validity)
  3. Talent / Candidate Retrieval (IR Metrics: Precision@K, Recall@K, MRR)
  4. Onboarding Quality Scoring & Threshold Enforcement
"""

from __future__ import annotations

from typing import Any, Dict, List

BENCHMARK_DATASET: Dict[str, List[Dict[str, Any]]] = {
    "learning_path_cases": [
        {
            "id": "LP-001",
            "name": "Anita Verma onboarding to AI Talent Matching Platform",
            "query": "Generate learning path for employee Anita Verma joining project AI Talent Matching Platform with skill gaps in React, Node.js, Python, GenAI",
            "project_data": {
                "project_id": "P001",
                "project_name": "AI Talent Matching Platform",
                "domain": "AI / HR Tech",
                "required_skills": [
                    {"skill_name": "React", "required_level": "Intermediate", "mandatory": True},
                    {"skill_name": "Node.js", "required_level": "Intermediate", "mandatory": True},
                    {"skill_name": "Python", "required_level": "Advanced", "mandatory": True},
                    {"skill_name": "GenAI", "required_level": "Advanced", "mandatory": False},
                ],
            },
            "employee_skills": ["Java", "Spring Boot", "AWS"],
            "expected_gap_skills": ["React", "Node.js", "Python", "GenAI"],
            "retrieved_context": [
                "Project P001: AI Talent Matching Platform. Domain: AI / HR Tech. Objective: Build an AI-driven talent-to-project matching system.",
                "Mandatory skills required: React (Intermediate), Node.js (Intermediate), Python (Advanced), GenAI (Advanced).",
                "Employee Anita Verma: Current skills in Java, Spring Boot, AWS. Role: Backend Developer.",
                "Identified skill gaps for bridge training: React, Node.js, Python, GenAI.",
            ],
            # High-quality response grounded in retrieved context
            "grounded_response": {
                "api_available": True,
                "project_name": "AI Talent Matching Platform",
                "tutor_summary": "Intensive bridge curriculum transitioning from Java/Spring Boot to Python backend, React frontend, and GenAI models.",
                "learning_tiers": [
                    {
                        "tier_name": "Tier 1: High Priority (Core Prerequisites)",
                        "priority": "High",
                        "skill_name": "Python",
                        "required_frameworks": ["Python 3.11", "FastAPI", "Pydantic"],
                        "estimated_duration": "1-2 Weeks",
                        "learning_objectives": ["Master Python data structures", "Build REST APIs with FastAPI"],
                        "practical_demo": {
                            "title": "FastAPI Microservice Demo",
                            "code_snippet": "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/health')\ndef health(): return {'status': 'ok'}",
                            "hands_on_task": "Build employee profile endpoint using FastAPI and Pydantic",
                        },
                    },
                    {
                        "tier_name": "Tier 2: Medium Priority (Frameworks & Libraries)",
                        "priority": "Medium",
                        "skill_name": "React & Node.js",
                        "required_frameworks": ["React 18", "Node.js", "TypeScript", "Vite"],
                        "estimated_duration": "1 Week",
                        "learning_objectives": ["Build reactive UI components", "Connect React UI to FastAPI backend"],
                        "practical_demo": {
                            "title": "React Dashboard Demo",
                            "code_snippet": "export function Dashboard() { return <div>AI Matching</div>; }",
                            "hands_on_task": "Create talent matching card component with score badge",
                        },
                    },
                    {
                        "tier_name": "Tier 3: Low Priority (GenAI & Matching)",
                        "priority": "Low",
                        "skill_name": "GenAI",
                        "required_frameworks": ["google-genai", "LangChain", "Vector Embeddings"],
                        "estimated_duration": "4-5 Days",
                        "learning_objectives": ["Prompt engineering for job matching", "Integrate Gemini models"],
                        "practical_demo": {
                            "title": "LLM Scoring Demo",
                            "code_snippet": "from google import genai\nclient = genai.Client()",
                            "hands_on_task": "Implement skill extraction prompt using Gemini API",
                        },
                    },
                ],
            },
            # Negative test: hallucinated response mentioning unrelated tech
            "hallucinated_response": {
                "api_available": True,
                "project_name": "AI Talent Matching Platform",
                "tutor_summary": "Learn embedded C programming and kernel driver development for robotics hardware.",
                "learning_tiers": [
                    {
                        "tier_name": "Tier 1",
                        "priority": "High",
                        "skill_name": "Cobol & Assembly",
                        "required_frameworks": ["Mainframe z/OS", "ARM Assembly"],
                        "estimated_duration": "3 Months",
                        "learning_objectives": ["Write hardware register drivers"],
                        "practical_demo": {
                            "title": "Assembly Demo",
                            "code_snippet": "MOV AX, BX",
                            "hands_on_task": "Write BIOS interrupt handler",
                        },
                    }
                ],
            },
        },
        {
            "id": "LP-002",
            "name": "Priya Nair onboarding to Cloud Migration Project",
            "query": "Generate learning path for Priya Nair joining Cloud Migration & Modernization project",
            "project_data": {
                "project_id": "P002",
                "project_name": "Cloud Migration & Modernization",
                "domain": "Cloud / DevOps",
                "required_skills": [
                    {"skill_name": "AWS", "required_level": "Advanced", "mandatory": True},
                    {"skill_name": "Docker", "required_level": "Intermediate", "mandatory": True},
                    {"skill_name": "Kubernetes", "required_level": "Intermediate", "mandatory": True},
                    {"skill_name": "Terraform", "required_level": "Intermediate", "mandatory": False},
                ],
            },
            "employee_skills": ["Python", "FastAPI", "GenAI / RAG", "SQL"],
            "expected_gap_skills": ["AWS", "Docker", "Kubernetes", "Terraform"],
            "retrieved_context": [
                "Project P002: Cloud Migration & Modernization. Domain: Cloud / DevOps. Goal: Migrate on-premises infrastructure to AWS.",
                "Required skills: AWS, Docker, Kubernetes, Terraform.",
                "Employee Priya Nair skills: Python, FastAPI, GenAI / RAG, SQL. Skill gaps: AWS, Docker, Kubernetes, Terraform.",
            ],
            "grounded_response": {
                "api_available": True,
                "project_name": "Cloud Migration & Modernization",
                "tutor_summary": "Comprehensive cloud enablement curriculum focusing on Docker containerization, Kubernetes orchestration, and AWS Terraform IaC.",
                "learning_tiers": [
                    {
                        "tier_name": "Tier 1: High Priority",
                        "priority": "High",
                        "skill_name": "Docker & AWS",
                        "required_frameworks": ["Docker", "AWS ECS", "EC2", "S3"],
                        "estimated_duration": "1 Week",
                        "learning_objectives": ["Containerize Python microservices", "Deploy containers to AWS"],
                        "practical_demo": {
                            "title": "Dockerfile setup",
                            "code_snippet": "FROM python:3.11-slim\nWORKDIR /app",
                            "hands_on_task": "Create production Dockerfile and push to AWS ECR",
                        },
                    },
                    {
                        "tier_name": "Tier 2: Medium Priority",
                        "priority": "Medium",
                        "skill_name": "Kubernetes & Terraform",
                        "required_frameworks": ["Kubernetes (EKS)", "Terraform HCL"],
                        "estimated_duration": "1-2 Weeks",
                        "learning_objectives": ["Write Kubernetes deployment manifests", "Provision AWS resources via Terraform"],
                        "practical_demo": {
                            "title": "Terraform AWS Provider",
                            "code_snippet": "resource \"aws_s3_bucket\" \"b\" { bucket = \"app-bucket\" }",
                            "hands_on_task": "Deploy EKS cluster configuration with Terraform",
                        },
                    },
                ],
            },
            "hallucinated_response": {
                "api_available": True,
                "project_name": "Cloud Migration",
                "tutor_summary": "Mobile UI design with Swift and Adobe Photoshop.",
                "learning_tiers": [
                    {
                        "tier_name": "Tier 1",
                        "priority": "High",
                        "skill_name": "Swift iOS",
                        "required_frameworks": ["UIKit", "SwiftUI"],
                        "estimated_duration": "4 Weeks",
                        "learning_objectives": ["Build iOS applications"],
                        "practical_demo": {"title": "iOS", "code_snippet": "import SwiftUI", "hands_on_task": "Build iPhone UI"},
                    }
                ],
            },
        },
    ],
    "course_recommendation_cases": [
        {
            "id": "CR-001",
            "gap_skills": ["React", "GenAI / RAG", "Docker"],
            "query": "Recommend official online courses for gap skills: React, GenAI / RAG, Docker",
            "retrieved_context": [
                "Skill gaps identified: React, GenAI / RAG, Docker.",
                "Target learning resources must be valid official documentation, Coursera, DeepLearning.AI, or freeCodeCamp.",
            ],
            "grounded_response": [
                {
                    "skill": "React",
                    "course_title": "React Official Documentation & Interactive Tutorial",
                    "url": "https://react.dev/learn",
                    "platform": "React Docs",
                },
                {
                    "skill": "GenAI / RAG",
                    "course_title": "Building Applications with Vector Databases & RAG",
                    "url": "https://www.deeplearning.ai/short-courses/building-agentic-rag-with-llamaindex/",
                    "platform": "DeepLearning.AI",
                },
                {
                    "skill": "Docker",
                    "course_title": "Docker for Beginners and Containerization",
                    "url": "https://docs.docker.com/get-started/",
                    "platform": "Docker Docs",
                },
            ],
            "hallucinated_response": [
                {
                    "skill": "Cooking 101",
                    "course_title": "Baking Bread at Home",
                    "url": "https://fake-random-invalid-link.xyz/bread",
                    "platform": "KitchenMaster",
                }
            ],
        }
    ],
    "candidate_retrieval_cases": [
        {
            "id": "RET-001",
            "project_id": "P001",
            "query": "Find best matching candidate for AI Engineer role on AI Talent Matching Platform requiring Python, FastAPI, GenAI, SQL",
            "ground_truth_candidate_ids": ["E003", "E001"],  # Priya Nair and Rahul Shah
        },
        {
            "id": "RET-002",
            "project_id": "P002",
            "query": "Find best matching candidate for DevOps Engineer role requiring AWS, Docker, Kubernetes",
            "ground_truth_candidate_ids": ["E004"],  # Vikram Joshi has React, AWS, Docker, Node.js
        },
    ],
    "onboarding_scoring_cases": [
        {
            "id": "SC-001",
            "topic": "Skills",
            "question": "What programming languages and backend frameworks do you have experience with?",
            "substantive_answer": "I have over 3 years of hands-on experience with Python and FastAPI for developing microservices. I regularly use SQL databases like PostgreSQL, handle Docker container deployments, and have integrated LangChain with LLM APIs for automated text processing.",
            "expected_threshold_passed": True,
            "min_expected_score": 3.0,
        },
        {
            "id": "SC-002",
            "topic": "Skills",
            "question": "What programming languages and backend frameworks do you have experience with?",
            "substantive_answer": "yes i know python",
            "expected_threshold_passed": False,
            "max_expected_score": 2.4,
        },
    ],
}
