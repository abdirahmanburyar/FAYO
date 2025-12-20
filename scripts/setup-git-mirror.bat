@echo off
REM Setup Git Mirror to VPS (Windows)
REM This script sets up automatic mirroring from local git to VPS

setlocal

set VPS_HOST=72.62.51.50
set VPS_USER=root
set VPS_PATH=/root/fayo

echo 🚀 Setting up Git Mirror to VPS
echo VPS: %VPS_USER%@%VPS_HOST%:%VPS_PATH%

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Error: Not in a git repository!
    exit /b 1
)

REM Check if VPS remote already exists
git remote get-url vps >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  VPS remote already exists. Updating...
    git remote set-url vps %VPS_USER%@%VPS_HOST%:%VPS_PATH%
) else (
    echo ➕ Adding VPS remote...
    git remote add vps %VPS_USER%@%VPS_PATH%
)

REM Test SSH connection
echo 🔍 Testing SSH connection...
ssh -o ConnectTimeout=5 %VPS_USER%@%VPS_HOST% "echo Connection successful" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH connection failed!
    echo Please set up SSH keys or configure SSH access first.
    exit /b 1
)
echo ✅ SSH connection successful

REM Setup VPS git repository
echo 📦 Setting up VPS git repository...
(
echo mkdir -p %VPS_PATH%
echo cd %VPS_PATH%
echo if [ ! -d .git ]; then git init; git config receive.denyCurrentBranch warn; fi
echo mkdir -p .git/hooks
echo cat ^> .git/hooks/post-receive ^<< 'HOOK_EOF'
echo #!/bin/bash
echo cd %VPS_PATH%
echo unset GIT_DIR
echo git checkout -f
echo ✅ Code updated on VPS
echo HOOK_EOF
echo chmod +x .git/hooks/post-receive
) | ssh %VPS_USER%@%VPS_HOST%

REM Create local post-commit hook
echo 📝 Creating local post-commit hook...
if not exist ".git\hooks" mkdir .git\hooks

(
echo #!/bin/bash
echo VPS_HOST="%VPS_HOST%"
echo VPS_USER="%VPS_USER%"
echo VPS_PATH="%VPS_PATH%"
echo echo 🔄 Auto-pushing to VPS...
echo git push vps HEAD:main 2^>^&1 ^|^| git push vps HEAD:master 2^>^&1 ^|^| ^{
echo     echo ⚠️  Auto-push failed, but commit was successful
echo ^}
) > .git\hooks\post-commit

echo.
echo ✅ Git mirror setup complete!
echo.
echo 📋 What happens now:
echo    1. Every time you commit, code will auto-push to VPS
echo    2. VPS will auto-update when it receives the push
echo    3. Manual push: git push vps
echo.
echo 🔧 To disable auto-push, remove .git\hooks\post-commit

endlocal

