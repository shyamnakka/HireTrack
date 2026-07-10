from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from app.database import get_db
from app.crud.user import get_user_by_id
from app.models.user import User
from app.core.security import decode_access_token

# Initialize OAuth2 password bearer scheme pointing to the future login route metadata
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to fetch the currently authenticated user from the Bearer token.
    Raises HTTPException (401 Unauthorized) on validation failures.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Decode token using the core security utility
    try:
        subject = decode_access_token(token)
    except jwt.PyJWTError:
        raise credentials_exception

    # 2. Validate subject format and convert to integer user ID
    try:
        user_id = int(subject)
    except ValueError:
        raise credentials_exception

    # 3. Retrieve user from the database
    user = get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception
        
    return user
