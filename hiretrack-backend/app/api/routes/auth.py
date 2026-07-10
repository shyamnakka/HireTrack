from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import register_user, authenticate_user, create_user_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user. Returns a 409 Conflict if the email is already registered.
    """
    new_user = register_user(db, user_in)
    if new_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return new_user

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Log in a user using email and password. Returns a 401 Unauthorized if the credentials are incorrect.
    """
    user = authenticate_user(db, login_in.email, login_in.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = create_user_access_token(user)
    return TokenResponse(access_token=token)
