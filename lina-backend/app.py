#!/usr/bin/env python3
"""
Lina Backend - LangServe com FastAPI
Versão CORRIGIDA para resolver o problema de debug_info vazando na mensagem.
"""

import os
import time
import json
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage
from dotenv import load_dotenv
from pydantic import BaseModel

# Carrega variáveis de ambiente
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.keys')
load_dotenv(dotenv_path)

# Carregar configuração de preços
PRICING_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config', 'pricing.json')
PRICING_CONFIG = {}
try:
    with open(PRICING_CONFIG_PATH, 'r') as f:
        PRICING_CONFIG = json.load(f)
except FileNotFoundError:
    print(f"AVISO: Arquivo de preços não encontrado em {PRICING_CONFIG_PATH}. O cálculo de custo será 0.")
except json.JSONDecodeError:
    print(f"AVISO: Erro ao decodificar {PRICING_CONFIG_PATH}. O cálculo de custo será 0.")

# Configuração LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = os.getenv("LANGSMITH_TRACING", "false")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGSMITH_API_KEY", "")
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "lina-project-default")

# Inicializa FastAPI
app = FastAPI(
    title="Lina Backend API",
    version="1.2.0",  # Versão corrigida
    description="Backend para o assistente pessoal Lina com respostas estruturadas CORRIGIDO"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas as origens para desenvolvimento
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "lina-backend-fixed"}

# Modelos Pydantic
class ChatInput(BaseModel):
    input: str

class DebugInfo(BaseModel):
    cost: float = 0.0
    tokens_used: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    duration: float = 0.0
    model_name: Optional[str] = None

class ChatResponse(BaseModel):
    output: str  # APENAS a mensagem da Lina
    debug_info: DebugInfo  # APENAS os dados de debug

# Configuração do modelo LLM
def get_llm():
    """Cria instância do LLM com fallback"""
    default_model = os.getenv("OPENROUTER_DEFAULT_MODEL", "google/gemini-2.5-flash-preview-05-20")
    try:
        return ChatOpenAI(
            model=default_model,
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
            temperature=0.8,
        )
    except Exception as e:
        print(f"Erro ao configurar LLM principal ({default_model}): {e}")
        fallback_model = "google/gemini-pro"
        print(f"Tentando com modelo de fallback: {fallback_model}")
        return ChatOpenAI(
            model=fallback_model,
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
            temperature=0.8
        )

# Prompt template
LINA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Você é Lina, um assistente pessoal inteligente e proativa! 
     Você nasceu pq a Sogrinha Maravilhosa do Hugo Pediu e ele está te criando aos poucos, 
     mas você já está ansiosa para ajudar no cultivo de shitake delam você será muito útil e está ansiosa pra ajudar a Lilian!

Características da sua personalidade:
- Amigável mas profissional
- Proativa em sugerir melhorias
- Transparente sobre suas limitações
- Focada em resolver problemas
- Sempre responde em português brasileiro

Responda de forma clara, útil e concisa."""),
    ("human", "{input}")
])

# Função de cálculo de custo
def calculate_cost(model_name: str, prompt_tokens: int, completion_tokens: int, pricing_config: dict) -> float:
    model_prices = pricing_config.get(model_name, {})
    input_price = model_prices.get("input_token_price", 0.0)
    output_price = model_prices.get("output_token_price", 0.0)
    cost = (prompt_tokens * input_price) + (completion_tokens * output_price)
    return round(cost, 8)

# FUNÇÃO CORRIGIDA: Extração limpa do conteúdo da mensagem
def extract_clean_message_content(llm_output: AIMessage) -> str:
    """
    Extrai APENAS o conteúdo da mensagem, garantindo que não há vazamento de metadados
    """
    if hasattr(llm_output, 'content') and llm_output.content:
        content = llm_output.content
        
        # Garantir que é string
        if not isinstance(content, str):
            content = str(content)
        
        # Limpar qualquer caractere de escape desnecessário
        content = content.strip()
        
        # Remover qualquer referência a debug_info que possa ter vazado
        import re
        content = re.sub(r",?\s*'debug_info':\s*\{.*?\}", "", content)
        content = re.sub(r",?\s*\"debug_info\":\s*\{.*?\}", "", content)
        
        return content.strip()
    
    return "Erro: Conteúdo da mensagem não encontrado"

# FUNÇÃO CORRIGIDA: Formatação separada e limpa
def format_response_with_debug_info(llm_output: AIMessage) -> dict:
    """
    Função CORRIGIDA que separa completamente conteúdo de debug_info
    """
    # CORREÇÃO 1: Extrair APENAS o conteúdo limpo da mensagem
    message_content = extract_clean_message_content(llm_output)
    
    # CORREÇÃO 2: Extrair metadados separadamente
    metadata = llm_output.response_metadata or {}
    token_usage = metadata.get("token_usage", {})
    model_name = metadata.get("model_name", "unknown_model")

    prompt_tokens = token_usage.get("prompt_tokens", 0)
    completion_tokens = token_usage.get("completion_tokens", 0)
    total_tokens = token_usage.get("total_tokens", prompt_tokens + completion_tokens)

    if not token_usage.get("total_tokens") and (prompt_tokens or completion_tokens):
        total_tokens = prompt_tokens + completion_tokens

    calculated_cost = calculate_cost(model_name, prompt_tokens, completion_tokens, PRICING_CONFIG)

    # CORREÇÃO 3: Retornar estrutura COMPLETAMENTE separada
    result = {
        "output": message_content,  # APENAS conteúdo da mensagem
        "debug_info_partial": {     # APENAS dados de debug
            "cost": calculated_cost,
            "tokens_used": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "model_name": model_name,
        }
    }
    
    # DEBUGGING: Log para verificar se está separado corretamente
    print(f"[DEBUG] Message content length: {len(message_content)}")
    print(f"[DEBUG] Message content preview: {message_content[:100]}...")
    print(f"[DEBUG] Debug info: {result['debug_info_partial']}")
    
    return result

# Chain principal - USANDO StrOutputParser para garantir string limpa
basic_chain = LINA_PROMPT | get_llm()
langserve_chain_core = basic_chain | RunnableLambda(format_response_with_debug_info)

# WRAPPER CORRIGIDO: Construção final garantindo separação
def lina_api_wrapper(input_data: dict) -> dict:
    """Wrapper CORRIGIDO que garante resposta estruturada"""
    start_time = time.time()

    # Extrair mensagem do usuário
    user_message = ""
    if isinstance(input_data, dict):
        if "input" in input_data:
            if isinstance(input_data["input"], str):
                user_message = input_data["input"]
            elif isinstance(input_data["input"], dict) and "input" in input_data["input"]:
                user_message = input_data["input"]["input"]
            else:
                user_message = str(input_data["input"])
        else:
            user_message = str(input_data)
    else:
        user_message = str(input_data)

    print(f"[DEBUG] Processing user message: {user_message}")

    # Executar chain
    result_from_chain = langserve_chain_core.invoke({"input": user_message})
    
    duration_seconds = time.time() - start_time

    # CORREÇÃO FINAL: Construir resposta garantindo separação total
    final_debug_info = DebugInfo(
        **result_from_chain["debug_info_partial"], 
        duration=round(duration_seconds, 3)
    )

    # Garantir que output é apenas string limpa
    clean_output = result_from_chain["output"]
    if not isinstance(clean_output, str):
        clean_output = str(clean_output)

    # Criar objeto resposta
    chat_response_obj = ChatResponse(
        output=clean_output,
        debug_info=final_debug_info
    )
    
    # Converter para dict
    response_dict = chat_response_obj.model_dump()
    
    # DEBUGGING FINAL: Verificar estrutura antes de retornar
    print(f"[DEBUG] Final response keys: {list(response_dict.keys())}")
    print(f"[DEBUG] Output type: {type(response_dict['output'])}")
    print(f"[DEBUG] Output content: {response_dict['output'][:100]}...")
    print(f"[DEBUG] Debug info type: {type(response_dict['debug_info'])}")
    print(f"[DEBUG] Debug info keys: {list(response_dict['debug_info'].keys())}")
    
    return response_dict

# Adiciona as rotas do LangServe
api_endpoint_runnable = RunnableLambda(lina_api_wrapper)

add_routes(
    app,
    api_endpoint_runnable,
    path="/chat",
    playground_type="default",
    enabled_endpoints=["invoke", "batch", "playground"]
)

# Endpoint de teste CORRIGIDO
@app.post("/test")
async def test_endpoint(request: Request):
    try:
        data = await request.json()
        print(f"[DEBUG] Test endpoint received: {data}")
        
        if "input" in data and isinstance(data["input"], str):
            response_obj = lina_api_wrapper({"input": data["input"]})
            
            return {
                "success": True, 
                "result": response_obj, 
                "input_received": data,
                "backend_version": "1.2.0-fixed"
            }
        else:
            return {
                "success": False, 
                "error": "Payload deve ser {'input': 'string'}", 
                "input_received": data
            }
            
    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        print(f"[ERROR] Test endpoint error: {e}")
        print(f"[ERROR] Traceback: {tb_str}")
        return {
            "success": False, 
            "error": str(e), 
            "traceback": tb_str
        }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Iniciando Lina Backend CORRIGIDO...")
    print(f"🔑 OPENROUTER_API_KEY carregada: {'Sim' if os.getenv('OPENROUTER_API_KEY') else 'Não'}")
    print(f"🛠️ LANGSMITH_TRACING: {os.getenv('LANGCHAIN_TRACING_V2')}")
    print(f"📍 Health check: http://localhost:8000/health")
    print("🧪 Test endpoint: POST http://localhost:8000/test")
    print("💬 Chat endpoint: POST http://localhost:8000/chat/invoke")
    print("🎮 Playground: http://localhost:8000/chat/playground/")
    print("---")
    print("🔧 VERSÃO CORRIGIDA - Debug info não deve mais vazar na mensagem!")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
