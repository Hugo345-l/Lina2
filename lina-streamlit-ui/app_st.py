import streamlit as st
import requests
import json
import ast
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# --- Configurações ---
BACKEND_URL_INVOKE = "http://localhost:8000/chat/invoke"
PAGE_TITLE = "Lina Chat 🤖"
PAGE_ICON = "🤖"

# --- Modelos Pydantic (espelho do backend para clareza) ---
class DebugInfo(BaseModel):
    cost: float = 0.0
    tokens_used: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    duration: float = 0.0
    model_name: Optional[str] = None

class ChatResponse(BaseModel):
    output: str
    debug_info: DebugInfo

# --- Estilos CSS ---
CSS = """
body {
    background-color: #1E1E2E;
}
.stApp {
    background-color: #1E1E2E;
    color: #E0E0E0;
}
.stChatInputContainer > div > div > textarea {
    background-color: #2D2D44 !important;
    color: #E0E0E0 !important;
    border-radius: 0.5rem !important;
    border: 1px solid #4A4A6A !important;
}
.stChatMessage {
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
}
[data-testid="stChatMessageContent"] p {
    margin-bottom: 0;
}
[data-testid="stChatMessage"]:has(div[data-testid="chatAvatarIcon-user"]) {
    background-color: #2D2D44;
}
[data-testid="stChatMessage"]:has(div[data-testid="chatAvatarIcon-assistant"]) {
    background-color: #3B3B58;
}
.stExpander {
    border: 1px solid #4A4A6A;
    border-radius: 0.5rem;
    background-color: #2D2D44;
}
.stExpander header {
    color: #E0E0E0;
}
"""

# --- Configuração da Página ---
st.set_page_config(page_title=PAGE_TITLE, page_icon=PAGE_ICON, layout="centered")
st.markdown(f"<style>{CSS}</style>", unsafe_allow_html=True)
st.title("🤖 Lina - Sua Assistente Pessoal")

# --- Gerenciamento de Estado ---
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "debug_info" not in st.session_state:
    st.session_state.debug_info = None

# --- Funções Auxiliares ---
def display_chat_history():
    for message in st.session_state.chat_history:
        avatar = "👤" if message["role"] == "user" else "🤖"
        with st.chat_message(message["role"], avatar=avatar):
            st.markdown(message["content"])

def display_debug_panel():
    if st.session_state.debug_info:
        debug_data = st.session_state.debug_info
        with st.expander("🔍 Painel de Debug", expanded=False):
            st.markdown(f"""
            - **Custo Total:** ${debug_data.cost:.8f} 
            - **Duração:** {debug_data.duration:.3f}s
            - **Modelo:** {debug_data.model_name or 'N/A'}
            - **Tokens:**
                - Total: {debug_data.tokens_used}
                - Prompt: {debug_data.prompt_tokens}
                - Completude: {debug_data.completion_tokens}
            - **Fluxo de Execução (Backend):**
                - ✅ Processamento Principal ({debug_data.duration:.3f}s)
            """)

def parse_backend_response_FIXED(response_data_dict):
    """
    VERSÃO COMPLETAMENTE NOVA - Parser específico para o formato observado
    """
    try:
        if isinstance(response_data_dict, dict) and "output" in response_data_dict:
            raw_output = response_data_dict["output"]
            
            if isinstance(raw_output, str):
                import re
                
                st.write("📝 **Processando string:** ", raw_output[:100] + "...")
                
                # EXTRAIR MENSAGEM - padrão específico observado
                # Procurar por: 'output': 'MENSAGEM_AQUI', 'debug_info':
                message_regex = r"'output':\s*'(.*?)',\s*'debug_info':"
                message_match = re.search(message_regex, raw_output, re.DOTALL)
                
                if message_match:
                    # Extrair e limpar a mensagem
                    extracted_message = message_match.group(1)
                    # Converter \\n para quebras de linha reais
                    clean_message = extracted_message.replace('\\n', '\n').replace("\\'", "'")
                    
                    st.write("✅ **Mensagem extraída:** ", clean_message[:50] + "...")
                else:
                    clean_message = "ERRO: Não conseguiu extrair mensagem"
                    st.write("❌ **Erro na extração da mensagem**")
                
                # EXTRAIR DEBUG INFO - valores específicos observados
                cost_regex = r"'cost':\s*([\d.e-]+)"
                tokens_regex = r"'tokens_used':\s*(\d+)"
                prompt_tokens_regex = r"'prompt_tokens':\s*(\d+)"
                completion_tokens_regex = r"'completion_tokens':\s*(\d+)"
                duration_regex = r"'duration':\s*([\d.]+)"
                model_regex = r"'model_name':\s*'([^']+)'"
                
                cost_match = re.search(cost_regex, raw_output)
                tokens_match = re.search(tokens_regex, raw_output)
                prompt_tokens_match = re.search(prompt_tokens_regex, raw_output)
                completion_tokens_match = re.search(completion_tokens_regex, raw_output)
                duration_match = re.search(duration_regex, raw_output)
                model_match = re.search(model_regex, raw_output)
                
                # Log dos valores encontrados
                st.write("🔍 **Valores encontrados:**")
                st.write(f"- Cost: {cost_match.group(1) if cost_match else 'NÃO ENCONTRADO'}")
                st.write(f"- Tokens: {tokens_match.group(1) if tokens_match else 'NÃO ENCONTRADO'}")
                st.write(f"- Duration: {duration_match.group(1) if duration_match else 'NÃO ENCONTRADO'}")
                
                # Construir DebugInfo com valores extraídos
                debug_info = DebugInfo(
                    cost=float(cost_match.group(1)) if cost_match else 0.0,
                    tokens_used=int(tokens_match.group(1)) if tokens_match else 0,
                    prompt_tokens=int(prompt_tokens_match.group(1)) if prompt_tokens_match else 0,
                    completion_tokens=int(completion_tokens_match.group(1)) if completion_tokens_match else 0,
                    duration=float(duration_match.group(1)) if duration_match else 0.0,
                    model_name=model_match.group(1) if model_match else "N/A"
                )
                
                return clean_message, debug_info
            
            else:
                return str(raw_output), DebugInfo(model_name="Output não é string")
        
        else:
            return "Formato de resposta inesperado", DebugInfo(model_name="Formato inesperado")
            
    except Exception as e:
        st.error(f"ERRO no parser: {e}")
        return f"Erro: {e}", DebugInfo(model_name="Erro Crítico")

# --- Interface Principal ---
display_chat_history()
display_debug_panel()

# Input do usuário
if prompt := st.chat_input("Converse com a Lina..."):
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    
    # Exibe a mensagem do usuário imediatamente
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    # Prepara a mensagem para o backend
    payload = {"input": {"input": prompt}}

    try:
        with st.spinner("🤖 Lina está pensando..."):
            response = requests.post(BACKEND_URL_INVOKE, json=payload, timeout=30)
            response.raise_for_status()
            
            response_data_dict = response.json()
            
            # DEBUG TEMPORÁRIO: Mostrar o que estamos recebendo
            st.write("🔍 **Debug - Raw Response:**")
            st.json(response_data_dict)
            
            # Usar a função NOVA de parsing
            assistant_response_content, debug_info = parse_backend_response_FIXED(response_data_dict)
            
            # Atualizar estado
            st.session_state.debug_info = debug_info
            st.session_state.chat_history.append({"role": "assistant", "content": assistant_response_content})
            
            st.rerun()

    except requests.exceptions.Timeout:
        error_message = "⏱️ Timeout: A Lina demorou muito para responder. Tente novamente."
        st.error(error_message)
        st.session_state.chat_history.append({"role": "assistant", "content": error_message})
        st.session_state.debug_info = DebugInfo(model_name="Timeout Error")
        st.rerun()
        
    except requests.exceptions.RequestException as e:
        error_message = f"❌ Erro de conexão com o backend: {e}"
        st.error(error_message)
        st.session_state.chat_history.append({"role": "assistant", "content": error_message})
        st.session_state.debug_info = DebugInfo(model_name="Connection Error")
        st.rerun()
        
    except json.JSONDecodeError:
        error_message = "❌ Erro: Resposta do backend não era JSON válido."
        st.error(error_message)
        st.session_state.chat_history.append({"role": "assistant", "content": error_message})
        st.session_state.debug_info = DebugInfo(model_name="JSON Decode Error")
        st.rerun()
        
    except Exception as e:
        error_message = f"❌ Erro inesperado: {e}"
        st.error(error_message)
        st.session_state.chat_history.append({"role": "assistant", "content": error_message})
        st.session_state.debug_info = DebugInfo(model_name="Unexpected Error")
        st.rerun()

# Footer com informações úteis
st.markdown("---")
st.markdown("💡 **Dica:** Use o painel de debug para ver métricas detalhadas da conversa!")