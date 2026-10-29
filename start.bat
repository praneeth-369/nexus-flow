@echo off
echo ===================================================
echo   Starting NexusFlow (Backend + Frontend)
echo ===================================================

start "NexusFlow Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 2 /nobreak >nul
start "NexusFlow Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo NexusFlow is launching:
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo.
