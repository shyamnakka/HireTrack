import urllib.request
import urllib.error
import json
import sys

print("--- RUNNING AUTHENTICATION INTEGRATION VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

# Unique test user
test_user = {
    "name": "Frontend Test User",
    "email": "frontend_test_auth@test-integration.com",
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
    except Exception as e:
        print(f"Connection error to {url}: {e}")
        sys.exit(1)

# Cleanup helper
def cleanup_test_user():
    # Login as admin or just delete user by logging in and calling DELETE /users/me
    status, token_resp = send_request("/auth/login", {
        "email": test_user["email"],
        "password": test_user["password"]
    })
    if status == 200:
        token = token_resp["access_token"]
        delete_status, _ = send_request("/users/me", method="DELETE", token=token)
        print(f"Cleanup user status: {delete_status}")

# Run cleanup first
cleanup_test_user()

# 1. Register new temporary frontend test user
status, body = send_request("/auth/register", test_user)
print(f"1. Register Status: {status}")
assert status == 201, "Failed to register test user"
assert "password" not in body, "Response exposed password"
assert "password_hash" not in body, "Response exposed password_hash"

# 2. Duplicate registration returns 409
status, body = send_request("/auth/register", test_user)
print(f"2. Duplicate Register Status: {status}")
assert status == 409, "Failed to reject duplicate email with 409"
assert body.get("detail") == "Email already registered"

# 3. Login with correct credentials succeeds
status, body = send_request("/auth/login", {
    "email": test_user["email"],
    "password": test_user["password"]
})
print(f"3. Login Status: {status}")
assert status == 200, "Failed to login with correct credentials"
assert "access_token" in body, "Missing access token"
assert body.get("token_type") == "bearer", "Token type mismatch"
token = body["access_token"]

# 4. Login with wrong password handles 401
status, body = send_request("/auth/login", {
    "email": test_user["email"],
    "password": "wrongpassword"
})
print(f"4. Login Wrong Password Status: {status}")
assert status == 401, "Failed to reject wrong password with 401"

# 5. Token is attached to GET /users/me
status, body = send_request("/users/me", token=token, method="GET")
print(f"5. GET /users/me Status: {status}")
assert status == 200, "Failed to retrieve user profile"
assert body.get("email") == test_user["email"], "User email mismatch"

# 6. Malformed email validation is handled (422)
status, body = send_request("/auth/register", {
    "name": "Invalid Email",
    "email": "notanemail",
    "password": "testpassword123"
})
print(f"6. Malformed Email Register Status: {status}")
assert status == 422, "Failed to reject malformed email with 422"

# 7. Short password validation is handled (422)
status, body = send_request("/auth/register", {
    "name": "Short Password",
    "email": "shortpwd@test-integration.com",
    "password": "short"
})
print(f"7. Short Password Register Status: {status}")
assert status == 422, "Failed to reject short password with 422"

# 8. Deleted-user token is rejected with 401
# Delete test user
status, _ = send_request("/users/me", method="DELETE", token=token)
print(f"8. Delete User Status: {status}")
assert status == 204, "Failed to delete user profile"

# Re-authenticate with old token
status, body = send_request("/users/me", token=token, method="GET")
print(f"9. GET /users/me with deleted-user token Status: {status}")
assert status == 401, "Failed to reject deleted-user token with 401"

print("\nAuthentication Integration Verification: SUCCESSFUL!")
