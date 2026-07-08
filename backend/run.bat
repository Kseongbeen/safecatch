@echo off
cd /d "%~dp0"
echo Starting SafeCatch Backend Server...
python -m uvicorn app.main:app --reload --port 8000
pause
