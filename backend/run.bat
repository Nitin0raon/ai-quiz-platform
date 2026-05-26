@echo off
REM ============================================================
REM AI Quiz Platform - Start Development Server
REM Run this every day to start working
REM ============================================================

echo Starting AI Quiz Platform...
echo.

REM Check if venv exists
if not exist venv\Scripts\activate.bat (
    echo ERROR: Virtual environment not found.
    echo Please run setup.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found.
    echo Please copy .env.example to .env and fill in your settings.
    pause
    exit /b 1
)

echo Virtual environment activated.
echo Starting Django development server...
echo.
echo Server running at: http://127.0.0.1:8000/
echo Admin panel at:    http://127.0.0.1:8000/admin/
echo.
echo Press CTRL+C to stop the server.
echo.

python manage.py runserver
