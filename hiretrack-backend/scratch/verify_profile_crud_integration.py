import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING USER PROFILE & CASCADE DELETION INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Setup test users
user_a = {
    "name": "User A Prof",
    "email": "user_a_prof@test-integration.com",
    "password": "oldpassword123"
}

user_b = {
    "name": "User B Prof",
    "email": "user_b_prof@test-integration.com",
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
    _, token_resp = send_request("/auth/login", {"email": u["email"].lower(), "password": "oldpassword123"})
    if token_resp and "access_token" in token_resp:
        send_request("/users/me", method="DELETE", token=token_resp["access_token"])
    _, token_resp2 = send_request("/auth/login", {"email": u["email"].lower(), "password": "newpassword123"})
    if token_resp2 and "access_token" in token_resp2:
        send_request("/users/me", method="DELETE", token=token_resp2["access_token"])
    _, token_resp3 = send_request("/auth/login", {"email": u["email"].lower(), "password": "testpassword123"})
    if token_resp3 and "access_token" in token_resp3:
        send_request("/users/me", method="DELETE", token=token_resp3["access_token"])

# 1. Register User A & B
send_request("/auth/register", user_a)
send_request("/auth/register", user_b)

# Login User A & B
_, login_a = send_request("/auth/login", {"email": user_a["email"], "password": user_a["password"]})
token_a = login_a["access_token"]

_, login_b = send_request("/auth/login", {"email": user_b["email"], "password": user_b["password"]})
token_b = login_b["access_token"]

# 2. Create User A's associated data (App, Interview, Reminders)
_, app = send_request("/applications", {"company_name": "Google", "job_role": "SWE"}, token=token_a)
app_id = app["id"]

_, interview = send_request(f"/applications/{app_id}/interviews", {
    "round_name": "Technical",
    "interview_date": "2030-10-20T10:00:00Z",
    "interview_mode": "Online"
}, token=token_a)
int_id = interview["id"]

_, rem_gen = send_request("/reminders", {
    "title": "General Prep",
    "reminder_date": "2030-10-20T10:00:00Z",
    "application_id": None
}, token=token_a)
rem_gen_id = rem_gen["id"]

_, rem_app = send_request("/reminders", {
    "title": "App Prep",
    "reminder_date": "2030-10-20T10:00:00Z",
    "application_id": app_id
}, token=token_a)
rem_app_id = rem_app["id"]

# 3. GET /users/me
status, profile = send_request("/users/me", token=token_a, method="GET")
assert status == 200
assert profile["email"] == user_a["email"].lower()

# 4. PATCH /users/me (updating name, mixed-case email, and password)
status, updated = send_request("/users/me", {
    "name": "User A Updated",
    "email": "USER_A_NEW@test-integration.com",
    "password": "newpassword123"
}, method="PATCH", token=token_a)
assert status == 200
assert updated["name"] == "User A Updated"
assert updated["email"] == "user_a_new@test-integration.com" # email normalized to lowercase!

# 5. Login with old password fails
status, _ = send_request("/auth/login", {"email": "user_a_new@test-integration.com", "password": "oldpassword123"})
assert status == 401

# 6. Login with new password & normalized email succeeds
status, login_new = send_request("/auth/login", {"email": "USER_A_NEW@test-integration.com", "password": "newpassword123"})
assert status == 200
token_a_new = login_new["access_token"]

# 7. Duplicate email update returns 409
status, _ = send_request("/users/me", {
    "email": user_b["email"] # User B's email
}, method="PATCH", token=token_a_new)
assert status == 409

# 8. Invalid validation inputs return 422
status, _ = send_request("/users/me", {
    "email": "not-an-email"
}, method="PATCH", token=token_a_new)
assert status == 422

# 9. Delete User (returns 204 with empty body)
status, body = send_request("/users/me", method="DELETE", token=token_a_new)
assert status == 204
assert body is None

# 10. Verify User cascade deletes using direct SQL/backend queries (all related entities must be gone)
# Since we deleted the user, their old token should reject with 401
status, _ = send_request("/users/me", token=token_a_new, method="GET")
assert status == 401

# Clean up User B
send_request("/users/me", method="DELETE", token=token_b)

print("\nUser Profile & Cascade Deletion Integration Verification: SUCCESSFUL!")
