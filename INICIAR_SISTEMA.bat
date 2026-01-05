@echo off
TITLE SISTEMA DE VENTAS - MODO DIAGNOSTICO
CLS

:: 1. DEFINIR LA RUTA RAIZ (Asegurate que esta sea EXACTA)
SET "PROYECTO=C:\Users\RYZEN 5 5600X\Modulo-customers-Listo"

ECHO ======================================================
ECHO      INICIANDO SISTEMA (MODO VISIBLE)
ECHO      Ruta base: %PROYECTO%
ECHO ======================================================
ECHO.

:: 2. BACKEND
ECHO [1/3] Lanzando Backend...
start "BACKEND" cmd /k "cd /d "%PROYECTO%\backend" && npm start"

:: 3. INTELIGENCIA ARTIFICIAL (La parte delicada)
ECHO [2/3] Lanzando IA (Puerto 8001)...
:: Aqui usamos la ruta completa al activador para evitar errores
start "IA_SERVICE" cmd /k "call "%PROYECTO%\.venv\Scripts\activate.bat" && cd /d "%PROYECTO%\ai-service" && uvicorn app.main:app --reload --port 8001"

:: 4. FRONTEND
ECHO [3/3] Lanzando Frontend...
start "FRONTEND" cmd /k "cd /d "%PROYECTO%\frontend\SistemaVentasIA" && npm run dev"

:: 5. NAVEGADOR
ECHO.
ECHO Si no ves errores rojos en las ventanas negras,
ECHO el sistema se abrira en 10 segundos...
TIMEOUT /T 10
start http://localhost:5173

ECHO.
ECHO ======================================================
ECHO  SI ALGO FALLA, TOMA FOTO A LAS VENTANAS NEGRAS
ECHO ======================================================
PAUSE