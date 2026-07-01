@echo off
echo Installing Electron dependencies...
npm install electron electron-builder concurrently wait-on --save-dev

echo Starting desktop app...
npm run electron:dev

pause
