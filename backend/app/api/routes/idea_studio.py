"""Tenant-scoped Idea Studio proxy to the shared TheHelm control-api."""
from __future__ import annotations

import logging
import os
import re
from typing import Annotated, Any
from urllib.parse import urlencode, urlparse

import requests
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from ...core.config import settings
from ...core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/idea-studio",
    tags=["idea-studio"],
    dependencies=[Depends(get_current_user)],
)

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
_SAFE_TENANT_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
_TENANT_KEYS = ("tenant", "tenant_id", "tenantId")

RequiredBody = Annotated[dict[str, Any], Body()]
OptionalBody = Annotated[dict[str, Any] | None, Body()]


def _get_tenant_id() -> str:
    raw = (
        os.environ.get("IDEA_STUDIO_TENANT_ID")
        or settings.IDEA_STUDIO_TENANT_ID
        or "nexus-solutions"
    )
    tenant = raw.strip().lower()
    if not _SAFE_TENANT_RE.fullmatch(tenant):
        return "nexus-solutions"
    return tenant


def _get_staging_domain() -> str:
    raw = (
        os.environ.get("IDEA_STUDIO_STAGING_DOMAIN")
        or settings.IDEA_STUDIO_STAGING_DOMAIN
        or "nexus-solutions.us"
    )
    return raw.strip().lower() or "nexus-solutions.us"


def _get_api_base_url() -> str:
    raw = (
        os.environ.get("IDEA_STUDIO_API_BASE_URL")
        or os.environ.get("CONTROL_API_BASE_URL")
        or settings.IDEA_STUDIO_API_BASE_URL
        or ""
    ).strip()
    if not raw:
        return ""
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        logger.warning("Ignoring invalid IDEA_STUDIO_API_BASE_URL scheme/host")
        return ""
    return raw.rstrip("/")


def _get_hosted_ui_url(tenant: str) -> str | None:
    explicit = (
        os.environ.get("IDEA_STUDIO_PUBLIC_URL")
        or settings.IDEA_STUDIO_PUBLIC_URL
        or ""
    ).strip()
    if explicit:
        parsed = urlparse(explicit)
        if parsed.scheme in ("http", "https") and parsed.netloc:
            return explicit
        return None

    api_base = _get_api_base_url()
    if not api_base:
        return None
    qs = urlencode({"mode": "public", "tenant": tenant})
    return f"{api_base}/idea-studio?{qs}"


def _get_timeout_seconds(long_running: bool = False) -> float:
    raw = os.environ.get("IDEA_STUDIO_TIMEOUT_SECONDS")
    if raw:
        try:
            configured = float(raw)
            if configured > 0:
                return configured if long_running else min(configured, 60.0)
        except ValueError:
            pass
    default_long = float(settings.IDEA_STUDIO_TIMEOUT_SECONDS or 180)
    return default_long if long_running else min(default_long, 30.0)


def _validate_resource_id(value: str, label: str) -> str:
    cleaned = (value or "").strip()
    if not _SAFE_ID_RE.fullmatch(cleaned):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return cleaned


def _prepare_body(payload: dict[str, Any] | None, tenant: str) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    if isinstance(payload, dict):
        for key, val in payload.items():
            if key in _TENANT_KEYS:
                continue
            cleaned[key] = val
    cleaned["tenantId"] = tenant
    return cleaned


def _execute_upstream_request(
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    params: dict[str, str],
    json_body: dict[str, Any] | None,
    timeout: float,
) -> requests.Response:
    return requests.request(
        method=method,
        url=url,
        headers=headers,
        params=params,
        json=json_body,
        timeout=timeout,
    )


async def _proxy_to_control_api(
    method: str,
    upstream_path: str,
    *,
    extra_params: dict[str, str | None] | None = None,
    payload: dict[str, Any] | None = None,
    long_running: bool = False,
) -> JSONResponse:
    api_base = _get_api_base_url()
    if not api_base:
        raise HTTPException(
            status_code=503,
            detail=(
                "Idea Studio backend is not configured. "
                "Set IDEA_STUDIO_API_BASE_URL to the shared control-api base URL."
            ),
        )

    tenant = _get_tenant_id()
    params: dict[str, str] = {"tenant_id": tenant}
    if extra_params:
        for key, val in extra_params.items():
            if key in _TENANT_KEYS or val is None or val == "":
                continue
            params[key] = str(val)

    headers: dict[str, str] = {
        "Accept": "application/json",
        "X-Tenant-Id": tenant,
    }
    api_token = (
        os.environ.get("IDEA_STUDIO_API_TOKEN")
        or settings.IDEA_STUDIO_API_TOKEN
        or ""
    ).strip()
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"

    json_body: dict[str, Any] | None = None
    if method.upper() != "GET":
        headers["Content-Type"] = "application/json"
        json_body = _prepare_body(payload, tenant)

    url = f"{api_base}{upstream_path}"
    timeout = _get_timeout_seconds(long_running=long_running)

    try:
        resp = await run_in_threadpool(
            _execute_upstream_request,
            method.upper(),
            url,
            headers=headers,
            params=params,
            json_body=json_body,
            timeout=timeout,
        )
    except requests.Timeout as exc:
        logger.warning("Idea Studio upstream timed out: %s %s", method, upstream_path)
        raise HTTPException(
            status_code=504,
            detail="Idea Studio upstream request timed out. Please retry shortly.",
        ) from exc
    except requests.RequestException as exc:
        logger.error("Idea Studio upstream request failed: %s %s: %s", method, upstream_path, exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to reach the shared Idea Studio backend.",
        ) from exc

    try:
        data = resp.json()
    except ValueError:
        if resp.ok:
            data = {"ok": True}
        else:
            data = {
                "error": "upstream_error",
                "message": (resp.text or f"Upstream returned HTTP {resp.status_code}")[:500],
            }

    return JSONResponse(status_code=resp.status_code, content=data)


@router.get("/config")
async def get_idea_studio_config() -> dict[str, Any]:
    """Return Nexus-Solutions Idea Studio configuration and tenant metadata."""
    tenant = _get_tenant_id()
    api_base = _get_api_base_url()
    return {
        "configured": bool(api_base),
        "tenant": tenant,
        "stagingDomain": _get_staging_domain(),
        "hostedUiUrl": _get_hosted_ui_url(tenant),
        "proxyMode": "backend",
    }


@router.get("/ideas")
async def list_ideas() -> JSONResponse:
    return await _proxy_to_control_api("GET", "/api/mission-control/ideas")


@router.post("/ideas")
async def create_idea(payload: RequiredBody) -> JSONResponse:
    return await _proxy_to_control_api("POST", "/api/mission-control/ideas", payload=payload)


@router.get("/ideas/{idea_id}/gates")
async def get_idea_gates(idea_id: str) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api("GET", f"/api/mission-control/ideas/{safe_id}/gates")


@router.post("/ideas/{idea_id}/gates")
async def evaluate_idea_gate(
    idea_id: str,
    payload: RequiredBody,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/gates",
        payload=payload,
    )


@router.get("/ideas/{idea_id}/reports")
async def list_idea_reports(
    idea_id: str,
    milestone: Annotated[str | None, Query()] = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "GET",
        f"/api/mission-control/ideas/{safe_id}/reports",
        extra_params={"milestone": milestone},
    )


@router.post("/ideas/{idea_id}/reports/market-research")
async def run_market_research(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/reports/market-research",
        payload=payload or {},
        long_running=True,
    )


@router.post("/ideas/{idea_id}/reports/feasibility-viability")
async def run_feasibility_viability(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/reports/feasibility-viability",
        payload=payload or {},
        long_running=True,
    )


@router.post("/ideas/{idea_id}/graduate")
async def graduate_idea(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/graduate",
        payload=payload or {},
        long_running=True,
    )


@router.post("/ideas/{idea_id}/scaffold")
async def scaffold_idea(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/scaffold",
        payload=payload or {},
        long_running=True,
    )


@router.get("/ideas/{idea_id}/staging")
async def get_idea_staging(idea_id: str) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api("GET", f"/api/mission-control/ideas/{safe_id}/staging")


@router.post("/ideas/{idea_id}/staging/provision")
async def provision_idea_staging(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/staging/provision",
        payload=payload or {},
        long_running=True,
    )


@router.get("/ideas/{idea_id}/finops")
async def get_idea_finops(idea_id: str) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api("GET", f"/api/mission-control/ideas/{safe_id}/finops")


@router.post("/ideas/{idea_id}/sprints/next")
async def advance_idea_sprint(
    idea_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(idea_id, "idea_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/ideas/{safe_id}/sprints/next",
        payload=payload or {},
    )


@router.get("/sprints")
async def list_sprints(
    initiativeId: Annotated[str | None, Query()] = None,
    ideaId: Annotated[str | None, Query()] = None,
    appSlug: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
) -> JSONResponse:
    return await _proxy_to_control_api(
        "GET",
        "/api/mission-control/sprints",
        extra_params={
            "initiativeId": initiativeId,
            "ideaId": ideaId,
            "appSlug": appSlug,
            "status": status,
        },
    )


@router.post("/sprints")
async def create_sprint(payload: RequiredBody) -> JSONResponse:
    return await _proxy_to_control_api("POST", "/api/mission-control/sprints", payload=payload)


@router.post("/sprints/{sprint_id}/execute")
async def execute_sprint(
    sprint_id: str,
    payload: OptionalBody = None,
) -> JSONResponse:
    safe_id = _validate_resource_id(sprint_id, "sprint_id")
    return await _proxy_to_control_api(
        "POST",
        f"/api/mission-control/sprints/{safe_id}/execute",
        payload=payload or {},
        long_running=True,
    )


@router.get("/initiatives")
async def list_initiatives() -> JSONResponse:
    return await _proxy_to_control_api("GET", "/api/mission-control/initiatives")


@router.get("/staging")
async def list_staging(
    ideaId: Annotated[str | None, Query()] = None,
    appSlug: Annotated[str | None, Query()] = None,
) -> JSONResponse:
    return await _proxy_to_control_api(
        "GET",
        "/api/mission-control/staging",
        extra_params={"ideaId": ideaId, "appSlug": appSlug},
    )


@router.get("/finops")
async def get_tenant_finops() -> JSONResponse:
    return await _proxy_to_control_api("GET", "/api/mission-control/finops")
