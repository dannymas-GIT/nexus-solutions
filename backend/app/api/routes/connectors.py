"""Connector routes - data source connections for Nexus Intelligence."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.connector import Connector
from ...models.workspace import Workspace
from ..deps import get_current_user_optional, get_password_hash
from ...models.user import User

router = APIRouter(prefix="/connectors", tags=["connectors"])


def _ensure_default_workspace(db: Session) -> int:
    """Ensure default workspace exists; return its id."""
    from ...models.workspace import WorkspaceType
    ws = db.query(Workspace).filter(Workspace.id == 1).first()
    if ws:
        return 1
    user = db.query(User).first()
    if not user:
        user = User(
            email="demo@nexus.local",
            hashed_password="dummy",
            full_name="Demo User",
            is_active=True,
            is_superuser=False,
        )
        user.hashed_password = get_password_hash("demo123")
        db.add(user)
        db.commit()
        db.refresh(user)
    ws = Workspace(name="Default Intelligence", workspace_type=WorkspaceType.intelligence, owner_id=user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws.id


class ConnectorCreate(BaseModel):
    name: str
    connector_type: str  # crm, erp, spreadsheet, accounting, analytics


class ConnectorOut(BaseModel):
    id: int
    name: str
    connector_type: str
    status: str
    last_sync_at: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=list[ConnectorOut])
def list_connectors(
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """List connectors. For MVP: use default workspace if none specified."""
    wid = workspace_id or _ensure_default_workspace(db)
    connectors = db.query(Connector).filter(Connector.workspace_id == wid).all()
    return [
        ConnectorOut(
            id=c.id,
            name=c.name,
            connector_type=c.connector_type,
            status=c.status,
            last_sync_at=c.last_sync_at.isoformat() if c.last_sync_at else None,
        )
        for c in connectors
    ]


@router.post("", response_model=ConnectorOut)
def create_connector(
    data: ConnectorCreate,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Create a connector. For MVP: use default workspace if none specified."""
    wid = workspace_id or _ensure_default_workspace(db)
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(404, detail="Workspace not found")
    conn = Connector(
        workspace_id=wid,
        name=data.name,
        connector_type=data.connector_type,
        status="pending",
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return ConnectorOut(
        id=conn.id,
        name=conn.name,
        connector_type=conn.connector_type,
        status=conn.status,
        last_sync_at=None,
    )
