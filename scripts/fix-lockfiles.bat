@echo off
REM Script to fix out-of-sync package-lock.json files on Windows
REM This updates all lock files to match their package.json files

echo ==========================================
echo Fixing package-lock.json files
echo ==========================================
echo.

REM Fix service lock files
for /d %%s in (services\*) do (
    if exist "%%s\package.json" (
        echo Fixing lock file for %%~ns...
        cd "%%s"
        
        REM Remove old lock file and node_modules
        if exist package-lock.json del /f package-lock.json
        if exist node_modules rmdir /s /q node_modules
        
        REM Install fresh dependencies
        call npm install
        
        cd ..\..
        echo [OK] Fixed %%~ns
        echo.
    )
)

REM Fix web/admin-panel if it exists
if exist "web\admin-panel\package.json" (
    echo Fixing lock file for web/admin-panel...
    cd web\admin-panel
    
    REM Remove old lock file and node_modules
    if exist package-lock.json del /f package-lock.json
    if exist node_modules rmdir /s /q node_modules
    
    REM Install fresh dependencies
    call npm install
    
    cd ..\..
    echo [OK] Fixed web/admin-panel
    echo.
)

echo ==========================================
echo All lock files have been updated!
echo ==========================================
echo.
echo Next steps:
echo 1. Review the changes: git status
echo 2. Commit the updated lock files:
echo    git add */package-lock.json
echo    git commit -m "Update package-lock.json files"
echo    git push
echo.

pause

