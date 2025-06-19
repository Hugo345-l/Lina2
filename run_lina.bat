@echo off
chcp 65001 >nul
cls
echo.
echo 🤖 LINA - Assistente Pessoal Multi-Agente
echo ==========================================
echo.

REM Ativar ambiente virtual se existir
if exist "venv-lina\Scripts\activate.bat" (
    echo 🔧 Ativando ambiente virtual...
    call venv-lina\Scripts\activate.bat
) else (
    echo ⚠️  Ambiente virtual não encontrado - usando Python global
)

REM Ir para backend
if exist "lina-backend" (
    cd lina-backend
) else (
    echo ❌ Erro: Pasta lina-backend não encontrada!
    pause
    exit /b 1
)

REM Verificar se app.py existe
if not exist "app.py" (
    echo ❌ Erro: app.py não encontrado em lina-backend!
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando Lina...
echo.
echo    🌐 Interface Web: http://localhost:8000/lina-frontend/
echo    🧪 Playground:   http://localhost:8000/chat/playground/
echo    💻 API Backend:  http://localhost:8000/docs
echo    🔍 Health Check: http://localhost:8000/health
echo.
echo 📌 Aguarde "Application startup complete" aparecer...
echo 🌍 O navegador abrirá automaticamente em 5 segundos
echo 🛑 Para parar: Ctrl+C
echo.

REM Executar servidor (sem abrir navegador ainda)
start /b uvicorn app:app --reload --host 0.0.0.0 --port 8000

REM Aguardar servidor inicializar e então abrir navegador
ping localhost -n 6 >nul
echo 🌍 Abrindo navegador...
start http://localhost:8000/lina-frontend/

REM Manter o terminal aberto para mostrar logs
pause
