@echo off
REM FAYO AI - Service Build Script for Windows
REM This script builds all services with their Dockerfiles

echo 🚀 Building FAYO AI Services...

REM Function to build a service
:build_service
set service_name=%1
set service_path=%2
set port=%3

echo 📦 Building %service_name%...

if exist "%service_path%\Dockerfile" (
    docker build -t "fayo-%service_name%" "%service_path%"
    echo ✅ %service_name% built successfully
    echo    Run with: docker run -p %port%:%port% fayo-%service_name%
) else (
    echo ❌ Dockerfile not found for %service_name%
)
echo.

REM Build all services
call :build_service "user-service" ".\services\user-service" "3001"
call :build_service "hospital-service" ".\services\hospital-service" "3002"
call :build_service "doctor-service" ".\services\doctor-service" "3003"
call :build_service "shared-service" ".\services\shared-service" "3004"
call :build_service "gateway" ".\services\gateway" "3006"
call :build_service "notification-worker" ".\services\notification-worker" "3007"
call :build_service "admin-panel" ".\web\admin-panel" "3000"

echo 🎉 All services built successfully!
echo.
echo To start infrastructure services:
echo docker-compose up -d
echo.
echo To run individual services:
echo docker run -p 3001:3001 fayo-user-service
echo docker run -p 3002:3002 fayo-hospital-service
echo docker run -p 3003:3003 fayo-doctor-service
echo docker run -p 3004:3004 fayo-shared-service
echo docker run -p 3000:3000 fayo-admin-panel

pause
