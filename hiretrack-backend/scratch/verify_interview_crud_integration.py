import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING INTERVIEW CRUD INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Setup test users
user_a = {
    "name": "User A Int",
    "email": "user_a_int@test-integration.com",
    "password": "testpassword123"
}

user_b = {
    "name": "User B Int",
    "email": "user_b_int@test-integration.com",
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

# 2. Create Application A1 under User A
_, a1 = send_request("/applications", {
    "company_name": "Google",
    "job_role": "SWE"
}, token=token_a)
a1_id = a1["id"]

# 3. Verify empty nested interviews list
status, ints = send_request(f"/applications/{a1_id}/interviews", token=token_a, method="GET")
assert status == 200 and len(ints) == 0

# 4. Create Interview I1 (scheduled later: 2030-08-20T10:00:00Z)
status, i1 = send_request(f"/applications/{a1_id}/interviews", {
    "round_name": "Technical Round 2",
    "interview_date": "2030-08-20T10:00:00Z",
    "interview_mode": "Online",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
}, token=token_a)
assert status == 201
i1_id = i1["id"]

# 5. Create Interview I2 (scheduled earlier: 2030-08-10T10:00:00Z)
status, i2 = send_request(f"/applications/{a1_id}/interviews", {
    "round_name": "Technical Round 1",
    "interview_date": "2030-08-10T10:00:00Z",
    "interview_mode": "Online"
}, token=token_a)
assert status == 201
i2_id = i2["id"]

# 6. Verify listing order is interview_date ASC (I2 then I1)
status, ints = send_request(f"/applications/{a1_id}/interviews", token=token_a, method="GET")
assert status == 200 and len(ints) == 2
assert ints[0]["id"] == i2_id
assert ints[1]["id"] == i1_id

# 7. Retrieve single interview details
status, details = send_request(f"/interviews/{i1_id}", token=token_a, method="GET")
assert status == 200
assert details["round_name"] == "Technical Round 2"

# 8. Result-only PATCH preserves other fields
status, updated = send_request(f"/interviews/{i1_id}", {
    "result": "Cleared"
}, method="PATCH", token=token_a)
assert status == 200
assert updated["result"] == "Cleared"
assert updated["round_name"] == "Technical Round 2"  # preserved
assert updated["meeting_link"] == "https://meet.google.com/abc-defg-hij"  # preserved

# 9. Explicit-null clearing works
status, updated_null = send_request(f"/interviews/{i1_id}", {
    "meeting_link": None
}, method="PATCH", token=token_a)
assert status == 200
assert updated_null["meeting_link"] is None
assert updated_null["result"] == "Cleared"  # preserved

# 10. Invalid interview mode handles 422
status, _ = send_request(f"/interviews/{i1_id}", {
    "interview_mode": "NotAMode"
}, method="PATCH", token=token_a)
assert status == 422

# 11. Cross-user Interview access handles 404
# GET
status, _ = send_request(f"/interviews/{i1_id}", token=token_b, method="GET")
assert status == 404
# PATCH
status, _ = send_request(f"/interviews/{i1_id}", {"round_name": "Hack"}, method="PATCH", token=token_b)
assert status == 404
# DELETE
status, _ = send_request(f"/interviews/{i1_id}", method="DELETE", token=token_b)
assert status == 404
# Create under other user's app
status, _ = send_request(f"/applications/{a1_id}/interviews", {
    "round_name": "Hack",
    "interview_date": "2030-08-10T10:00:00Z",
    "interview_mode": "Online"
}, token=token_b)
assert status == 404

# 12. Delete Interview I1 (returns 204 behavior)
status, _ = send_request(f"/interviews/{i1_id}", method="DELETE", token=token_a)
assert status == 204

# 13. Verify deleted and parent intact
status, _ = send_request(f"/interviews/{i1_id}", token=token_a, method="GET")
assert status == 404

status, app_details = send_request(f"/applications/{a1_id}", token=token_a, method="GET")
assert status == 200
assert app_details["company_name"] == "Google"

# Cleanup test users
send_request("/users/me", method="DELETE", token=token_a)
send_request("/users/me", method="DELETE", token=token_b)

print("\nInterview CRUD Integration Verification: SUCCESSFUL!")
