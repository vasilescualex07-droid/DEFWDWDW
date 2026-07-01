@echo off
title StakeLite Casino
color 0A
cls
echo.
echo  ╔══════════════════════════════════════╗
echo  ║     STAKELITE CASINO - DESKTOP LAUNCHER     ║
echo  ╚════════════════════════════════════════╝
echo.
echo Starting game...
cd /d "%~dp0"

REM Kill any existing processes
taskkill /f /im node.exe >nul 2>&1

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start game server
echo Starting game server...
start /min cmd /c "npm run dev"

REM Wait for server
timeout /t 3 /nobreak >nul

REM Launch browser
echo Launching game...
start http://localhost:8080

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       GAME IS NOW RUNNING!       ║
echo  ╚════════════════════════════════════════╝
echo.
echo Play any casino game to see WIN ANIMATIONS!
echo.
pause
