@echo off
cd /d "%~dp0"
echo Starting StakeLite Casino...
npm run dev
start http://localhost:8080
