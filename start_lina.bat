@echo off
setlocal

:: Ir para pasta do projeto
cd /d %~dp0

echo ========================================
echo        INICIANDO PROJETO LINA
echo ========================================

:: Verificar se ambiente virtual existe
if not exist "venv-lina\Scripts\activate.bat" (
    echo ❌ ERRO: Ambiente virtual venv-lina não encontrado!
    echo Execute: python -m venv venv-lina
    pause
    exit /b 1
)

:: Verificar se backend existe
if not exist "lina-backend\app.py" (
    echo ❌ ERRO: Backend app.py não encontrado!
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando Lina Backend...
start "Lina Backend" cmd /k "cd /d %~dp0 && venv-lina\Scripts\activate && cd lina-backend && python app.py"

echo.
echo ⏳ Aguardando backend carregar...
echo    (Verificando se servidor está rodando...)

:wait_backend
timeout /t 2 /nobreak > nul
curl -s http://localhost:8000/health > nul 2>&1
if %errorlevel% neq 0 (
    echo    . ainda carregando...
    goto wait_backend
)

echo ✅ Backend carregado com sucesso!

echo.
echo 🌐 Iniciando Lina Frontend (Streamlit)...
start "Lina Frontend" cmd /k "cd /d %~dp0 && venv-lina\Scripts\activate && cd lina-streamlit-ui && streamlit run app_st.py"

echo.
echo ========================================
echo ✅ LINA INICIADA COM SUCESSO!
echo ========================================
echo.
echo 🔗 Backend:  http://localhost:8000
echo 🔗 Frontend: http://localhost:8501  
echo 🎮 Playground: http://localhost:8000/chat/playground/
echo.
echo ⚠️  Aguarde alguns segundos para o Streamlit carregar.
echo 💡 Feche esta janela quando terminar de usar a Lina.
echo.
pause