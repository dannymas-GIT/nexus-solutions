"""Phase 2 Data Convergence Engine — CSV ingestion, Corporate KPI CRUD, Report Studio & Portal publish."""
from __future__ import annotations

import csv
import html
import io
import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from docx import Document as DocxDocument
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pptx import Presentation
from pptx.util import Inches, Pt
from pydantic import BaseModel, ConfigDict, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from ...db.portal_db import (
    DataSourceSnapshot,
    ExecutiveReport,
    KpiMetric,
    PortalDeliverable,
    get_db,
)
from .portal import _bundle_root, _require_api_key, create_magic_link_for_deliverable

router = APIRouter(prefix="/convergence", tags=["convergence"])

MAX_CSV_BYTES = 5 * 1024 * 1024
ALLOWED_AGGREGATIONS = {"manual", "sum", "avg", "min", "max", "count"}
ALLOWED_DIRECTIONS = {"higher_is_better", "lower_is_better"}

CORPORATE_KPI_TEMPLATES: List[Dict[str, Any]] = [
    {
        "key": "monthly-revenue",
        "name": "Monthly Recurring Revenue (MRR)",
        "category": "Revenue",
        "unit": "USD",
        "direction": "higher_is_better",
        "defaultTarget": 125000,
        "description": "Recognized recurring monthly revenue across active accounts.",
    },
    {
        "key": "gross-margin",
        "name": "Gross Margin",
        "category": "Margin",
        "unit": "%",
        "direction": "higher_is_better",
        "defaultTarget": 68,
        "description": "Gross profit as a percentage of net revenue after delivery cost.",
    },
    {
        "key": "dso-days",
        "name": "Days Sales Outstanding (DSO)",
        "category": "Cash & Finance",
        "unit": "Days",
        "direction": "lower_is_better",
        "defaultTarget": 35,
        "description": "Average number of days required to collect accounts receivable.",
    },
    {
        "key": "pipeline-conversion",
        "name": "Pipeline Conversion Rate",
        "category": "Pipeline",
        "unit": "%",
        "direction": "higher_is_better",
        "defaultTarget": 28,
        "description": "Percentage of qualified enterprise opportunities closing won.",
    },
    {
        "key": "team-utilization",
        "name": "Delivery Team Utilization",
        "category": "Operations",
        "unit": "%",
        "direction": "higher_is_better",
        "defaultTarget": 78,
        "description": "Billable or value-delivery hours divided by total available hours.",
    },
    {
        "key": "net-retention",
        "name": "Net Revenue Retention (NRR)",
        "category": "Revenue",
        "unit": "%",
        "direction": "higher_is_better",
        "defaultTarget": 110,
        "description": "Expansion plus renewals minus churn across existing customer cohorts.",
    },
]


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _parse_number(raw: Any) -> Optional[float]:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    cleaned = text.replace(",", "").replace("$", "").replace("%", "").strip()
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = "-" + cleaned[1:-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def _profile_csv_bytes(raw: bytes) -> tuple[int, List[Dict[str, Any]], List[Dict[str, str]]]:
    try:
        decoded = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = raw.decode("latin-1", errors="replace")

    reader = csv.DictReader(io.StringIO(decoded))
    fieldnames = [f.strip() for f in (reader.fieldnames or []) if f and f.strip()]
    if not fieldnames:
        raise HTTPException(status_code=400, detail="CSV file must contain a header row")

    rows: List[Dict[str, str]] = []
    numeric_buckets: Dict[str, List[float]] = {col: [] for col in fieldnames}

    for row in reader:
        normalized = {col: (row.get(col) or "").strip() for col in fieldnames}
        if not any(normalized.values()):
            continue
        rows.append(normalized)
        for col in fieldnames:
            val = _parse_number(normalized[col])
            if val is not None:
                numeric_buckets[col].append(val)

    columns: List[Dict[str, Any]] = []
    for col in fieldnames:
        nums = numeric_buckets[col]
        is_numeric = len(nums) > 0 and (len(nums) / max(len(rows), 1)) >= 0.5
        col_info: Dict[str, Any] = {
            "name": col,
            "type": "number" if is_numeric else "text",
            "nonEmptyCount": sum(1 for r in rows if r.get(col)),
        }
        if is_numeric:
            col_info["stats"] = {
                "sum": round(sum(nums), 4),
                "avg": round(sum(nums) / len(nums), 4),
                "min": round(min(nums), 4),
                "max": round(max(nums), 4),
                "count": len(nums),
            }
        columns.append(col_info)

    return len(rows), columns, rows[:20]


def _compute_kpi_attainment(kpi: KpiMetric) -> tuple[float, str]:
    target = float(kpi.target_value or 0.0)
    actual = float(kpi.actual_value or 0.0)
    direction = (kpi.direction or "higher_is_better").strip()
    if target == 0:
        return 0.0, "tracking"
    if direction == "lower_is_better":
        if actual <= 0:
            pct = 100.0
        else:
            pct = round((target / actual) * 100.0, 1)
    else:
        pct = round((actual / target) * 100.0, 1)

    if pct >= 95.0:
        status = "on_track"
    elif pct >= 75.0:
        status = "at_risk"
    else:
        status = "off_track"
    return pct, status


def _format_metric_value(value: float, unit: str) -> str:
    if unit == "USD":
        return f"${value:,.2f}" if abs(value) < 1000 else f"${value:,.0f}"
    if unit == "%":
        return f"{value:.1f}%"
    if unit == "Days":
        return f"{value:.1f} days"
    return f"{value:,.2f}" if value % 1 else f"{int(value):,}"


def _serialize_source(src: DataSourceSnapshot) -> Dict[str, Any]:
    try:
        cols = json.loads(src.columns_json or "[]")
    except json.JSONDecodeError:
        cols = []
    try:
        sample = json.loads(src.sample_rows_json or "[]")
    except json.JSONDecodeError:
        sample = []
    try:
        cfg = json.loads(src.config_json or "{}")
    except json.JSONDecodeError:
        cfg = {}
    return {
        "id": src.id,
        "name": src.name,
        "sourceType": src.source_type,
        "category": src.category,
        "status": src.status,
        "filename": src.filename,
        "rowCount": src.row_count or 0,
        "columns": cols,
        "sampleRows": sample,
        "config": cfg,
        "lastSyncedAt": src.last_synced_at.isoformat() + "Z" if src.last_synced_at else None,
        "createdAt": src.created_at.isoformat() + "Z" if src.created_at else None,
    }


def _serialize_kpi(kpi: KpiMetric, source_names: Dict[str, str]) -> Dict[str, Any]:
    pct, status = _compute_kpi_attainment(kpi)
    return {
        "id": kpi.id,
        "name": kpi.name,
        "category": kpi.category,
        "description": kpi.description or "",
        "unit": kpi.unit or "USD",
        "direction": kpi.direction or "higher_is_better",
        "targetValue": float(kpi.target_value or 0.0),
        "actualValue": float(kpi.actual_value or 0.0),
        "formattedActual": _format_metric_value(float(kpi.actual_value or 0.0), kpi.unit or "USD"),
        "formattedTarget": _format_metric_value(float(kpi.target_value or 0.0), kpi.unit or "USD"),
        "attainmentPct": pct,
        "status": status,
        "sourceId": kpi.source_id,
        "sourceName": source_names.get(kpi.source_id or "", None),
        "sourceColumn": kpi.source_column,
        "aggregation": kpi.aggregation or "manual",
        "updatedAt": kpi.updated_at.isoformat() + "Z" if kpi.updated_at else None,
    }


def _compute_value_from_source(
    source: DataSourceSnapshot, column_name: str, aggregation: str
) -> float:
    try:
        cols = json.loads(source.columns_json or "[]")
    except json.JSONDecodeError:
        cols = []
    match = next((c for c in cols if c.get("name") == column_name), None)
    if not match:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{column_name}' not found in data source '{source.name}'",
        )
    if aggregation == "count":
        return float(match.get("nonEmptyCount", source.row_count or 0))
    stats = match.get("stats")
    if not isinstance(stats, dict) or aggregation not in stats:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{column_name}' is not numeric; choose 'count' or a numeric column",
        )
    return float(stats[aggregation])


def _recompute_kpis_for_source(source: DataSourceSnapshot, db: Session) -> None:
    bound = db.query(KpiMetric).filter(KpiMetric.source_id == source.id).all()
    for kpi in bound:
        if kpi.source_column and kpi.aggregation in ("sum", "avg", "min", "max", "count"):
            try:
                kpi.actual_value = _compute_value_from_source(
                    source, kpi.source_column, kpi.aggregation
                )
                db.add(kpi)
            except HTTPException:
                continue
    if bound:
        db.commit()


class DataSourceCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=256)
    source_type: str = Field("custom", alias="sourceType", max_length=64)
    category: str = Field("Operations", max_length=64)
    notes: str = Field("", max_length=1000)


class KpiCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=256)
    category: str = Field("Revenue", max_length=64)
    description: str = Field("", max_length=1000)
    unit: str = Field("USD", max_length=32)
    direction: str = Field("higher_is_better", max_length=16)
    target_value: float = Field(..., alias="targetValue")
    actual_value: float = Field(0.0, alias="actualValue")
    source_id: Optional[str] = Field(None, alias="sourceId")
    source_column: Optional[str] = Field(None, alias="sourceColumn")
    aggregation: str = Field("manual", max_length=32)


class KpiUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(None, min_length=2, max_length=256)
    category: Optional[str] = Field(None, max_length=64)
    description: Optional[str] = Field(None, max_length=1000)
    unit: Optional[str] = Field(None, max_length=32)
    direction: Optional[str] = Field(None, max_length=16)
    target_value: Optional[float] = Field(None, alias="targetValue")
    actual_value: Optional[float] = Field(None, alias="actualValue")
    source_id: Optional[str] = Field(None, alias="sourceId")
    source_column: Optional[str] = Field(None, alias="sourceColumn")
    aggregation: Optional[str] = Field(None, max_length=32)


class ReportCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=2, max_length=512)
    company_name: str = Field("", alias="companyName", max_length=256)
    period_label: str = Field("", alias="periodLabel", max_length=128)
    executive_summary: str = Field("", alias="executiveSummary", max_length=8000)
    kpi_ids: List[str] = Field(default_factory=list, alias="kpiIds")
    source_ids: List[str] = Field(default_factory=list, alias="sourceIds")


class PublishPortalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    client_email: str = Field(..., alias="clientEmail", min_length=5, max_length=256)
    expires_in_days: int = Field(14, alias="expiresInDays", ge=1, le=90)
    send_email: bool = Field(False, alias="sendEmail")


@router.get("/overview")
def convergence_overview(db: Session = Depends(get_db)):
    sources = db.query(DataSourceSnapshot).all()
    kpis = db.query(KpiMetric).all()
    reports = db.query(ExecutiveReport).all()
    source_names = {s.id: s.name for s in sources}
    serialized_kpis = [_serialize_kpi(k, source_names) for k in kpis]

    on_track = sum(1 for k in serialized_kpis if k["status"] == "on_track")
    at_risk = sum(1 for k in serialized_kpis if k["status"] == "at_risk")
    off_track = sum(1 for k in serialized_kpis if k["status"] == "off_track")
    published_reports = sum(1 for r in reports if r.portal_deliverable_id)

    return {
        "sourceCount": len(sources),
        "totalRowsIngested": sum(int(s.row_count or 0) for s in sources),
        "kpiCount": len(serialized_kpis),
        "kpisOnTrack": on_track,
        "kpisAtRisk": at_risk,
        "kpisOffTrack": off_track,
        "reportCount": len(reports),
        "publishedPortalCount": published_reports,
        "kpis": serialized_kpis[:8],
    }


@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    rows = (
        db.query(DataSourceSnapshot)
        .order_by(DataSourceSnapshot.created_at.desc())
        .all()
    )
    return {"sources": [_serialize_source(r) for r in rows]}


@router.post("/sources/upload-csv", status_code=201)
async def upload_csv_source(
    file: UploadFile = File(...),
    name: str = Form(""),
    category: str = Form("Operations"),
    db: Session = Depends(get_db),
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="CSV exceeds 5 MB upload limit")

    row_count, columns, sample_rows = _profile_csv_bytes(raw)
    clean_name = (name or Path(file.filename or "Uploaded Dataset").stem).strip()[:256]

    src = DataSourceSnapshot(
        id=str(uuid.uuid4()),
        name=clean_name or "Uploaded Dataset",
        source_type="csv",
        category=(category or "Operations").strip()[:64],
        status="synced",
        filename=(file.filename or "dataset.csv")[:512],
        row_count=row_count,
        columns_json=json.dumps(columns),
        sample_rows_json=json.dumps(sample_rows),
        config_json=json.dumps({"format": "csv"}),
        last_synced_at=_utc_now_naive(),
    )
    db.add(src)
    db.commit()
    db.refresh(src)
    _recompute_kpis_for_source(src, db)
    return {"source": _serialize_source(src)}


@router.post("/sources", status_code=201)
def register_connector_source(body: DataSourceCreate, db: Session = Depends(get_db)):
    src = DataSourceSnapshot(
        id=str(uuid.uuid4()),
        name=body.name.strip(),
        source_type=body.source_type.strip()[:64],
        category=body.category.strip()[:64],
        status="configured",
        filename="",
        row_count=0,
        columns_json="[]",
        sample_rows_json="[]",
        config_json=json.dumps({"notes": body.notes.strip()}),
        last_synced_at=_utc_now_naive(),
    )
    db.add(src)
    db.commit()
    db.refresh(src)
    return {"source": _serialize_source(src)}


@router.delete("/sources/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db)):
    src = db.query(DataSourceSnapshot).filter(DataSourceSnapshot.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Data source not found")
    bound = db.query(KpiMetric).filter(KpiMetric.source_id == source_id).all()
    for kpi in bound:
        kpi.source_id = None
        kpi.source_column = None
        kpi.aggregation = "manual"
        db.add(kpi)
    db.delete(src)
    db.commit()
    return {"ok": True}


@router.get("/kpi-templates")
def list_kpi_templates():
    return {"templates": CORPORATE_KPI_TEMPLATES}


@router.get("/kpis")
def list_kpis(db: Session = Depends(get_db)):
    sources = {s.id: s.name for s in db.query(DataSourceSnapshot).all()}
    rows = db.query(KpiMetric).order_by(KpiMetric.created_at.desc()).all()
    return {"kpis": [_serialize_kpi(k, sources) for k in rows]}


@router.post("/kpis", status_code=201)
def create_kpi(body: KpiCreate, db: Session = Depends(get_db)):
    agg = (body.aggregation or "manual").strip().lower()
    if agg not in ALLOWED_AGGREGATIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported aggregation: {agg}")
    direction = (body.direction or "higher_is_better").strip()
    if direction not in ALLOWED_DIRECTIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported direction: {direction}")

    actual = float(body.actual_value)
    source_id = body.source_id.strip() if body.source_id else None
    source_col = body.source_column.strip() if body.source_column else None
    source_names: Dict[str, str] = {}

    if source_id and source_col and agg != "manual":
        src = db.query(DataSourceSnapshot).filter(DataSourceSnapshot.id == source_id).first()
        if not src:
            raise HTTPException(status_code=404, detail="Bound data source not found")
        actual = _compute_value_from_source(src, source_col, agg)
        source_names[src.id] = src.name
    elif source_id:
        src = db.query(DataSourceSnapshot).filter(DataSourceSnapshot.id == source_id).first()
        if src:
            source_names[src.id] = src.name

    kpi = KpiMetric(
        id=str(uuid.uuid4()),
        name=body.name.strip(),
        category=body.category.strip(),
        description=body.description.strip(),
        unit=body.unit.strip() or "USD",
        direction=direction,
        target_value=float(body.target_value),
        actual_value=actual,
        source_id=source_id,
        source_column=source_col,
        aggregation=agg,
    )
    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    return {"kpi": _serialize_kpi(kpi, source_names)}


@router.patch("/kpis/{kpi_id}")
def update_kpi(kpi_id: str, body: KpiUpdate, db: Session = Depends(get_db)):
    kpi = db.query(KpiMetric).filter(KpiMetric.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    if body.name is not None:
        kpi.name = body.name.strip()
    if body.category is not None:
        kpi.category = body.category.strip()
    if body.description is not None:
        kpi.description = body.description.strip()
    if body.unit is not None:
        kpi.unit = body.unit.strip()
    if body.direction is not None:
        if body.direction not in ALLOWED_DIRECTIONS:
            raise HTTPException(status_code=400, detail="Unsupported direction")
        kpi.direction = body.direction
    if body.target_value is not None:
        kpi.target_value = float(body.target_value)
    if body.aggregation is not None:
        agg = body.aggregation.strip().lower()
        if agg not in ALLOWED_AGGREGATIONS:
            raise HTTPException(status_code=400, detail="Unsupported aggregation")
        kpi.aggregation = agg
    if body.source_id is not None:
        kpi.source_id = body.source_id.strip() or None
    if body.source_column is not None:
        kpi.source_column = body.source_column.strip() or None

    if kpi.source_id and kpi.source_column and kpi.aggregation != "manual":
        src = db.query(DataSourceSnapshot).filter(DataSourceSnapshot.id == kpi.source_id).first()
        if not src:
            raise HTTPException(status_code=404, detail="Bound data source not found")
        kpi.actual_value = _compute_value_from_source(src, kpi.source_column, kpi.aggregation)
    elif body.actual_value is not None:
        kpi.actual_value = float(body.actual_value)

    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    sources = {s.id: s.name for s in db.query(DataSourceSnapshot).all()}
    return {"kpi": _serialize_kpi(kpi, sources)}


@router.delete("/kpis/{kpi_id}")
def delete_kpi(kpi_id: str, db: Session = Depends(get_db)):
    kpi = db.query(KpiMetric).filter(KpiMetric.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    db.delete(kpi)
    db.commit()
    return {"ok": True}


def _resolve_report_context(
    report: ExecutiveReport, db: Session
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    sources_all = db.query(DataSourceSnapshot).all()
    source_names = {s.id: s.name for s in sources_all}
    try:
        wanted_kpi_ids = json.loads(report.kpi_ids_json or "[]")
    except json.JSONDecodeError:
        wanted_kpi_ids = []
    try:
        wanted_source_ids = json.loads(report.source_ids_json or "[]")
    except json.JSONDecodeError:
        wanted_source_ids = []

    kpi_query = db.query(KpiMetric)
    if wanted_kpi_ids:
        kpi_rows = kpi_query.filter(KpiMetric.id.in_(wanted_kpi_ids)).all()
    else:
        kpi_rows = kpi_query.order_by(KpiMetric.created_at.desc()).all()

    if wanted_source_ids:
        src_rows = [s for s in sources_all if s.id in wanted_source_ids]
    else:
        src_rows = sources_all

    return (
        [_serialize_kpi(k, source_names) for k in kpi_rows],
        [_serialize_source(s) for s in src_rows],
    )


def _serialize_report(report: ExecutiveReport, db: Session) -> Dict[str, Any]:
    kpis, sources = _resolve_report_context(report, db)
    return {
        "id": report.id,
        "title": report.title,
        "companyName": report.company_name or "",
        "periodLabel": report.period_label or "",
        "executiveSummary": report.executive_summary or "",
        "kpiCount": len(kpis),
        "sourceCount": len(sources),
        "kpis": kpis,
        "sources": [{"id": s["id"], "name": s["name"], "rowCount": s["rowCount"]} for s in sources],
        "portalDeliverableId": report.portal_deliverable_id,
        "portalMagicLinkUrl": report.portal_magic_link_url,
        "createdAt": report.created_at.isoformat() + "Z" if report.created_at else None,
        "updatedAt": report.updated_at.isoformat() + "Z" if report.updated_at else None,
    }


def _render_report_pdf(
    report: ExecutiveReport, kpis: List[Dict[str, Any]], sources: List[Dict[str, Any]]
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=48, bottomMargin=48)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "NexusTitle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "NexusSub",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14,
    )
    body_style = ParagraphStyle(
        "NexusBody",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
    )

    story = [
        Paragraph(html.escape(report.title), title_style),
        Paragraph(
            html.escape(
                " · ".join(
                    p for p in [report.company_name or "Nexus Solutions", report.period_label] if p
                )
            ),
            subtitle_style,
        ),
    ]
    if report.executive_summary:
        story.append(Paragraph("Executive Summary", styles["Heading2"]))
        story.append(Paragraph(html.escape(report.executive_summary).replace("\n", "<br/>"), body_style))
        story.append(Spacer(1, 14))

    story.append(Paragraph("KPI Performance Scorecard", styles["Heading2"]))
    if kpis:
        table_data = [["Metric", "Category", "Actual", "Target", "Attainment", "Status"]]
        for k in kpis:
            table_data.append(
                [
                    k["name"],
                    k["category"],
                    k["formattedActual"],
                    k["formattedTarget"],
                    f"{k['attainmentPct']}%",
                    k["status"].replace("_", " ").title(),
                ]
            )
        tbl = Table(table_data, repeatRows=1)
        tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(tbl)
    else:
        story.append(Paragraph("No KPIs attached to this report yet.", body_style))

    story.append(Spacer(1, 16))
    story.append(Paragraph("Converged Data Sources", styles["Heading2"]))
    if sources:
        for s in sources:
            story.append(
                Paragraph(
                    f"• <b>{html.escape(s['name'])}</b> ({html.escape(s['sourceType'].upper())}) — "
                    f"{s['rowCount']} rows ingested",
                    body_style,
                )
            )
    else:
        story.append(Paragraph("Manual KPI entries (no CSV datasets attached).", body_style))

    doc.build(story)
    return buf.getvalue()


def _render_report_docx(
    report: ExecutiveReport, kpis: List[Dict[str, Any]], sources: List[Dict[str, Any]]
) -> bytes:
    doc = DocxDocument()
    doc.add_heading(report.title, level=0)
    subtitle = " · ".join(
        p for p in [report.company_name or "Nexus Solutions", report.period_label] if p
    )
    if subtitle:
        doc.add_paragraph(subtitle)

    if report.executive_summary:
        doc.add_heading("Executive Summary", level=1)
        doc.add_paragraph(report.executive_summary)

    doc.add_heading("KPI Performance Scorecard", level=1)
    if kpis:
        table = doc.add_table(rows=1, cols=6)
        table.style = "Table Grid"
        headers = ["Metric", "Category", "Actual", "Target", "Attainment", "Status"]
        for i, h in enumerate(headers):
            table.rows[0].cells[i].text = h
        for k in kpis:
            row = table.add_row().cells
            row[0].text = k["name"]
            row[1].text = k["category"]
            row[2].text = k["formattedActual"]
            row[3].text = k["formattedTarget"]
            row[4].text = f"{k['attainmentPct']}%"
            row[5].text = k["status"].replace("_", " ").title()
    else:
        doc.add_paragraph("No KPIs attached to this report yet.")

    doc.add_heading("Converged Data Sources", level=1)
    if sources:
        for s in sources:
            doc.add_paragraph(
                f"{s['name']} ({s['sourceType'].upper()}) — {s['rowCount']} rows",
                style="List Bullet",
            )
    else:
        doc.add_paragraph("Manual KPI entries.")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _render_report_pptx(
    report: ExecutiveReport, kpis: List[Dict[str, Any]], sources: List[Dict[str, Any]]
) -> bytes:
    prs = Presentation()
    title_slide = prs.slides.add_slide(prs.slide_layouts[0])
    title_slide.shapes.title.text = report.title
    subtitle = " · ".join(
        p for p in [report.company_name or "Nexus Solutions", report.period_label] if p
    )
    title_slide.placeholders[1].text = subtitle or "Executive Data Convergence Report"

    if report.executive_summary:
        s2 = prs.slides.add_slide(prs.slide_layouts[1])
        s2.shapes.title.text = "Executive Summary"
        s2.placeholders[1].text = report.executive_summary

    s3 = prs.slides.add_slide(prs.slide_layouts[5])
    s3.shapes.title.text = "KPI Performance Scorecard"
    rows = max(2, len(kpis) + 1)
    tbl_shape = s3.shapes.add_table(rows, 5, Inches(0.5), Inches(1.4), Inches(9.0), Inches(4.5))
    tbl = tbl_shape.table
    for i, h in enumerate(["Metric", "Actual", "Target", "Attainment", "Status"]):
        cell = tbl.cell(0, i)
        cell.text = h
        for p in cell.text_frame.paragraphs:
            p.font.bold = True
            p.font.size = Pt(12)
    if kpis:
        for r_idx, k in enumerate(kpis, start=1):
            vals = [
                k["name"],
                k["formattedActual"],
                k["formattedTarget"],
                f"{k['attainmentPct']}%",
                k["status"].replace("_", " ").title(),
            ]
            for c_idx, v in enumerate(vals):
                cell = tbl.cell(r_idx, c_idx)
                cell.text = v
                for p in cell.text_frame.paragraphs:
                    p.font.size = Pt(11)
    else:
        tbl.cell(1, 0).text = "No KPIs attached"

    if sources:
        s4 = prs.slides.add_slide(prs.slide_layouts[1])
        s4.shapes.title.text = "Converged Data Sources"
        s4.placeholders[1].text = "\n".join(
            f"• {s['name']} ({s['sourceType'].upper()}): {s['rowCount']} rows" for s in sources
        )

    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()


def _render_portal_html(
    report: ExecutiveReport, kpis: List[Dict[str, Any]], sources: List[Dict[str, Any]]
) -> str:
    kpi_cards = ""
    for k in kpis:
        badge_bg = (
            "#dcfce7;color:#14532d"
            if k["status"] == "on_track"
            else "#fef3c7;color:#78350f"
            if k["status"] == "at_risk"
            else "#fee2e2;color:#7f1d1d"
        )
        kpi_cards += (
            f"<tr>"
            f"<td><strong>{html.escape(k['name'])}</strong><div style='color:#475569;font-size:13px'>{html.escape(k['category'])}</div></td>"
            f"<td><strong>{html.escape(k['formattedActual'])}</strong></td>"
            f"<td>{html.escape(k['formattedTarget'])}</td>"
            f"<td>{k['attainmentPct']}%</td>"
            f"<td><span style='display:inline-block;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600;background:{badge_bg}'>"
            f"{html.escape(k['status'].replace('_', ' ').title())}</span></td>"
            f"</tr>"
        )
    if not kpi_cards:
        kpi_cards = "<tr><td colspan='5'>No KPIs attached to this report.</td></tr>"

    source_items = "".join(
        f"<li><strong>{html.escape(s['name'])}</strong> ({html.escape(s['sourceType'].upper())}) — {s['rowCount']} rows</li>"
        for s in sources
    ) or "<li>Manual KPI entries</li>"

    subtitle = " · ".join(
        p for p in [report.company_name or "Nexus Solutions", report.period_label] if p
    )
    summary_html = html.escape(report.executive_summary or "").replace("\n", "<br/>")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(report.title)}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 28px; background: #f8fafc; color: #0f172a; line-height: 1.55; }}
  .wrap {{ max-width: 920px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px; }}
  h1 {{ margin: 0 0 6px; font-size: 28px; }}
  .sub {{ color: #475569; margin: 0 0 24px; font-size: 16px; }}
  h2 {{ margin: 28px 0 12px; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px; }}
  th, td {{ text-align: left; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }}
  th {{ background: #0f172a; color: #ffffff; font-weight: 600; }}
</style>
</head>
<body>
  <div class="wrap">
    <h1>{html.escape(report.title)}</h1>
    <p class="sub">{html.escape(subtitle)}</p>
    {"<h2>Executive Summary</h2><p>" + summary_html + "</p>" if summary_html else ""}
    <h2>KPI Performance Scorecard</h2>
    <table>
      <thead><tr><th>Metric</th><th>Actual</th><th>Target</th><th>Attainment</th><th>Status</th></tr></thead>
      <tbody>{kpi_cards}</tbody>
    </table>
    <h2>Converged Data Sources</h2>
    <ul>{source_items}</ul>
  </div>
</body>
</html>"""


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    rows = db.query(ExecutiveReport).order_by(ExecutiveReport.created_at.desc()).all()
    return {"reports": [_serialize_report(r, db) for r in rows]}


@router.post("/reports", status_code=201)
def create_report(body: ReportCreate, db: Session = Depends(get_db)):
    report = ExecutiveReport(
        id=str(uuid.uuid4()),
        title=body.title.strip(),
        company_name=body.company_name.strip(),
        period_label=body.period_label.strip(),
        executive_summary=body.executive_summary.strip(),
        kpi_ids_json=json.dumps(body.kpi_ids),
        source_ids_json=json.dumps(body.source_ids),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"report": _serialize_report(report, db)}


@router.get("/reports/{report_id}/export")
def export_report(
    report_id: str,
    format: str = Query("pdf", pattern="^(pdf|docx|pptx)$"),
    db: Session = Depends(get_db),
):
    report = db.query(ExecutiveReport).filter(ExecutiveReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    kpis, sources = _resolve_report_context(report, db)

    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", report.title.lower()).strip("-")[:48] or "nexus-report"
    if format == "pdf":
        data = _render_report_pdf(report, kpis, sources)
        media = "application/pdf"
    elif format == "docx":
        data = _render_report_docx(report, kpis, sources)
        media = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        data = _render_report_pptx(report, kpis, sources)
        media = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{slug}.{format}"'},
    )


@router.post("/reports/{report_id}/publish-portal", status_code=201)
def publish_report_to_portal(
    report_id: str,
    body: PublishPortalRequest,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    """Package an executive KPI report into a static bundle and mint a Client Portal magic link."""
    report = db.query(ExecutiveReport).filter(ExecutiveReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if "@" not in body.client_email or "." not in body.client_email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Please enter a valid client email address")

    kpis, sources = _resolve_report_context(report, db)
    did = str(uuid.uuid4())
    exp = _utc_now_naive() + timedelta(days=body.expires_in_days)
    bundle_dir = _bundle_root() / did
    bundle_dir.mkdir(parents=True, exist_ok=True)

    html_doc = _render_portal_html(report, kpis, sources)
    (bundle_dir / "index.html").write_text(html_doc, encoding="utf-8")

    # Also include machine-readable KPI CSV and PDF copy inside the downloadable ZIP bundle
    csv_buf = io.StringIO()
    writer = csv.writer(csv_buf)
    writer.writerow(["Metric", "Category", "Actual", "Target", "Unit", "AttainmentPct", "Status"])
    for k in kpis:
        writer.writerow(
            [
                k["name"],
                k["category"],
                k["actualValue"],
                k["targetValue"],
                k["unit"],
                k["attainmentPct"],
                k["status"],
            ]
        )
    (bundle_dir / "kpis.csv").write_text(csv_buf.getvalue(), encoding="utf-8")
    (bundle_dir / "executive-report.pdf").write_bytes(_render_report_pdf(report, kpis, sources))

    deliverable = PortalDeliverable(
        id=did,
        opportunity_id=f"report:{report.id}",
        title=report.title[:500],
        description=(report.executive_summary or f"{report.company_name} {report.period_label}".strip())[:10000],
        kind="static",
        entrypoint="index.html",
        client_email=body.client_email.strip(),
        status="ready",
        bundle_root=str(bundle_dir),
        expires_at=exp,
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)

    link_data = create_magic_link_for_deliverable(deliverable, db, send_email=body.send_email)
    report.portal_deliverable_id = did
    report.portal_magic_link_url = link_data["magicLinkUrl"]
    db.add(report)
    db.commit()

    return {
        "deliverableId": did,
        "portalUrl": link_data["magicLinkUrl"],
        "token": link_data["token"],
        "expiresAt": link_data["expiresAt"],
        "report": _serialize_report(report, db),
    }


@router.delete("/reports/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(ExecutiveReport).filter(ExecutiveReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"ok": True}
