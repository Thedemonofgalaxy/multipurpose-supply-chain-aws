@echo off
title AWS CloudChain SCM Platform
echo ========================================================
echo    Starting AWS CloudChain SCM (FastAPI + Cloud Hub)
echo ========================================================
echo.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

echo Starting application server...
echo Dashboard will be available at: http://127.0.0.1:8000
echo API Documentation (Swagger) at: http://127.0.0.1:8000/docs
echo.
python app.py
pause
