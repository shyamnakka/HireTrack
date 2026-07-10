from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.application import Application
from app.schemas.interview import InterviewCreate, InterviewUpdate

def get_interview_by_id(db: Session, interview_id: int, user_id: int) -> Interview | None:
    """
    Retrieve an interview by its ID, ensuring ownership through a join with Application.
    """
    stmt = (
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(
            Interview.id == interview_id,
            Application.user_id == user_id
        )
    )
    return db.execute(stmt).scalar_one_or_none()

def get_interviews_by_application(db: Session, application_id: int, user_id: int) -> List[Interview]:
    """
    Retrieve all interviews for an application, ensuring ownership by joining with Application.
    Orders chronologically (interview_date ASC).
    """
    stmt = (
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(
            Interview.application_id == application_id,
            Application.user_id == user_id
        )
        .order_by(Interview.interview_date.asc())
    )
    return list(db.execute(stmt).scalars().all())

def create_interview(db: Session, application_id: int, user_id: int, interview_in: InterviewCreate) -> Interview | None:
    """
    Create a new interview round, verifying parent application existence and ownership first.
    """
    # 1. Verify parent application existence and ownership
    app_stmt = select(Application).where(Application.id == application_id, Application.user_id == user_id)
    app = db.execute(app_stmt).scalar_one_or_none()
    if not app:
        return None

    # 2. Convert Pydantic schema to dictionary
    interview_data = interview_in.model_dump()

    # 3. Convert Pydantic HttpUrl to string for database compatibility
    if interview_data.get("meeting_link") is not None:
        interview_data["meeting_link"] = str(interview_data["meeting_link"])

    # 4. Instantiate ORM model
    db_interview = Interview(
        application_id=application_id,
        **interview_data
    )

    # 5. Add to session, commit transaction, and refresh object
    try:
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def update_interview(db: Session, db_interview: Interview, interview_in: InterviewUpdate) -> Interview:
    """
    Partially update an interview.
    """
    # 1. Extract only the fields sent in the request (exclude unset values)
    # This preserves explicit nulls while ignoring omitted fields.
    update_data = interview_in.model_dump(exclude_unset=True)

    # 2. Convert Pydantic HttpUrl to string for database compatibility if updated
    if "meeting_link" in update_data and update_data["meeting_link"] is not None:
        update_data["meeting_link"] = str(update_data["meeting_link"])

    # 3. Apply updates dynamically
    for field, value in update_data.items():
        setattr(db_interview, field, value)

    # 4. Commit changes and refresh object
    try:
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def delete_interview(db: Session, db_interview: Interview) -> bool:
    """
    Delete an interview from the database.
    Returns True if deletion succeeded, otherwise raises DB exception.
    """
    try:
        db.delete(db_interview)
        db.commit()
        return True
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise
