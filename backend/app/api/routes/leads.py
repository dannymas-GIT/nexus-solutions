"""Corporate audit / demo lead capture endpoints."""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from ...db.portal_db import AuditLead, get_db
from .storage import require_admin_api_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: str = Field(..., min_length=5, max_length=254)
    company: str = Field(..., min_length=2, max_length=200)
    role: str = Field("", max_length=200)
    dataSources: List[str] = Field(default_factory=list)
    painPoint: str = Field("", max_length=4000)
    website: str = Field("", max_length=500)
    sourcePage: str = Field("/request-audit", max_length=128)

    @field_validator("name", "company", "role", "painPoint", "website", "sourcePage", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> str:
        return (v or "").strip()

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = (v or "").strip().lower()
        if not EMAIL_RE.match(cleaned):
            raise ValueError("Please provide a valid work email address")
        return cleaned


def _notify_lead_via_ses(lead: AuditLead, sources: List[str]) -> bool:
    notify_to = (os.environ.get("LEADS_NOTIFY_EMAIL") or "").strip()
    src = (os.environ.get("SES_SOURCE_EMAIL") or "").strip()
    if not notify_to or not src:
        return False
    region = os.environ.get("AWS_REGION", "us-east-1")
    body = (
        f"New Nexus Solutions Data Convergence Audit Request\n\n"
        f"Name: {lead.name}\n"
        f"Email: {lead.email}\n"
        f"Company: {lead.company}\n"
        f"Role: {lead.role or '-'}\n"
        f"Website: {lead.website or '-'}\n"
        f"Data Sources: {', '.join(sources) if sources else '-'}\n"
        f"Goal / Pain Point:\n{lead.pain_point or '-'}\n\n"
        f"Source Page: {lead.source_page}\n"
        f"Lead ID: {lead.id}\n"
    )
    try:
        import boto3

        client = boto3.client("ses", region_name=region)
        client.send_email(
            Source=src,
            Destination={"ToAddresses": [notify_to]},
            Message={
                "Subject": {
                    "Data": f"Nexus Audit Request: {lead.company} ({lead.name})",
                    "Charset": "UTF-8",
                },
                "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
            },
        )
        return True
    except Exception as e:  # noqa: BLE001
        logger.warning("Lead notification email skipped/failed: %s", e)
        return False


@router.post("", status_code=201)
def submit_lead(body: LeadCreate, db: Session = Depends(get_db)):
    """Submit a corporate data convergence audit / demo request."""
    lead_id = str(uuid.uuid4())
    clean_sources = [str(s).strip()[:80] for s in body.dataSources[:20] if str(s).strip()]
    lead = AuditLead(
        id=lead_id,
        name=body.name,
        email=body.email,
        company=body.company,
        role=body.role,
        data_sources_json=json.dumps(clean_sources),
        pain_point=body.painPoint,
        website=body.website,
        source_page=body.sourcePage or "/request-audit",
        status="new",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    _notify_lead_via_ses(lead, clean_sources)
    return {
        "id": lead.id,
        "status": "received",
        "message": "Your Data Convergence Audit request has been received. Our team will follow up within one business day.",
    }


@router.get("")
def list_leads(
    limit: int = 50,
    _: None = Depends(require_admin_api_key),
    db: Session = Depends(get_db),
):
    """Operator-only list of captured audit leads."""
    capped = max(1, min(limit, 200))
    rows = (
        db.query(AuditLead)
        .order_by(AuditLead.created_at.desc())
        .limit(capped)
        .all()
    )
    out = []
    for row in rows:
        try:
            sources = json.loads(row.data_sources_json or "[]")
        except json.JSONDecodeError:
            sources = []
        out.append(
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "company": row.company,
                "role": row.role,
                "dataSources": sources,
                "painPoint": row.pain_point,
                "website": row.website,
                "sourcePage": row.source_page,
                "status": row.status,
                "createdAt": row.created_at.isoformat() + "Z" if row.created_at else None,
            }
        )
    return {"leads": out, "count": len(out)}
