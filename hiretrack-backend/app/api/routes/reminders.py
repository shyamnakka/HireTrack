from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.crud.reminder import (
    get_reminder_by_id,
    get_reminders_by_user,
    create_reminder,
    update_reminder,
    delete_reminder
)

router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_new_reminder(
    reminder_in: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new general or application-specific reminder for the current user.
    Returns 404 Not Found if a specified application_id is unauthorized or nonexistent.
    """
    db_reminder = create_reminder(db, current_user.id, reminder_in)
    if db_reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return db_reminder

@router.get("", response_model=List[ReminderResponse], status_code=status.HTTP_200_OK)
def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all reminders belonging to the current user, ordered chronologically.
    Returns empty list if no reminders exist.
    """
    return get_reminders_by_user(db, current_user.id)

@router.get("/{reminder_id}", response_model=ReminderResponse, status_code=status.HTTP_200_OK)
def get_one_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single reminder by ID, confirming direct ownership.
    Returns 404 if the reminder does not exist or belongs to another user.
    """
    db_reminder = get_reminder_by_id(db, reminder_id, current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    return db_reminder

@router.patch("/{reminder_id}", response_model=ReminderResponse, status_code=status.HTTP_200_OK)
def update_existing_reminder(
    reminder_id: int,
    reminder_in: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially update a reminder, confirming direct ownership first.
    Returns 404 Reminder not found if the reminder is missing/unauthorized.
    Returns 404 Application not found if application_id reassignment is invalid.
    """
    db_reminder = get_reminder_by_id(db, reminder_id, current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    updated = update_reminder(db, db_reminder, reminder_in)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return updated

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a reminder, confirming direct ownership first.
    Returns 204 No Content with an empty response body on success.
    """
    db_reminder = get_reminder_by_id(db, reminder_id, current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    delete_reminder(db, db_reminder)
    return None  # HTTP 204 requires no content in response body
