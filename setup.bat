@echo off
echo ============================================
echo   Cloud-Powered Virtual Coding Lab Setup
echo ============================================
echo.

echo --- Setting up Python Backend ---
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo Backend ready!
cd ..

echo.
echo --- Setting up React Frontend ---
cd frontend
npm install
echo Frontend ready!
cd ..

echo.
echo ============================================
echo   Setup Complete! Run: run.bat
echo ============================================
pause
