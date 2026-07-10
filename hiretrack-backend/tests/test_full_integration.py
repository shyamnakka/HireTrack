import pytest
from sqlalchemy import select
from fastapi.testclient import TestClient
from app.database import SessionLocal
from app.models.user import User
from app.models.application import Application
from app.models.interview import Interview
from app.models.reminder import Reminder

# Helper to register a user
def register_user(client, name, email, password):
    return client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })

# Helper to login a user
def login_user(client, email, password):
    return client.post("/auth/login", json={
        "email": email,
        "password": password
    })

def test_health_and_openapi(client):
    """
    Test A: Verify health checks and OpenAPI router paths
    """
    # Health checks
    r1 = client.get("/")
    assert r1.status_code == 200
    assert r1.json() == {"message": "HireTrack API is running"}

    r2 = client.get("/db-health")
    assert r2.status_code == 200
    assert "status" in r2.json()

    # OpenAPI Paths
    openapi = client.get("/openapi.json")
    assert openapi.status_code == 200
    paths = openapi.json().get("paths", {})
    assert "/auth/register" in paths
    assert "/auth/login" in paths
    assert "/users/me" in paths
    assert "/applications" in paths
    assert "/applications/{application_id}" in paths
    assert "/applications/{application_id}/interviews" in paths
    assert "/interviews/{interview_id}" in paths
    assert "/reminders" in paths
    assert "/reminders/{reminder_id}" in paths


def test_user_registration_and_login_flow(client, db_session):
    """
    Test B: Verify User A registration, validation, duplicate prevention, login, and profile fetching
    """
    email = "usera@test-integration.com"
    pwd = "passwordA123"

    # 1. Register User A
    r_reg = register_user(client, "User A", email, pwd)
    assert r_reg.status_code == 201
    reg_data = r_reg.json()
    assert "id" in reg_data
    assert reg_data["email"] == email
    assert reg_data["name"] == "User A"
    assert "password" not in reg_data
    assert "password_hash" not in reg_data

    # 2. Duplicate Registration
    r_dup = register_user(client, "User A Dup", email, pwd)
    assert r_dup.status_code == 409
    assert r_dup.json()["detail"] == "Email already registered"

    # 3. Login User A
    r_log = login_user(client, email, pwd)
    assert r_log.status_code == 200
    log_data = r_log.json()
    assert "access_token" in log_data
    assert log_data["token_type"] == "bearer"

    token = log_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. GET /users/me
    r_me = client.get("/users/me", headers=headers)
    assert r_me.status_code == 200
    me_data = r_me.json()
    assert me_data["id"] == reg_data["id"]
    assert me_data["email"] == email
    assert "password" not in me_data
    assert "password_hash" not in me_data


def test_applications_integration_flow(client, db_session):
    """
    Test C: Verify Application integration flow (POST, list sorting, updates, validation)
    """
    email = "usera_app@test-integration.com"
    pwd = "passwordA123"

    # Register & Login
    r_reg = register_user(client, "User A", email, pwd)
    user_id = r_reg.json()["id"]
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Application A1
    payload_a1 = {
        "company_name": "Google",
        "job_role": "SWE",
        "job_location": "Bangalore",
        "job_url": "https://google.com/jobs/1",
        "applied_date": "2026-07-01",
        "status": "Applied",
        "package_amount": 3500000.00,
        "package_currency": "INR",
        "notes": "First application"
    }
    r_a1 = client.post("/applications", json=payload_a1, headers=headers)
    assert r_a1.status_code == 201
    a1_data = r_a1.json()
    assert a1_data["company_name"] == "Google"
    assert a1_data["user_id"] == user_id
    a1_id = a1_data["id"]

    # 2. Create Application A2 (later)
    payload_a2 = {
        "company_name": "Meta",
        "job_role": "SWE",
        "job_location": "London",
        "status": "Applied"
    }
    r_a2 = client.post("/applications", json=payload_a2, headers=headers)
    assert r_a2.status_code == 201
    a2_id = r_a2.json()["id"]

    # 3. Verify validation rules (422)
    # Negative package
    r_val1 = client.post("/applications", json={"company_name": "Meta", "job_role": "SWE", "package_amount": -100}, headers=headers)
    assert r_val1.status_code == 422
    # Invalid status
    r_val2 = client.post("/applications", json={"company_name": "Meta", "job_role": "SWE", "status": "Pending"}, headers=headers)
    assert r_val2.status_code == 422
    # Invalid job URL
    r_val3 = client.post("/applications", json={"company_name": "Meta", "job_role": "SWE", "job_url": "not-a-url"}, headers=headers)
    assert r_val3.status_code == 422

    # 4. GET /applications (List sorting: newest first)
    r_list = client.get("/applications", headers=headers)
    assert r_list.status_code == 200
    apps = r_list.json()
    assert len(apps) == 2
    assert apps[0]["id"] == a2_id  # A2 created second -> newest first
    assert apps[1]["id"] == a1_id

    # 5. GET single Application A1
    r_get = client.get(f"/applications/{a1_id}", headers=headers)
    assert r_get.status_code == 200
    assert r_get.json()["company_name"] == "Google"

    # 6. PATCH Application A1
    r_patch = client.patch(f"/applications/{a1_id}", json={
        "status": "Online Assessment",
        "job_location": None  # Explicit null clearing
    }, headers=headers)
    assert r_patch.status_code == 200
    patch_data = r_patch.json()
    assert patch_data["status"] == "Online Assessment"
    assert patch_data["job_location"] is None
    assert patch_data["notes"] == "First application"  # Omitted remains preserved


def test_interviews_integration_flow(client, db_session):
    """
    Test D: Verify Interview integration flow (POST, list sorting ASC, validation, updates)
    """
    email = "usera_int@test-integration.com"
    pwd = "passwordA123"

    register_user(client, "User A", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create App
    app_id = client.post("/applications", json={"company_name": "Google", "job_role": "SWE"}, headers=headers).json()["id"]

    # 1. Create Interviews (with different dates)
    payload_i1 = {
        "round_name": "Round 1",
        "interview_date": "2026-07-20T10:00:00Z",
        "interview_mode": "Online",
        "meeting_link": "https://google.com/meet/1"
    }
    payload_i2 = {
        "round_name": "Round 2",
        "interview_date": "2026-07-25T14:00:00Z",
        "interview_mode": "Online"
    }
    payload_i3 = {
        "round_name": "Round 3",
        "interview_date": "2026-07-22T09:00:00Z",
        "interview_mode": "In-Person"
    }

    r_i1 = client.post(f"/applications/{app_id}/interviews", json=payload_i1, headers=headers)
    r_i2 = client.post(f"/applications/{app_id}/interviews", json=payload_i2, headers=headers)
    r_i3 = client.post(f"/applications/{app_id}/interviews", json=payload_i3, headers=headers)

    assert r_i1.status_code == 201
    i1_id = r_i1.json()["id"]
    i2_id = r_i2.json()["id"]
    i3_id = r_i3.json()["id"]

    # 2. Validation Checks (422)
    # Invalid mode
    assert client.post(f"/applications/{app_id}/interviews", json={"round_name": "R", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Video Call"}, headers=headers).status_code == 422
    # Invalid result
    assert client.post(f"/applications/{app_id}/interviews", json={"round_name": "R", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online", "result": "Passed"}, headers=headers).status_code == 422
    # Invalid meeting link
    assert client.post(f"/applications/{app_id}/interviews", json={"round_name": "R", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online", "meeting_link": "not-a-url"}, headers=headers).status_code == 422

    # 3. GET /applications/{id}/interviews list (ordered ASC)
    r_list = client.get(f"/applications/{app_id}/interviews", headers=headers)
    assert r_list.status_code == 200
    rounds = r_list.json()
    assert len(rounds) == 3
    # Check date order: July 20 (i1) -> July 22 (i3) -> July 25 (i2)
    assert rounds[0]["id"] == i1_id
    assert rounds[1]["id"] == i3_id
    assert rounds[2]["id"] == i2_id

    # 4. PATCH Interview i1
    r_patch = client.patch(f"/interviews/{i1_id}", json={
        "result": "Cleared",
        "meeting_link": None  # Explicit null clearing
    }, headers=headers)
    assert r_patch.status_code == 200
    p_data = r_patch.json()
    assert p_data["result"] == "Cleared"
    assert p_data["meeting_link"] is None
    assert p_data["round_name"] == "Round 1"  # Omitted preserved


def test_reminders_integration_flow(client, db_session):
    """
    Test E: Verify Reminder integration flow (POST, list sorting ASC, validation, updates, null/omitted associations)
    """
    email = "usera_rem@test-integration.com"
    pwd = "passwordA123"

    register_user(client, "User A", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create App A1 & A2
    app_a1_id = client.post("/applications", json={"company_name": "Google", "job_role": "SWE"}, headers=headers).json()["id"]
    app_a2_id = client.post("/applications", json={"company_name": "Meta", "job_role": "SWE"}, headers=headers).json()["id"]

    # 1. Create Reminders
    # General (app_id = null)
    payload_r1 = {
        "title": "General Task",
        "reminder_date": "2026-07-22T10:00:00Z",
        "application_id": None
    }
    # Specific to A1 (earlier deadline)
    payload_r2 = {
        "title": "Google Prep",
        "reminder_date": "2026-07-18T10:00:00Z",
        "application_id": app_a1_id
    }
    # Specific to A2
    payload_r3 = {
        "title": "Meta Prep",
        "reminder_date": "2026-07-20T10:00:00Z",
        "application_id": app_a2_id
    }

    r_r1 = client.post("/reminders", json=payload_r1, headers=headers)
    r_r2 = client.post("/reminders", json=payload_r2, headers=headers)
    r_r3 = client.post("/reminders", json=payload_r3, headers=headers)

    assert r_r1.status_code == 201
    r1_id = r_r1.json()["id"]
    r2_id = r_r2.json()["id"]
    r3_id = r_r3.json()["id"]

    # 2. GET /reminders list (ordered ASC)
    r_list = client.get("/reminders", headers=headers)
    assert r_list.status_code == 200
    rems = r_list.json()
    assert len(rems) == 3
    # Check date order: July 18 (r2) -> July 20 (r3) -> July 22 (r1)
    assert rems[0]["id"] == r2_id
    assert rems[1]["id"] == r3_id
    assert rems[2]["id"] == r1_id

    # 3. PATCH Reminder r2
    # is_completed = true
    r_patch = client.patch(f"/reminders/{r2_id}", json={"is_completed": True}, headers=headers)
    assert r_patch.status_code == 200
    p_data = r_patch.json()
    assert p_data["is_completed"] is True
    assert p_data["application_id"] == app_a1_id  # Omitted preserves association

    # Explicit null application_id
    r_null = client.patch(f"/reminders/{r2_id}", json={"application_id": None}, headers=headers)
    assert r_null.status_code == 200
    assert r_null.json()["application_id"] is None

    # Reassign to A2
    r_reassign = client.patch(f"/reminders/{r2_id}", json={"application_id": app_a2_id}, headers=headers)
    assert r_reassign.status_code == 200
    assert r_reassign.json()["application_id"] == app_a2_id


def test_cross_user_security_and_reassignment_boundaries(client, db_session):
    """
    Test F: Verify cross-user security boundary controls (User A blocked from User B resources, returning 404s)
    """
    email_a = "user_a_sec@test-integration.com"
    email_b = "user_b_sec@test-integration.com"
    pwd = "passwordA123"

    # Register & Login User A
    register_user(client, "User A", email_a, pwd)
    token_a = login_user(client, email_a, pwd).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register & Login User B
    register_user(client, "User B", email_b, pwd)
    token_b = login_user(client, email_b, pwd).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create User B Resources
    app_b = client.post("/applications", json={"company_name": "Apple", "job_role": "QA"}, headers=headers_b).json()
    app_b_id = app_b["id"]

    int_b = client.post(f"/applications/{app_b_id}/interviews", json={"round_name": "Technical", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online"}, headers=headers_b).json()
    int_b_id = int_b["id"]

    rem_b = client.post("/reminders", json={"title": "Apple Task", "reminder_date": "2026-07-20T10:00:00Z", "application_id": app_b_id}, headers=headers_b).json()
    rem_b_id = rem_b["id"]

    # Using User A token, attempt unauthorized access
    # 1. APPLICATION
    assert client.get(f"/applications/{app_b_id}", headers=headers_a).status_code == 404
    assert client.patch(f"/applications/{app_b_id}", json={"company_name": "Hack"}, headers=headers_a).status_code == 404
    assert client.delete(f"/applications/{app_b_id}", headers=headers_a).status_code == 404

    # 2. INTERVIEW
    assert client.post(f"/applications/{app_b_id}/interviews", json={"round_name": "Hack Round", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online"}, headers=headers_a).status_code == 404
    assert client.get(f"/applications/{app_b_id}/interviews", headers=headers_a).status_code == 404
    assert client.get(f"/interviews/{int_b_id}", headers=headers_a).status_code == 404
    assert client.patch(f"/interviews/{int_b_id}", json={"result": "Cleared"}, headers=headers_a).status_code == 404
    assert client.delete(f"/interviews/{int_b_id}", headers=headers_a).status_code == 404

    # 3. REMINDER
    assert client.post("/reminders", json={"title": "Hack Task", "reminder_date": "2026-07-20T10:00:00Z", "application_id": app_b_id}, headers=headers_a).status_code == 404
    assert client.get(f"/reminders/{rem_b_id}", headers=headers_a).status_code == 404
    assert client.patch(f"/reminders/{rem_b_id}", json={"title": "Hack Title"}, headers=headers_a).status_code == 404
    assert client.delete(f"/reminders/{rem_b_id}", headers=headers_a).status_code == 404

    # User A reassigns their own reminder to User B's application B1
    rem_a_id = client.post("/reminders", json={"title": "Own Task", "reminder_date": "2026-07-20T10:00:00Z"}, headers=headers_a).json()["id"]
    assert client.patch(f"/reminders/{rem_a_id}", json={"application_id": app_b_id}, headers=headers_a).status_code == 404

    # Verify User B's records remain unchanged in database
    db_session.expire_all()
    db_app_b = db_session.execute(select(Application).where(Application.id == app_b_id)).scalar_one_or_none()
    assert db_app_b.company_name == "Apple"
    
    db_int_b = db_session.execute(select(Interview).where(Interview.id == int_b_id)).scalar_one_or_none()
    assert db_int_b.result == "Pending"

    db_rem_b = db_session.execute(select(Reminder).where(Reminder.id == rem_b_id)).scalar_one_or_none()
    assert db_rem_b.title == "Apple Task"


def test_reminder_update_atomicity(client, db_session):
    """
    Test G: Verify PATCH Reminder atomicity (valid fields revert completely if validation checks fail)
    """
    email_a = "user_a_atom@test-integration.com"
    email_b = "user_b_atom@test-integration.com"
    pwd = "passwordA123"

    # User A Setup
    register_user(client, "User A", email_a, pwd)
    token_a = login_user(client, email_a, pwd).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    app_a1_id = client.post("/applications", json={"company_name": "Google", "job_role": "SWE"}, headers=headers_a).json()["id"]
    rem_a_id = client.post("/reminders", json={"title": "Google Prep", "reminder_date": "2026-07-20T10:00:00Z", "application_id": app_a1_id}, headers=headers_a).json()["id"]

    # User B Setup
    register_user(client, "User B", email_b, pwd)
    token_b = login_user(client, email_b, pwd).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    app_b_id = client.post("/applications", json={"company_name": "Apple", "job_role": "QA"}, headers=headers_b).json()["id"]

    # As User A, PATCH Reminder A1 with valid title change and unauthorized B1 application ID
    r_patch = client.patch(f"/reminders/{rem_a_id}", json={
        "title": "Hacked Title",
        "application_id": app_b_id
    }, headers=headers_a)
    assert r_patch.status_code == 404
    assert "Application not found" in r_patch.json().get("detail", "")

    # Verify DB: both title and application_id remain unchanged (atomic integrity)
    db_session.expire_all()
    db_rem = db_session.execute(select(Reminder).where(Reminder.id == rem_a_id)).scalar_one_or_none()
    assert db_rem.title == "Google Prep"
    assert db_rem.application_id == app_a1_id


def test_authentication_failures_and_deleted_user_token(client, db_session):
    """
    Test H: Verify authentication controls (missing, malformed, expired tokens) and deleted user token rejection
    """
    # 1. No token
    assert client.get("/users/me").status_code == 401
    
    # 2. Malformed token
    r_mal = client.get("/users/me", headers={"Authorization": "Bearer malformedtoken123"})
    assert r_mal.status_code == 401
    assert "WWW-Authenticate" in r_mal.headers

    # 3. Expired or tampered token (invalid signature)
    r_tamp = client.get("/users/me", headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.tampersig"})
    assert r_tamp.status_code == 401

    # 4. Deleted user token behavior
    email_c = "userc_del@test-integration.com"
    pwd = "passwordC123"

    register_user(client, "User C", email_c, pwd)
    token_c = login_user(client, email_c, pwd).json()["access_token"]
    headers_c = {"Authorization": f"Bearer {token_c}"}

    # Verify token works
    assert client.get("/users/me", headers=headers_c).status_code == 200

    # Delete User C
    assert client.delete("/users/me", headers=headers_c).status_code == 204

    # Re-verify token -> 401 (database query check in dependency gets None)
    assert client.get("/users/me", headers=headers_c).status_code == 401


def test_validation_boundaries_and_integrity(client, db_session):
    """
    Test I: Verify validation boundaries (422 returns do not persist corrupted records)
    """
    email = "usera_val@test-integration.com"
    pwd = "passwordA123"

    register_user(client, "User A", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to POST with validation failure
    # Short title for reminder
    r_val = client.post("/reminders", json={"title": "a", "reminder_date": "2026-07-20T10:00:00Z"}, headers=headers)
    assert r_val.status_code == 422

    # Verify nothing was added
    db_session.expire_all()
    rems = db_session.execute(select(Reminder).join(User).where(User.email == email)).scalars().all()
    assert len(rems) == 0


def test_application_deletion_cascade_set_null_relationship(client, db_session):
    """
    Test J: Verify Application deletion preserves Reminders (NULL application_id) but deletes Interviews (ON DELETE SET NULL verification)
    """
    email = "usera_cascade@test-integration.com"
    pwd = "passwordA123"

    register_user(client, "User A", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create parent application
    app_data = client.post("/applications", json={"company_name": "Google", "job_role": "SWE"}, headers=headers).json()
    app_id = app_data["id"]

    # Create related interview
    int_data = client.post(f"/applications/{app_id}/interviews", json={"round_name": "Coding", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online"}, headers=headers).json()
    int_id = int_data["id"]

    # Create related reminder
    rem_data = client.post("/reminders", json={"title": "Google Prep", "reminder_date": "2026-07-20T10:00:00Z", "application_id": app_id}, headers=headers).json()
    rem_id = rem_data["id"]

    # Delete Application
    r_del = client.delete(f"/applications/{app_id}", headers=headers)
    assert r_del.status_code == 204

    # Verify using fresh DB session
    check_db = SessionLocal()
    try:
        # 1. Application is deleted
        app_db = check_db.execute(select(Application).where(Application.id == app_id)).scalar_one_or_none()
        assert app_db is None

        # 2. Interview is deleted (ORM Cascade)
        int_db = check_db.execute(select(Interview).where(Interview.id == int_id)).scalar_one_or_none()
        assert int_db is None

        # 3. Reminder is preserved, but application_id is NULL
        rem_db = check_db.execute(select(Reminder).where(Reminder.id == rem_id)).scalar_one_or_none()
        assert rem_db is not None
        assert rem_db.application_id is None
        assert rem_db.title == "Google Prep"

        # 4. Reminder remains accessible to User A
        r_get = client.get("/reminders", headers=headers)
        assert r_get.status_code == 200
        rems_returned = r_get.json()
        assert len(rems_returned) == 1
        assert rems_returned[0]["id"] == rem_id
    finally:
        check_db.close()


def test_user_deletion_cascade_cleanup(client, db_session):
    """
    Test K: Verify User deletion cascade deletes all downstream records
    """
    email = "userd_cascade@test-integration.com"
    pwd = "passwordD123"

    # Register & Login User D
    register_user(client, "User D", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create resources
    app_data = client.post("/applications", json={"company_name": "Google", "job_role": "SWE"}, headers=headers).json()
    app_id = app_data["id"]

    int_data = client.post(f"/applications/{app_id}/interviews", json={"round_name": "Coding", "interview_date": "2026-07-20T10:00:00Z", "interview_mode": "Online"}, headers=headers).json()
    int_id = int_data["id"]

    rem1_data = client.post("/reminders", json={"title": "General Task", "reminder_date": "2026-07-20T10:00:00Z", "application_id": None}, headers=headers).json()
    rem1_id = rem1_data["id"]

    rem2_data = client.post("/reminders", json={"title": "Specific Task", "reminder_date": "2026-07-22T10:00:00Z", "application_id": app_id}, headers=headers).json()
    rem2_id = rem2_data["id"]

    # Delete User D
    assert client.delete("/users/me", headers=headers).status_code == 204

    # Verify everything deleted in a fresh database session
    check_db = SessionLocal()
    try:
        assert check_db.execute(select(Application).where(Application.id == app_id)).scalar_one_or_none() is None
        assert check_db.execute(select(Interview).where(Interview.id == int_id)).scalar_one_or_none() is None
        assert check_db.execute(select(Reminder).where(Reminder.id == rem1_id)).scalar_one_or_none() is None
        assert check_db.execute(select(Reminder).where(Reminder.id == rem2_id)).scalar_one_or_none() is None
    finally:
        check_db.close()


def test_datetime_timezone_normalization(client, db_session):
    """
    Test L: Verify timezone-aware ISO 8601 datetime inputs serialize and sort correctly
    """
    email = "usera_tz@test-integration.com"
    pwd = "passwordA123"

    register_user(client, "User A", email, pwd)
    token = login_user(client, email, pwd).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. POST reminders with timezone-aware ISO 8601 strings
    # Target values:
    # r1: 2026-07-20T10:00:00+02:00 (equivalent to 08:00:00 UTC)
    # r2: 2026-07-20T09:00:00Z (equivalent to 09:00:00 UTC - later than r1)
    payload_r1 = {"title": "Task 1", "reminder_date": "2026-07-20T10:00:00+02:00"}
    payload_r2 = {"title": "Task 2", "reminder_date": "2026-07-20T09:00:00Z"}

    r_r1 = client.post("/reminders", json=payload_r1, headers=headers)
    r_r2 = client.post("/reminders", json=payload_r2, headers=headers)

    assert r_r1.status_code == 201
    assert r_r2.status_code == 201
    r1_id = r_r1.json()["id"]
    r2_id = r_r2.json()["id"]

    # 2. Verify list results sorted by date ASC (Task 1 at 08:00 UTC should appear before Task 2 at 09:00 UTC)
    rems = client.get("/reminders", headers=headers).json()
    assert len(rems) == 2
    assert rems[0]["id"] == r1_id
    assert rems[1]["id"] == r2_id
