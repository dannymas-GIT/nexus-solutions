"""Admin user & role management API (RBAC, protected tiers, soft-deactivate, audited resets)."""
from __future__ import annotations

import json
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ...core.dependencies import (
    ALL_ROLES,
    PROTECTED_ROLES,
    ROLE_CATALOG,
    get_current_admin_user,
    hash_password,
    record_admin_audit,
    serialize_user,
)
from ...db.portal_db import AdminAuditLog, UserAccount, get_db

router = APIRouter(tags=["admin-users"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AdminUserCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str = Field(..., min_length=5, max_length=256)
    full_name: str = Field(..., alias="fullName", min_length=2, max_length=256)
    username: str | None = Field(None, max_length=128)
    organization_name: str = Field("Nexus Workspace", alias="organizationName", max_length=256)
    role: str = Field("viewer", max_length=32)
    temporary_password: str = Field(..., alias="temporaryPassword", min_length=10, max_length=128)


class AdminUserUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str | None = Field(None, alias="fullName", min_length=2, max_length=256)
    organization_name: str | None = Field(None, alias="organizationName", max_length=256)
    role: str | None = Field(None, max_length=32)
    is_active: bool | None = Field(None, alias="isActive")


class AdminPasswordReset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    temporary_password: str = Field(..., alias="temporaryPassword", min_length=10, max_length=128)


def _enforce_role_tier_permission(actor: UserAccount, target_role: str) -> None:
    if target_role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail=f"Unsupported role: {target_role}")
    if target_role in PROTECTED_ROLES and actor.role != "platform_admin":
        raise HTTPException(
            status_code=403,
            detail="Only platform administrators can assign or modify protected platform roles",
        )


def _list_users_impl(search: str, db: Session) -> dict:
    q = db.query(UserAccount).order_by(UserAccount.created_at.desc())
    rows = q.all()
    needle = (search or "").strip().lower()
    if needle:
        rows = [
            u
            for u in rows
            if needle in (u.full_name or "").lower()
            or needle in (u.email or "").lower()
            or needle in (u.username or "").lower()
            or needle in (u.role or "").lower()
        ]
    return {
        "users": [serialize_user(u) for u in rows],
        "total": db.query(UserAccount).count(),
        "filtered": len(rows),
        "roleCatalog": ROLE_CATALOG,
    }


def _create_user_impl(body: AdminUserCreate, actor: UserAccount, db: Session) -> dict:
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    _enforce_role_tier_permission(actor, body.role.strip())

    if db.query(UserAccount).filter(UserAccount.email == email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    raw_un = (body.username or email.split("@", 1)[0]).strip().lower()
    base_un = re.sub(r"[^a-z0-9._-]+", "-", raw_un).strip("-") or "user"
    username = base_un
    suffix = 1
    while db.query(UserAccount).filter(UserAccount.username == username).first():
        suffix += 1
        username = f"{base_un}-{suffix}"

    user = UserAccount(
        id=str(uuid.uuid4()),
        email=email,
        username=username,
        full_name=body.full_name.strip(),
        organization_name=(body.organization_name or actor.organization_name or "Nexus Workspace").strip(),
        role=body.role.strip(),
        password_hash=hash_password(body.temporary_password),
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_admin_audit(
        db,
        actor=actor,
        action="user.create",
        target_user_id=user.id,
        detail={"email": user.email, "role": user.role},
    )
    return {"user": serialize_user(user)}


def _update_user_impl(
    user_id: str, body: AdminUserUpdate, actor: UserAccount, db: Session
) -> dict:
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.role in PROTECTED_ROLES and actor.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform administrators can modify platform admins"
        )

    changes: dict = {}
    if body.full_name is not None:
        target.full_name = body.full_name.strip()
        changes["fullName"] = target.full_name
    if body.organization_name is not None:
        target.organization_name = body.organization_name.strip() or "Nexus Workspace"
        changes["organizationName"] = target.organization_name
    if body.role is not None:
        new_role = body.role.strip()
        _enforce_role_tier_permission(actor, new_role)
        if target.id == actor.id and new_role != actor.role:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        if new_role != target.role:
            changes["role"] = {"from": target.role, "to": new_role}
            target.role = new_role
    if body.is_active is not None:
        if target.id == actor.id and not body.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        if bool(body.is_active) != bool(target.is_active):
            changes["isActive"] = {"from": bool(target.is_active), "to": bool(body.is_active)}
            target.is_active = bool(body.is_active)

    db.add(target)
    db.commit()
    db.refresh(target)

    if changes:
        action = "user.deactivate" if changes.get("isActive", {}).get("to") is False else "user.update"
        record_admin_audit(
            db, actor=actor, action=action, target_user_id=target.id, detail=changes
        )

    return {"user": serialize_user(target)}


def _reset_password_impl(
    user_id: str, body: AdminPasswordReset, actor: UserAccount, db: Session
) -> dict:
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role in PROTECTED_ROLES and actor.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform administrators can reset a platform admin password"
        )

    target.password_hash = hash_password(body.temporary_password)
    target.must_change_password = True
    db.add(target)
    db.commit()

    # Never log the password value in audit logs.
    record_admin_audit(
        db,
        actor=actor,
        action="user.password_reset",
        target_user_id=target.id,
        detail={"targetEmail": target.email, "mustChangePassword": True},
    )
    return {"ok": True, "message": f"Temporary password set for {target.email}."}


def _list_audit_impl(limit: int, db: Session) -> dict:
    capped = max(1, min(limit, 200))
    rows = (
        db.query(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
        .limit(capped)
        .all()
    )
    items = []
    for r in rows:
        try:
            detail = json.loads(r.detail_json or "{}")
        except json.JSONDecodeError:
            detail = {}
        items.append(
            {
                "id": r.id,
                "actorUserId": r.actor_user_id,
                "actorEmail": r.actor_email,
                "action": r.action,
                "targetUserId": r.target_user_id,
                "detail": detail,
                "createdAt": r.created_at.isoformat() + "Z" if r.created_at else None,
            }
        )
    return {"logs": items}


# Mount canonical /api/admin/users/* routes (matches saas-capability-baseline.yaml probes)
@router.get("/admin/users")
def list_users_canonical(
    search: str = Query(""),
    _: UserAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return _list_users_impl(search, db)


@router.post("/admin/users", status_code=201)
def create_user_canonical(
    body: AdminUserCreate,
    actor: UserAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return _create_user_impl(body, actor, db)


@router.patch("/admin/users/{user_id}")
def update_user_canonical(
    user_id: str,
    body: AdminUserUpdate,
    actor: UserAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return _update_user_impl(user_id, body, actor, db)


@router.post("/admin/users/{user_id}/reset-password")
def reset_password_canonical(
    user_id: str,
    body: AdminPasswordReset,
    actor: UserAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return _reset_password_impl(user_id, body, actor, db)


@router.get("/admin/audit-logs")
def list_audit_logs_canonical(
    limit: int = 50,
    _: UserAccount = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return _list_audit_impl(limit, db)
