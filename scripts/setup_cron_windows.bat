@echo off
REM Setup script for database backup Windows Task Scheduler
REM This script helps you set up automatic backups on Windows

set SCRIPT_DIR=%~dp0
set BACKUP_SCRIPT=%SCRIPT_DIR%database_backup.py
set PYTHON_CMD=python

echo Database Backup Windows Task Scheduler Setup
echo =============================================
echo.

REM Check if Python is available
where %PYTHON_CMD% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python not found. Please install Python 3.
    echo Make sure Python is in your PATH.
    pause
    exit /b 1
)

echo Script location: %BACKUP_SCRIPT%
echo Python command: %PYTHON_CMD%
echo.

REM Check if script exists
if not exist "%BACKUP_SCRIPT%" (
    echo Error: Backup script not found at %BACKUP_SCRIPT%
    pause
    exit /b 1
)

echo Choose schedule:
echo 1. Daily at 2:00 AM (recommended)
echo 2. Daily at 3:00 AM
echo 3. Every 6 hours
echo 4. Custom (you'll create task manually)
echo.
set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" (
    set SCHEDULE_TIME=02:00
    set SCHEDULE_TYPE=daily
) else if "%choice%"=="2" (
    set SCHEDULE_TIME=03:00
    set SCHEDULE_TYPE=daily
) else if "%choice%"=="3" (
    set SCHEDULE_TIME=00:00
    set SCHEDULE_TYPE=hourly
    set REPEAT_HOURS=6
) else (
    echo.
    echo To create a custom task manually:
    echo 1. Open Task Scheduler (taskschd.msc)
    echo 2. Create Basic Task
    echo 3. Set trigger and action
    echo 4. Action: Start a program
    echo    Program: %PYTHON_CMD%
    echo    Arguments: "%BACKUP_SCRIPT%"
    echo    Start in: %SCRIPT_DIR%
    pause
    exit /b 0
)

set TASK_NAME=FAYO_Database_Backup
set TASK_DESC=Automated database backup for FAYO PostgreSQL databases

echo.
echo Task to be created:
echo Name: %TASK_NAME%
echo Description: %TASK_DESC%
echo Schedule: %SCHEDULE_TYPE% at %SCHEDULE_TIME%
echo.

REM Check if task already exists
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Warning: Task "%TASK_NAME%" already exists.
    set /p replace="Replace it? (y/n): "
    if /i not "%replace%"=="y" (
        echo Keeping existing task. Exiting.
        pause
        exit /b 0
    )
    echo Deleting existing task...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

echo Creating scheduled task...
echo.

if "%SCHEDULE_TYPE%"=="daily" (
    schtasks /create /tn "%TASK_NAME%" /tr "\"%PYTHON_CMD%\" \"%BACKUP_SCRIPT%\"" /sc daily /st %SCHEDULE_TIME% /ru SYSTEM /f /rl HIGHEST
) else (
    REM For hourly, we'll use a workaround with /sc once and /mo
    schtasks /create /tn "%TASK_NAME%" /tr "\"%PYTHON_CMD%\" \"%BACKUP_SCRIPT%\"" /sc daily /st %SCHEDULE_TIME% /mo 1 /ru SYSTEM /f /rl HIGHEST
    echo Note: For hourly backups, you may need to manually configure the repeat interval in Task Scheduler.
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Task created successfully!
    echo.
    echo Task Name: %TASK_NAME%
    echo To view task: Open Task Scheduler and look for "%TASK_NAME%"
    echo To delete task: schtasks /delete /tn "%TASK_NAME%" /f
    echo.
    echo The backup will run according to the schedule you chose.
) else (
    echo.
    echo Error: Failed to create task. You may need to run this script as Administrator.
    echo Right-click and select "Run as administrator"
)

pause

