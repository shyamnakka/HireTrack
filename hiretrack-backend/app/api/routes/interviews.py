from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewResponse
from app.crud.application import get_application_by_id
from app.crud.interview import (
    get_interview_by_id,
    get_interviews_by_application,
    create_interview,
    update_interview,
    delete_interview
)

# APIRouter without global prefix because we support multiple path families
router = APIRouter(
    tags=["Interviews"]
)

@router.post("/applications/{application_id}/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_new_interview(
    application_id: int,
    interview_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new interview round under the specified application.
    Returns 404 Not Found if the application does not exist or is owned by another user.
    """
    db_int = create_interview(db, application_id, current_user.id, interview_in)
    if db_int is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return db_int

@router.get("/applications/{application_id}/interviews", response_model=List[InterviewResponse], status_code=status.HTTP_200_OK)
def list_interviews(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all interview rounds for the specified application, ordered by date ascending.
    Verifies application ownership first. Returns 404 if the application is not found or is owned by another user.
    """
    # 1. Verify parent application existence and ownership
    db_app = get_application_by_id(db, application_id, current_user.id)
    if db_app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # 2. Fetch interviews (ordered by date ascending in CRUD)
    return get_interviews_by_application(db, application_id, current_user.id)

@router.get("/interviews/{interview_id}", response_model=InterviewResponse, status_code=status.HTTP_200_OK)
def get_one_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single interview round by ID, verifying indirect user ownership.
    Returns 404 if the interview is not found or is owned by another user.
    """
    db_int = get_interview_by_id(db, interview_id, current_user.id)
    if db_int is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return db_int

@router.patch("/interviews/{interview_id}", response_model=InterviewResponse, status_code=status.HTTP_200_OK)
def update_existing_interview(
    interview_id: int,
    interview_in: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially update an interview round, verifying indirect ownership first.
    Returns 404 if the interview is not found or is owned by another user.
    """
    db_int = get_interview_by_id(db, interview_id, current_user.id)
    if db_int is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return update_interview(db, db_int, interview_in)

@router.delete("/interviews/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an interview round, verifying indirect ownership first.
    Returns 204 No Content with an empty response body on success.
    """
    db_int = get_interview_by_id(db, interview_id, current_user.id)
    if db_int is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    delete_interview(db, db_int)
    return None  # HTTP 204 requires no content in response body
