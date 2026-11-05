@echo off
title AI HOSTEL HELP DESK
echo ====================================================
echo   AI HOSTEL HELP DESK - Starting Application...
echo ====================================================
cd /d "%~dp0"
timeout /t 2 /nobreak >nul
start http://localhost:3000
node server.js
pause
