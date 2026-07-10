import sys
sys.path.append(r"c:\Users\abc\Desktop\Hire Track\hiretrack-backend")

from sqlalchemy import select
from app.database import SessionLocal
from app.crud.user import create_user, delete_user, get_user_by_email, get_user_by_id
from app.crud.application import create_application, get_application_by_id, delete_application
from app.crud.interview import create_interview, get_interview_by_id
from app.crud.reminder import create_reminder, get_reminder_by_id
from app.schemas.user import UserCreate
from app.schemas.application import ApplicationCreate
from app.schemas.interview import InterviewCreate
from app.schemas.reminder import ReminderCreate
from app.models.user import User
from app.models.application import Application
from app.models.interview import Interview
from app.models.reminder import Reminder

print("--- RUNNING CASCADE ALIGNMENT TESTS ---")

db = SessionLocal()

# Setup test user A and B
email_a = "cascade_align_a@example.com"
email_b = "cascade_align_b@example.com"

# Cleanup
for email in [email_a, email_b]:
    u = get_user_by_email(db, email)
    if u:
        delete_user(db, u)

try:
    # 1. Create User A
    user_in = UserCreate(name="User A", email=email_a, password="passwordA123")
    user_a = create_user(db, user_in)
    user_a_id = user_a.id
    print(f"Created User A: ID={user_a_id}")

    # 2. Create Application A
    app_in = ApplicationCreate(company_name="Google", job_role="SWE", status="Applied")
    app_a = create_application(db, user_a_id, app_in)
    app_a_id = app_a.id
    print(f"Created Application A: ID={app_a_id}")

    # 3. Create Interview linked to Application A
    int_in = InterviewCreate(round_name="Coding Round", interview_date="2026-07-20T10:00:00Z", interview_mode="Online")
    int_a = create_interview(db, app_a_id, user_a_id, int_in)
    int_a_id = int_a.id
    print(f"Created Interview A: ID={int_a_id}")

    # 4. Create Reminder linked to Application A
    rem_in = ReminderCreate(title="Google Prep", reminder_date="2026-07-20T10:00:00Z", application_id=app_a_id)
    rem_a = create_reminder(db, user_a_id, rem_in)
    rem_a_id = rem_a.id
    print(f"Created Reminder A: ID={rem_a_id}")

    # 5. Delete Application A
    db_app = get_application_by_id(db, app_a_id, user_a_id)
    delete_application(db, db_app)
    print("Deleted Application A.")

    # 6. Verify Application deleted
    db.expire_all()
    app_check = get_application_by_id(db, app_a_id, user_a_id)
    if app_check is None:
        print("Verify Application Deleted: PASSED")
    else:
        print("Verify Application Deleted: FAILED")

    # 7. Verify Interview deleted
    int_check = get_interview_by_id(db, int_a_id, user_a_id)
    if int_check is None:
        print("Verify Interview Deleted: PASSED")
    else:
        print("Verify Interview Deleted: FAILED")

    # 8. Verify Reminder still exists
    rem_check = get_reminder_by_id(db, rem_a_id, user_a_id)
    if rem_check is not None:
        print("Verify Reminder Still Exists: PASSED")
        # 9. Verify Reminder.application_id is NULL
        if rem_check.application_id is None:
            print("Verify Reminder.application_id is NULL: PASSED")
        else:
            print(f"Verify Reminder.application_id is NULL: FAILED (value={rem_check.application_id})")
        # 10. Verify Reminder.user_id is unchanged
        if rem_check.user_id == user_a_id:
            print("Verify Reminder.user_id is unchanged: PASSED")
        else:
            print(f"Verify Reminder.user_id is unchanged: FAILED (value={rem_check.user_id})")
        # 11. Verify Reminder is still accessible to its owner
        print("Verify Reminder is still accessible to its owner: PASSED")
    else:
        print("Verify Reminder Still Exists: FAILED")

    # 12. Clean all temporary test data
    if rem_check:
        from app.crud.reminder import delete_reminder
        delete_reminder(db, rem_check)
    if user_a:
        delete_user(db, user_a)
    print("Cleaned User A and remaining test data.")

    # 13. Verify User deletion behavior separately
    # - Create User B
    user_in_b = UserCreate(name="User B", email=email_b, password="passwordB123")
    user_b = create_user(db, user_in_b)
    user_b_id = user_b.id
    print(f"Created User B: ID={user_b_id}")

    # - Create Reminder
    rem_in_b = ReminderCreate(title="User B Task", reminder_date="2026-07-20T10:00:00Z", application_id=None)
    rem_b = create_reminder(db, user_b_id, rem_in_b)
    rem_b_id = rem_b.id
    print(f"Created Reminder B: ID={rem_b_id}")

    # - Delete User B
    delete_user(db, user_b)
    print("Deleted User B.")

    # - Verify Reminder B is deleted
    db.expire_all()
    rem_b_db = db.execute(select(Reminder).where(Reminder.id == rem_b_id)).scalar_one_or_none()
    if rem_b_db is None:
        print("Verify User Deletion Cascades to Reminder: PASSED")
    else:
        print("Verify User Deletion Cascades to Reminder: FAILED")

finally:
    db.close()
    print("Cascade alignment tests finished.")
