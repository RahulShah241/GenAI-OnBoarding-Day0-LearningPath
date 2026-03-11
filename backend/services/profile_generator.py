"""
services/profile_generator.py
──────────────────────────────
Build an EmployeeProfile from a completed EmployeeResponse record.

Called after every topic submission so the profile is always up-to-date.
Also merges NLP-extracted skills with the base employee skills stored in
employees.json so the job-matching page sees a richer skill set.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from services.nlp_scoring import extract_experience_years, extract_skills_from_text


def generate_profile(response_data: dict, base_employee: Optional[dict] = None) -> dict:
    """
    Build a profile dict from the stored chatbot response document.

    Parameters
    ----------
    response_data : dict
        Content of  data/employee_responses/{email}.json
    base_employee : dict | None
        Row from employees.json (used to seed base skills / years of exp).

    Returns
    -------
    dict matching the EmployeeProfile schema.
    """
    responses: list[dict] = response_data.get("responses", [])
    employee_id: str = response_data.get("employee_id", "")
    email: str = response_data.get("employee_email", "")

    # ── Per-topic buckets ──────────────────────────────────────────────────────
    role_answers: list[str] = []
    skills_answers: list[str] = []
    experience_answers: list[str] = []
    learning_answers: list[str] = []
    workstyle_answers: list[str] = []
    soft_topic_scores: dict[str, list[float]] = {
        "communication": [],
        "collaboration": [],
        "problem_solving": [],
        "ownership": [],
    }
    all_scores: list[float] = []
    completed_topics: list[str] = []

    for r in responses:
        topic = r.get("topic", "")
        answer = r.get("answer", "")
        score_val = r.get("score", {}).get("final_score", 0.0)
        all_scores.append(score_val)

        if topic not in completed_topics:
            completed_topics.append(topic)

        if topic == "Role":
            role_answers.append(answer)
        elif topic == "Skills":
            skills_answers.append(answer)
        elif topic == "Experience":
            experience_answers.append(answer)
        elif topic == "Learning":
            learning_answers.append(answer)
        elif topic == "Workstyle":
            workstyle_answers.append(answer)
        elif topic.lower() == "communication":
            soft_topic_scores["communication"].append(score_val)
        elif topic.lower() == "collaboration":
            soft_topic_scores["collaboration"].append(score_val)
        elif topic.lower() in ("problem-solving", "problem solving"):
            soft_topic_scores["problem_solving"].append(score_val)
        elif topic.lower() == "ownership":
            soft_topic_scores["ownership"].append(score_val)

    # ── Skill extraction ───────────────────────────────────────────────────────
    all_text = " ".join(skills_answers + experience_answers)
    extracted_skills: list[str] = extract_skills_from_text(all_text)

    # Merge with base employee skills (if provided)
    base_skills: list[str] = base_employee.get("skills", []) if base_employee else []
    merged_skills = list(dict.fromkeys(base_skills + extracted_skills))  # deduplicate

    # ── Experience years ───────────────────────────────────────────────────────
    exp_text = " ".join(experience_answers)
    years = extract_experience_years(exp_text)
    if years is None and base_employee:
        years = base_employee.get("experience")

    # ── Soft skill averages ────────────────────────────────────────────────────
    def _avg(vals: list[float]) -> Optional[float]:
        return round(sum(vals) / len(vals), 2) if vals else None

    # ── Role summaries ─────────────────────────────────────────────────────────
    current_role = role_answers[0] if len(role_answers) > 0 else None
    desired_role = role_answers[1] if len(role_answers) > 1 else None

    # ── Learning interests ─────────────────────────────────────────────────────
    learning_interests = [a for a in learning_answers if a.strip()]

    # ── Workstyle ─────────────────────────────────────────────────────────────
    preferred_ws = workstyle_answers[0] if len(workstyle_answers) > 0 else None
    motivations = workstyle_answers[1] if len(workstyle_answers) > 1 else None

    # ── Overall score & readiness ──────────────────────────────────────────────
    overall = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0
    if overall >= 4.5:
        readiness = "High"
    elif overall >= 3.0:
        readiness = "Moderate"
    else:
        readiness = "Needs Development"

    return {
        "employee_id": employee_id,
        "email": email,
        "name": base_employee.get("name") if base_employee else None,
        "current_role_summary": current_role,
        "desired_role_summary": desired_role,
        "experience_summary": experience_answers[0] if experience_answers else None,
        "years_of_experience": years,
        "extracted_skills": extracted_skills,
        "merged_skills": merged_skills,   # used to update employees.json
        "soft_skills": {
            "communication": _avg(soft_topic_scores["communication"]),
            "collaboration": _avg(soft_topic_scores["collaboration"]),
            "problem_solving": _avg(soft_topic_scores["problem_solving"]),
            "ownership": _avg(soft_topic_scores["ownership"]),
        },
        "learning_interests": learning_interests,
        "workstyle": {
            "preferred_work_style": preferred_ws,
            "motivations": motivations,
        },
        "overall_score": overall,
        "readiness": readiness,
        "profile_version": response_data.get("profile_version", 1),
        "completed_topics": completed_topics,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
