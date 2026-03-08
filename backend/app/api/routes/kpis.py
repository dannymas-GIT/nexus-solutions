"""KPI routes - define and list KPIs for Nexus Intelligence."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.kpi import Kpi
from ...models.workspace import Workspace
from ..deps import get_current_user_optional
from ...models.user import User

router = APIRouter(prefix="/kpis", tags=["kpis"])


class KpiCreate(BaseModel):
    name: str
    metric_key: str
    target_value: float | None = None
    unit: str = ""
    description: str | None = None


class KpiOut(BaseModel):
    id: int
    name: str
    metric_key: str
    target_value: float | None
    unit: str | None
    description: str | None

    class Config:
        from_attributes = True


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
        from ..deps import get_password_hash
        user.hashed_password = get_password_hash("demo123")
        db.add(user)
        db.commit()
        db.refresh(user)
    ws = Workspace(name="Default Intelligence", workspace_type=WorkspaceType.intelligence, owner_id=user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws.id


@router.get("", response_model=list[KpiOut])
def list_kpis(
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """List KPIs. For MVP: use default workspace if none specified."""
    wid = workspace_id or _ensure_default_workspace(db)
    kpis = db.query(Kpi).filter(Kpi.workspace_id == wid).all()
    return [
        KpiOut(
            id=k.id,
            name=k.name,
            metric_key=k.metric_key,
            target_value=k.target_value,
            unit=k.unit,
            description=k.description,
        )
        for k in kpis
    ]


@router.post("", response_model=KpiOut)
def create_kpi(
    data: KpiCreate,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Create a KPI. For MVP: use default workspace if none specified."""
    wid = workspace_id or _ensure_default_workspace(db)
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(404, detail="Workspace not found")
    kpi = Kpi(
        workspace_id=wid,
        name=data.name,
        metric_key=data.metric_key,
        target_value=data.target_value,
        unit=data.unit or "",
        description=data.description,
    )
    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    return KpiOut(
        id=kpi.id,
        name=kpi.name,
        metric_key=kpi.metric_key,
        target_value=kpi.target_value,
        unit=kpi.unit,
        description=kpi.description,
    )
