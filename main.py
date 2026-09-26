"""
IPSS — Intelligent Product Scheduling System
Root entry point to launch the FastAPI server and static frontend.
"""
import sys
import os

# Ensure workspace root is in sys.path
_project_root = os.path.dirname(os.path.abspath(__file__))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  Starting IPSS (Intelligent Product Scheduling System)")
    print("  Application: http://localhost:8000")
    print("  Login Page:  http://localhost:8000/login.html")
    print("  API Docs:    http://localhost:8000/docs")
    print("=" * 60 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
