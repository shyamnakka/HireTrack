import urllib.request

backend_url = "http://127.0.0.1:8001"
frontend_origin = "http://localhost:5173"

req = urllib.request.Request(backend_url)
req.add_header("Origin", frontend_origin)

with urllib.request.urlopen(req) as response:
    headers = dict(response.info())
    print("Response Headers:")
    for k, v in headers.items():
        print(f"  {k}: {v}")
