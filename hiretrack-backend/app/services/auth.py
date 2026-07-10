from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, create_user
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import verify_password, create_access_token

def _normalize_email(email: str) -> str:
    """
    Consistently normalize an email address.
    Strips surrounding whitespace and converts it to lowercase.
    """
    return email.strip().lower()

def register_user(db: Session, user_in: UserCreate) -> User | None:
    """
    Orchestrate registration. Normalizes email and checks for duplicate registrations.
    """
    # 1. Normalize the email address
    normalized_email = _normalize_email(user_in.email)
    
    # 2. Check for duplicate registration
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        return None
        
    # 3. Copy the Pydantic model with the normalized email using Pydantic v2 model_copy
    normalized_user_in = user_in.model_copy(
        update={"email": normalized_email}
    )
    
    # 4. Call CRUD to hash password and save to database
    return create_user(db, normalized_user_in)

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Verify user credentials. Normalizes email and uses verify_password security helper.
    """
    # 1. Normalize the email address
    normalized_email = _normalize_email(email)
    
    # 2. Look up user by email
    db_user = get_user_by_email(db, normalized_email)
    if not db_user:
        return None
        
    # 3. Verify password via security utility
    if not verify_password(password, db_user.password_hash):
        return None
        
    # 4. Return validated User object
    return db_user

def create_user_access_token(user: User) -> str:
    """
    Orchestrate JWT generation for the authenticated user.
    """
    return create_access_token(subject=user.id)
