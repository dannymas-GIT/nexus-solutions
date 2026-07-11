"""Client portal API — magic links, bundle upload, outbound polling for OpenClaw."""
from __future__ import annotations

import io
import json
import logging
import os
import shutil
import tarfile
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ...db.portal_db import PortalAction, PortalDeliverable, PortalMagicLink, get_db, get_session_factory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portal", tags=["portal"])

BUNDLE_ROOT = Path(os.environ.get("PORTAL_BUNDLE_ROOT", "./data/portal_bundles")).resolve()
JWT_SECRET = os.environ.get("PORTAL_JWT_SECRET", "change-me-in-production")
API_KEY_EXPECTED = os.environ.get("PORTAL_API_KEY", "").strip()
PUBLIC_BASE = os.environ.get("PORTAL_PUBLIC_BASE", "https://nexus-solutions.us").rstrip("/")


def _require_api_key(x_portal_api_key: Optional[str] = Header(None, alias="X-Portal-Api-Key")):
    if not API_KEY_EXPECTED:
        raise HTTPException(status_code=503, detail="PORTAL_API_KEY not configured on server")
    if not x_portal_api_key or x_portal_api_key.strip() != API_KEY_EXPECTED:
        raise HTTPException(status_code=401, detail="invalid API key")


class DeliverableCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    opportunity_id: str = Field(alias="opportunityId")
    title: str = ""
    description: str = ""
    kind: str = "static"
    entrypoint: str = "index.html"
    client_email: str = Field(alias="clientEmail")
    expires_in_days: int = Field(14, alias="expiresInDays")


class LinkRequest(BaseModel):
    sendEmail: bool = True


class ActionBody(BaseModel):
    token: str
    action: str
    message: Optional[str] = None


def _send_ses_email(to_addr: str, subject: str, body_text: str) -> bool:
    region = os.environ.get("AWS_REGION", "us-east-1")
    src = os.environ.get("SES_SOURCE_EMAIL", "").strip()
    if not src:
        logger.warning("SES_SOURCE_EMAIL not set; email not sent")
        return False
    try:
        import boto3

        client = boto3.client("ses", region_name=region)
        client.send_email(
            Source=src,
            Destination={"ToAddresses": [to_addr]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": body_text, "Charset": "UTF-8"}},
            },
        )
        return True
    except Exception as e:  # noqa: BLE001
        logger.exception("SES send failed: %s", e)
        return False


@router.post("/deliverables")
def create_deliverable(
    body: DeliverableCreate,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    did = str(uuid.uuid4())
    exp = datetime.utcnow() + timedelta(days=max(1, min(body.expires_in_days, 90)))
    bundle_dir = BUNDLE_ROOT / did
    bundle_dir.mkdir(parents=True, exist_ok=True)
    d = PortalDeliverable(
        id=did,
        opportunity_id=body.opportunity_id,
        title=body.title[:500],
        description=(body.description or "")[:10000],
        kind=body.kind[:32],
        entrypoint=body.entrypoint[:256],
        client_email=body.client_email.strip(),
        status="pending_bundle",
        bundle_root=str(bundle_dir),
        expires_at=exp,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": did, "deliverableId": did, "expiresAt": exp.isoformat() + "Z"}


@router.put("/deliverables/{deliverable_id}/bundle")
async def upload_bundle(
    deliverable_id: str,
    bundle: UploadFile = File(...),
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    d = db.query(PortalDeliverable).filter(PortalDeliverable.id == deliverable_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    raw = await bundle.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty bundle")
    root = Path(d.bundle_root or (BUNDLE_ROOT / deliverable_id))
    root.mkdir(parents=True, exist_ok=True)
    for child in list(root.iterdir()):
        if child.is_file():
            child.unlink()
        elif child.is_dir():
            shutil.rmtree(child)
    try:
        with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tf:
            tf.extractall(path=root)
    except tarfile.TarError as e:
        raise HTTPException(status_code=400, detail=f"invalid tarball: {e}") from e
    d.status = "ready"
    db.add(d)
    db.commit()
    return {"ok": True, "path": str(root)}


@router.post("/deliverables/{deliverable_id}/links")
def mint_link(
    deliverable_id: str,
    body: LinkRequest,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    d = db.query(PortalDeliverable).filter(PortalDeliverable.id == deliverable_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    if d.status != "ready":
        raise HTTPException(status_code=400, detail="bundle not uploaded")

    jti = uuid.uuid4().hex
    exp_dt = d.expires_at or (datetime.utcnow() + timedelta(days=14))
    exp_ts = int(time.mktime(exp_dt.timetuple())) if exp_dt else int(time.time()) + 86400 * 14

    ml = PortalMagicLink(
        jti=jti,
        deliverable_id=deliverable_id,
        uses_remaining=3,
        expires_at=exp_dt,
    )
    db.add(ml)
    db.commit()

    token = jwt.encode(
        {"sub": deliverable_id, "jti": jti, "exp": exp_ts, "typ": "portal"},
        JWT_SECRET,
        algorithm="HS256",
    )
    magic_url = f"{PUBLIC_BASE}/portal/{token}"
    if body.sendEmail:
        ok = _send_ses_email(
            d.client_email,
            f"Review: {d.title or 'Deliverable'}",
            f"Please open your private review link:\n{magic_url}\n",
        )
        if not ok:
            logger.info("Magic link (email may be skipped): %s", magic_url)
    return {"magicLinkUrl": magic_url, "url": magic_url, "token": token, "expiresAt": exp_dt.isoformat() + "Z"}


@router.delete("/deliverables/{deliverable_id}")
def delete_deliverable(
    deliverable_id: str,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    d = db.query(PortalDeliverable).filter(PortalDeliverable.id == deliverable_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    db.query(PortalMagicLink).filter(PortalMagicLink.deliverable_id == deliverable_id).delete()
    db.query(PortalAction).filter(PortalAction.deliverable_id == deliverable_id).delete()
    db.delete(d)
    db.commit()
    root = Path(d.bundle_root or (BUNDLE_ROOT / deliverable_id))
    if root.exists():
        shutil.rmtree(root, ignore_errors=True)
    return {"ok": True}


@router.get("/events")
def list_events(
    since: int = 0,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(PortalAction)
        .filter(PortalAction.id > since)
        .order_by(PortalAction.id.asc())
        .limit(500)
        .all()
    )
    events = []
    max_id = since
    for r in rows:
        max_id = max(max_id, r.id)
        try:
            payload = json.loads(r.payload_json or "{}")
        except json.JSONDecodeError:
            payload = {}
        events.append(
            {
                "id": r.id,
                "deliverableId": r.deliverable_id,
                "action": r.action,
                "payload": payload,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
        )
    return {"events": events, "nextSince": max_id}


@router.get("/session")
def session_by_token(token: str):
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"invalid token: {e}") from e
    did = claims.get("sub")
    jti = claims.get("jti")
    if not did or not jti:
        raise HTTPException(status_code=401, detail="invalid claims")

    db = get_session_factory()()
    try:
        d = db.query(PortalDeliverable).filter(PortalDeliverable.id == did).first()
        if not d:
            raise HTTPException(status_code=404, detail="deliverable gone")
        ml = db.query(PortalMagicLink).filter(PortalMagicLink.jti == jti).first()
        if not ml or ml.deliverable_id != did:
            raise HTTPException(status_code=401, detail="unknown link")
        if ml.expires_at and ml.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="expired")
        return {
            "deliverable": {
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "kind": d.kind,
                "entrypoint": d.entrypoint,
                "opportunityId": d.opportunity_id,
            },
            "usesRemaining": ml.uses_remaining,
        }
    finally:
        db.close()


@router.post("/actions")
def post_action(body: ActionBody):
    try:
        claims = jwt.decode(body.token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"invalid token: {e}") from e
    did = claims.get("sub")
    jti = claims.get("jti")
    if not did or not jti:
        raise HTTPException(status_code=401, detail="invalid claims")

    db = get_session_factory()()
    try:
        ml = db.query(PortalMagicLink).filter(PortalMagicLink.jti == jti).first()
        if not ml or ml.deliverable_id != did:
            raise HTTPException(status_code=401, detail="unknown link")
        if ml.expires_at and ml.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="expired")
        act = (body.action or "").strip().lower()
        if act not in ("approve", "request_changes", "reject", "view"):
            raise HTTPException(status_code=400, detail="invalid action")
        if act != "view" and ml.uses_remaining <= 0:
            raise HTTPException(status_code=403, detail="no uses remaining")
        if act != "view":
            ml.uses_remaining -= 1
            db.add(ml)
        pa = PortalAction(
            deliverable_id=did,
            action=act,
            payload_json=json.dumps({"message": body.message or ""}),
        )
        db.add(pa)
        db.commit()
        return {"ok": True, "actionId": pa.id}
    finally:
        db.close()


@router.get("/static/{deliverable_id}/{file_path:path}")
def serve_static_file(deliverable_id: str, file_path: str, token: str = ""):
    if not token:
        raise HTTPException(status_code=401, detail="token required")
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid token")
    if claims.get("sub") != deliverable_id:
        raise HTTPException(status_code=403, detail="mismatch")

    db = get_session_factory()()
    try:
        d = db.query(PortalDeliverable).filter(PortalDeliverable.id == deliverable_id).first()
        if not d:
            raise HTTPException(status_code=404)
        root = Path(d.bundle_root or (BUNDLE_ROOT / deliverable_id))
        target = (root / file_path).resolve()
        if not str(target).startswith(str(root.resolve())):
            raise HTTPException(status_code=400, detail="invalid path")
        if not target.is_file():
            raise HTTPException(status_code=404, detail="not found")
        return FileResponse(target)
    finally:
        db.close()
