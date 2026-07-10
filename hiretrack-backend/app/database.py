from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# 1. Create the SQLAlchemy Engine
# The engine manages the pool of database connections.
engine = create_engine(settings.database_url)

# 2. Create the SessionLocal Session Factory
# Each instance of SessionLocal represents an active database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base Class
# Used as the parent class for all database models (using the new SQLAlchemy 2.x DeclarativeBase syntax).
class Base(DeclarativeBase):
    pass

# 4. Dependency to Inject Database Session Into Route Handlers
# Guarantees each request gets a fresh session, and that it is closed after the request is finished.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
