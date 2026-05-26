@echo off
REM ============================================================
REM AI Quiz Platform - Windows Setup Script
REM Run this ONCE to set everything up
REM Usage: Double-click this file OR run in Command Prompt
REM ============================================================

echo ============================================================
echo  AI Quiz Platform - Automated Setup
echo ============================================================
echo.

REM Check Python version
python --version 2>nul
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.12 from https://python.org
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

echo [1/7] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment.
    pause
    exit /b 1
)

echo [2/7] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/7] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [4/7] Installing dependencies (this takes 3-5 minutes)...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Some packages failed to install.
    echo Try running: pip install -r requirements.txt manually
    pause
    exit /b 1
)

echo [5/7] Checking .env file...
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit the .env file with your settings before continuing!
    echo Required fields:
    echo   - DB_PASSWORD: Your PostgreSQL password
    echo   - GEMINI_API_KEY: From https://makersuite.google.com/app/apikey
    echo   - SECRET_KEY: Run: python -c "import secrets; print(secrets.token_urlsafe(50))"
    echo.
    notepad .env
    echo Press any key after editing .env...
    pause >nul
) else (
    echo .env already exists, skipping...
)

echo [6/7] Running database migrations...
python manage.py makemigrations users
python manage.py makemigrations documents
python manage.py makemigrations quizzes
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Migration failed. Check your database settings in .env
    pause
    exit /b 1
)

echo [7/7] Creating superuser...
echo You will be prompted to enter email, username, and password.
python manage.py createsuperuser

echo.
echo ============================================================
echo  Setup Complete!
echo ============================================================
echo.
echo To seed sample data (optional):
echo   python manage.py seed_data
echo.
echo To start the development server:
echo   python manage.py runserver
echo.
echo Then open: http://127.0.0.1:8000/
echo Admin panel: http://127.0.0.1:8000/admin/
echo.
pause
