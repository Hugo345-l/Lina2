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
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from langserve import add_routes
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict
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

# 🗄️ CONFIGURAÇÃO OTIMIZADA DO SQLITE CHECKPOINTER (TAREFA 1.3.1)
import sqlite3

SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'lina_conversations.db'))
print(f"🗄️ SQLite Database Path: {SQLITE_DB_PATH}")

def setup_optimized_sqlite():
    """Configuração otimizada do SQLite conforme documentação LangChain"""
    try:
        # Conexão direta com configurações específicas
        conn = sqlite3.connect(
            SQLITE_DB_PATH,
            check_same_thread=False,
            isolation_level=None  # WAL mode funciona melhor sem isolation
        )
        
        # Habilitar WAL mode (Write-Ahead Logging)
        conn.execute("PRAGMA journal_mode=WAL")
        print("✅ WAL mode habilitado")
        
        # Otimizações de performance conforme documentação
        conn.execute("PRAGMA synchronous=NORMAL")     # Balance entre segurança e velocidade
        conn.execute("PRAGMA cache_size=10000")       # 10MB de cache
        conn.execute("PRAGMA temp_store=memory")      # Usar RAM para temporários
        conn.execute("PRAGMA mmap_size=268435456")    # 256MB memory mapping
        
        # Configurações específicas do WAL
        conn.execute("PRAGMA wal_autocheckpoint=1000") # Checkpoint a cada 1000 páginas
        conn.execute("PRAGMA busy_timeout=30000")      # 30 segundos timeout
        
        print("✅ Otimizações SQLite aplicadas")
        
        # Criar SqliteSaver com conexão otimizada
        checkpointer = SqliteSaver(conn)
        print("✅ SqliteSaver criado com conexão otimizada")
        
        return checkpointer
        
    except Exception as e:
        print(f"⚠️ Erro ao configurar SQLite otimizado: {e}")
        return None

# Configurar checkpointer otimizado
checkpointer = setup_optimized_sqlite()
if checkpointer:
    print(f"✅ Checkpointer otimizado configurado em: {SQLITE_DB_PATH}")
else:
    print("⚠️ Fallback: Checkpointer desabilitado")

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

# Configurar arquivos estáticos para servir o frontend
FRONTEND_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lina-frontend"))
print(f"🔍 Caminho do frontend: {FRONTEND_PATH}")
print(f"🔍 Frontend existe: {os.path.exists(FRONTEND_PATH)}")

if os.path.exists(FRONTEND_PATH):
    # Montar arquivos estáticos ANTES da rota específica
    app.mount("/static-frontend", StaticFiles(directory=FRONTEND_PATH), name="frontend")
    print(f"✅ Frontend servido em: {FRONTEND_PATH}")
    print(f"✅ Arquivos estáticos disponíveis em: /static-frontend/")
else:
    print(f"⚠️  Frontend não encontrado em: {FRONTEND_PATH}")

# Rota específica para servir index.html em /lina-frontend/
@app.get("/lina-frontend/")
async def serve_frontend():
    frontend_index = os.path.join(FRONTEND_PATH, "index.html")
    print(f"🔍 Tentando servir: {frontend_index}")
    print(f"🔍 Arquivo existe: {os.path.exists(frontend_index)}")
    
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    else:
        return {"error": "Frontend index.html não encontrado", "path_checked": frontend_index}

# Rota alternativa para acessar arquivos estáticos diretamente
@app.get("/lina-frontend/{file_path:path}")
async def serve_frontend_files(file_path: str):
    full_path = os.path.join(FRONTEND_PATH, file_path)
    print(f"🔍 Servindo arquivo: {full_path}")
    
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return FileResponse(full_path)
    else:
        return {"error": "Arquivo não encontrado", "path_checked": full_path}

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

# 🗄️ LANGGRAPH STATE E GRAPH CORRIGIDO (TAREFA 1.3.1)
from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState

class AgentState(MessagesState):
    """Estado do agente conforme documentação LangChain"""
    thread_id: Optional[str] = None
    user_id: Optional[str] = None
    current_step: str = "chat"
    debug_info: dict = {}

def chat_node(state: AgentState) -> dict:
    """Nó principal do chat conforme padrão LangChain"""
    
    # Extrair mensagens do estado (MessagesState format)
    messages = state.get("messages", [])
    if not messages:
        return {"messages": [AIMessage(content="Olá! Como posso ajudar?")]}
    
    # Pegar a última mensagem (deve ser HumanMessage)
    last_message = messages[-1]
    user_input = last_message.content if hasattr(last_message, 'content') else str(last_message)
    
    print(f"[DEBUG] Chat node processing: {user_input[:50]}...")
    
    # Executar chain com LLM
    try:
        llm = get_llm()
        chain = LINA_PROMPT | llm
        
        # Invocar com input estruturado
        ai_message = chain.invoke({"input": user_input})
        
        # Extrair metadados para debug
        metadata = getattr(ai_message, 'response_metadata', {})
        token_usage = metadata.get('token_usage', {})
        
        debug_info = {
            "tokens_used": token_usage.get('total_tokens', 0),
            "prompt_tokens": token_usage.get('prompt_tokens', 0),
            "completion_tokens": token_usage.get('completion_tokens', 0),
            "model_name": metadata.get('model_name', 'unknown'),
            "cost": calculate_cost(
                metadata.get('model_name', ''), 
                token_usage.get('prompt_tokens', 0),
                token_usage.get('completion_tokens', 0), 
                PRICING_CONFIG
            )
        }
        
        print(f"[DEBUG] Chat node completed - tokens: {debug_info['tokens_used']}")
        
        # Retornar state update conforme padrão
        return {
            "messages": [ai_message],
            "debug_info": debug_info
        }
        
    except Exception as e:
        print(f"[ERROR] Chat node error: {e}")
        error_message = AIMessage(content=f"Erro: {str(e)}")
        return {
            "messages": [error_message],
            "debug_info": {"error": str(e)}
        }

def create_conversation_graph():
    """Cria grafo de conversação otimizado conforme documentação"""
    
    print("🔧 Criando StateGraph com checkpointing...")
    
    # Criar graph com AgentState
    workflow = StateGraph(AgentState)
    
    # Adicionar nó principal
    workflow.add_node("chat", chat_node)
    
    # Definir entry point e edges
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)
    
    # Compilar com checkpointer otimizado
    if checkpointer:
        compiled_graph = workflow.compile(checkpointer=checkpointer)
        print("✅ StateGraph compilado com checkpointer")
        return compiled_graph
    else:
        compiled_graph = workflow.compile()
        print("⚠️ StateGraph compilado SEM checkpointer")
        return compiled_graph

# Criar instância do grafo otimizado
conversation_graph = create_conversation_graph()
print(f"🗄️ Conversation graph criado: {conversation_graph is not None}")

# Chain principal - mantendo compatibilidade
basic_chain = LINA_PROMPT | get_llm()
langserve_chain_core = basic_chain | RunnableLambda(format_response_with_debug_info)

# WRAPPER LANGSERVE COMPATÍVEL (TAREFA 1.3.1 - ETAPA 3)
def lina_api_wrapper(input_data: dict) -> dict:
    """Wrapper LangServe compatível que usa StateGraph com checkpointing otimizado"""
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

    print(f"[DEBUG] Wrapper processing: {user_message[:50]}...")

    # 🗄️ USAR LANGGRAPH COM CHECKPOINTER OTIMIZADO
    try:
        # Configuração completa do thread conforme documentação
        thread_id = f"thread_{int(time.time())}"
        config = {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": "",
                "checkpoint_id": None
            }
        }
        
        # Estado inicial com HumanMessage (MessagesState format)
        initial_state = {
            "messages": [HumanMessage(content=user_message)],
            "thread_id": thread_id,
            "current_step": "chat"
        }
        
        print(f"[DEBUG] Invoking StateGraph with thread_id: {thread_id}")
        
        # Executar grafo com checkpointing
        result = conversation_graph.invoke(initial_state, config=config)
        
        print(f"[DEBUG] StateGraph execution successful")
        
        # Extrair resposta do estado final (MessagesState format)
        final_messages = result.get("messages", [])
        if final_messages and len(final_messages) > 0:
            # Pegar a última mensagem AI
            last_ai_message = final_messages[-1]
            if hasattr(last_ai_message, 'content'):
                output = last_ai_message.content
            else:
                output = str(last_ai_message)
        else:
            output = "Erro: Nenhuma resposta gerada"
        
        # Extrair debug info do estado
        debug_info_partial = result.get("debug_info", {})
        
        print(f"[DEBUG] Extracted output length: {len(output) if output else 0}")
        print(f"[DEBUG] Debug info keys: {list(debug_info_partial.keys()) if debug_info_partial else []}")
        
    except Exception as e:
        print(f"[ERROR] StateGraph error: {e}")
        import traceback
        traceback.print_exc()
        
        print(f"[ERROR] Falling back to basic chain")
        # Fallback para chain básico se StateGraph falhar
        try:
            result_from_chain = langserve_chain_core.invoke({"input": user_message})
            output = result_from_chain["output"]
            debug_info_partial = result_from_chain["debug_info_partial"]
            print(f"[DEBUG] Fallback successful")
        except Exception as fallback_error:
            print(f"[ERROR] Fallback also failed: {fallback_error}")
            output = f"Erro: {str(e)}"
            debug_info_partial = {
                "cost": 0.0,
                "tokens_used": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "model_name": "error"
            }
    
    duration_seconds = time.time() - start_time

    # Garantir estrutura de debug_info completa
    if not debug_info_partial:
        debug_info_partial = {
            "cost": 0.0,
            "tokens_used": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "model_name": "unknown"
        }

    # Construir resposta final
    final_debug_info = DebugInfo(
        cost=debug_info_partial.get("cost", 0.0),
        tokens_used=debug_info_partial.get("tokens_used", 0),
        prompt_tokens=debug_info_partial.get("prompt_tokens", 0),
        completion_tokens=debug_info_partial.get("completion_tokens", 0),
        model_name=debug_info_partial.get("model_name", "unknown"),
        duration=round(duration_seconds, 3)
    )

    # Garantir que output é string limpa
    if not isinstance(output, str):
        output = str(output)

    # Criar resposta estruturada
    chat_response_obj = ChatResponse(
        output=output,
        debug_info=final_debug_info
    )
    
    response_dict = chat_response_obj.model_dump()
    
    # DEBUGGING FINAL
    print(f"[DEBUG] Response created - output length: {len(response_dict['output'])}")
    print(f"[DEBUG] Duration: {duration_seconds:.3f}s")
    print(f"[DEBUG] Tokens: {final_debug_info.tokens_used}")
    
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
