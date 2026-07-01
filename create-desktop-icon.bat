@echo off
echo Creating StakeLite Casino desktop icon...
echo.

REM Get the current directory
set GAME_DIR=%~dp0
set GAME_DIR=%GAME_DIR:~0,-1%

REM Create PowerShell shortcut
echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\StakeLite Casino.lnk'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -File ""%GAME_DIR%\StakeLite-Desktop.ps1""'; $Shortcut.WorkingDirectory = '%GAME_DIR%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Description = 'StakeLite Casino Game with Win Animations'; $Shortcut.Save()"

REM Create Start Menu shortcut
echo Creating Start Menu shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\StakeLite Casino.lnk'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -File ""%GAME_DIR%\StakeLite-Desktop.ps1""'; $Shortcut.WorkingDirectory = '%GAME_DIR%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Description = 'StakeLite Casino Game with Win Animations'; $Shortcut.Save()"

echo.
echo ========================================
echo   Desktop icon created successfully!
echo ========================================
echo.
echo You can now launch StakeLite Casino from:
echo - Your desktop
echo - Start Menu
echo.
echo Double-click the "StakeLite Casino" icon to play!
echo.
pause
