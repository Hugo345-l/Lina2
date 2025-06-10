@echo off
echo Iniciando Lina Backend...
start "Lina Backend" cmd /k "cd lina-backend && python app.py"

echo Iniciando Lina Frontend (Streamlit)...
start "Lina Frontend" cmd /k "cd lina-streamlit-ui && streamlit run app_st.py"

echo.
echo Lina está sendo iniciada em duas novas janelas.
echo O frontend estará disponível em http://localhost:8501 assim que o Streamlit carregar.
