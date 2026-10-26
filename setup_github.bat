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
    echo [*] Git repository active on branch main.
    git branch -M main
)

echo [*] Staging all files...
git add .

echo [*] Committing changes (if any)...
git commit -m "feat: AWS CloudChain SCM multipurpose prototype" 2>nul

set REPO_URL=https://github.com/Thedemonofgalaxy/multipurpose-supply-chain-aws.git

echo.
echo [*] Target Repository: %REPO_URL%
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [*] Pushing to GitHub (main branch)...
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Project deployed successfully to GitHub!
    echo  View it here: https://github.com/Thedemonofgalaxy/multipurpose-supply-chain-aws
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  [AUTHENTICATION REQUIRED]
    echo  If a browser window opened, click "Sign in with your browser"
    echo  to authenticate with GitHub account: Thedemonofgalaxy.
    echo.
    echo  Alternatively, you can push using a Personal Access Token:
    echo  git push https://Thedemonofgalaxy:YOUR_TOKEN@github.com/Thedemonofgalaxy/multipurpose-supply-chain-aws.git main
    echo ========================================================
)

echo.
pause
