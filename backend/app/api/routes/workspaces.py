"""Workspace routes - create and list workspaces."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.workspace import Workspace, WorkspaceType
from ..deps import get_current_user
from ...models.user import User

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceCreate(BaseModel):
    name: str
    workspace_type: str  # "launch" | "intelligence"


class WorkspaceOut(BaseModel):
    id: int
    name: str
    workspace_type: str

    class Config:
        from_attributes = True


@router.post("", response_model=WorkspaceOut)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace."""
    try:
        ws_type = WorkspaceType(data.workspace_type)
    except ValueError:
        raise HTTPException(400, detail="workspace_type must be 'launch' or 'intelligence'")
    ws = Workspace(
        name=data.name,
        workspace_type=ws_type,
        owner_id=current_user.id,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceOut(id=ws.id, name=ws.name, workspace_type=ws.workspace_type.value)


@router.get("", response_model=list[WorkspaceOut])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List workspaces for current user."""
    workspaces = db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()
    return [
        WorkspaceOut(id=w.id, name=w.name, workspace_type=w.workspace_type.value)
        for w in workspaces
    ]
