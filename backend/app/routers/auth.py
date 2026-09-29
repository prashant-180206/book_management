from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from ..deps import DbSession, get_current_user
from ..models import User
from ..schemas import LoginRequest, Token, UserResponse, SignupRequest
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserResponse, operation_id="getMe")
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED, operation_id="signup")
def signup(payload: SignupRequest, db: DbSession) -> Token:

    email = payload.email.lower()

    # Check whether user already exists
    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Create new user
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return Token(
        access_token=create_access_token(user),
        user=UserResponse.model_validate(user),
    )



@router.post("/login", response_model=Token, operation_id="login")
def login(payload: LoginRequest, db: DbSession) -> Token:

    user = db.scalar(
        select(User).where(User.email == payload.email.lower())
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return Token(
        access_token=create_access_token(user),
        user=UserResponse.model_validate(user),
    )