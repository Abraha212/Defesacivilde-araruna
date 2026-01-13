@echo off
echo ============================================
echo   DEFESA CIVIL ARARUNA - SISTEMA
echo   Versao 5.0 - 100%% JavaScript
echo ============================================
echo.

echo Iniciando Sistema (Frontend + API)...
start "Defesa Civil Araruna" cmd /k "npm run dev"

echo.
echo ============================================
echo   Sistema iniciado!
echo   - Acesse: http://localhost:3000
echo.
echo   NOTA: O backend Python foi substituido
echo   por API Routes do Next.js (JavaScript).
echo   Funciona na Vercel sem precisar de
echo   servidor Python separado!
echo ============================================
echo.
pause
