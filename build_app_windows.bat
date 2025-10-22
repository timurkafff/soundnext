@echo off
REM Build script for SoundNext Desktop Application (Windows)
setlocal enabledelayedexpansion

echo ============================================
echo Building SoundNext Desktop Application
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install it first.
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Python
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install it first.
    pause
    exit /b 1
)
echo [OK] Python found
echo.

REM Build Next.js frontend
echo ============================================
echo Step 1: Building Next.js frontend...
echo ============================================

call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo [ERROR] Next.js build failed
    pause
    exit /b 1
)

if not exist "out" (
    echo [ERROR] Build failed - 'out' directory not found
    pause
    exit /b 1
)

echo [OK] Next.js build completed
echo.

REM Install Python dependencies
echo ============================================
echo Step 2: Installing Python dependencies...
echo ============================================

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [OK] Python dependencies installed
echo.

REM Build with PyInstaller
echo ============================================
echo Step 3: Building Windows executable...
echo ============================================

pyinstaller soundnext_windows.spec --clean --noconfirm
if errorlevel 1 (
    echo [ERROR] PyInstaller build failed
    pause
    exit /b 1
)

if not exist "dist\SoundNext" (
    echo [ERROR] Build failed - executable not found
    pause
    exit /b 1
)

echo [OK] Application built successfully!
echo.

REM Success message
echo ============================================
echo Build completed successfully!
echo ============================================
echo.
echo Your application is ready:
echo   Location: backend\dist\SoundNext\
echo   Executable: backend\dist\SoundNext\SoundNext.exe
echo.
echo To run the app:
echo   1. Navigate to backend\dist\SoundNext\
echo   2. Double-click SoundNext.exe
echo.
echo To distribute:
echo   1. Copy the entire 'SoundNext' folder
echo   2. Or create installer with Inno Setup / NSIS (optional)
echo.
echo ============================================

pause

