"""SQLite/Postgres portal database for client deliverable review."""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine, func
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
    db = factory()
    try:
        yield db
    finally:
        db.close()
