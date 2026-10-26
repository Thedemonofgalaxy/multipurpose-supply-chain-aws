#!/usr/bin/env bash
# AWS CloudChain SCM - Unix/Linux/macOS Launcher

echo "========================================================"
echo "   Starting AWS CloudChain SCM (FastAPI + Cloud Hub)"
echo "========================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found."
    exit 1
fi

echo "Starting application server..."
echo "Dashboard: http://127.0.0.1:8000"
echo "API Docs:  http://127.0.0.1:8000/docs"
echo ""

python3 app.py
