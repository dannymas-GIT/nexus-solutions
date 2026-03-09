"""FastAPI dependencies for auth and database."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..core.config import settings
from ..core.database import get_db
from ..models.user import User
from ..models.organization import Organization
from ..models.organization_membership import OrganizationMembership
from ..models.workspace import Workspace

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return current user if authenticated, else None."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        return None
    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Require authentication. Raise 401 if not logged in."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def _org_ids_for_user(db: Session, user_id: int) -> list[int]:
    rows = db.query(OrganizationMembership.organization_id).filter(
        OrganizationMembership.user_id == user_id
    ).distinct().all()
    return [r[0] for r in rows]


async def get_current_organization_optional(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Optional[Organization]:
    """Return first organization the current user belongs to, or None."""
    org_ids = _org_ids_for_user(db, current_user.id)
    if not org_ids:
        return None
    return db.query(Organization).filter(Organization.id == org_ids[0]).first()


async def get_current_organization(
    org: Optional[Organization] = Depends(get_current_organization_optional),
) -> Organization:
    """Require user to belong to at least one organization."""
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No organization. Complete onboarding or create a workspace.",
        )
    return org


def require_workspace_access(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    """Ensure current user can access the workspace (via org membership)."""
    org_ids = _org_ids_for_user(db, current_user.id)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws or ws.organization_id not in org_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws
