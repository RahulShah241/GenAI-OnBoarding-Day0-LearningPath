"""
matching.py
───────────
calculate_match() computes a weighted skill + experience score for one
employee against one project and returns a SuggestedEmployee.

Scoring formula
───────────────
  skill_score   = (matched_skills / required_skills) * 100   [0–100]
  exp_score     = min(employee_exp / required_exp, 1) * 100  [0–100]
  final_score   = round(0.7 * skill_score + 0.3 * exp_score) [0–100, int]

required_exp is derived from the highest role_level found in required_roles:
  Junior → 1 yr,  Mid → 3 yrs,  Senior → 5 yrs,  Lead → 7 yrs
"""

from __future__ import annotations

from schemas import SuggestedEmployee

# Maps role_level keywords (case-insensitive prefix) to required years.
_EXP_MAP: dict[str, int] = {
    "lead": 7,
    "senior": 5,
    "mid": 3,
    "junior": 1,
}
_DEFAULT_EXP: int = 3


def _required_experience(project: dict) -> int:
    """Return the highest experience threshold implied by required_roles."""
    levels = [r.get("role_level", "").lower() for r in project.get("required_roles", [])]
    years = [
        exp
        for level in levels
        for key, exp in _EXP_MAP.items()
        if level.startswith(key)
    ]
    return max(years, default=_DEFAULT_EXP)


def calculate_match(project: dict, employee: dict) -> SuggestedEmployee:
    """
    Compute a match score for *employee* against *project*.

    Both arguments are raw dicts (as loaded from JSON).
    Returns a SuggestedEmployee with password excluded.
    """
    required_skills: list[str] = [
        s["skill_name"] for s in project.get("required_skills", [])
    ]
    emp_skills: list[str] = employee.get("skills", [])

    # Case-insensitive skill comparison
    req_lower = {s.lower(): s for s in required_skills}
    emp_lower = {s.lower() for s in emp_skills}

    matched_keys = req_lower.keys() & emp_lower
    matched = [req_lower[k] for k in matched_keys]
    missing = [req_lower[k] for k in req_lower.keys() - emp_lower]

    skill_score = (len(matched) / len(required_skills) * 100) if required_skills else 0

    required_exp = _required_experience(project)
    exp_score = min(employee.get("experience", 0) / required_exp, 1.0) * 100

    final_score = int(round(0.7 * skill_score + 0.3 * exp_score))

    return SuggestedEmployee(
        employee_id=employee["employee_id"],
        name=employee["name"],
        email=employee["email"],
        role=employee["role"],
        skills=emp_skills,
        experience=employee.get("experience", 0),
        status=employee.get("status", ""),
        designation=employee.get("designation"),
        department=employee.get("department"),
        match_percentage=final_score,
        matched_skills=matched,
        missing_skills=missing,
    )
