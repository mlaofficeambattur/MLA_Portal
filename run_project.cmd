@echo off
cd /d "%~dp0"

echo Starting backend on http://127.0.0.1:8000 ...
start "Appointment Backend" cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo.
echo Starting frontend on http://127.0.0.1:5173 ...
echo Keep this terminal open while using the app.
echo.

cd /d "%~dp0frontend"
cmd /c npm run dev -- --host 127.0.0.1 --port 5173
