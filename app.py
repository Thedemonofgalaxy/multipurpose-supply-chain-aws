"""
AWS CloudChain SCM - Root Launcher
Usage: python app.py
"""

import sys
import os

# Ensure project root is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from backend.app.main import app

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    
    port = int(os.getenv("PORT", 8000))
    print(f"\n=======================================================")
    print(f"[*] AWS CloudChain SCM - Starting Server")
    print(f"    Dashboard: http://127.0.0.1:{port}")
    print(f"    API Docs:  http://127.0.0.1:{port}/docs")
    print(f"=======================================================\n")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
