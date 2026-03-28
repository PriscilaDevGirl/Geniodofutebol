@echo off
cd /d "%~dp0"

if "%PORT%"=="" set PORT=8001
if "%VITE_API_BASE_URL%"=="" set VITE_API_BASE_URL=http://127.0.0.1:%PORT%

start "Neurobit Backend" cmd /k run-backend.bat
timeout /t 3 /nobreak >nul
start "Neurobit Frontend" cmd /k run-frontend.bat

echo Backend e frontend iniciados.
echo.
echo Backend:  http://127.0.0.1:%PORT%/dashboard/brasileirao
echo Frontend: confira a URL mostrada na janela do Vite, normalmente http://localhost:8080
pause
