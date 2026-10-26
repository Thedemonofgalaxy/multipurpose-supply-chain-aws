@echo off
title Deploy AWS CloudChain SCM to GitHub
echo ========================================================
echo    Deploy AWS CloudChain SCM to GitHub
echo ========================================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist .git (
    echo [*] Initializing Git repository...
    git init -b main
) else (
    echo [*] Git repository already initialized.
    git branch -M main
)

echo [*] Staging project files...
git add .

echo [*] Committing changes...
git commit -m "Initial commit: AWS CloudChain SCM multipurpose prototype"

echo.
echo ========================================================
echo  Next Steps to Push to your GitHub Account:
echo ========================================================
echo 1. Create a new repository on GitHub: https://github.com/new
echo    (Name it e.g. 'multipurpose-supply-chain-aws')
echo 2. Run the following command (replace with your repo URL):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/multipurpose-supply-chain-aws.git
echo    git push -u origin main
echo.
echo ========================================================
set /p REPO_URL="Enter your GitHub Repository URL (or press ENTER to skip): "

if not "%REPO_URL%"=="" (
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    echo [*] Pushing to %REPO_URL%...
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] Project successfully deployed to GitHub!
    ) else (
        echo.
        echo [NOTE] Push completed or requires GitHub authentication.
    )
)

echo.
pause
