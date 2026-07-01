@echo off
title STAKELITE CASINO
color 0A
cls

echo  ╔════════════════════════════════════╗
echo  ║    STAKELITE CASINO - SIMPLE LAUNCHER    ║
echo  ╚════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo Killing any existing game processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting game server...
start /min cmd /c "npm run dev"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Opening game in browser...
start http://localhost:8080

echo.
echo  ╔════════════════════════════════════╗
echo  ║       GAME IS RUNNING!       ║
echo  ║  Open your browser window      ║
echo  ╚════════════════════════════════════╝
echo.
echo Press Ctrl+C to stop the game
echo.

:loop
timeout /t 2 /nobreak >nul
goto loop
