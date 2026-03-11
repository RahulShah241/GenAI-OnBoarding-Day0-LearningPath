"""
auth/dependencies.py
────────────────────
FastAPI dependency functions for authentication and role-based access control.

Usage in route handlers
-----------------------
    from auth.dependencies import get_current_user, require_roles

    @app.get("/employees")
    def list_employees(current_user: TokenData = Depends(require_roles("HR", "ADMIN"))):
        ...
"""

from __future__ import annotations

from functools import partial
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.security import decode_access_token
from schemas import TokenData

# HTTPBearer extracts the "Authorization: Bearer <token>" header automatically.
_bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> TokenData:
    """
    Dependency that validates the JWT and returns the TokenData claims.

    Raises 401 if the token is missing, expired, or tampered.
    """
    token_data = decode_access_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data


def require_roles(*roles: str):
    """
    Factory that returns a dependency enforcing role membership.

    Example
    -------
        Depends(require_roles("HR", "ADMIN"))

    Raises 403 if the authenticated user's role is not in *roles*.
    """
    allowed = set(roles)

    def _check(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(sorted(allowed))}",
            )
        return current_user

    return _check
