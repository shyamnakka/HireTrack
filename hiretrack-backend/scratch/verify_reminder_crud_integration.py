import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING REMINDER CRUD INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Setup test users
user_a = {
    "name": "User A Rem",
    "email": "user_a_rem@test-integration.com",
    "password": "testpassword123"
}

user_b = {
    "name": "User B Rem",
    "email": "user_b_rem@test-integration.com",
    "password": "testpassword123"
}

def send_request(path, data=None, method="POST", token=None):
    url = f"{backend_url}{path}"
    payload = json.dumps(data).encode('utf-8') if data else None
    
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Origin", frontend_origin)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
        
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            return status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, json.loads(body) if body else None

# Clean up existing test users if any
for u in [user_a, user_b]:
    _, token_resp = send_request("/auth/login", {"email": u["email"], "password": u["password"]})
    if token_resp and "access_token" in token_resp:
        send_request("/users/me", method="DELETE", token=token_resp["access_token"])

# 1. Register and Login
send_request("/auth/register", user_a)
_, login_a = send_request("/auth/login", {"email": user_a["email"], "password": user_a["password"]})
token_a = login_a["access_token"]

send_request("/auth/register", user_b)
_, login_b = send_request("/auth/login", {"email": user_b["email"], "password": user_b["password"]})
token_b = login_b["access_token"]

# 2. Create Application A1 under User A, and B1 under User B
_, a1 = send_request("/applications", {"company_name": "Google", "job_role": "SWE"}, token=token_a)
a1_id = a1["id"]

_, b1 = send_request("/applications", {"company_name": "Meta", "job_role": "SWE"}, token=token_b)
b1_id = b1["id"]

# 3. Verify empty reminders list
status, rems = send_request("/reminders", token=token_a, method="GET")
assert status == 200 and len(rems) == 0

# 4. Create General Reminder (application_id = null)
status, r_gen = send_request("/reminders", {
    "title": "General Task",
    "reminder_date": "2030-10-20T10:00:00Z",
    "application_id": None
}, token=token_a)
assert status == 201
assert r_gen["application_id"] is None
r_gen_id = r_gen["id"]

# 5. Create Application-specific Reminder linked to A1
status, r_link = send_request("/reminders", {
    "title": "Google OA Prep",
    "reminder_date": "2030-10-10T10:00:00Z",
    "application_id": a1_id
}, token=token_a)
assert status == 201
assert r_link["application_id"] == a1_id
r_link_id = r_link["id"]

# 6. Verify listing order is reminder_date ASC (r_link then r_gen)
status, rems = send_request("/reminders", token=token_a, method="GET")
assert status == 200 and len(rems) == 2
assert rems[0]["id"] == r_link_id
assert rems[1]["id"] == r_gen_id

# 7. Perform PATCH to toggle is_completed (false -> true)
status, updated = send_request(f"/reminders/{r_link_id}", {
    "is_completed": True
}, method="PATCH", token=token_a)
assert status == 200
assert updated["is_completed"] is True
assert updated["title"] == "Google OA Prep"  # preserved

# 8. Explicit-null clearing of application_id converts linked reminder to general
status, updated_null = send_request(f"/reminders/{r_link_id}", {
    "application_id": None
}, method="PATCH", token=token_a)
assert status == 200
assert updated_null["application_id"] is None

# 9. Create Application A2 under User A and perform reassignment
_, a2 = send_request("/applications", {"company_name": "Netflix", "job_role": "SWE"}, token=token_a)
a2_id = a2["id"]

status, reassigned = send_request(f"/reminders/{r_link_id}", {
    "application_id": a2_id
}, method="PATCH", token=token_a)
assert status == 200
assert reassigned["application_id"] == a2_id

# 10. Unauthorized reassignment of User A Reminder to User B Application B1 returns 404
status, _ = send_request(f"/reminders/{r_link_id}", {
    "application_id": b1_id
}, method="PATCH", token=token_a)
assert status == 404

# 11. Verify atomicity of update: send update with a valid title change and an unauthorized application_id (User B's B1)
# Title change should NOT be saved because the entire transaction should fail/rollback.
status, _ = send_request(f"/reminders/{r_link_id}", {
    "title": "Hacked Title",
    "application_id": b1_id
}, method="PATCH", token=token_a)
assert status == 404

# Verify in database that title remains unchanged and application_id remains A2
_, current_rem = send_request(f"/reminders/{r_link_id}", token=token_a, method="GET")
assert current_rem["title"] == "Google OA Prep"
assert current_rem["application_id"] == a2_id

# 12. Short title creation handles 422
status, _ = send_request("/reminders", {
    "title": "x",
    "reminder_date": "2030-10-10T10:00:00Z"
}, token=token_a)
assert status == 422

# 13. Cross-user Reminder access (User B accessing User A Reminder) returns 404
status, _ = send_request(f"/reminders/{r_link_id}", token=token_b, method="GET")
assert status == 404

status, _ = send_request(f"/reminders/{r_link_id}", {"title": "Hack"}, method="PATCH", token=token_b)
assert status == 404

status, _ = send_request(f"/reminders/{r_link_id}", method="DELETE", token=token_b)
assert status == 404

# 14. Delete Reminder r_gen (returns 204 behavior)
status, _ = send_request(f"/reminders/{r_gen_id}", method="DELETE", token=token_a)
assert status == 204

# 15. Verify deleted Reminder returns 404, and parent user and applications remain fully intact
status, _ = send_request(f"/reminders/{r_gen_id}", token=token_a, method="GET")
assert status == 404

status, app_check = send_request(f"/applications/{a2_id}", token=token_a, method="GET")
assert status == 200
assert app_check["company_name"] == "Netflix"

# 16. Verify application deletion cascade behavior: delete Application A2, and verify that the associated reminder is preserved as a General Reminder (application_id becomes null)
status, _ = send_request(f"/applications/{a2_id}", method="DELETE", token=token_a)
assert status == 204

status, rem_check = send_request(f"/reminders/{r_link_id}", token=token_a, method="GET")
assert status == 200
assert rem_check["application_id"] is None  # preserved as General Reminder!

# Cleanup test users
send_request("/users/me", method="DELETE", token=token_a)
send_request("/users/me", method="DELETE", token=token_b)

print("\nReminder CRUD Integration Verification: SUCCESSFUL!")
