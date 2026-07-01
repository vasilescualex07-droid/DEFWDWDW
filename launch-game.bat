@echo off
title StakeLite Casino Game
echo Starting StakeLite Casino Game...
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start Vite dev server
echo Starting game server...
start /B npm run dev

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start Electron desktop app
echo Launching desktop app...
node .\node_modules\electron\cli.js . --dev

echo Game closed.
