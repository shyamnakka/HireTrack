import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.database import SessionLocal, engine
from app.models.user import User
from app.crud.user import delete_user

@pytest.fixture(scope="session")
def client():
    """
    Yields a TestClient instance for routing requests.
    """
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    """
    Yields a database session, and handles connection cleanup.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function", autouse=True)
def clean_db(db_session):
    """
    Autouse fixture that runs cleanups before and after each test.
    Deletes any user whose email ends with '@test-integration.com'.
    Since Cascade deletion is configured, this removes all related
    Applications, Interviews, and Reminders from the database.
    """
    def perform_cleanup():
        db_session.expire_all()
        # Find all test-created users
        stmt = select(User).where(User.email.like("%@test-integration.com"))
        test_users = db_session.execute(stmt).scalars().all()
        for user in test_users:
            delete_user(db_session, user)
        db_session.expire_all()

    # Clean before test
    perform_cleanup()
    yield
    # Clean after test
    perform_cleanup()
