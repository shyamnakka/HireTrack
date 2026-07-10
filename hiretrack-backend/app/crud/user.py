import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_user_by_id(db: Session, user_id: int) -> User | None:
    """
    Retrieve a single User by primary key using SQLAlchemy 2.0 select.
    """
    stmt = select(User).where(User.id == user_id)
    return db.execute(stmt).scalar_one_or_none()

def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Retrieve a single User by email using SQLAlchemy 2.0 select.
    """
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()

def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Create a new user with password hashing.
    """
    # 1. Generate salt and hash the plain-text password using bcrypt
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(user_in.password.encode('utf-8'), salt).decode('utf-8')
    
    # 2. Instantiate User model mapping password to password_hash
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd
    )
    
    # 3. Add to session, commit transaction, and refresh object
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception:
        db.rollback()  # Rollback transaction on failure to ensure session integrity
        raise

def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    """
    Partially update user information.
    """
    # 1. Extract only the fields sent in the request (exclude unset values)
    update_data = user_in.model_dump(exclude_unset=True)
    
    # 2. Iterate through updates and apply changes
    for field, value in update_data.items():
        if field == "password":
            # Hash the new password and assign it to the password_hash column
            salt = bcrypt.gensalt()
            hashed_pwd = bcrypt.hashpw(value.encode('utf-8'), salt).decode('utf-8')
            db_user.password_hash = hashed_pwd
        else:
            setattr(db_user, field, value)
            
    # 3. Commit the changes and refresh the session
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception:
        db.rollback()  # Rollback on transaction failure
        raise

def delete_user(db: Session, db_user: User) -> bool:
    """
    Delete a user from the database.
    Returns True if deletion succeeded, otherwise raises DB exception.
    """
    try:
        db.delete(db_user)
        db.commit()
        return True
    except Exception:
        db.rollback()  # Rollback on transaction failure
        raise
