@echo off
TITLE SISTEMA DE VENTAS - LAUNCHER
CLS

:: === CONFIGURACIÓN DE LA RUTA ===
:: Aquí definimos la ruta exacta de tu proyecto
SET "PROJECT_ROOT=C:\Users\RYZEN 5 5600X\Modulo-customers-Listo"

ECHO ======================================================
ECHO      INICIANDO SISTEMA DE VENTAS
ECHO      Ruta: %PROJECT_ROOT%
ECHO ======================================================
ECHO.

:: 1. Verificación rápida de MySQL
netstat -an | find "3306" >nul
IF ERRORLEVEL 1 (
    ECHO [ALERTA] No detecto MySQL (XAMPP) corriendo.
    ECHO Por favor, abre XAMPP y activa "MySQL".
    PAUSE
    EXIT
)

:: 2. Iniciar Backend (Node.js)
ECHO [1/3] Iniciando Backend...
start "BACKEND_API" /min cmd /k "cd /d "%PROJECT_ROOT%\backend" && npm start"

:: 3. Iniciar AI Service (Python)
ECHO [2/3] Iniciando Servicio IA...
:: Activamos el entorno virtual en la raiz y corremos la app
start "AI_SERVICE" /min cmd /k "call "%PROJECT_ROOT%\.venv\Scripts\activate.bat" && cd /d "%PROJECT_ROOT%\ai-service" && python main.py"

:: 4. Iniciar Frontend (React)
ECHO [3/3] Iniciando Interfaz Web...
start "FRONTEND_UI" /min cmd /k "cd /d "%PROJECT_ROOT%\frontend" && npm run dev"

:: 5. Abrir Navegador
ECHO.
ECHO Todo listo. Abriendo sistema en 5 segundos...
TIMEOUT /T 5 /NOBREAK >nul
start http://localhost:5173

EXIT