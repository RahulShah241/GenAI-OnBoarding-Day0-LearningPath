from typing import List
from schemas import ProjectDescription, Employee, SuggestedEmployee


def calculate_match(project: ProjectDescription, employee: Employee) -> SuggestedEmployee:
    required_skills = [s['skill_name'] for s in project['required_skills']]
    emp_skills = employee['skills']

    matched = list(set(required_skills) & set(emp_skills))
    missing = list(set(required_skills) - set(emp_skills))

    # Skill score
    skill_score = (len(matched) / len(required_skills)) * 100 if required_skills else 0

    # Experience score
    required_exp = 3  # You can derive from role level later
    if employee['experience_years'] >= required_exp:
        exp_score = 100
    else:
        exp_score = (employee['experience_years'] / required_exp) * 100

    final_score = int((0.7 * skill_score) + (0.3 * exp_score))

    return SuggestedEmployee(
        **dict(employee),
        match_percentage=final_score,
        matched_skills=matched,
        missing_skills=missing,
    )
