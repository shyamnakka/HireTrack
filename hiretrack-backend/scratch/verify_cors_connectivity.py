import urllib.request
import urllib.error
import sys

print("--- RUNNING CORS CONNECTIVITY VERIFICATION ---")

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

endpoints = ["/", "/db-health"]

for path in endpoints:
    url = f"{backend_url}{path}"
    req = urllib.request.Request(url)
    req.add_header("Origin", frontend_origin)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            headers = dict(response.info())
            body = response.read().decode('utf-8')
            
            allow_origin = response.info().get('Access-Control-Allow-Origin')
            allow_credentials = response.info().get('Access-Control-Allow-Credentials')
            allow_methods = response.info().get('Access-Control-Allow-Methods')
            allow_headers = response.info().get('Access-Control-Allow-Headers')
            
            print(f"\nEndpoint: {path}")
            print(f"HTTP Status: {status}")
            print("CORS Headers:")
            print(f"  Access-Control-Allow-Origin: {allow_origin}")
            print(f"  Access-Control-Allow-Credentials: {allow_credentials}")
            print(f"  Access-Control-Allow-Methods: {allow_methods}")
            print(f"  Access-Control-Allow-Headers: {allow_headers}")
            print(f"Response Body: {body}")
            
            # Assertions to ensure CORS configured correctly
            assert allow_origin == frontend_origin, "CORS Origin mismatch"
            assert allow_credentials == "true", "CORS Credentials mismatch"
            
    except urllib.error.HTTPError as e:
        print(f"\nEndpoint: {path} - FAILED with HTTPError: {e.code}")
        sys.exit(1)
    except Exception as e:
        print(f"\nEndpoint: {path} - FAILED with error: {e}")
        sys.exit(1)

print("\nCORS Connectivity Verification: SUCCESSFUL!")
