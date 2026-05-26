@echo off
REM ============================================================
REM AI Quiz Platform - Frontend First-Time Setup
REM ============================================================

echo ============================================================
echo  AI Quiz Platform - Frontend Setup
echo ============================================================
echo.

echo [1/3] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo [3/3] Verifying .env file...
if not exist .env (
    echo WARNING: .env file not found.
    echo The default .env is already included — it should work out of the box.
)

echo.
echo ============================================================
echo  Setup complete!
echo ============================================================
echo.
echo To start the app:  npm run dev   OR   double-click run.bat
echo Then open:         http://localhost:3000
echo.
echo Remember to also start the Django backend:
echo   cd ..\backend
echo   venv\Scripts\activate
echo   python manage.py runserver
echo.
pause
