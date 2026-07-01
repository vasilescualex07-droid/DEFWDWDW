@echo off
echo Testing Electron setup...
echo.

echo 1. Checking if Electron exists...
if exist ".\node_modules\electron\dist\electron.exe" (
    echo ✓ Electron found
) else (
    echo ✗ Electron not found
    pause
    exit /b
)

echo.
echo 2. Checking main.cjs file...
if exist "main.cjs" (
    echo ✓ main.cjs found
) else (
    echo ✗ main.cjs not found
    pause
    exit /b
)

echo.
echo 3. Testing Electron with simple HTML...
echo Creating simple test file...

echo ^<!DOCTYPE html^> > test.html
echo ^<html^>^<head^>^<title^>Test^</title^>^</head^> >> test.html
echo ^<body^>^<h1^>Electron Test Working!^</h1^>^</body^>^</html^> >> test.html

echo.
echo 4. Launching Electron with test file...
.\node_modules\electron\dist\electron.exe test.html

echo.
echo Test completed. Check if Electron window appeared.
pause
