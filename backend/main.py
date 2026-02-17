from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import uuid
from schemas import TopicResponseCreate
from services.nlp_scoring import nlp_score
from services.llm_scoring import llm_score
from services.scoring_engine import combine_scores

from fastapi import FastAPI, HTTPException
from typing import List

from schemas import (
    ProjectSummary,
    ProjectDescription,
    Employee,
    SuggestedEmployee,
    ProjectCreate
)
# from data import pro, EMPLOYEES
from json_db import read_json, append_json
from matching import calculate_match 
app = FastAPI(title="Employee Chatbot Backend")

# ✅ CORS FIX (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path("data/employee_responses")
DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_employee_file(email: str) -> Path:
    safe_email = email.replace("@", "_").replace(".", "_")
    return DATA_DIR / f"{safe_email}.json"


@app.post("/employee/topic-response")
def save_topic_response(payload: TopicResponseCreate):
    file_path = get_employee_file(payload.employee_email)

    if file_path.exists():
        data = json.loads(file_path.read_text())
    else:
        data = {
            "employee_email": payload.employee_email,
            "role": payload.role,
            "responses": []
        }

    # 🧠 NLP scoring
    nlp_result = nlp_score(payload.answer, payload.topic)

    # 🤖 LLM scoring
    llm_result = llm_score(
        payload.topic,
        payload.question,
        payload.answer
    )

    # 🎯 Combine scores
    scoring = combine_scores(nlp_result, llm_result)

    response_entry = {
        "topic": payload.topic,
        "question": payload.question,
        "answer": payload.answer,
        "score": scoring
    }

    data["responses"].append(response_entry)

    file_path.write_text(json.dumps(data, indent=2))

    return {
        "message": "Response saved & evaluated",
        "topic": payload.topic,
        "final_score": scoring["final_score"],
        "feedback": llm_result["feedback"]
    }


@app.get("/employee/{email}")
def get_employee_data(email: str):
    file_path = get_employee_file(email)

    if not file_path.exists():
        return {"error": "Employee not found"}

    return json.loads(file_path.read_text())



# -------------------------------
# PROJECT LIST (Lightweight)
# -------------------------------
@app.get("/projects", response_model=List[dict])
def get_projects():
    projects = read_json("projectDetails.json")

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



# -------------------------------
# PROJECT FULL DETAILS
# -------------------------------
@app.get("/projects/{project_id}")
def get_project(project_id: str):
    projects = read_json("projectDetails.json")
    
    for p in projects:
        if p["project_id"] == project_id:
            return p

    raise HTTPException(status_code=404, detail="Project not found")

from fastapi.encoders import jsonable_encoder
##Add NEW project
@app.post("/project")
def add_project(project: ProjectCreate):
    print(project)
    Id=str(uuid.uuid4())
    new_project = ProjectDescription(
        project_id=Id,
        **project.dict()
    )
    print(new_project.dict())
    append_json("projectDetails.json", jsonable_encoder(new_project.dict()))
    return {"message": "Project added successfully",'project_id':Id}
 
# -------------------------------
# EMPLOYEES
# -------------------------------
@app.get("/employees", response_model=List[dict])
def get_employees():
    return read_json("employees.json")


@app.get("/employees/{employee_id}")
def get_employee(employee_id: str):
    employees = read_json("employees.json")

    for e in employees:
        if e["employee_id"] == employee_id:
            return e

    raise HTTPException(status_code=404, detail="Employee not found")

@app.post("/employees")
def add_employee(employee: dict):
    employees = read_json("employees.json")

    if any(e["employee_id"] == employee["employee_id"] for e in employees):
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    employees.append(employee)

    from  json_db import write_json
    write_json("employees.json", employees)

    return {"message": "Employee added successfully"}




# -------------------------------
# SUGGESTED EMPLOYEES PER PROJECT
# -------------------------------
@app.get(
    "/projects/{project_id}/suggested-employees",
    response_model=List[SuggestedEmployee],
)
def suggest_employees(project_id: str):
    projects = read_json("projectDetails.json")
    print(projects[0]['project_id'])
    project = next((p for p in projects if p['project_id'] == project_id), None)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    employees = read_json("employees.json")
    suggestions = [
        calculate_match(project, emp) for emp in employees
    ]

    # Sort by highest match first
    suggestions.sort(key=lambda x: x.match_percentage, reverse=True)

    return suggestions
