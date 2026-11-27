"""Client portal API — magic links, safe bundle upload, download, operator listing, outbound polling."""
from __future__ import annotations

import hmac
import io
import json
import logging
import os
import shutil
import tarfile
import time
import uuid
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ...db.portal_db import PortalAction, PortalDeliverable, PortalMagicLink, get_db, get_session_factory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portal", tags=["portal"])

INSECURE_DEFAULT_SECRETS = {"", "change-me-in-production", "changeme", "secret"}


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _bundle_root() -> Path:
    return Path(os.environ.get("PORTAL_BUNDLE_ROOT", "./data/portal_bundles")).resolve()


def _jwt_secret() -> str:
    secret = (os.environ.get("PORTAL_JWT_SECRET") or "").strip()
    if secret in INSECURE_DEFAULT_SECRETS:
        raise HTTPException(
            status_code=503,
            detail="PORTAL_JWT_SECRET must be configured with a strong secret",
        )
    return secret


def _public_base() -> str:
    return os.environ.get("PORTAL_PUBLIC_BASE", "https://nexus-solutions.us").rstrip("/")


def _require_api_key(x_portal_api_key: Optional[str] = Header(None, alias="X-Portal-Api-Key")):
    expected = (os.environ.get("PORTAL_API_KEY") or "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="PORTAL_API_KEY not configured on server")
    if not x_portal_api_key or not hmac.compare_digest(x_portal_api_key.strip(), expected):
        raise HTTPException(status_code=401, detail="invalid API key")


def _safe_extract_tar_gz(raw: bytes, dest_root: Path) -> None:
    """Safely extract a gzipped tarball preventing TarSlip, symlinks, and device nodes."""
    resolved_root = dest_root.resolve()
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tf:
        members = tf.getmembers()
        for member in members:
            if member.issym() or member.islnk() or member.isdev() or member.isfifo():
                raise HTTPException(
                    status_code=400,
                    detail=f"unsafe archive member type: {member.name}",
                )
            member_path = Path(member.name)
            if member_path.is_absolute() or ".." in member_path.parts:
                raise HTTPException(
                    status_code=400,
                    detail=f"unsafe archive member path: {member.name}",
                )
            target = (resolved_root / member_path).resolve()
            if not target.is_relative_to(resolved_root):
                raise HTTPException(
                    status_code=400,
                    detail=f"archive member escapes bundle root: {member.name}",
                )
        for member in members:
            target = (resolved_root / member.name).resolve()
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                target.parent.mkdir(parents=True, exist_ok=True)
                src = tf.extractfile(member)
                if src is not None:
                    with open(target, "wb") as out:
                        shutil.copyfileobj(src, out)


def _validate_portal_token(token: str, db: Session) -> tuple[PortalDeliverable, PortalMagicLink, dict]:
    """Decode JWT and verify backing deliverable + non-expired magic link."""
    secret = _jwt_secret()
    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"invalid token: {e}") from e
    did = claims.get("sub")
    jti = claims.get("jti")
    if not did or not jti:
        raise HTTPException(status_code=401, detail="invalid claims")

    d = db.query(PortalDeliverable).filter(PortalDeliverable.id == did).first()
    if not d:
        raise HTTPException(status_code=404, detail="deliverable gone")
    ml = db.query(PortalMagicLink).filter(PortalMagicLink.jti == jti).first()
    if not ml or ml.deliverable_id != did:
        raise HTTPException(status_code=401, detail="unknown link")
    if ml.expires_at and ml.expires_at < _utc_now_naive():
        raise HTTPException(status_code=401, detail="expired")
    return d, ml, claims


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


def create_magic_link_for_deliverable(
    d: PortalDeliverable,
    db: Session,
    send_email: bool = False,
) -> dict:
    """Mint and persist a signed magic link for an existing ready deliverable."""
    secret = _jwt_secret()
    if d.status != "ready":
        raise HTTPException(status_code=400, detail="bundle not uploaded")

    jti = uuid.uuid4().hex
    exp_dt = d.expires_at or (_utc_now_naive() + timedelta(days=14))
    exp_ts = int(exp_dt.replace(tzinfo=timezone.utc).timestamp()) if exp_dt else int(time.time()) + 86400 * 14

    ml = PortalMagicLink(
        jti=jti,
        deliverable_id=d.id,
        uses_remaining=3,
        expires_at=exp_dt,
    )
    db.add(ml)
    db.commit()

    token = jwt.encode(
        {"sub": d.id, "jti": jti, "exp": exp_ts, "typ": "portal"},
        secret,
        algorithm="HS256",
    )
    magic_url = f"{_public_base()}/portal/{token}"
    if send_email:
        ok = _send_ses_email(
            d.client_email,
            f"Review: {d.title or 'Deliverable'}",
            f"Please open your private review link:\n{magic_url}\n",
        )
        if not ok:
            logger.info("Magic link (email may be skipped): %s", magic_url)
    return {
        "magicLinkUrl": magic_url,
        "url": magic_url,
        "token": token,
        "expiresAt": exp_dt.isoformat() + "Z",
    }


@router.get("/deliverables")
def list_deliverables(
    limit: int = 100,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    """List client deliverables with review action summaries for the operator console."""
    capped = max(1, min(limit, 500))
    rows = (
        db.query(PortalDeliverable)
        .order_by(PortalDeliverable.created_at.desc())
        .limit(capped)
        .all()
    )
    items = []
    for d in rows:
        actions = (
            db.query(PortalAction)
            .filter(PortalAction.deliverable_id == d.id, PortalAction.action != "view")
            .order_by(PortalAction.created_at.desc(), PortalAction.id.desc())
            .limit(10)
            .all()
        )
        links = (
            db.query(PortalMagicLink)
            .filter(PortalMagicLink.deliverable_id == d.id)
            .all()
        )
        parsed_actions = []
        for a in actions:
            try:
                payload = json.loads(a.payload_json or "{}")
            except json.JSONDecodeError:
                payload = {}
            parsed_actions.append(
                {
                    "id": a.id,
                    "action": a.action,
                    "message": payload.get("message", ""),
                    "createdAt": a.created_at.isoformat() + "Z" if a.created_at else None,
                }
            )
        latest = parsed_actions[0] if parsed_actions else None
        items.append(
            {
                "id": d.id,
                "opportunityId": d.opportunity_id,
                "title": d.title,
                "description": d.description,
                "kind": d.kind,
                "clientEmail": d.client_email,
                "status": d.status,
                "latestAction": latest["action"] if latest else None,
                "latestMessage": latest["message"] if latest else "",
                "actionCount": len(parsed_actions),
                "actions": parsed_actions,
                "linkCount": len(links),
                "usesRemaining": sum(max(0, int(lnk.uses_remaining or 0)) for lnk in links),
                "expiresAt": d.expires_at.isoformat() + "Z" if d.expires_at else None,
                "createdAt": d.created_at.isoformat() + "Z" if d.created_at else None,
            }
        )
    return {"deliverables": items}


@router.post("/deliverables")
def create_deliverable(
    body: DeliverableCreate,
    _: None = Depends(_require_api_key),
    db: Session = Depends(get_db),
):
    did = str(uuid.uuid4())
    exp = _utc_now_naive() + timedelta(days=max(1, min(body.expires_in_days, 90)))
    bundle_dir = _bundle_root() / did
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
    root = Path(d.bundle_root or (_bundle_root() / deliverable_id))
    root.mkdir(parents=True, exist_ok=True)
    for child in list(root.iterdir()):
        if child.is_file() or child.is_symlink():
            child.unlink()
        elif child.is_dir():
            shutil.rmtree(child)
    try:
        _safe_extract_tar_gz(raw, root)
    except HTTPException:
        raise
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
    return create_magic_link_for_deliverable(d, db, send_email=body.sendEmail)


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
    root = Path(d.bundle_root or (_bundle_root() / deliverable_id))
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
                "message": payload.get("message", ""),
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
        )
    return {"events": events, "nextSince": max_id}


@router.get("/session")
def session_by_token(token: str):
    db = get_session_factory()()
    try:
        d, ml, _ = _validate_portal_token(token, db)
        prior_rows = (
            db.query(PortalAction)
            .filter(PortalAction.deliverable_id == d.id, PortalAction.action != "view")
            .order_by(PortalAction.created_at.desc(), PortalAction.id.desc())
            .limit(20)
            .all()
        )
        actions = []
        for row in prior_rows:
            try:
                payload = json.loads(row.payload_json or "{}")
            except json.JSONDecodeError:
                payload = {}
            actions.append(
                {
                    "id": row.id,
                    "action": row.action,
                    "message": payload.get("message", ""),
                    "createdAt": row.created_at.isoformat() + "Z" if row.created_at else None,
                }
            )
        return {
            "deliverable": {
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "kind": d.kind,
                "entrypoint": d.entrypoint,
                "opportunityId": d.opportunity_id,
                "createdAt": d.created_at.isoformat() + "Z" if d.created_at else None,
                "expiresAt": d.expires_at.isoformat() + "Z" if d.expires_at else None,
            },
            "usesRemaining": ml.uses_remaining,
            "expiresAt": ml.expires_at.isoformat() + "Z" if ml.expires_at else None,
            "actions": actions,
        }
    finally:
        db.close()


@router.post("/actions")
def post_action(body: ActionBody):
    db = get_session_factory()()
    try:
        d, ml, _ = _validate_portal_token(body.token, db)
        act = (body.action or "").strip().lower()
        if act not in ("approve", "request_changes", "reject", "view"):
            raise HTTPException(status_code=400, detail="invalid action")
        if act != "view" and ml.uses_remaining <= 0:
            raise HTTPException(status_code=403, detail="no uses remaining")
        if act != "view":
            ml.uses_remaining -= 1
            db.add(ml)
        pa = PortalAction(
            deliverable_id=d.id,
            action=act,
            payload_json=json.dumps({"message": body.message or ""}),
        )
        db.add(pa)
        db.commit()
        db.refresh(pa)
        return {
            "ok": True,
            "actionId": pa.id,
            "usesRemaining": ml.uses_remaining,
            "action": {
                "id": pa.id,
                "action": pa.action,
                "message": body.message or "",
                "createdAt": pa.created_at.isoformat() + "Z" if pa.created_at else None,
            },
        }
    finally:
        db.close()


@router.get("/static/{deliverable_id}/{file_path:path}")
def serve_static_file(deliverable_id: str, file_path: str, token: str = ""):
    if not token:
        raise HTTPException(status_code=401, detail="token required")
    db = get_session_factory()()
    try:
        d, _, _ = _validate_portal_token(token, db)
        if d.id != deliverable_id:
            raise HTTPException(status_code=403, detail="mismatch")
        root = Path(d.bundle_root or (_bundle_root() / deliverable_id)).resolve()
        target = (root / file_path).resolve()
        if not target.is_relative_to(root):
            raise HTTPException(status_code=400, detail="invalid path")
        if not target.is_file():
            raise HTTPException(status_code=404, detail="not found")
        return FileResponse(target)
    finally:
        db.close()


@router.get("/download/{deliverable_id}")
def download_bundle(deliverable_id: str, token: str = ""):
    """Download the deliverable bundle as a ZIP archive using a valid magic-link token."""
    if not token:
        raise HTTPException(status_code=401, detail="token required")
    db = get_session_factory()()
    try:
        d, _, _ = _validate_portal_token(token, db)
        if d.id != deliverable_id:
            raise HTTPException(status_code=403, detail="mismatch")
        root = Path(d.bundle_root or (_bundle_root() / deliverable_id)).resolve()
        if not root.exists():
            raise HTTPException(status_code=404, detail="bundle not found")
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for item in sorted(root.rglob("*")):
                if item.is_file() and item.resolve().is_relative_to(root):
                    zf.write(item, arcname=str(item.relative_to(root)))
        safe_title = "".join(
            ch if ch.isalnum() or ch in ("-", "_") else "-"
            for ch in (d.title or "deliverable").lower()
        ).strip("-")[:48] or "deliverable"
        return Response(
            content=buf.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}-bundle.zip"'},
        )
    finally:
        db.close()
