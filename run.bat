@echo off
echo ============================================
echo   Starting Cloud Virtual Coding Lab
echo ============================================
echo.

echo Starting FastAPI Backend...
cd backend
start "Backend" cmd /k "call venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

timeout /t 3 /nobreak >nul

echo Starting React Frontend...
cd frontend
start "Frontend" cmd /k "npm start"
cd ..

echo.
echo ============================================
echo   Servers started!
echo   Frontend  -> http://localhost:3000
echo   Backend   -> http://localhost:8000
echo   API Docs  -> http://localhost:8000/docs
echo ============================================
pause
