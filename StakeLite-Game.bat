@echo off
title StakeLite Casino Game
color 0A
echo.
echo =====================================
echo    STAKELITE CASINO GAME
echo =====================================
echo.

REM Set working directory
cd /d "%~dp0"

REM Check dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start Vite dev server
echo Starting game server...
start /B cmd /c "npm run dev"

REM Wait for server to start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Launch browser version (more reliable)
echo.
echo Launching game in browser...
echo Game will open at: http://localhost:8080
echo.
start http://localhost:8080

echo.
echo =====================================
echo   GAME IS NOW RUNNING!
echo   Check your browser window
echo =====================================
echo.
echo Press Ctrl+C to stop server
echo.

REM Keep server running
:loop
timeout /t 2 /nobreak >nul
goto loop
