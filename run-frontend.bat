@echo off
cd /d "%~dp0lovable_import"

if "%VITE_API_BASE_URL%"=="" set VITE_API_BASE_URL=http://127.0.0.1:8001
echo Iniciando frontend...
npm run dev

pause
