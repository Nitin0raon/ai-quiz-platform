@echo off
REM ============================================================
REM AI Quiz Platform - Start Frontend Dev Server
REM Run this every day to start the React app
REM ============================================================

echo Starting AI Quiz Platform Frontend...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please download from https://nodejs.org/ and install it.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules\ (
    echo node_modules not found. Running npm install first...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo Frontend running at: http://localhost:3000
echo.
echo Make sure your Django backend is running on port 8000!
echo Press CTRL+C to stop.
echo.

npm run dev
