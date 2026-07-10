from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, update_user
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.auth import _normalize_email

def update_user_profile(db: Session, db_user: User, user_update: UserUpdate) -> User | None:
    """
    Orchestrate user profile update with email normalization and uniqueness checks.
    Returns the updated User object, or None if email conflict occurs.
    """
    # 1. Extract only the fields sent in the request (exclude unset values)
    update_data = user_update.model_dump(exclude_unset=True)

    # 2. Check and normalize email if updated
    if "email" in update_data:
        normalized_email = _normalize_email(update_data["email"])
        
        # Check uniqueness against other users
        if normalized_email != db_user.email:
            existing_user = get_user_by_email(db, normalized_email)
            if existing_user and existing_user.id != db_user.id:
                return None  # Email conflict
                
        # Update the schema update object using Pydantic v2 model_copy
        user_update = user_update.model_copy(update={"email": normalized_email})

    # 3. Call the CRUD function to persist changes
    return update_user(db, db_user, user_update)
