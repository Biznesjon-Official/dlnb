@echo off
echo ========================================
echo   Dalnoboy Shop - Development Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo   Starting Backend Server...
echo ========================================
echo.

REM Start backend first
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Starting Frontend Server...
echo ========================================
echo.

REM Start frontend after delay
start "Frontend Server" cmd