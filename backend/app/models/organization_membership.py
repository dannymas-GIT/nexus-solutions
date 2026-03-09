"""Organization membership - links users to organizations with roles."""
from sqlalchemy import String, DateTime, ForeignKey, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import enum

from .base import Base


class OrgRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class OrganizationMembership(Base):
    """User membership in an organization with a role."""

    __tablename__ = "organization_memberships"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[OrgRole] = mapped_column(Enum(OrgRole), default=OrgRole.member, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
