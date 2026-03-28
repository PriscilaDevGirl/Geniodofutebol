@echo off
cd /d "%~dp0"

if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%~A"=="" if not "%%A:~0,1"=="#" set "%%A=%%B"
  )
)

echo Iniciando backend Neurobit AI...
if "%PORT%"=="" set PORT=8001
python -m uvicorn src.app:app --host 127.0.0.1 --port %PORT%

pause
