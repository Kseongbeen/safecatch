@echo off
cd /d "%~dp0"
title SafeCatch Starter

echo ===================================================
echo   SafeCatch - Starting All Servers
echo ===================================================
echo.

echo [1/2] Starting Backend (FastAPI) server...
start "SafeCatch-Backend" "%~dp0backend\run.bat"

echo [2/2] Starting Frontend (React/Vite) server...
start "SafeCatch-Frontend" "%~dp0frontend\run.bat"

echo.
echo ===================================================
echo   All servers started in new windows!
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo ===================================================
echo.
pause
