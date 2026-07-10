import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING DASHBOARD INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Unique test user for dashboard
test_user = {
    "name": "Dashboard Tester",
    "email": "dash_test_user@test-integration.com",
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

# 1. Register and Login
send_request("/auth/register", test_user)
_, token_resp = send_request("/auth/login", {
    "email": test_user["email"],
    "password": test_user["password"]
})
token = token_resp["access_token"]

# 2. Setup Test Data
# Create App A1 (Active - Applied)
_, app_a1 = send_request("/applications", {
    "company_name": "Google",
    "job_role": "SWE",
    "status": "Applied"
}, token=token)
app_a1_id = app_a1["id"]

# Create App A2 (Active - Technical Interview)
_, app_a2 = send_request("/applications", {
    "company_name": "Meta",
    "job_role": "SWE",
    "status": "Technical Interview"
}, token=token)
app_a2_id = app_a2["id"]

# Create App A3 (Inactive - Selected)
_, app_a3 = send_request("/applications", {
    "company_name": "Netflix",
    "job_role": "SWE",
    "status": "Selected"
}, token=token)

# Create 2 Interviews under A1 (one upcoming, one past)
# Upcoming
_, int_up = send_request(f"/applications/{app_a1_id}/interviews", {
    "round_name": "Coding",
    "interview_date": "2030-07-20T10:00:00Z",
    "interview_mode": "Online",
    "result": "Pending"
}, token=token)

# Past
_, int_past = send_request(f"/applications/{app_a1_id}/interviews", {
    "round_name": "Past Screen",
    "interview_date": "2020-07-20T10:00:00Z",
    "interview_mode": "Online",
    "result": "Pending"
}, token=token)

# Create Reminders
# Pending Reminder
_, rem_pend = send_request("/reminders", {
    "title": "Google Prep",
    "reminder_date": "2030-07-20T10:00:00Z",
    "is_completed": False,
    "application_id": app_a1_id
}, token=token)

# Completed Reminder
_, rem_comp = send_request("/reminders", {
    "title": "Netflix Action",
    "reminder_date": "2030-07-20T10:00:00Z",
    "is_completed": True,
    "application_id": None
}, token=token)

# 3. Simulate Dashboard Logic
# Fetch applications
_, apps = send_request("/applications", token=token, method="GET")
assert len(apps) == 3, "Applications length mismatch"

# Fetch reminders
_, rems = send_request("/reminders", token=token, method="GET")
assert len(rems) == 2, "Reminders length mismatch"

# Fetch interviews nested
all_interviews = []
for app in apps:
    _, ints = send_request(f"/applications/{app['id']}/interviews", token=token, method="GET")
    all_interviews.extend(ints)

assert len(all_interviews) == 2, "Interviews length mismatch"

# Calculate Metrics
active_statuses = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview']
active_apps_count = len([app for app in apps if app["status"] in active_statuses])
print(f"Calculated Active Apps: {active_apps_count}")
assert active_apps_count == 2, "Active applications count incorrect (must be 2: Google, Meta)"

pending_reminders_count = len([rem for rem in rems if not rem["is_completed"]])
print(f"Calculated Pending Reminders: {pending_reminders_count}")
assert pending_reminders_count == 1, "Pending reminders count incorrect"

# Clean up Test User
del_status, _ = send_request("/users/me", token=token, method="DELETE")
print(f"Cleanup Status: {del_status}")
assert del_status == 204

print("\nDashboard Integration Verification: SUCCESSFUL!")
