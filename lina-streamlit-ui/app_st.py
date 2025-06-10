import streamlit as st
import requests
import json

# URL do backend LangServe
BACKEND_URL_INVOKE = "http://localhost:8000/chat/invoke"
# BACKEND_URL_STREAM = "http://localhost:8000/chat/stream" # Para implementação futura

st.set_page_config(page_title="Lina Chat", page_icon="🤖")

st.title("🤖 Lina - IA da Lilian")

# Inicializa o histórico da conversa na session_state se não existir
if "messages" not in st.session_state:
    st.session_state.messages = []

# Exibe as mensagens do histórico
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Input do usuário
if prompt := st.chat_input("Converse com a Lina..."):
    # Adiciona a mensagem do usuário ao histórico e exibe
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Prepara a mensagem para o backend
    payload = {"input": {"input": prompt}} # Formato esperado pelo backend LangServe

    # Envia a mensagem para o backend e obtém a resposta
    try:
        response = requests.post(BACKEND_URL_INVOKE, json=payload)
        response.raise_for_status()  # Levanta um erro para respostas HTTP ruins (4xx ou 5xx)
        
        # A resposta do /chat/invoke com StrOutputParser é diretamente a string da IA
        # Se a chain principal no backend retornar um dicionário com uma chave 'output',
        # como é comum em algumas configurações do LangServe, você precisaria ajustar aqui.
        # Ex: assistant_response = response.json().get("output", "Erro ao processar resposta.")
        # No nosso caso, com StrOutputParser, a resposta JSON é algo como:
        # {"output": "Olá! Como posso ajudar?", "metadata": {...}}
        # ou apenas a string diretamente se a rota for configurada para output direto.
        # O add_routes com StrOutputParser geralmente resulta em:
        # {"output": "string da IA", "metadata": {"run_id": "..."}}
        
        response_data = response.json()
        assistant_response = response_data.get("output", "Desculpe, não consegui processar sua solicitação.")
        
        # Adiciona a resposta da Lina ao histórico e exibe
        st.session_state.messages.append({"role": "assistant", "content": assistant_response})
        with st.chat_message("assistant"):
            st.markdown(assistant_response)

    except requests.exceptions.RequestException as e:
        st.error(f"Erro de conexão com o backend: {e}")
        st.session_state.messages.append({"role": "assistant", "content": f"Erro de conexão: {e}"})
    except json.JSONDecodeError:
        st.error("Erro ao decodificar a resposta do backend. Resposta não era um JSON válido.")
        st.session_state.messages.append({"role": "assistant", "content": "Erro: Resposta inválida do backend."})
    except Exception as e:
        st.error(f"Ocorreu um erro inesperado: {e}")
        st.session_state.messages.append({"role": "assistant", "content": f"Erro inesperado: {e}"})
