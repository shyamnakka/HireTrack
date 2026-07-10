from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.reminder import Reminder
from app.models.application import Application
from app.schemas.reminder import ReminderCreate, ReminderUpdate

def get_reminder_by_id(db: Session, reminder_id: int, user_id: int) -> Reminder | None:
    """
    Retrieve a reminder by its ID, ensuring direct ownership by user_id.
    """
    stmt = select(Reminder).where(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    )
    return db.execute(stmt).scalar_one_or_none()

def get_reminders_by_user(db: Session, user_id: int) -> List[Reminder]:
    """
    Retrieve all reminders for a specific user, ordered chronologically (reminder_date ASC).
    """
    stmt = select(Reminder).where(Reminder.user_id == user_id).order_by(Reminder.reminder_date.asc())
    return list(db.execute(stmt).scalars().all())

def create_reminder(db: Session, user_id: int, reminder_in: ReminderCreate) -> Reminder | None:
    """
    Create a new reminder for the user.
    If application_id is provided, validates that the application exists and belongs to the user first.
    """
    # 1. If application_id is provided, perform ownership/existence validation
    if reminder_in.application_id is not None:
        app_stmt = select(Application).where(
            Application.id == reminder_in.application_id,
            Application.user_id == user_id
        )
        app = db.execute(app_stmt).scalar_one_or_none()
        if not app:
            return None

    # 2. Convert schema to dictionary
    reminder_data = reminder_in.model_dump()

    # 3. Instantiate ORM model, injecting the trusted user_id
    db_reminder = Reminder(
        user_id=user_id,
        **reminder_data
    )

    # 4. Save to database
    try:
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def update_reminder(db: Session, db_reminder: Reminder, reminder_in: ReminderUpdate) -> Reminder | None:
    """
    Partially update a reminder, ensuring application ownership verification.
    Implements strict atomicity: fails immediately without modifying any fields if validation fails.
    """
    # 1. Extract only the fields sent in the request (exclude unset values)
    update_data = reminder_in.model_dump(exclude_unset=True)

    # 2. Strict Atomicity & Validation: If application_id is being updated to a non-null integer,
    # verify ownership before modifying any fields on the ORM object.
    if "application_id" in update_data and update_data["application_id"] is not None:
        app_stmt = select(Application).where(
            Application.id == update_data["application_id"],
            Application.user_id == db_reminder.user_id
        )
        app = db.execute(app_stmt).scalar_one_or_none()
        if not app:
            return None

    # 3. Apply updates dynamically only after validation passes
    for field, value in update_data.items():
        setattr(db_reminder, field, value)

    # 4. Commit changes and refresh object
    try:
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def delete_reminder(db: Session, db_reminder: Reminder) -> bool:
    """
    Delete a reminder from the database.
    Returns True if deletion succeeded, otherwise raises DB exception.
    """
    try:
        db.delete(db_reminder)
        db.commit()
        return True
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise
