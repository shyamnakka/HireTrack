from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.crud.application import (
    get_application_by_id,
    get_applications_by_user,
    create_application,
    update_application,
    delete_application
)

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_new_application(
    application_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new job application for the current authenticated user.
    """
    return create_application(db, current_user.id, application_in)

@router.get("", response_model=List[ApplicationResponse], status_code=status.HTTP_200_OK)
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all job applications belonging to the current authenticated user, ordered newest first.
    """
    return get_applications_by_user(db, current_user.id)

@router.get("/{application_id}", response_model=ApplicationResponse, status_code=status.HTTP_200_OK)
def get_one_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single application by ID, confirming ownership by the current user.
    Returns 404 Not Found if the application does not exist or is owned by another user.
    """
    db_app = get_application_by_id(db, application_id, current_user.id)
    if db_app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return db_app

@router.patch("/{application_id}", response_model=ApplicationResponse, status_code=status.HTTP_200_OK)
def update_existing_application(
    application_id: int,
    application_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially update an application, confirming ownership first.
    Returns 404 Not Found if the application does not exist or is owned by another user.
    """
    db_app = get_application_by_id(db, application_id, current_user.id)
    if db_app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return update_application(db, db_app, application_in)

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an application, confirming ownership first.
    Returns 204 No Content with an empty response body on success.
    """
    db_app = get_application_by_id(db, application_id, current_user.id)
    if db_app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    delete_application(db, db_app)
    return None  # HTTP 204 requires no content in response body
