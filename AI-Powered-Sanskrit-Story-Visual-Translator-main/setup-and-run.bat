@echo off
setlocal enabledelayedexpansion

set "PROJECT_DIR=c:\Users\HP\OneDrive\Desktop\6669\Ancient Sanskrit Text Translational Portal\AI-Powered-Sanskrit-Story-Visual-Translator-main"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

echo ================================
echo Sanskrit Portal Auto Setup
echo ================================
echo.

echo [1/5] Navigating to project...
cd /d "%PROJECT_DIR%"

echo [2/5] Creating Python virtual environment...
python -m venv "%BACKEND_DIR%\venv"

echo [3/5] Installing Python dependencies...
call "%BACKEND_DIR%\venv\Scripts\activate.bat"
pip install -q -r "%BACKEND_DIR%\requirements.txt"

echo [4/5] Installing Node.js packages...
cd /d "%FRONTEND_DIR%"
call npm install -q

echo [5/5] Starting servers...
echo.
echo Starting Backend on http://localhost:8000...
cd /d "%BACKEND_DIR%"
start "Sanskrit Backend" python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

timeout /t 4 /nobreak
echo Starting Frontend on http://localhost:3000...
cd /d "%FRONTEND_DIR%"
start "Sanskrit Frontend" cmd /c "npm start"

timeout /t 10 /nobreak
echo Opening browser...
start http://localhost:3000/login

echo.
echo ================================
echo Setup Complete!
echo ================================
echo Frontend: http://localhost:3000
echo Login:    http://localhost:3000/login
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ================================
