"""Authentication, RBAC, and password-hashing dependencies (security-by-default)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..db.portal_db import AdminAuditLog, UserAccount, get_db
from .config import settings

ADMIN_ROLES = {"platform_admin", "workspace_admin"}
PROTECTED_ROLES = {"platform_admin"}
ALL_ROLES = ("platform_admin", "workspace_admin", "analyst", "viewer")

ROLE_CATALOG = [
    {
        "code": "platform_admin",
        "label": "Platform Admin",
        "tier": "platform",
        "locked": True,
        "description": "Full platform governance, security policy, and user/role lifecycle control.",
    },
    {
        "code": "workspace_admin",
        "label": "Workspace Admin",
        "tier": "workspace",
        "locked": False,
        "description": "Manages workspace users (non-platform tiers), data sources, KPIs, and client portals.",
    },
    {
        "code": "analyst",
        "label": "Analyst",
        "tier": "workspace",
        "locked": False,
        "description": "Uploads CSV datasets, configures corporate KPIs, and generates executive reports.",
    },
    {
        "code": "viewer",
        "label": "Viewer",
        "tier": "workspace",
        "locked": False,
        "description": "Least-privilege read-only access to dashboards, KPI scorecards, and shared reports.",
    },
]


def _auth_jwt_secret() -> str:
    return (
        os.environ.get("AUTH_JWT_SECRET")
        or os.environ.get("SECRET_KEY")
        or settings.SECRET_KEY
    ).strip()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, salt_b64, dk_b64 = stored_hash.split("$", 2)
        if scheme != "scrypt":
            return False
        salt = base64.b64decode(salt_b64.encode())
        expected = base64.b64decode(dk_b64.encode())
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=len(expected))
        return hmac.compare_digest(actual, expected)
    except Exception:  # noqa: BLE001
        return False


def create_access_token(
    user: UserAccount,
    act_as: dict[str, Any] | None = None,
    expires_minutes: int | None = None,
) -> str:
    ttl = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "typ": "access",
        "iat": now,
        "exp": now + int(ttl) * 60,
    }
    if act_as:
        payload["act_as"] = act_as
    return jwt.encode(payload, _auth_jwt_secret(), algorithm="HS256")


def decode_access_token(authorization: str | None) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        claims = jwt.decode(token, _auth_jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc
    if claims.get("typ") != "access" or not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid access token claims")
    return claims


def serialize_user(user: UserAccount) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "fullName": user.full_name,
        "organizationName": user.organization_name or "Nexus Workspace",
        "role": user.role,
        "roles": [user.role],
        "isActive": bool(user.is_active),
        "mustChangePassword": bool(user.must_change_password),
        "lastLoginAt": user.last_login_at.isoformat() + "Z" if user.last_login_at else None,
        "createdAt": user.created_at.isoformat() + "Z" if user.created_at else None,
    }


def record_admin_audit(
    db: Session,
    actor: UserAccount,
    action: str,
    target_user_id: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    entry = AdminAuditLog(
        actor_user_id=actor.id,
        actor_email=actor.email,
        action=action,
        target_user_id=target_user_id,
        detail_json=json.dumps(detail or {}),
    )
    db.add(entry)
    db.commit()


def get_current_user_and_claims(
    authorization: str | None = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> tuple[UserAccount, dict[str, Any]]:
    claims = decode_access_token(authorization)
    user = db.query(UserAccount).filter(UserAccount.id == claims["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user, claims


def get_current_user(
    pair: tuple[UserAccount, dict[str, Any]] = Depends(get_current_user_and_claims),
) -> UserAccount:
    return pair[0]


def require_not_impersonating(
    pair: tuple[UserAccount, dict[str, Any]] = Depends(get_current_user_and_claims),
) -> UserAccount:
    user, claims = pair
    if claims.get("act_as"):
        raise HTTPException(
            status_code=403,
            detail="This action is blocked while viewing as or impersonating another user",
        )
    return user


def get_current_admin_user(
    pair: tuple[UserAccount, dict[str, Any]] = Depends(get_current_user_and_claims),
) -> UserAccount:
    user, claims = pair
    act_as = claims.get("act_as")
    if isinstance(act_as, dict) and act_as.get("mode") == "preview":
        raise HTTPException(status_code=403, detail="IMPERSONATION_READ_ONLY")
    if user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user
