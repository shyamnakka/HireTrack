from typing import List
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate

def get_application_by_id(db: Session, application_id: int, user_id: int) -> Application | None:
    """
    Retrieve an application by ID, ensuring ownership by user_id.
    """
    stmt = select(Application).where(
        Application.id == application_id,
        Application.user_id == user_id
    )
    return db.execute(stmt).scalar_one_or_none()

def get_applications_by_user(db: Session, user_id: int) -> List[Application]:
    """
    Retrieve all applications for a specific user, ordered by newest created first.
    """
    stmt = select(Application).where(Application.user_id == user_id).order_by(desc(Application.created_at))
    return list(db.execute(stmt).scalars().all())

def create_application(db: Session, user_id: int, app_in: ApplicationCreate) -> Application:
    """
    Create a new job application for the specified user using trusted user_id.
    """
    # 1. Convert validated Pydantic schema to dictionary
    app_data = app_in.model_dump()
    
    # 2. Convert Pydantic HttpUrl object to string for SQLAlchemy compatibility
    if app_data.get("job_url") is not None:
        app_data["job_url"] = str(app_data["job_url"])
    
    # 3. Instantiate Application ORM model, assigning the trusted user_id
    db_app = Application(
        user_id=user_id,
        **app_data
    )
    
    # 4. Add to session, commit transaction, and refresh object
    try:
        db.add(db_app)
        db.commit()
        db.refresh(db_app)
        return db_app
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def update_application(db: Session, db_app: Application, app_in: ApplicationUpdate) -> Application:
    """
    Partially update an application.
    """
    # 1. Extract only the fields sent in the request (exclude unset values)
    # This preserves explicit nulls (e.g. job_location=None) while ignoring omitted fields.
    update_data = app_in.model_dump(exclude_unset=True)
    
    # 2. Convert Pydantic HttpUrl object to string for SQLAlchemy compatibility
    if "job_url" in update_data and update_data["job_url"] is not None:
        update_data["job_url"] = str(update_data["job_url"])
    
    # 3. Apply updates dynamically
    for field, value in update_data.items():
        setattr(db_app, field, value)
        
    # 4. Commit changes and refresh object
    try:
        db.add(db_app)
        db.commit()
        db.refresh(db_app)
        return db_app
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise

def delete_application(db: Session, db_app: Application) -> bool:
    """
    Delete an application from the database.
    Returns True if deletion succeeded, otherwise raises DB exception.
    """
    try:
        db.delete(db_app)
        db.commit()
        return True
    except Exception:
        db.rollback()  # Rollback on database transaction failure
        raise
