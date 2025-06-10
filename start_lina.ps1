Write-Host "Iniciando Lina Backend..."
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd lina-backend; python app.py" -WindowStyle Normal -PassThru

Write-Host "Iniciando Lina Frontend (Streamlit)..."
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd lina-streamlit-ui; streamlit run app_st.py" -WindowStyle Normal -PassThru

Write-Host ""
Write-Host "Lina está sendo iniciada em duas novas janelas do PowerShell."
Write-Host "O frontend estará disponível em http://localhost:8501 assim que o Streamlit carregar."
