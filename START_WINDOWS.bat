@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "Компас — сервер" cmd /k "py server.py"
) else (
    start "Компас — сервер" cmd /k "python server.py"
)
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8000"
echo Server window is running. To stop, close it or press Ctrl+C there.
pause
