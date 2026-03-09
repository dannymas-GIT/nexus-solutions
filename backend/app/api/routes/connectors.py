"""Connector routes - data source connections for Nexus Intelligence (workspace-scoped, auth required)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.connector import Connector
from ...models.workspace import Workspace
from ..deps import require_workspace_access

router = APIRouter(prefix="/connectors", tags=["connectors"])


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
    workspace_id: int,
    db: Session = Depends(get_db),
    _ws: Workspace = Depends(require_workspace_access),
):
    """List connectors for the given workspace. User must have access via org membership."""
    connectors = db.query(Connector).filter(Connector.workspace_id == workspace_id).all()
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
    workspace_id: int,
    db: Session = Depends(get_db),
    _ws: Workspace = Depends(require_workspace_access),
):
    """Create a connector in the given workspace. User must have access via org membership."""
    conn = Connector(
        workspace_id=workspace_id,
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
        last_sync_at=conn.last_sync_at.isoformat() if conn.last_sync_at else None,
    )
