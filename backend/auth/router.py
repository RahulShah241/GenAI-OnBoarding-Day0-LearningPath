"""
auth/router.py
──────────────
Authentication endpoints:

    POST  /auth/login            — obtain JWT (open)
    GET   /auth/me               — return current user profile (any authenticated)
    POST  /auth/change-password  — change own password (any authenticated)
    POST  /auth/register         — create a new user account (ADMIN only)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import get_current_user, require_roles
from auth.security import create_access_token, hash_password, verify_password
from json_db import read_json, write_json
from schemas import (
    ChangePasswordRequest,
    EmployeePublic,
    LoginRequest,
    RegisterRequest,
    TokenData,
    TokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _find_employee_by_email(email: str) -> dict | None:
    """Return the raw employee dict whose email matches, or None."""
    employees: list[dict] = read_json("employees.json")
    return next((e for e in employees if e["email"].lower() == email.lower()), None)


def _find_employee_by_id(employee_id: str) -> dict | None:
    employees: list[dict] = read_json("employees.json")
    return next((e for e in employees if e["employee_id"] == employee_id), None)


def _to_public(emp: dict) -> EmployeePublic:
    """Strip the password field before returning employee data."""
    return EmployeePublic(
        employee_id=emp["employee_id"],
        name=emp["name"],
        email=emp["email"],
        role=emp["role"],
        skills=emp.get("skills", []),
        experience=emp.get("experience", 0.0),
        status=emp.get("status", ""),
        designation=emp.get("designation"),
        department=emp.get("department"),
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
def login(payload: LoginRequest) -> TokenResponse:
    """
    Authenticate with email + password.

    Returns a JWT **access_token** (Bearer) together with the authenticated
    employee's public profile. Pass the token in every subsequent request:

        Authorization: Bearer <access_token>
    """
    emp = _find_employee_by_email(payload.email)

    if emp is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    stored_password: str = emp.get("password", "")

    # Support both plain-text legacy passwords (not hashed yet) and bcrypt hashes.
    # Once a user logs in their password is transparently upgraded to bcrypt.
    password_ok: bool = False
    needs_upgrade: bool = False

    if stored_password.startswith("$2b$") or stored_password.startswith("$2a$"):
        # Already hashed — use bcrypt verification
        password_ok = verify_password(payload.password, stored_password)
    else:
        # Legacy plain-text comparison
        password_ok = payload.password == stored_password
        needs_upgrade = password_ok  # upgrade on successful login

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Transparently upgrade plain-text passwords to bcrypt
    if needs_upgrade:
        employees: list[dict] = read_json("employees.json")
        for e in employees:
            if e["employee_id"] == emp["employee_id"]:
                e["password"] = hash_password(payload.password)
                break
        write_json("employees.json", employees)
        logger.info("Upgraded password hash for employee %s", emp["employee_id"])

    token = create_access_token(
        {
            "sub": emp["employee_id"],
            "email": emp["email"],
            "role": emp["role"],
        }
    )

    return TokenResponse(access_token=token, employee=_to_public(emp))


@router.get(
    "/me",
    response_model=EmployeePublic,
    summary="Get current authenticated user's profile",
)
def get_me(current_user: TokenData = Depends(get_current_user)) -> EmployeePublic:
    """Return the public profile of the currently logged-in employee."""
    emp = _find_employee_by_id(current_user.employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _to_public(emp)


@router.post(
    "/change-password",
    summary="Change your own password",
    status_code=status.HTTP_200_OK,
)
def change_password(
    payload: ChangePasswordRequest,
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    """
    Change the password for the currently authenticated employee.
    Requires the correct current password for verification.
    """
    employees: list[dict] = read_json("employees.json")
    idx = next(
        (i for i, e in enumerate(employees) if e["employee_id"] == current_user.employee_id),
        None,
    )
    if idx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    emp = employees[idx]
    stored = emp.get("password", "")

    # Verify current password (supports both bcrypt and legacy plain-text)
    if stored.startswith("$2b$") or stored.startswith("$2a$"):
        correct = verify_password(payload.current_password, stored)
    else:
        correct = payload.current_password == stored

    if not correct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    employees[idx]["password"] = hash_password(payload.new_password)
    write_json("employees.json", employees)
    return {"message": "Password changed successfully"}


@router.post(
    "/register",
    response_model=EmployeePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new employee account (ADMIN only)",
)
def register(
    payload: RegisterRequest,
    _: TokenData = Depends(require_roles("ADMIN")),
) -> EmployeePublic:
    """
    Create a new employee record.
    Only ADMINs may call this endpoint.
    Password is stored as a bcrypt hash.
    """
    employees: list[dict] = read_json("employees.json")

    # Duplicate checks
    if any(e["employee_id"] == payload.employee_id for e in employees):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{payload.employee_id}' already exists",
        )
    if any(e["email"].lower() == payload.email.lower() for e in employees):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{payload.email}' is already registered",
        )

    new_emp: dict = {
        "employee_id": payload.employee_id,
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "skills": payload.skills,
        "experience": payload.experience,
        "status": payload.status,
        "designation": payload.designation,
        "department": payload.department,
        "password": hash_password(payload.password),
    }

    employees.append(new_emp)
    write_json("employees.json", employees)
    logger.info("Registered new employee: %s (%s)", payload.employee_id, payload.email)

    return _to_public(new_emp)
