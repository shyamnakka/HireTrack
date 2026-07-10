import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING APPLICATION CRUD INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Setup two test users (User A and User B)
user_a = {
    "name": "User A CRUD",
    "email": "user_a_crud@test-integration.com",
    "password": "testpassword123"
}

user_b = {
    "name": "User B CRUD",
    "email": "user_b_crud@test-integration.com",
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

# 1. Register and Login User A & B
send_request("/auth/register", user_a)
_, login_a = send_request("/auth/login", {"email": user_a["email"], "password": user_a["password"]})
token_a = login_a["access_token"]

send_request("/auth/register", user_b)
_, login_b = send_request("/auth/login", {"email": user_b["email"], "password": user_b["password"]})
token_b = login_b["access_token"]

# 2. Empty list renders correctly
status, apps = send_request("/applications", token=token_a, method="GET")
assert status == 200 and len(apps) == 0, "Initial applications list not empty"

# 3. Create A1
status, a1 = send_request("/applications", {
    "company_name": "Google",
    "job_role": "SWE",
    "job_location": "Bangalore",
    "package_amount": 1500000.00
}, token=token_a)
assert status == 201
a1_id = a1["id"]

# 4. Create A2
status, a2 = send_request("/applications", {
    "company_name": "Meta",
    "job_role": "SWE",
    "job_location": "London"
}, token=token_a)
assert status == 201
a2_id = a2["id"]

# 5. List shows real records, newest first (A2 then A1)
status, apps = send_request("/applications", token=token_a, method="GET")
assert status == 200 and len(apps) == 2
assert apps[0]["id"] == a2_id
assert apps[1]["id"] == a1_id

# 6. Details page loads A1
status, details = send_request(f"/applications/{a1_id}", token=token_a, method="GET")
assert status == 200
assert details["company_name"] == "Google"

# 7. Status-only PATCH preserves unrelated fields
status, updated = send_request(f"/applications/{a1_id}", {
    "status": "Technical Interview"
}, method="PATCH", token=token_a)
assert status == 200
assert updated["status"] == "Technical Interview"
assert updated["job_location"] == "Bangalore"  # preserved
assert float(updated["package_amount"]) == 1500000.00  # preserved

# 8. Explicit-null clearing works
status, updated_null = send_request(f"/applications/{a1_id}", {
    "job_location": None
}, method="PATCH", token=token_a)
assert status == 200
assert updated_null["job_location"] is None
assert float(updated_null["package_amount"]) == 1500000.00  # preserved

# 9. Invalid status receives 422
status, _ = send_request(f"/applications/{a1_id}", {
    "status": "NotAStatus"
}, method="PATCH", token=token_a)
assert status == 422

# 10. Cross-user application access handles 404
status, _ = send_request(f"/applications/{a1_id}", token=token_b, method="GET")
assert status == 404

# 11. Cross-user PATCH handles 404
status, _ = send_request(f"/applications/{a1_id}", {"company_name": "Hack"}, method="PATCH", token=token_b)
assert status == 404

# 12. Cross-user DELETE handles 404
status, _ = send_request(f"/applications/{a1_id}", method="DELETE", token=token_b)
assert status == 404

# 13. Create related interview and reminder for relationship cascade verification
_, interview = send_request(f"/applications/{a1_id}/interviews", {
    "round_name": "Screening",
    "interview_date": "2030-07-20T10:00:00Z",
    "interview_mode": "Online"
}, token=token_a)
int_id = interview["id"]

_, reminder = send_request("/reminders", {
    "title": "Google Prep",
    "reminder_date": "2030-07-20T10:00:00Z",
    "application_id": a1_id
}, token=token_a)
rem_id = reminder["id"]

# 14. Delete Application (returns 204 behavior)
status, _ = send_request(f"/applications/{a1_id}", method="DELETE", token=token_a)
assert status == 204

# 15. Deleted Application returns 404
status, _ = send_request(f"/applications/{a1_id}", token=token_a, method="GET")
assert status == 404

# 16. Related Interview is deleted
status, _ = send_request(f"/interviews/{int_id}", token=token_a, method="GET")
assert status == 404

# 17. Related Reminder is preserved, but application_id is null
status, rem_details = send_request(f"/reminders/{rem_id}", token=token_a, method="GET")
assert status == 200
assert rem_details["application_id"] is None
assert rem_details["title"] == "Google Prep"

# Cleanup test users
send_request("/users/me", method="DELETE", token=token_a)
send_request("/users/me", method="DELETE", token=token_b)

print("\nApplication CRUD Integration Verification: SUCCESSFUL!")
