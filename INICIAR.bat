@echo off
echo ============================================
echo   DEFESA CIVIL ARARUNA - SISTEMA
echo ============================================
echo.

echo Iniciando Backend Python...
start "Backend Python" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak > nul

echo Iniciando Frontend Next.js...
start "Frontend Next.js" cmd /k "npm run dev"

echo.
echo ============================================
echo   Sistema iniciado!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000/docs
echo ============================================
echo.
pause
