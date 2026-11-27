"""SQLite/Postgres database for client portal, audit leads, and data convergence workspace."""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine, func
from sqlalchemy.orm import Session, declarative_base, sessionmaker

Base = declarative_base()


class PortalDeliverable(Base):
    __tablename__ = "portal_deliverables"

    id = Column(String(36), primary_key=True)
    opportunity_id = Column(String(128), index=True, nullable=False)
    title = Column(String(512), default="")
    description = Column(Text, default="")
    kind = Column(String(32), default="static")
    entrypoint = Column(String(256), default="index.html")
    client_email = Column(String(256), nullable=False)
    status = Column(String(32), default="active")
    bundle_root = Column(String(1024), default="")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class PortalMagicLink(Base):
    __tablename__ = "portal_magic_links"

    jti = Column(String(64), primary_key=True)
    deliverable_id = Column(String(36), index=True, nullable=False)
    uses_remaining = Column(Integer, default=3)
    expires_at = Column(DateTime, nullable=False)
    ip_first_seen = Column(String(64), nullable=True)


class PortalAction(Base):
    __tablename__ = "portal_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    deliverable_id = Column(String(36), index=True, nullable=False)
    action = Column(String(32), nullable=False)
    payload_json = Column(Text, default="{}")
    created_at = Column(DateTime, server_default=func.now())
    sent_to_origin_at = Column(DateTime, nullable=True)


class AuditLead(Base):
    __tablename__ = "audit_leads"

    id = Column(String(36), primary_key=True)
    name = Column(String(256), nullable=False)
    email = Column(String(256), index=True, nullable=False)
    company = Column(String(256), nullable=False)
    role = Column(String(256), default="")
    data_sources_json = Column(Text, default="[]")
    pain_point = Column(Text, default="")
    website = Column(String(512), default="")
    source_page = Column(String(128), default="/request-audit")
    status = Column(String(32), default="new")
    created_at = Column(DateTime, server_default=func.now())


class DataSourceSnapshot(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True)
    name = Column(String(256), nullable=False)
    source_type = Column(String(64), default="csv")
    category = Column(String(64), default="Operations")
    status = Column(String(32), default="synced")
    filename = Column(String(512), default="")
    row_count = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    sample_rows_json = Column(Text, default="[]")
    config_json = Column(Text, default="{}")
    last_synced_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class KpiMetric(Base):
    __tablename__ = "kpi_metrics"

    id = Column(String(36), primary_key=True)
    name = Column(String(256), nullable=False)
    category = Column(String(64), default="Revenue")
    description = Column(Text, default="")
    unit = Column(String(32), default="USD")
    direction = Column(String(16), default="higher_is_better")
    target_value = Column(Float, nullable=False, default=0.0)
    actual_value = Column(Float, nullable=False, default=0.0)
    source_id = Column(String(36), index=True, nullable=True)
    source_column = Column(String(256), nullable=True)
    aggregation = Column(String(32), default="manual")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())


class ExecutiveReport(Base):
    __tablename__ = "executive_reports"

    id = Column(String(36), primary_key=True)
    title = Column(String(512), nullable=False)
    company_name = Column(String(256), default="")
    period_label = Column(String(128), default="")
    executive_summary = Column(Text, default="")
    kpi_ids_json = Column(Text, default="[]")
    source_ids_json = Column(Text, default="[]")
    portal_deliverable_id = Column(String(36), nullable=True)
    portal_magic_link_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


_engine = None
_SessionLocal = None


def reset_engine() -> None:
    """Reset cached SQLAlchemy engine/sessionmaker (used in tests)."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        url = (os.environ.get("DATABASE_URL") or "").strip()
        if not url:
            data_dir = Path(__file__).resolve().parents[2] / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            url = f"sqlite:///{data_dir / 'portal.db'}"
        connect_args = {}
        if url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        _engine = create_engine(url, connect_args=connect_args)
        Base.metadata.create_all(bind=_engine)
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def get_db():
    factory = get_session_factory()
    db: Session = factory()
    try:
        yield db
    finally:
        db.close()
