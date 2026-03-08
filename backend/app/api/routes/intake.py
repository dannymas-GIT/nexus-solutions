"""Intake routes - business plan wizard submission and generation."""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from ...core.database import get_db
from ...models.intake import Intake
from ...services.document import get_document_service

router = APIRouter(prefix="/intake", tags=["intake"])
logger = logging.getLogger(__name__)


class BusinessPlanData(BaseModel):
    businessInfo: dict
    marketAnalysis: dict
    productsServices: dict
    financialInfo: dict


class IntakeCreate(BaseModel):
    businessInfo: dict
    marketAnalysis: dict
    productsServices: dict
    financialInfo: dict


class IntakeOut(BaseModel):
    id: int
    business_name: str | None
    industry: str | None
    status: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("", response_model=IntakeOut)
def submit_intake(data: IntakeCreate, db: Session = Depends(get_db)):
    """Submit business plan intake from wizard. Persists and returns intake id."""
    bi = data.businessInfo or {}
    business_name = bi.get("name") or ""
    industry = bi.get("industry") or ""
    data_json = json.dumps({
        "businessInfo": data.businessInfo,
        "marketAnalysis": data.marketAnalysis,
        "productsServices": data.productsServices,
        "financialInfo": data.financialInfo,
    })
    intake = Intake(
        business_name=business_name or None,
        industry=industry or None,
        data_json=data_json,
        status="submitted",
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)
    return IntakeOut(
        id=intake.id,
        business_name=intake.business_name,
        industry=intake.industry,
        status=intake.status,
        created_at=intake.created_at.isoformat(),
    )


@router.post("/{intake_id}/generate")
async def generate_plan_pdf(intake_id: int, db: Session = Depends(get_db)):
    """Generate PDF business plan from stored intake."""
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(404, detail="Intake not found")
    data = json.loads(intake.data_json)

    # Map wizard data to nexus_solutions template format
    bi = data.get("businessInfo", {})
    ma = data.get("marketAnalysis", {})
    ps = data.get("productsServices", {})
    fi = data.get("financialInfo", {})

    from datetime import datetime
    template_data: dict[str, Any] = {
        "business_name": bi.get("name", ""),
        "industry": bi.get("industry", ""),
        "description": bi.get("description", ""),
        "mission": bi.get("mission", ""),
        "vision": bi.get("vision", ""),
        "target_market": ma.get("targetMarket", ""),
        "market_size": ma.get("marketSize", ""),
        "competitors": ma.get("competitors", ""),
        "trends": ma.get("trends", ""),
        "products_services": ps.get("description", ""),
        "unique_selling_points": ps.get("uniqueSellingPoints", ""),
        "unique_value_proposition": ps.get("uniqueSellingPoints", "") or ps.get("description", ""),
        "pricing": ps.get("pricing", ""),
        "startup_costs": fi.get("startupCosts", ""),
        "expected_revenue": fi.get("expectedRevenue", ""),
        "break_even": fi.get("breakEvenPoint", ""),
        "funding_needs": fi.get("fundingNeeds", ""),
        "current_date": datetime.now().strftime("%Y-%m-%d"),
        "initial_investment": fi.get("startupCosts", "TBD"),
        "breakeven_timeline": fi.get("breakEvenPoint", "TBD"),
        "year1_revenue": fi.get("expectedRevenue", "TBD"),
        "year3_revenue": fi.get("expectedRevenue", "TBD"),
        "year5_revenue": fi.get("expectedRevenue", "TBD"),
        "year1_customers": "-",
        "year3_customers": "-",
        "year5_customers": "-",
        "year1_team_size": "-",
        "year3_team_size": "-",
        "year5_team_size": "-",
    }

    try:
        doc_service = get_document_service("pdf")
        templates = await doc_service.list_templates()
        template_name = "nexus_solutions" if "nexus_solutions" in templates else (templates[0] if templates else "nexus_solutions")
    except Exception:
        template_name = "nexus_solutions"

    try:
        import tempfile
        from pathlib import Path
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        import os
        os.close(fd)
        output_path = Path(temp_path)

        doc_service = get_document_service("pdf")
        output_file = await doc_service.generate_document(
            template_name=template_name,
            data=template_data,
            output_path=str(output_path),
        )
        content = output_file.read_bytes()
        output_file.unlink(missing_ok=True)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="business_plan_{intake_id}.pdf"'},
        )
    except Exception as e:
        logger.exception(f"Document generation failed: {e}")
        raise HTTPException(500, detail=f"Document generation failed: {str(e)}")
