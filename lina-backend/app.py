#!/usr/bin/env python3
"""
Lina Backend - LangServe com FastAPI
Versão corrigida que resolve os problemas encontrados
"""

import os
from typing import Dict, Any, Optional # Adicionado Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough # Adicionado RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from pydantic import BaseModel # Adicionado BaseModel
import json # Adicionado json

# Carrega variáveis de ambiente
# Ajustado para procurar .env.keys no diretório pai de onde app.py está
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.keys')
load_dotenv(dotenv_path)


# Configuração LangSmith
# Usando os nomes de variáveis do seu .env.keys (LANGSMITH_*)
os.environ["LANGCHAIN_TRACING_V2"] = os.getenv("LANGSMITH_TRACING", "false")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGSMITH_API_KEY", "")
# Definindo um nome de projeto padrão se não estiver no .env.keys
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "lina-project-default")


# Inicializa FastAPI
app = FastAPI(
    title="Lina Backend API",
    version="1.0.0",
    description="Backend para o assistente pessoal Lina"
)

# CORS para permitir o frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # Adicione a porta do seu Agent Chat UI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "lina-backend"}

# Configuração do modelo LLM
def get_llm():
    """Cria instância do LLM com fallback"""
    try:
        return ChatOpenAI(
            model=os.getenv("OPENROUTER_DEFAULT_MODEL", "google/gemini-flash-1.5"), # Modelo do .env ou fallback
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
            temperature=0.7
        )
    except Exception as e:
        print(f"Erro ao configurar LLM principal: {e}")
        # Fallback para um modelo diferente se o primeiro falhar
        return ChatOpenAI(
            model="google/gemini-pro", # Um modelo comum como fallback
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
            temperature=0.7
        )

# Prompt template para a Lina
LINA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Você é Lina, um assistente pessoal inteligente e proativo.

Características da sua personalidade:
- Amigável mas profissional
- Proativa em sugerir melhorias
- Transparente sobre suas limitações
- Focada em resolver problemas
- Sempre responde em português brasileiro

Responda de forma clara, útil e concisa."""),
    ("human", "{input}")
])

# Função simples para processar input (usada como fallback ou pelo /test)
def process_input(data: Any) -> Dict[str, Any]: # Alterado para Any para mais flexibilidade
    """
    Processa o input para garantir que seja um dicionário com a chave 'input'.
    """
    if isinstance(data, dict) and "input" in data and isinstance(data["input"], str):
        return {"input": data["input"]}
    elif isinstance(data, str):
        return {"input": data}
    elif isinstance(data, dict):
        # Tenta encontrar um valor de string para usar como input
        for value in data.values():
            if isinstance(value, str):
                return {"input": value}
        # Se nenhum valor de string for encontrado, converte o dict inteiro para uma string JSON
        try:
            return {"input": json.dumps(data)}
        except TypeError: # Se o dict não for serializável
            return {"input": str(data)}
    return {"input": str(data)}

# Modelo Pydantic para o input das rotas /chat/*
class ChatInput(BaseModel):
    input: str
    # config: Optional[Dict[str, Any]] = None # Exemplo se precisar de config

# Lógica principal da chain (sem o processamento de input inicial)
lina_chain_logic = LINA_PROMPT | get_llm() | StrOutputParser()

# (A função process_input e adapt_input_for_lina_logic podem não ser mais necessárias da mesma forma
# se a chain principal e o payload forem redefinidos, ou podem ser simplificadas.
# Por enquanto, vamos mantê-las caso o endpoint /test ainda precise delas, mas a lógica principal mudará)

# Chain principal que será exposta pelo LangServe.
# Ela espera um objeto ChatInput como entrada, devido ao .with_types()
langserve_chain_core = LINA_PROMPT | get_llm() | StrOutputParser()
langserve_chain = langserve_chain_core.with_types(input_type=ChatInput)

# Adiciona as rotas do LangServe
add_routes(
    app,
    langserve_chain, 
    path="/chat",
    # input_type é agora inferido de langserve_chain.InputType (que é ChatInput)
    # enabled_endpoints=["invoke", "stream", "stream_log", "playground"], # Removido "info" e toda a linha
    playground_type="default"
)

# Endpoint de teste simples
from fastapi import Request 

@app.post("/test")
async def test_endpoint(request: Request):
    """
    Endpoint de teste para debug. 
    Ele tentará simular o novo formato de payload esperado se necessário,
    ou invocar a chain de uma forma que seja útil para teste.
    """
    try:
        data = await request.json() # Lê o corpo JSON explicitamente
        
        # Para testar a langserve_chain, precisamos fornecer um objeto ChatInput.
        # O test_backend.py precisará enviar {"input": {"input": "mensagem"}}
        # ou o endpoint /test precisará construir ChatInput a partir de um payload mais simples.
        # Vamos assumir que o payload para /test ainda é {"input": "mensagem simples"}
        # e vamos construir o ChatInput aqui para invocar a chain.
        
        if "input" in data and isinstance(data["input"], str):
            chat_input_obj = ChatInput(input=data["input"])
            # A langserve_chain espera ChatInput, então passamos o objeto.
            # O .invoke() na chain tipada com .with_types() espera o tipo especificado.
            result = langserve_chain.invoke(chat_input_obj) 
            return {"success": True, "result": result, "input_received": data}
        else:
            return {"success": False, "error": "Payload para /test deve ser {'input': 'string'}", "input_received": data}
            
    except Exception as e:
        return {"success": False, "error": str(e), "input_received": await request.body()}

if __name__ == "__main__":
    import uvicorn
    import json # Adicionado para o process_input
    
    print("🚀 Iniciando Lina Backend...")
    print(f"🔑 OPENROUTER_API_KEY carregada: {'Sim' if os.getenv('OPENROUTER_API_KEY') else 'Não'}")
    print(f"🛠️ LANGSMITH_TRACING: {os.getenv('LANGCHAIN_TRACING_V2')}")
    print(f"🗝️ LANGSMITH_API_KEY carregada: {'Sim' if os.getenv('LANGCHAIN_API_KEY') else 'Não'}")
    print(f"🏷️ LANGSMITH_PROJECT: {os.getenv('LANGCHAIN_PROJECT')}")
    print("---")
    print("📍 Health check: http://localhost:8000/health")
    print("🧪 Test endpoint: POST http://localhost:8000/test (corpo: {\"input\": \"seu texto\"})")
    print("💬 Chat endpoint (invoke): POST http://localhost:8000/chat/invoke (corpo: {\"input\": \"seu texto\"})")
    print("🌊 Chat endpoint (stream): POST http://localhost:8000/chat/stream (corpo: {\"input\": \"seu texto\"})")
    print("🎮 Playground: http://localhost:8000/chat/playground/")
    print("📊 Docs: http://localhost:8000/docs")
    print("---")
    
    uvicorn.run(
        "app:app", # app:app refere-se ao objeto 'app' neste arquivo 'app.py'
        host="0.0.0.0",
        port=8000,
        reload=True, # Ativa o reload automático para desenvolvimento
        log_level="info" # Nível de log
    )
