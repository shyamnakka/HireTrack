import urllib.request
import urllib.error
import json

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

user = {
    "name": "Delete Tester",
    "email": "delete_tester@test-integration.com",
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
            body = response.read()
            headers = dict(response.info())
            return status, body, headers
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.info())

# 1. Register & Login
send_request("/auth/register", user)
_, login_body, _ = send_request("/auth/login", {"email": user["email"], "password": user["password"]})
token = json.loads(login_body.decode('utf-8'))["access_token"]

# 2. Create Application
_, app_body, _ = send_request("/applications", {"company_name": "InspectInc", "job_role": "Tester"}, token=token)
app_id = json.loads(app_body.decode('utf-8'))["id"]

# 3. Delete Application and print info
status, body, headers = send_request(f"/applications/{app_id}", method="DELETE", token=token)

print("--- DELETE RESPONSE INSPECTION RESULTS ---")
print(f"HTTP Status Code: {status}")
print(f"Response Body (bytes): {body}")
print(f"Response Body Length: {len(body)}")
print("Response Headers:")
for k, v in headers.items():
    print(f"  {k}: {v}")

# Cleanup user
send_request("/users/me", method="DELETE", token=token)
