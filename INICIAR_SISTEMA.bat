@echo off
TITLE SISTEMA DE VENTAS - MODO DIAGNOSTICO
CLS

SET "PROYECTO=C:\Users\RYZEN 5 5600X\Desktop\SistemaInventarioIA"

ECHO ======================================================
ECHO      INICIANDO SISTEMA (MODO VISIBLE)
ECHO      Ruta base: %PROYECTO%
ECHO ======================================================
ECHO.

ECHO [1/3] Lanzando Backend...
start "BACKEND" cmd /k "cd /d "%PROYECTO%\backend" && npm start"

ECHO [2/3] Lanzando IA (Puerto 8001)...
IF EXIST "%PROYECTO%\.venv\Scripts\activate.bat" (
  start "IA_SERVICE" cmd /k "call "%PROYECTO%\.venv\Scripts\activate.bat" && cd /d "%PROYECTO%\ai-service" && uvicorn app.main:app --reload --port 8001"
) ELSE (
  ECHO AVISO: No hay .venv — se omite el servicio de IA por ahora.
)

ECHO [3/3] Lanzando Frontend...
start "FRONTEND" cmd /k "cd /d "%PROYECTO%\frontend\SistemaVentasIA" && npm run dev"

ECHO.
ECHO Si no ves errores rojos en las ventanas negras,
ECHO el sistema se abrira en 10 segundos...
TIMEOUT /T 10
start http://localhost:5173/login

ECHO.
ECHO ======================================================
ECHO  Abre siempre: http://localhost:5173/login
ECHO  Backend local: http://localhost:5000/health
ECHO ======================================================
PAUSE
