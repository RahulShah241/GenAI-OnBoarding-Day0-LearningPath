"""
auth/security.py
────────────────
JWT helpers (create / decode) and password hashing utilities.
Uses python-jose for JWT and native bcrypt for hashing (avoiding passlib detect_wrap_bug issues).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from schemas import TokenData

logger = logging.getLogger(__name__)

# ── Config from .env (with safe defaults for development) ────────────────────
SECRET_KEY: str = os.getenv(
    "SECRET_KEY",
    "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
)
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "45")
)


# ── Password hashing ─────────────────────────────────────────────────────────

def _get_pwd_bytes(password: str) -> bytes:
    """
    Bcrypt only supports passwords up to 72 bytes.
    Safely encode to UTF-8 and truncate to 72 bytes.
    """
    return password.encode("utf-8")[:72]


def hash_password(plain: str) -> str:
    """Hash a plain text password using bcrypt."""
    pwd_bytes = _get_pwd_bytes(plain)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against a bcrypt hash string."""
    try:
        pwd_bytes = _get_pwd_bytes(plain)
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception as exc:
        logger.warning("Password verification error: %s", exc)
        return False


# ── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Encode *data* into a signed JWT.

    Parameters
    ----------
    data:           Arbitrary dict to embed as claims (must include 'sub').
    expires_delta:  Override default lifetime (ACCESS_TOKEN_EXPIRE_MINUTES).

    Returns
    -------
    Signed JWT string.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate *token*.

    Returns
    -------
    TokenData if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("sub", "")
        email: str = payload.get("email", "")
        role: str = payload.get("role", "")
        if not employee_id:
            return None
        return TokenData(employee_id=employee_id, email=email, role=role)
    except JWTError as exc:
        logger.debug("JWT decode error: %s", exc)
        return None
