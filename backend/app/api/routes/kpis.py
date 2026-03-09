"""KPI routes - define and list KPIs for Nexus Intelligence (workspace-scoped, auth required)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...models.kpi import Kpi
from ...models.workspace import Workspace
from ..deps import get_current_user, require_workspace_access

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


@router.get("", response_model=list[KpiOut])
def list_kpis(
    workspace_id: int,
    db: Session = Depends(get_db),
    _ws: Workspace = Depends(require_workspace_access),
):
    """List KPIs for the given workspace. User must have access via org membership."""
    kpis = db.query(Kpi).filter(Kpi.workspace_id == workspace_id).all()
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
    workspace_id: int,
    db: Session = Depends(get_db),
    _ws: Workspace = Depends(require_workspace_access),
):
    """Create a KPI in the given workspace. User must have access via org membership."""
    kpi = Kpi(
        workspace_id=workspace_id,
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
