"""Authentication, Profile, and Self-Service Password routes."""
from __future__ import annotations

import hmac
import os
import re
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ...core.dependencies import (
    create_access_token,
    get_current_user,
    hash_password,
    require_not_impersonating,
    serialize_user,
    verify_password,
)
from ...db.portal_db import UserAccount, get_db

router = APIRouter(tags=["auth"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _normalize_username(email: str, requested: str | None) -> str:
    raw = (requested or email.split("@", 1)[0]).strip().lower()
    cleaned = re.sub(r"[^a-z0-9._-]+", "-", raw).strip("-")
    return (cleaned or "user")[:120]


def _verify_bootstrap_api_key(x_admin_api_key: str | None) -> None:
    """Require X-Admin-Api-Key matching NEXUS_ADMIN_API_KEY or PORTAL_API_KEY."""
    provided = (x_admin_api_key or "").strip()
    if not provided:
        raise HTTPException(
            status_code=401,
            detail="X-Admin-Api-Key header is required to bootstrap the initial platform administrator",
        )
    expected = (
        os.environ.get("NEXUS_ADMIN_API_KEY")
        or os.environ.get("PORTAL_API_KEY")
        or ""
    ).strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Bootstrap admin API key is not configured on server",
        )
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid admin API key")


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str = Field(..., min_length=5, max_length=256)
    password: str = Field(..., min_length=10, max_length=128)
    full_name: str = Field(..., alias="fullName", min_length=2, max_length=256)
    username: str | None = Field(None, max_length=128)
    organization_name: str = Field("Nexus Workspace", alias="organizationName", max_length=256)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=256)
    password: str = Field(..., min_length=1, max_length=128)


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str | None = Field(None, alias="fullName", min_length=2, max_length=256)
    organization_name: str | None = Field(None, alias="organizationName", max_length=256)


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current_password: str = Field(..., alias="currentPassword", min_length=1, max_length=128)
    new_password: str = Field(..., alias="newPassword", min_length=10, max_length=128)


@router.get("/v1/auth/status")
def auth_status(db: Session = Depends(get_db)):
    count = db.query(UserAccount).count()
    return {"hasUsers": count > 0, "userCount": count, "publicSignupEnabled": False}


def _bootstrap_initial_admin(
    body: RegisterRequest,
    x_admin_api_key: str | None,
    db: Session,
) -> dict:
    # Once any account exists, public registration/bootstrap is permanently closed.
    if db.query(UserAccount).count() > 0:
        raise HTTPException(
            status_code=403,
            detail="Public registration is disabled. Accounts must be created by an administrator via /api/admin/users.",
        )

    _verify_bootstrap_api_key(x_admin_api_key)

    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")

    existing = db.query(UserAccount).filter(UserAccount.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    base_username = _normalize_username(email, body.username)
    username = base_username
    suffix = 1
    while db.query(UserAccount).filter(UserAccount.username == username).first():
        suffix += 1
        username = f"{base_username}-{suffix}"

    user = UserAccount(
        id=str(uuid.uuid4()),
        email=email,
        username=username,
        full_name=body.full_name.strip(),
        organization_name=(body.organization_name or "Nexus Workspace").strip(),
        role="platform_admin",
        password_hash=hash_password(body.password),
        is_active=True,
        must_change_password=False,
        last_login_at=_utc_now_naive(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user)
    return {"accessToken": token, "tokenType": "bearer", "user": serialize_user(user)}


@router.post("/v1/auth/bootstrap", status_code=201)
def bootstrap_platform_admin(
    body: RegisterRequest,
    x_admin_api_key: str | None = Header(None, alias="X-Admin-Api-Key"),
    db: Session = Depends(get_db),
):
    """Server-key-protected one-time bootstrap for the initial platform_admin."""
    return _bootstrap_initial_admin(body, x_admin_api_key, db)


@router.post("/v1/auth/register", status_code=201)
def register_account(
    body: RegisterRequest,
    x_admin_api_key: str | None = Header(None, alias="X-Admin-Api-Key"),
    db: Session = Depends(get_db),
):
    """Locked-down bootstrap alias: requires X-Admin-Api-Key when zero users exist; disabled once initialized."""
    return _bootstrap_initial_admin(body, x_admin_api_key, db)


@router.post("/v1/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    identifier = body.email.strip().lower()
    user = (
        db.query(UserAccount)
        .filter((UserAccount.email == identifier) | (UserAccount.username == identifier))
        .first()
    )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact your administrator.")

    user.last_login_at = _utc_now_naive()
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user)
    return {"accessToken": token, "tokenType": "bearer", "user": serialize_user(user)}


@router.get("/v1/auth/me")
def get_me(user: UserAccount = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@router.patch("/v1/auth/me")
def update_me(
    body: ProfileUpdateRequest,
    user: UserAccount = Depends(require_not_impersonating),
    db: Session = Depends(get_db),
):
    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.organization_name is not None:
        user.organization_name = body.organization_name.strip() or "Nexus Workspace"
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": serialize_user(user)}


def _do_change_password(
    body: ChangePasswordRequest,
    user: UserAccount,
    db: Session,
) -> dict:
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password")

    user.password_hash = hash_password(body.new_password)
    user.must_change_password = False
    db.add(user)
    db.commit()
    return {"ok": True, "message": "Password updated successfully."}


@router.post("/v1/auth/change-password")
def change_password_v1(
    body: ChangePasswordRequest,
    user: UserAccount = Depends(require_not_impersonating),
    db: Session = Depends(get_db),
):
    return _do_change_password(body, user, db)


@router.post("/users/me/password")
def change_password_standard(
    body: ChangePasswordRequest,
    user: UserAccount = Depends(require_not_impersonating),
    db: Session = Depends(get_db),
):
    """Canonical SaaS capability baseline alias for self-service password change."""
    return _do_change_password(body, user, db)
