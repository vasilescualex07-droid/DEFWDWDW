# StakeLite Casino Desktop Launcher
# This script launches the StakeLite game with integrated win animations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     StakeLite Casino Game Launcher     " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the working directory
$gamePath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $gamePath

Write-Host "Game Directory: $gamePath" -ForegroundColor Gray
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing game dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting StakeLite Casino..." -ForegroundColor Cyan
Write-Host ""

# Start the Vite dev server in the background
Write-Host "Starting game server..." -ForegroundColor Gray
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:gamePath
    npm run dev
}

# Wait for the server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Launch the Electron desktop app
Write-Host "Launching desktop application..." -ForegroundColor Green
try {
    & node .\node_modules\electron\cli.js . --dev
} catch {
    Write-Host "Error launching desktop app: $_" -ForegroundColor Red
}

# Clean up the background server job
Write-Host "Shutting down game server..." -ForegroundColor Yellow
Stop-Job $serverJob
Remove-Job $serverJob

Write-Host ""
Write-Host "StakeLite Casino closed. Thanks for playing!" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
