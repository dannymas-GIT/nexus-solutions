"""Auth routes - JWT-based auth with optional onboarding path."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ...core.database import get_db
from ...models.user import User
from ...models.organization import Organization
from ...models.organization_membership import OrganizationMembership, OrgRole
from ...models.workspace import Workspace, WorkspaceType
from ..deps import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    onboarding_path: str | None = None  # "launch" | "intelligence" to create org + workspace


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str | None

    class Config:
        from_attributes = True


@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Optionally create org and first workspace from onboarding_path."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    db.flush()
    if user_in.onboarding_path in ("launch", "intelligence"):
        org_name = user_in.full_name or user_in.email.split("@")[0]
        org = Organization(name=org_name + "'s Workspace")
        db.add(org)
        db.flush()
        db.add(OrganizationMembership(organization_id=org.id, user_id=user.id, role=OrgRole.owner))
        ws_type = WorkspaceType.launch if user_in.onboarding_path == "launch" else WorkspaceType.intelligence
        ws = Workspace(name=org_name, workspace_type=ws_type, organization_id=org.id)
        db.add(ws)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Login and return JWT."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account disabled")
    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Return current user."""
    return current_user
