"""Organization routes - list orgs, get current org, members (for team management)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.organization import Organization
from ...models.organization_membership import OrganizationMembership, OrgRole
from ...models.user import User
from ..deps import get_current_user, get_current_organization_optional, get_current_organization

router = APIRouter(prefix="/organizations", tags=["organizations"])


class OrganizationOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class MemberOut(BaseModel):
    user_id: int
    email: str
    full_name: str | None
    role: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List organizations the current user belongs to."""
    memberships = db.query(OrganizationMembership).filter(
        OrganizationMembership.user_id == current_user.id
    ).all()
    org_ids = [m.organization_id for m in memberships]
    if not org_ids:
        return []
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return [OrganizationOut(id=o.id, name=o.name) for o in orgs]


@router.get("/current", response_model=OrganizationOut)
def get_current_org(
    org: Organization = Depends(get_current_organization),
):
    """Return the current user's first organization (for session/context)."""
    return OrganizationOut(id=org.id, name=org.name)


@router.get("/{org_id}/members", response_model=list[MemberOut])
def list_members(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List members of an organization. Caller must be a member."""
    membership = db.query(OrganizationMembership).filter(
        OrganizationMembership.organization_id == org_id,
        OrganizationMembership.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    memberships = db.query(OrganizationMembership).filter(
        OrganizationMembership.organization_id == org_id
    ).all()
    out = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            out.append(MemberOut(
                user_id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=m.role.value,
            ))
    return out
