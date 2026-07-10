from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user import update_user_profile
from app.crud.user import delete_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile.
    """
    return current_user

@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially update current authenticated user profile.
    Returns 409 Conflict if the updated email is already registered by another user.
    """
    updated_user = update_user_profile(db, current_user, user_update)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return updated_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete current authenticated user profile.
    """
    delete_user(db, current_user)
    return None  # HTTP 204 requires no content in response body
