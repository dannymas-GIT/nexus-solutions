"""Workspace routes - create and list workspaces (org-scoped)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.workspace import Workspace, WorkspaceType
from ...models.organization import Organization
from ...models.organization_membership import OrganizationMembership, OrgRole
from ..deps import get_current_user, require_workspace_access
from ...models.user import User

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceCreate(BaseModel):
    name: str
    workspace_type: str  # "launch" | "intelligence"


class WorkspaceOut(BaseModel):
    id: int
    name: str
    workspace_type: str
    organization_id: int

    class Config:
        from_attributes = True


def _org_ids_for_user(db: Session, user_id: int) -> list[int]:
    """Return organization IDs the user is a member of."""
    rows = db.query(OrganizationMembership.organization_id).filter(
        OrganizationMembership.user_id == user_id
    ).distinct().all()
    return [r[0] for r in rows]


@router.post("", response_model=WorkspaceOut)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace. Requires an organization; uses first org user belongs to, or create one."""
    org_ids = _org_ids_for_user(db, current_user.id)
    if not org_ids:
        # Create default organization for user
        org = Organization(name=current_user.full_name or current_user.email.split("@")[0] + "'s Workspace")
        db.add(org)
        db.flush()
        db.add(OrganizationMembership(organization_id=org.id, user_id=current_user.id, role=OrgRole.owner))
        db.flush()
        org_id = org.id
    else:
        org_id = org_ids[0]
    try:
        ws_type = WorkspaceType(data.workspace_type)
    except ValueError:
        raise HTTPException(400, detail="workspace_type must be 'launch' or 'intelligence'")
    ws = Workspace(
        name=data.name,
        workspace_type=ws_type,
        organization_id=org_id,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceOut(id=ws.id, name=ws.name, workspace_type=ws.workspace_type.value, organization_id=ws.organization_id)


@router.get("", response_model=list[WorkspaceOut])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List workspaces for organizations the current user belongs to."""
    org_ids = _org_ids_for_user(db, current_user.id)
    if not org_ids:
        return []
    workspaces = db.query(Workspace).filter(Workspace.organization_id.in_(org_ids)).all()
    return [
        WorkspaceOut(id=w.id, name=w.name, workspace_type=w.workspace_type.value, organization_id=w.organization_id)
        for w in workspaces
    ]


class WorkspaceUpdate(BaseModel):
    name: str | None = None


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
def update_workspace(
    workspace_id: int,
    data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    _ws: Workspace = Depends(require_workspace_access),
):
    """Update workspace (e.g. name). User must have access via org membership."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(404, detail="Workspace not found")
    if data.name is not None:
        ws.name = data.name
    db.commit()
    db.refresh(ws)
    return WorkspaceOut(id=ws.id, name=ws.name, workspace_type=ws.workspace_type.value, organization_id=ws.organization_id)
