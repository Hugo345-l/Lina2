# Fundamentos LangChain: Arquitetura, LangGraph e LangSmith

## 📋 Índice - Parte 1

1. [Arquitetura Geral do Ecossistema](#arquitetura-geral)
2. [LangGraph: Orquestração Multi-Agente](#langgraph)
3. [LangSmith: Observabilidade e Monitoramento](#langsmith)

---

## 1. Arquitetura Geral do Ecossistema {#arquitetura-geral}

### Visão Geral da Stack

O ecossistema LangChain em 2025 é composto por quatro pilares principais que trabalham em conjunto para criar aplicações de IA robustas e escaláveis:

```mermaid
graph TB
    UI[Interface do Usuário] --> API[LangServe API Layer]
    API --> GRAPH[LangGraph Orchestration]
    GRAPH --> SMITH[LangSmith Observability]
    GRAPH --> TOOLS[Tools & Integrations]
    SMITH --> METRICS[(Metrics & Analytics)]
    TOOLS --> EXTERNAL[External Services]
```

### Os Quatro Pilares

#### 1. **LangChain Core**: Fundação e Abstrações
```python
# Conceitos fundamentais
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

# Exemplo básico de chain
prompt = ChatPromptTemplate.from_messages([
    ("system", "Você é um assistente útil."),
    ("human", "{input}")
])

chain = prompt | llm | StrOutputParser()
result = chain.invoke({"input": "Olá!"})
```

**Responsabilidades:**
- Abstrações base (Messages, Prompts, Parsers)
- Interface comum para LLMs
- Sistema de Runnables (chainable components)
- Memory abstractions

#### 2. **LangGraph**: Orquestração de Workflows
```python
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode

# Workflow com estado
class MyState(MessagesState):
    current_step: str
    context: dict

workflow = StateGraph(MyState)
workflow.add_node("analyzer", analyze_input)
workflow.add_node("processor", process_data)
workflow.add_edge("analyzer", "processor")
```

**Responsabilidades:**
- Workflows complexos com estado
- Multi-agent orchestration
- Checkpointing e persistência
- Human-in-the-loop patterns

#### 3. **LangServe**: Deploy e APIs
```python
from langserve import add_routes
from fastapi import FastAPI

app = FastAPI()
add_routes(app, chain, path="/my-agent")
# Cria automaticamente: /invoke, /batch, /stream, /playground
```

**Responsabilidades:**
- REST APIs automáticas
- Streaming support
- Authentication & rate limiting
- Interactive playgrounds

#### 4. **LangSmith**: Observabilidade
```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your_key"

# Tracing automático de todas as operações
# Métricas, debugging, evaluation
```

**Responsabilidades:**
- Tracing automático
- Performance monitoring
- Cost tracking
- Quality evaluation

### Filosofia de Design

**Composabilidade**: Cada componente pode ser usado independentemente ou combinado
```python
# Componentes independentes
llm_chain = prompt | llm
parser_chain = llm | parser
full_chain = prompt | llm | parser

# Combinação flexível
complex_chain = (
    RunnablePassthrough.assign(context=context_retriever) |
    prompt | 
    llm | 
    parser
)
```

**Observabilidade First**: Todo componente é automaticamente observável
```python
# Sem configuração adicional, você ganha:
# - Traces de execução
# - Tempo de resposta
# - Tokens utilizados
# - Erros e stack traces
```

**Async-Native**: Suporte nativo para operações assíncronas
```python
# Tanto sync quanto async
result = chain.invoke(input)
result = await chain.ainvoke(input)

# Streaming
for chunk in chain.stream(input):
    print(chunk)
```

---

## 2. LangGraph: Orquestração Multi-Agente {#langgraph}

### Conceitos Fundamentais

#### StateGraph: O Coração do LangGraph

O `StateGraph` é uma máquina de estados que permite criar workflows complexos com estado compartilhado:

```python
from langgraph.graph import StateGraph, MessagesState
from typing import Annotated, TypedDict

# 1. Definir o estado compartilhado
class AgentState(MessagesState):
    """Estado compartilhado entre todos os nós"""
    current_task: str
    completed_steps: list[str]
    user_preferences: dict
    error_count: int = 0

# 2. Criar o grafo
workflow = StateGraph(AgentState)

# 3. Definir funções dos nós
def input_processor(state: AgentState) -> dict:
    """Processa entrada do usuário"""
    last_message = state["messages"][-1].content
    
    return {
        "current_task": extract_task(last_message),
        "messages": [AIMessage(content="Processando sua solicitação...")]
    }

def task_executor(state: AgentState) -> dict:
    """Executa a tarefa identificada"""
    task = state["current_task"]
    result = execute_task(task)
    
    return {
        "completed_steps": state["completed_steps"] + [task],
        "messages": state["messages"] + [AIMessage(content=result)]
    }

# 4. Adicionar nós ao grafo
workflow.add_node("input_processor", input_processor)
workflow.add_node("task_executor", task_executor)

# 5. Definir fluxo
workflow.set_entry_point("input_processor")
workflow.add_edge("input_processor", "task_executor")
workflow.add_edge("task_executor", "__end__")

# 6. Compilar
app = workflow.compile()
```

#### Sistema de Checkpoints

Os checkpoints permitem persistência automática do estado:

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Checkpoint em memória (desenvolvimento)
memory_checkpointer = MemorySaver()

# Checkpoint em SQLite (produção)
sqlite_checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

# Compilar com checkpointer
app = workflow.compile(checkpointer=sqlite_checkpointer)

# Usar com configuração
config = {"configurable": {"thread_id": "user_123_session_1"}}
result = app.invoke({"messages": [HumanMessage("Olá")]}, config=config)

# Estado é automaticamente salvo e pode ser recuperado
state = app.get_state(config)
print(state.values)  # Estado atual
print(state.next)    # Próximos nós possíveis
```

#### Command System para Roteamento Dinâmico

```python
from langgraph.prebuilt import Command

def supervisor_node(state: AgentState) -> Command:
    """Supervisor que roteia para diferentes agentes"""
    last_message = state["messages"][-1].content.lower()
    
    if "email" in last_message:
        return Command(
            goto="email_agent",
            update={"current_task": "email_processing"}
        )
    elif "calendar" in last_message:
        return Command(
            goto="calendar_agent", 
            update={"current_task": "calendar_management"}
        )
    else:
        return Command(
            goto="general_agent",
            update={"current_task": "general_conversation"}
        )

# Usar Command para roteamento dinâmico
workflow.add_node("supervisor", supervisor_node)
```

### Patterns de Multi-Agent

#### 1. Supervisor Pattern (Recomendado para Lina)

```python
def create_supervisor_workflow():
    """Padrão supervisor com agentes especializados"""
    
    class SupervisorState(MessagesState):
        next_agent: str
        task_context: dict
        agent_responses: dict
    
    def supervisor(state: SupervisorState) -> Command:
        """Decide qual agente usar"""
        system_prompt = """
        Você é um supervisor. Analise a mensagem e decida qual agente deve processar:
        - conversation_agent: Para conversas gerais
        - task_agent: Para execução de tarefas específicas  
        - memory_agent: Para busca em histórico
        
        Responda apenas com o nome do agente.
        """
        
        decision = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=state["messages"][-1].content)
        ])
        
        agent_name = decision.content.strip().lower()
        
        return Command(
            goto=agent_name,
            update={"next_agent": agent_name}
        )
    
    def conversation_agent(state: SupervisorState) -> dict:
        """Agente de conversação geral"""
        response = llm.invoke(state["messages"])
        return {"messages": [response]}
    
    def task_agent(state: SupervisorState) -> dict:
        """Agente de execução de tarefas"""
        # Lógica para executar tarefas específicas
        task_result = "Tarefa executada com sucesso!"
        return {"messages": [AIMessage(content=task_result)]}
    
    # Construir o grafo
    workflow = StateGraph(SupervisorState)
    workflow.add_node("supervisor", supervisor)
    workflow.add_node("conversation_agent", conversation_agent)
    workflow.add_node("task_agent", task_agent)
    
    workflow.set_entry_point("supervisor")
    workflow.add_edge("conversation_agent", "__end__")
    workflow.add_edge("task_agent", "__end__")
    
    return workflow.compile()
```

#### 2. Sequential Processing Pattern

```python
def create_sequential_workflow():
    """Pipeline sequencial de processamento"""
    
    class ProcessingState(MessagesState):
        raw_input: str
        parsed_intent: dict
        processed_result: str
        confidence_score: float
    
    def parse_intent(state: ProcessingState) -> dict:
        """Extrai intenção da mensagem"""
        intent_prompt = """
        Analise a mensagem e extraia:
        - intent: tipo de solicitação
        - entities: entidades mencionadas
        - confidence: confiança na análise (0-1)
        
        Formato JSON.
        """
        
        result = llm.invoke([
            SystemMessage(content=intent_prompt),
            HumanMessage(content=state["messages"][-1].content)
        ])
        
        intent_data = json.loads(result.content)
        
        return {
            "parsed_intent": intent_data,
            "confidence_score": intent_data.get("confidence", 0.5)
        }
    
    def process_request(state: ProcessingState) -> dict:
        """Processa baseado na intenção"""
        intent = state["parsed_intent"]["intent"]
        
        if intent == "question":
            result = answer_question(state)
        elif intent == "task":
            result = execute_task(state)
        else:
            result = general_response(state)
        
        return {"processed_result": result}
    
    def format_response(state: ProcessingState) -> dict:
        """Formata resposta final"""
        formatted = format_output(
            state["processed_result"],
            state["confidence_score"]
        )
        
        return {"messages": [AIMessage(content=formatted)]}
    
    # Pipeline linear
    workflow = StateGraph(ProcessingState)
    workflow.add_node("parse_intent", parse_intent)
    workflow.add_node("process_request", process_request)
    workflow.add_node("format_response", format_response)
    
    workflow.set_entry_point("parse_intent")
    workflow.add_edge("parse_intent", "process_request")
    workflow.add_edge("process_request", "format_response")
    workflow.add_edge("format_response", "__end__")
    
    return workflow.compile()
```

### Human-in-the-Loop

```python
from langgraph.prebuilt import Command

def create_approval_workflow():
    """Workflow com aprovação humana"""
    
    class ApprovalState(MessagesState):
        pending_action: dict
        approved: bool = False
        human_feedback: str = ""
    
    def analyze_request(state: ApprovalState) -> Command:
        """Analisa se precisa de aprovação"""
        message = state["messages"][-1].content
        
        # Detectar ações sensíveis
        if any(keyword in message.lower() for keyword in ["delete", "send email", "schedule"]):
            return Command(
                goto="request_approval",
                update={
                    "pending_action": {"type": "sensitive", "description": message}
                }
            )
        else:
            return Command(goto="execute_directly")
    
    def request_approval(state: ApprovalState) -> Command:
        """Solicita aprovação humana"""
        # Interrompe para aprovação
        return Command(goto="__end__", update={"messages": [
            AIMessage(content="Ação sensível detectada. Aprovação necessária.")
        ]})
    
    def execute_with_approval(state: ApprovalState) -> dict:
        """Executa após aprovação"""
        if state["approved"]:
            result = execute_action(state["pending_action"])
            return {"messages": [AIMessage(content=f"Executado: {result}")]}
        else:
            return {"messages": [AIMessage(content="Ação cancelada pelo usuário.")]}
    
    workflow = StateGraph(ApprovalState)
    workflow.add_node("analyze_request", analyze_request)
    workflow.add_node("request_approval", request_approval)
    workflow.add_node("execute_with_approval", execute_with_approval)
    
    workflow.set_entry_point("analyze_request")
    
    return workflow.compile(checkpointer=SqliteSaver.from_conn_string("approval.db"))

# Uso com interrupção
app = create_approval_workflow()
config = {"configurable": {"thread_id": "approval_session"}}

# Primeira execução - para na aprovação
result = app.invoke({"messages": [HumanMessage("Delete all emails")]}, config)

# Verificar estado
state = app.get_state(config)
if state.next == ("execute_with_approval",):
    # Humano decide
    app.update_state(config, {"approved": True, "human_feedback": "Approved"})
    
    # Continuar execução
    result = app.invoke(None, config)
```

---

## 3. LangSmith: Observabilidade e Monitoramento {#langsmith}

### Setup e Configuração

```python
import os
from langsmith import Client

# Configuração básica
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls__sua_chave_aqui"
os.environ["LANGCHAIN_PROJECT"] = "meu-projeto-ia"

# Cliente para operações avançadas
client = Client()
```

### Estrutura de Traces

#### Hierarquia Automática
```python
# Exemplo de trace automático
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4")
prompt = ChatPromptTemplate.from_template("Explique {topic}")

# Esta chain será automaticamente traced
chain = prompt | llm

# Execução gera trace completo
result = chain.invoke({"topic": "LangChain"})

# Estrutura do trace:
# 📊 Chain Execution (Run)
# ├── 📝 Prompt Formatting (Run)  
# ├── 🤖 LLM Call (LLM Run)
# │   ├── Input: formatted prompt
# │   ├── Output: LLM response  
# │   ├── Tokens: input/output counts
# │   └── Cost: calculated cost
# └── ⚡ Total Duration: end-to-end time
```

#### Traces Customizados

```python
from langsmith import traceable
import time

@traceable(name="custom_processing")
def complex_processing(input_data: dict) -> dict:
    """Função customizada com tracing"""
    
    # Simular processamento
    time.sleep(1)
    
    # Dados que aparecerão no trace
    return {
        "processed": True,
        "input_size": len(str(input_data)),
        "processing_time": 1.0
    }

@traceable(name="multi_step_workflow")
def workflow_with_steps(user_input: str) -> str:
    """Workflow com múltiplos steps traced"""
    
    # Step 1: Preprocessamento
    with traceable(name="preprocessing") as trace:
        cleaned_input = user_input.strip().lower()
        trace.metadata = {"original_length": len(user_input)}
    
    # Step 2: Processamento principal
    with traceable(name="main_processing") as trace:
        result = complex_processing({"text": cleaned_input})
        trace.metadata = {"success": result["processed"]}
    
    # Step 3: Formatação
    with traceable(name="formatting") as trace:
        formatted = f"Resultado: {result}"
        trace.metadata = {"output_length": len(formatted)}
    
    return formatted

# Uso mantém hierarquia de traces
output = workflow_with_steps("  Olá Mundo  ")
```

### Métricas e Analytics

#### Métricas Automáticas
```python
# LangSmith coleta automaticamente:
metrics_collected = {
    "performance": {
        "latency": "Tempo total de execução",
        "first_token_time": "Tempo até primeiro token (streaming)",
        "tokens_per_second": "Velocidade de geração"
    },
    "usage": {
        "input_tokens": "Tokens de entrada",
        "output_tokens": "Tokens de saída", 
        "total_tokens": "Total de tokens",
        "estimated_cost": "Custo estimado"
    },
    "quality": {
        "error_rate": "Taxa de erro por período",
        "success_rate": "Taxa de sucesso",
        "feedback_scores": "Scores de feedback do usuário"
    }
}
```

#### Métricas Customizadas
```python
from langsmith import Client

client = Client()

def log_custom_metrics(session_id: str, metrics: dict):
    """Log métricas customizadas"""
    
    # Criar run customizado para métricas
    run = client.create_run(
        name="custom_metrics",
        run_type="llm",  # ou "chain", "tool", etc.
        inputs={"session_id": session_id},
        outputs=metrics,
        session_name=session_id
    )
    
    # Adicionar tags para filtrar
    client.update_run(
        run.id,
        tags=["metrics", "custom", "performance"]
    )

# Exemplo de uso
log_custom_metrics("user_123_session", {
    "user_satisfaction": 4.5,
    "task_completion_time": 120,  # segundos
    "errors_encountered": 0,
    "features_used": ["email", "calendar"]
})
```

### Feedback e Avaliação

#### Sistema de Feedback
```python
from langsmith import Client

client = Client()

def collect_user_feedback(run_id: str, feedback_data: dict):
    """Coleta feedback do usuário"""
    
    client.create_feedback(
        run_id=run_id,
        key="user_satisfaction",
        score=feedback_data.get("rating", 0),  # 0-1 ou 0-5
        comment=feedback_data.get("comment", ""),
        source_info={
            "user_id": feedback_data.get("user_id"),
            "feedback_type": "explicit"
        }
    )

# Capturar run ID durante execução
@traceable
def assistente_resposta(pergunta: str) -> str:
    resposta = llm.invoke([HumanMessage(content=pergunta)])
    
    # Run ID fica disponível automaticamente
    current_run = traceable.get_current_run_context()
    
    # Salvar para coletar feedback depois
    save_run_id_for_feedback(current_run.run_id, pergunta)
    
    return resposta.content

# Depois de mostrar resposta ao usuário
def after_user_interaction(run_id: str, user_rating: int, comment: str):
    collect_user_feedback(run_id, {
        "rating": user_rating,
        "comment": comment,
        "user_id": "user_123"
    })
```

#### Avaliação Automática
```python
from langsmith.evaluation import evaluate, LangChainStringEvaluator

# Definir dataset de teste
test_cases = [
    {"input": {"question": "O que é Python?"}, "expected": "linguagem_programacao"},
    {"input": {"question": "Como fazer café?"}, "expected": "receita_culinaria"},
]

# Avaliadores automáticos
evaluators = [
    # Avaliador de relevância
    LangChainStringEvaluator(
        "labeled_score_string",
        config={
            "criteria": "relevance",
            "normalize_by": 10
        }
    ),
    
    # Avaliador customizado
    lambda run, example: {
        "key": "custom_score", 
        "score": calculate_custom_score(run.outputs, example.outputs)
    }
]

# Executar avaliação
results = evaluate(
    lambda inputs: chain.invoke(inputs),
    data=test_cases,
    evaluators=evaluators,
    experiment_prefix="teste_qualidade_v1"
)

print(f"Accuracy: {results['accuracy']}")
print(f"Average Score: {results['average_score']}")
```

### Dashboards e Alertas

#### Dashboards Nativos
```python
# LangSmith fornece dashboards automáticos para:
dashboard_views = {
    "overview": {
        "total_traces": "Número total de execuções",
        "error_rate": "Taxa de erro ao longo do tempo",
        "latency_p95": "95th percentil de latência",
        "cost_trends": "Tendências de custo"
    },
    
    "performance": {
        "latency_distribution": "Distribuição de tempos de resposta",
        "throughput": "Requisições por minuto/hora",
        "token_usage": "Uso de tokens ao longo do tempo"
    },
    
    "quality": {
        "feedback_scores": "Scores de feedback ao longo do tempo",
        "success_rate": "Taxa de sucesso por operação",
        "error_types": "Distribuição de tipos de erro"
    }
}
```

#### Alertas Customizados
```python
from langsmith import Client

def setup_monitoring_alerts():
    """Configurar alertas de monitoramento"""
    
    alert_rules = [
        {
            "name": "high_error_rate",
            "condition": "error_rate > 0.05",  # 5%
            "window": "5 minutes",
            "notification": {
                "type": "webhook",
                "url": "https://hooks.slack.com/...",
                "message": "Taxa de erro alta detectada: {{error_rate}}%"
            }
        },
        
        {
            "name": "high_latency",
            "condition": "p95_latency > 5000",  # 5 segundos
            "window": "2 minutes", 
            "notification": {
                "type": "email",
                "recipients": ["admin@empresa.com"],
                "message": "Latência alta: {{p95_latency}}ms"
            }
        },
        
        {
            "name": "cost_spike",
            "condition": "hourly_cost > 10.0",  # $10/hora
            "window": "1 hour",
            "notification": {
                "type": "both",
                "message": "Pico de custo: ${{hourly_cost}}/hora"
            }
        }
    ]
    
    # Implementar via webhooks ou API do LangSmith
    for rule in alert_rules:
        setup_alert_rule(rule)

def setup_alert_rule(rule: dict):
    """Implementação do sistema de alertas"""
    # Integração com sistema de monitoramento
    # Pode usar Prometheus, Grafana, ou webhooks customizados
    pass
```

### Debugging e Troubleshooting

#### Traces Detalhados
```python
# Para debug detalhado, habilitar informações extras
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_DETAILED_TRACING"] = "true"

@traceable(name="debug_session")
def debug_workflow(input_data):
    """Workflow para debugging com informações extras"""
    
    try:
        # Cada step é automaticamente traced
        step1_result = preprocessing_step(input_data)
        step2_result = main_processing_step(step1_result)
        final_result = postprocessing_step(step2_result)
        
        return final_result
        
    except Exception as e:
        # Erros são automaticamente capturados no trace
        current_run = traceable.get_current_run_context()
        current_run.error = str(e)
        current_run.end_time = datetime.now()
        raise

# Stack traces completos ficam disponíveis no LangSmith
```

#### Análise de Performance
```python
from langsmith import Client

def analyze_performance_bottlenecks(project_name: str, time_range: str = "24h"):
    """Analisa gargalos de performance"""
    
    client = Client()
    
    # Buscar runs com alta latência
    slow_runs = client.list_runs(
        project_name=project_name,
        filter="latency > 5000",  # > 5 segundos
        start_time=f"-{time_range}"
    )
    
    # Analisar padrões
    bottlenecks = {}
    for run in slow_runs:
        operation = run.name
        if operation not in bottlenecks:
            bottlenecks[operation] = {
                "count": 0,
                "avg_latency": 0,
                "total_latency": 0
            }
        
        bottlenecks[operation]["count"] += 1
        bottlenecks[operation]["total_latency"] += run.latency
    
    # Calcular médias
    for operation in bottlenecks:
        count = bottlenecks[operation]["count"]
        total = bottlenecks[operation]["total_latency"]
        bottlenecks[operation]["avg_latency"] = total / count
    
    return sorted(
        bottlenecks.items(), 
        key=lambda x: x[1]["avg_latency"], 
        reverse=True
    )

# Exemplo de uso
bottlenecks = analyze_performance_bottlenecks("lina-assistant")
for operation, stats in bottlenecks[:5]:  # Top 5 gargalos
    print(f"{operation}: {stats['avg_latency']:.2f}ms médio ({stats['count']} runs)")
```

LangChain Guide: MCPs, Persistência e LangServe
📋 Índice - Parte 2

Model Context Protocols (MCPs)
Sistema de Persistência e Threads
LangServe: API e Deployment


4. Model Context Protocols (MCPs) {#mcps}
O que são MCPs?
Model Context Protocols são uma especificação padronizada criada pela Anthropic para conectar modelos de IA a ferramentas externas de forma segura e consistente. É como um "USB" para integrações de IA - um protocolo único que funciona com qualquer ferramenta que o implemente.
Arquitetura MCP
mermaidgraph LR
    AI[LLM/Agent] --> ADAPTER[MCP Adapter]
    ADAPTER --> SERVER1[Gmail MCP Server]
    ADAPTER --> SERVER2[Calendar MCP Server] 
    ADAPTER --> SERVER3[File System MCP Server]
    SERVER1 --> GMAIL[Gmail API]
    SERVER2 --> GCAL[Google Calendar API]
    SERVER3 --> FS[Local File System]
Componentes Principais
1. Tools: Funções que o AI pode executar
python# Exemplo de tool MCP
{
    "name": "send_email",
    "description": "Send an email via Gmail",
    "inputSchema": {
        "type": "object",
        "properties": {
            "to": {"type": "string", "description": "Recipient email"},
            "subject": {"type": "string", "description": "Email subject"},
            "body": {"type": "string", "description": "Email content"}
        },
        "required": ["to", "subject", "body"]
    }
}
2. Resources: Fontes de dados estruturados
python# Exemplo de resource MCP
{
    "uri": "gmail://inbox/unread",
    "name": "Unread emails",
    "description": "List of unread emails in inbox",
    "mimeType": "application/json"
}
3. Prompts: Templates reutilizáveis
python# Exemplo de prompt MCP
{
    "name": "email_summary",
    "description": "Generate email summary",
    "arguments": [
        {
            "name": "emails",
            "description": "List of email objects",
            "required": true
        }
    ]
}
Implementação Básica de um MCP Server
python# gmail_mcp_server.py
import asyncio
from mcp.server import Server
from mcp.types import Tool, Resource, TextContent

# Criar servidor MCP
app = Server("gmail-integration")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """Lista ferramentas disponíveis"""
    return [
        Tool(
            name="send_email",
            description="Send email via Gmail",
            inputSchema={
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to", "subject", "body"]
            }
        ),
        Tool(
            name="list_emails",
            description="List emails from inbox",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "default": "is:unread"},
                    "max_results": {"type": "integer", "default": 10}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Executa ferramenta solicitada"""
    
    if name == "send_email":
        # Integração real com Gmail API
        result = await gmail_service.send_message(
            to=arguments["to"],
            subject=arguments["subject"],
            body=arguments["body"]
        )
        return [TextContent(
            type="text", 
            text=f"Email enviado com sucesso. ID: {result.id}"
        )]
    
    elif name == "list_emails":
        # Buscar emails
        emails = await gmail_service.list_messages(
            query=arguments.get("query", "is:unread"),
            max_results=arguments.get("max_results", 10)
        )
        
        # Formatar resposta
        email_list = []
        for email in emails:
            email_list.append(f"De: {email.sender}\nAssunto: {email.subject}\n---")
        
        return [TextContent(
            type="text",
            text="\n".join(email_list)
        )]

@app.list_resources()
async def list_resources() -> list[Resource]:
    """Lista recursos disponíveis"""
    return [
        Resource(
            uri="gmail://inbox/unread",
            name="Unread Emails",
            description="Current unread emails in inbox",
            mimeType="application/json"
        ),
        Resource(
            uri="gmail://sent/recent",
            name="Recent Sent Emails", 
            description="Recently sent emails",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    """Lê conteúdo de um resource"""
    
    if uri == "gmail://inbox/unread":
        unread = await gmail_service.get_unread_count()
        return json.dumps({
            "count": unread.count,
            "latest": unread.latest_subjects
        })
    
    elif uri == "gmail://sent/recent":
        recent_sent = await gmail_service.get_recent_sent(limit=5)
        return json.dumps([
            {"to": email.to, "subject": email.subject, "sent_at": email.sent_at}
            for email in recent_sent
        ])

# Executar servidor
if __name__ == "__main__":
    import mcp.server.stdio
    mcp.server.stdio.run_server(app)
Integração MCP com LangChain
pythonfrom langchain_mcp import MCPToolkit

# Configurar cliente MCP
async def setup_mcp_integration():
    """Configura integração com múltiplos servidores MCP"""
    
    # Configuração dos servidores
    servers_config = {
        "gmail": {
            "command": "python",
            "args": ["-m", "gmail_mcp_server"],
            "env": {"GMAIL_CREDENTIALS": "/path/to/creds.json"}
        },
        "calendar": {
            "command": "python", 
            "args": ["-m", "calendar_mcp_server"],
            "env": {"CALENDAR_CREDENTIALS": "/path/to/creds.json"}
        },
        "filesystem": {
            "command": "python",
            "args": ["-m", "filesystem_mcp_server"],
            "env": {"ALLOWED_PATHS": "/home/user/documents"}
        }
    }
    
    # Criar toolkit MCP
    mcp_toolkit = MCPToolkit()
    
    # Conectar a cada servidor
    for name, config in servers_config.items():
        await mcp_toolkit.add_server(
            name=name,
            **config
        )
    
    # Obter todas as tools disponíveis
    available_tools = mcp_toolkit.get_tools()
    
    return available_tools, mcp_toolkit

# Uso com LangGraph
async def create_mcp_enabled_agent():
    """Cria agente com capacidades MCP"""
    
    tools, mcp_toolkit = await setup_mcp_integration()
    
    def mcp_agent_node(state: MessagesState) -> dict:
        """Node que pode usar ferramentas MCP"""
        
        # Decidir qual ferramenta usar baseado na mensagem
        user_message = state["messages"][-1].content
        
        if "email" in user_message.lower():
            if "send" in user_message.lower():
                # Extrair detalhes do email e enviar
                result = execute_mcp_tool("send_email", extracted_params)
            else:
                # Listar emails
                result = execute_mcp_tool("list_emails", {"query": "is:unread"})
        
        elif "calendar" in user_message.lower():
            result = execute_mcp_tool("list_events", {"days_ahead": 7})
        
        else:
            result = "Não entendi a solicitação. Posso ajudar com emails ou calendário."
        
        return {"messages": [AIMessage(content=result)]}
    
    # Adicionar ao workflow
    workflow = StateGraph(MessagesState)
    workflow.add_node("mcp_agent", mcp_agent_node)
    workflow.set_entry_point("mcp_agent")
    workflow.add_edge("mcp_agent", "__end__")
    
    return workflow.compile()
Padrões de Segurança MCP
python# Configuração segura de MCP
class SecureMCPConfig:
    """Configuração segura para servidores MCP"""
    
    def __init__(self):
        self.security_rules = {
            "gmail": {
                "allowed_operations": ["read", "send"],
                "rate_limit": "10/minute",
                "requires_confirmation": ["send_email"],
                "sensitive_data_filters": ["password", "ssn", "credit_card"]
            },
            "filesystem": {
                "allowed_paths": ["/home/user/documents", "/home/user/downloads"],
                "forbidden_extensions": [".exe", ".bat", ".sh"],
                "max_file_size": "10MB",
                "read_only": False
            }
        }
    
    def validate_mcp_request(self, server: str, tool: str, args: dict) -> bool:
        """Valida se a requisição MCP é segura"""
        
        rules = self.security_rules.get(server, {})
        
        # Verificar operações permitidas
        if tool not in rules.get("allowed_operations", []):
            return False
        
        # Verificar dados sensíveis
        sensitive_filters = rules.get("sensitive_data_filters", [])
        request_text = str(args).lower()
        
        for filter_term in sensitive_filters:
            if filter_term in request_text:
                return False
        
        return True

# Wrapper seguro para execução MCP
async def secure_mcp_execute(server: str, tool: str, args: dict):
    """Executa ferramenta MCP com validações de segurança"""
    
    security = SecureMCPConfig()
    
    # Validar requisição
    if not security.validate_mcp_request(server, tool, args):
        raise SecurityError(f"Operação {tool} no servidor {server} não permitida")
    
    # Verificar se precisa de confirmação
    if tool in security.security_rules[server].get("requires_confirmation", []):
        confirmation = await request_user_confirmation(
            f"Confirma execução de {tool} com parâmetros {args}?"
        )
        if not confirmation:
            return "Operação cancelada pelo usuário"
    
    # Executar com timeout
    try:
        result = await asyncio.wait_for(
            mcp_toolkit.execute_tool(server, tool, args),
            timeout=30.0
        )
        return result
    except asyncio.TimeoutError:
        return "Timeout na execução da ferramenta MCP"

5. Sistema de Persistência e Threads {#persistencia}
Arquitetura de Persistência
O LangGraph usa um sistema de checkpointing que permite salvar e recuperar o estado de conversas automaticamente:
mermaidgraph TB
    APP[LangGraph App] --> CHECKPOINT[Checkpointer]
    CHECKPOINT --> SQLITE[SQLite Database]
    SQLITE --> THREADS[Threads Table]
    SQLITE --> CHECKPOINTS[Checkpoints Table]
    SQLITE --> WRITES[Checkpoint Writes Table]
    
    CHECKPOINT --> MEMORY[Memory Store]
    MEMORY --> SESSION[Session State]
Configuração SQLite WAL
pythonimport sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver

def setup_optimized_sqlite():
    """Configuração otimizada do SQLite para LangGraph"""
    
    # Conexão com configurações de performance
    conn = sqlite3.connect(
        "langgraph_checkpoints.db",
        check_same_thread=False,
        isolation_level=None  # WAL mode funciona melhor sem isolation
    )
    
    # Habilitar WAL mode (Write-Ahead Logging)
    conn.execute("PRAGMA journal_mode=WAL")
    
    # Otimizações de performance
    conn.execute("PRAGMA synchronous=NORMAL")     # Balance entre segurança e velocidade
    conn.execute("PRAGMA cache_size=10000")       # 10MB de cache
    conn.execute("PRAGMA temp_store=memory")      # Usar RAM para temporários
    conn.execute("PRAGMA mmap_size=268435456")    # 256MB memory mapping
    
    # Configurações específicas do WAL
    conn.execute("PRAGMA wal_autocheckpoint=1000") # Checkpoint a cada 1000 páginas
    conn.execute("PRAGMA busy_timeout=30000")      # 30 segundos timeout
    
    return SqliteSaver(conn)

# Uso com LangGraph
checkpointer = setup_optimized_sqlite()
app = workflow.compile(checkpointer=checkpointer)
Sistema de Threading
pythonfrom typing import Optional
import uuid
from datetime import datetime

class ThreadManager:
    """Gerenciador de threads de conversação"""
    
    def __init__(self, checkpointer):
        self.checkpointer = checkpointer
    
    def create_thread(self, user_id: str, metadata: dict = None) -> str:
        """Cria nova thread de conversação"""
        
        thread_id = f"thread_{user_id}_{uuid.uuid4().hex[:8]}"
        
        # Metadados da thread
        thread_metadata = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "title": "Nova Conversa",
            **(metadata or {})
        }
        
        # Configuração inicial
        config = {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": "",
                "checkpoint_id": None
            },
            "metadata": thread_metadata
        }
        
        return thread_id, config
    
    def get_thread_history(self, thread_id: str, limit: int = 50) -> list:
        """Recupera histórico da thread"""
        
        config = {"configurable": {"thread_id": thread_id}}
        
        # Obter estado atual
        state = self.checkpointer.get(config)
        
        if not state:
            return []
        
        # Extrair mensagens do estado
        messages = state.values.get("messages", [])
        
        # Retornar últimas N mensagens
        return messages[-limit:] if messages else []
    
    def update_thread_metadata(self, thread_id: str, updates: dict):
        """Atualiza metadados da thread"""
        
        config = {"configurable": {"thread_id": thread_id}}
        current_state = self.checkpointer.get(config)
        
        if current_state:
            # Merge metadados
            new_metadata = {**current_state.metadata, **updates}
            
            # Salvar estado atualizado
            self.checkpointer.put(
                config,
                current_state.checkpoint,
                new_metadata
            )
    
    def list_user_threads(self, user_id: str, days: int = 30) -> list:
        """Lista threads do usuário"""
        
        # Buscar threads dos últimos N dias
        cutoff_date = datetime.now() - timedelta(days=days)
        
        threads = []
        
        # Iterar por todos os checkpoints do usuário
        for state in self.checkpointer.list(
            {"configurable": {"user_id": user_id}},
            limit=100
        ):
            thread_data = {
                "thread_id": state.config["configurable"]["thread_id"],
                "metadata": state.metadata,
                "last_activity": state.created_at,
                "message_count": len(state.values.get("messages", []))
            }
            threads.append(thread_data)
        
        return sorted(threads, key=lambda x: x["last_activity"], reverse=True)

# Exemplo de uso
thread_manager = ThreadManager(checkpointer)

# Criar nova conversa
thread_id, config = thread_manager.create_thread(
    user_id="hugo_123",
    metadata={"context": "assistente_pessoal"}
)

# Executar conversa
result = app.invoke(
    {"messages": [HumanMessage("Olá!")]},
    config=config
)

# Continuar conversa
result = app.invoke(
    {"messages": [HumanMessage("Como está o tempo?")]},
    config=config
)

# Recuperar histórico
history = thread_manager.get_thread_history(thread_id)
Sistema de Memória Multi-Tier
pythonfrom langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
import json

class MultiTierMemory:
    """Sistema de memória em múltiplas camadas"""
    
    def __init__(self, checkpointer, embedding_model):
        self.checkpointer = checkpointer
        self.embeddings = embedding_model
        self.vector_store = self._setup_vector_store()
    
    def _setup_vector_store(self):
        """Inicializa vector store para memória semântica"""
        try:
            # Tentar carregar existente
            return FAISS.load_local("memory_vectors", self.embeddings)
        except:
            # Criar novo
            return FAISS.from_texts([""], self.embeddings)
    
    # Camada 1: SHORT-TERM (Thread-scoped)
    def get_recent_context(self, thread_id: str, turns: int = 10) -> list:
        """Contexto recente da conversa"""
        
        config = {"configurable": {"thread_id": thread_id}}
        state = self.checkpointer.get(config)
        
        if not state:
            return []
        
        messages = state.values.get("messages", [])
        return messages[-turns*2:]  # Últimas N trocas (user + assistant)
    
    # Camada 2: SEMANTIC (Cross-thread knowledge)
    def semantic_search(self, query: str, user_id: str, k: int = 5) -> list:
        """Busca semântica em conversas passadas"""
        
        # Buscar no vector store
        results = self.vector_store.similarity_search_with_score(query, k=k)
        
        # Filtrar por usuário e relevância
        relevant_memories = []
        for doc, score in results:
            if score < 0.8:  # Threshold de relevância
                metadata = doc.metadata
                if metadata.get("user_id") == user_id:
                    relevant_memories.append({
                        "content": doc.page_content,
                        "context": metadata.get("context", ""),
                        "timestamp": metadata.get("timestamp", ""),
                        "relevance_score": score
                    })
        
        return relevant_memories
    
    # Camada 3: EPISODIC (Past experiences)
    def get_similar_episodes(self, current_context: str, user_id: str) -> list:
        """Encontra episódios similares do passado"""
        
        # Buscar threads com contexto similar
        similar_contexts = self.semantic_search(current_context, user_id, k=3)
        
        episodes = []
        for context in similar_contexts:
            thread_id = context.get("thread_id")
            if thread_id:
                episode = {
                    "thread_id": thread_id,
                    "context": context["context"],
                    "outcome": self._get_episode_outcome(thread_id),
                    "relevance": context["relevance_score"]
                }
                episodes.append(episode)
        
        return episodes
    
    # Camada 4: PROCEDURAL (Learned patterns)
    def get_user_patterns(self, user_id: str) -> dict:
        """Analisa padrões comportamentais do usuário"""
        
        user_threads = self._get_user_threads(user_id, days=30)
        
        patterns = {
            "common_tasks": self._analyze_task_patterns(user_threads),
            "preferred_times": self._analyze_time_patterns(user_threads),
            "communication_style": self._analyze_communication_style(user_threads),
            "success_factors": self._analyze_success_patterns(user_threads)
        }
        
        return patterns
    
    def save_conversation_memory(self, thread_id: str, user_id: str, content: str):
        """Salva conversa na memória semântica"""
        
        # Criar embedding
        embedding = self.embeddings.embed_query(content)
        
        # Metadados
        metadata = {
            "thread_id": thread_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "content_type": "conversation"
        }
        
        # Adicionar ao vector store
        self.vector_store.add_texts(
            [content],
            metadatas=[metadata]
        )
        
        # Salvar vector store atualizado
        self.vector_store.save_local("memory_vectors")

# Exemplo de integração com LangGraph
def create_memory_aware_agent():
    """Agente com consciência de memória"""
    
    memory_system = MultiTierMemory(checkpointer, OpenAIEmbeddings())
    
    def memory_enhanced_node(state: MessagesState) -> dict:
        """Node que usa sistema de memória"""
        
        current_input = state["messages"][-1].content
        thread_id = state.get("thread_id")
        user_id = state.get("user_id")
        
        # Buscar contexto relevante
        recent_context = memory_system.get_recent_context(thread_id)
        semantic_context = memory_system.semantic_search(current_input, user_id)
        user_patterns = memory_system.get_user_patterns(user_id)
        
        # Criar prompt enriquecido com contexto
        enhanced_prompt = f"""
        Input atual: {current_input}
        
        Contexto recente: {recent_context[-4:]}  # Últimas 2 trocas
        
        Contexto relevante do histórico: {semantic_context[:2]}
        
        Padrões do usuário: {user_patterns['communication_style']}
        
        Responda considerando todo este contexto.
        """
        
        # Gerar resposta
        response = llm.invoke([HumanMessage(content=enhanced_prompt)])
        
        # Salvar na memória
        memory_system.save_conversation_memory(
            thread_id, user_id, f"Q: {current_input}\nA: {response.content}"
        )
        
        return {"messages": [response]}
    
    return memory_enhanced_node

6. LangServe: API e Deployment {#langserve}
Conceitos Fundamentais
LangServe transforma qualquer LangChain/LangGraph application em uma API REST completa com endpoints automáticos, documentation e playground interativo.
Setup Básico
pythonfrom fastapi import FastAPI
from langserve import add_routes
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# Criar aplicação FastAPI
app = FastAPI(
    title="Assistente API",
    version="1.0",
    description="API para assistente pessoal com LangGraph"
)

# Criar chain simples
prompt = ChatPromptTemplate.from_template("Você é um assistente útil. {input}")
llm = ChatOpenAI(model="gpt-4")
chain = prompt | llm

# Adicionar rotas automáticas
add_routes(
    app,
    chain,
    path="/assistant",
    input_type=dict,  # Tipo de entrada
    output_type=dict,  # Tipo de saída
    config_keys=["configurable"],  # Chaves de configuração aceitas
)

# Endpoints criados automaticamente:
# POST /assistant/invoke       - Execução síncrona
# POST /assistant/batch        - Execução em lote
# POST /assistant/stream       - Streaming de resposta
# GET  /assistant/playground   - Interface web interativa
# GET  /assistant/config_schema - Schema de configuração
Integração com LangGraph Multi-Agent
pythonfrom langgraph.graph import StateGraph, MessagesState
from langserve import add_routes
from pydantic import BaseModel
from typing import Optional

# Modelos de entrada e saída
class ChatRequest(BaseModel):
    message: str
    user_id: str
    thread_id: Optional[str] = None
    context: dict = {}

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    agent_used: str
    tokens_used: int
    cost: float

# Workflow multi-agente (versão simplificada)
def create_multi_agent_workflow():
    """Cria workflow com múltiplos agentes"""
    
    class AgentState(MessagesState):
        user_id: str
        thread_id: str
        current_agent: str
        context: dict
        metrics: dict
    
    def supervisor_node(state: AgentState) -> dict:
        """Supervisor que roteia para agentes especializados"""
        
        message = state["messages"][-1].content.lower()
        
        if "email" in message:
            agent = "email_agent"
        elif "calendar" in message:
            agent = "calendar_agent"
        elif "search" in message or "find" in message:
            agent = "search_agent"
        else:
            agent = "conversation_agent"
        
        return {
            "current_agent": agent,
            "messages": [AIMessage(content=f"Routing to {agent}...")]
        }
    
    def email_agent(state: AgentState) -> dict:
        """Agente especializado em emails"""
        response = "Processando solicitação de email..."
        return {
            "messages": [AIMessage(content=response)],
            "metrics": {"tokens_used": 150, "cost": 0.001}
        }
    
    def calendar_agent(state: AgentState) -> dict:
        """Agente especializado em calendário"""
        response = "Verificando seu calendário..."
        return {
            "messages": [AIMessage(content=response)],
            "metrics": {"tokens_used": 120, "cost": 0.0008}
        }
    
    def conversation_agent(state: AgentState) -> dict:
        """Agente de conversação geral"""
        response = llm.invoke(state["messages"]).content
        return {
            "messages": [AIMessage(content=response)],
            "metrics": {"tokens_used": 200, "cost": 0.002}
        }
    
    # Construir grafo
    workflow = StateGraph(AgentState)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("email_agent", email_agent)
    workflow.add_node("calendar_agent", calendar_agent) 
    workflow.add_node("conversation_agent", conversation_agent)
    
    # Conexões
    workflow.set_entry_point("supervisor")
    workflow.add_conditional_edges(
        "supervisor",
        lambda state: state["current_agent"],
        {
            "email_agent": "email_agent",
            "calendar_agent": "calendar_agent",
            "conversation_agent": "conversation_agent"
        }
    )
    workflow.add_edge("email_agent", "__end__")
    workflow.add_edge("calendar_agent", "__end__")
    workflow.add_edge("conversation_agent", "__end__")
    
    return workflow.compile(checkpointer=checkpointer)

# Wrapper para LangServe
def create_assistant_chain():
    """Cria chain compatível com LangServe"""
    
    multi_agent_app = create_multi_agent_workflow()
    
    def assistant_wrapper(request: ChatRequest) -> ChatResponse:
        """Wrapper que adapta entrada/saída para LangServe"""
        
        # Configuração da thread
        if not request.thread_id:
            thread_id = f"thread_{request.user_id}_{uuid.uuid4().hex[:8]}"
        else:
            thread_id = request.thread_id
        
        config = {
            "configurable": {"thread_id": thread_id},
            "metadata": {"user_id": request.user_id}
        }
        
        # Executar workflow
        result = multi_agent_app.invoke(
            {
                "messages": [HumanMessage(content=request.message)],
                "user_id": request.user_id,
                "thread_id": thread_id,
                "context": request.context
            },
            config=config
        )
        
        # Extrair resposta
        response_message = result["messages"][-1].content
        metrics = result.get("metrics", {})
        
        return ChatResponse(
            response=response_message,
            thread_id=thread_id,
            agent_used=result.get("current_agent", "unknown"),
            tokens_used=metrics.get("tokens_used", 0),
            cost=metrics.get("cost", 0.0)
        )
    
    return assistant_wrapper

# Adicionar ao FastAPI
assistant_chain = create_assistant_chain()

add_routes(
    app,
    assistant_chain,
    path="/chat",
    input_type=ChatRequest,
    output_type=ChatResponse,
    enable_feedback_endpoint=True,  # Endpoint para feedback
    playground_type="chat"          # Tipo de playground
)
Endpoints Avançados e Customização
pythonfrom fastapi import HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer
from langserve.pydantic_v1 import BaseModel

# Configuração de segurança
security = HTTPBearer()

async def verify_token(token = Depends(security)):
    """Verificação de token de acesso"""
    if not validate_jwt_token(token.credentials):
        raise HTTPException(status_code=401, detail="Token inválido")
    return extract_user_from_token(token.credentials)

# Endpoints customizados
@app.get("/health")
async def health_check():
    """Health check da API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "langsmith": check_langsmith_connection(),
            "database": check_database_connection(),
            "mcps": check_mcp_servers_status()
        }
    }

@app.get("/threads/{user_id}")
async def get_user_threads(
    user_id: str,
    user = Depends(verify_token),
    limit: int = 20
):
    """Lista threads do usuário"""
    
    # Verificar autorização
    if user["id"] != user_id and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Buscar threads
    threads = thread_manager.list_user_threads(user_id, limit=limit)
    
    return {
        "user_id": user_id,
        "threads": threads,
        "total": len(threads)
    }

@app.post("/threads/{thread_id}/feedback")
async def submit_feedback(
    thread_id: str,
    feedback: FeedbackModel,
    user = Depends(verify_token)
):
    """Coleta feedback do usuário"""
    
    # Salvar feedback no LangSmith
    langsmith_client.create_feedback(
        run_id=feedback.run_id,
        key="user_satisfaction",
        score=feedback.rating,
        comment=feedback.comment,
        source_info={"user_id": user["id"]}
    )
    
    return {"status": "feedback_saved"}

@app.get("/analytics/{user_id}")
async def get_user_analytics(
    user_id: str,
    user = Depends(verify_token),
    days: int = 30
):
    """Analytics do usuário"""
    
    if user["id"] != user_id and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    analytics = memory_system.get_user_patterns(user_id)
    usage_stats = get_usage_statistics(user_id, days)
    
    return {
        "user_id": user_id,
        "period_days": days,
        "patterns": analytics,
        "usage": usage_stats,
        "insights": generate_user_insights(analytics, usage_stats)
    }

# Streaming endpoint personalizado
@app.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    user = Depends(verify_token)
):
    """Streaming de conversa em tempo real"""
    
    async def event_generator():
        """Generator para Server-Sent Events"""
        
        config = {
            "configurable": {"thread_id": request.thread_id or f"stream_{uuid.uuid4().hex[:8]}"},
            "metadata": {"user_id": request.user_id}
        }
        
        # Stream do LangGraph
        async for chunk in multi_agent_app.astream(
            {
                "messages": [HumanMessage(content=request.message)],
                "user_id": request.user_id,
                "context": request.context
            },
            config=config
        ):
            # Enviar updates incrementais
            if "messages" in chunk:
                yield f"data: {json.dumps({'type': 'message', 'content': chunk['messages'][-1].content})}\n\n"
            
            if "current_agent" in chunk:
                yield f"data: {json.dumps({'type': 'agent_change', 'agent': chunk['current_agent']})}\n\n"
            
            if "metrics" in chunk:
                yield f"data: {json.dumps({'type': 'metrics', 'data': chunk['metrics']})}\n\n"
        
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
Configuração de Produção
python# production_settings.py
from pydantic import BaseSettings
import os

class ProductionSettings(BaseSettings):
    """Configurações para ambiente de produção"""
    
    # API Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: list = ["https://app.example.com"]
    
    # Database
    DATABASE_URL: str = "sqlite:///prod_checkpoints.db"
    MAX_CONNECTIONS: int = 20
    CONNECTION_TIMEOUT: int = 30
    
    # LangSmith
    LANGCHAIN_API_KEY: str
    LANGCHAIN_PROJECT: str = "production-assistant"
    LANGCHAIN_TRACING_V2: bool = True
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Performance
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10MB
    RESPONSE_TIMEOUT: int = 30
    
    # Costs
    DAILY_COST_LIMIT: float = 50.0
    COST_ALERT_THRESHOLD: float = 40.0
    
    class Config:
        env_file = ".env"

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Aplicar rate limiting aos endpoints
@app.post("/chat/invoke")
@limiter.limit("60/minute")
async def rate_limited_chat(request: Request, chat_request: ChatRequest):
    """Endpoint com rate limiting"""
    return await assistant_chain(chat_request)

# Middleware de monitoramento
@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    """Middleware para métricas e logs"""
    
    start_time = time.time()
    
    # Log da requisição
    logger.info(f"Request: {request.method} {request.url}")
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log da resposta
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    # Métricas para monitoramento
    record_api_metrics(
        endpoint=str(request.url.path),
        method=request.method,
        status_code=response.status_code,
        duration=process_time
    )
    
    return response

# Tratamento de erros
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global de exceções"""
    
    error_id = uuid.uuid4().hex[:8]
    
    # Log detalhado do erro
    logger.error(f"Error {error_id}: {type(exc).__name__}: {str(exc)}", exc_info=True)
    
    # Resposta padronizada
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "error_id": error_id,
                "timestamp": datetime.now().isoformat()
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Erro interno do servidor",
                "error_id": error_id,
                "timestamp": datetime.now().isoformat()
            }
        )
Deployment com Docker
python# Dockerfile
"""
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
"""

# docker-compose.yml
"""
version: '3.8'

services:
  assistant-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/assistant
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: assistant
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - assistant-api
    restart: unless-stopped

volumes:
  postgres_data:
"""

# nginx.conf
"""
events {
    worker_connections 1024;
}

http {
    upstream assistant_backend {
        server assistant-api:8000;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        listen 80;
        server_name api.example.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name api.example.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # API endpoints
        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://assistant_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Streaming endpoints
        location /chat/stream {
            proxy_pass http://assistant_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Configurações para streaming
            proxy_buffering off;
            proxy_cache off;
            proxy_set_header Connection '';
            proxy_http_version 1.1;
            chunked_transfer_encoding off;
        }
    }
}
"""
Monitoramento e Observabilidade
python# monitoring.py
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

# Métricas Prometheus
REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

ACTIVE_USERS = Gauge(
    'active_users_total',
    'Number of active users'
)

COST_TRACKING = Gauge(
    'api_cost_usd',
    'API costs in USD',
    ['user_id', 'model']
)

def record_api_metrics(endpoint: str, method: str, status_code: int, duration: float):
    """Registra métricas da API"""
    
    REQUEST_COUNT.labels(
        method=method,
        endpoint=endpoint,
        status=str(status_code)
    ).inc()
    
    REQUEST_DURATION.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration)

# Endpoint de métricas
@app.get("/metrics")
async def metrics():
    """Endpoint para métricas Prometheus"""
    return Response(
        prometheus_client.generate_latest(),
        media_type="text/plain"
    )

# Dashboard customizado
@app.get("/dashboard")
async def dashboard():
    """Dashboard simples de monitoramento"""
    
    metrics_data = {
        "requests_last_hour": get_requests_last_hour(),
        "average_response_time": get_average_response_time(),
        "error_rate": get_error_rate(),
        "active_users": get_active_users_count(),
        "total_cost_today": get_total_cost_today(),
        "top_users": get_top_users_by_usage(),
        "system_health": {
            "database": check_database_connection(),
            "langsmith": check_langsmith_connection(),
            "mcps": check_mcp_servers_status()
        }
    }
    
    return metrics_data

💡 Conceitos-Chave para Implementação
MCPs (Model Context Protocols)

Padronização: Protocolo único para todas as integrações externas
Segurança: Validação e sandboxing automático
Escalabilidade: Adicionar novos serviços sem refatorar código

Persistência e Threads

WAL Mode: Performance otimizada para concorrência
Multi-tier Memory: Contexto inteligente em múltiplas camadas
Thread Management: Conversas persistentes e recuperáveis

LangServe

APIs Automáticas: Endpoints REST gerados automaticamente
Streaming: Respostas em tempo real
Observabilidade: Integração nativa com LangSmith
Produção: Rate limiting, segurança, monitoramento

Padrões de Produção

Circuit Breakers: Resiliência a falhas
Rate Limiting: Proteção contra abuse
Monitoramento: Métricas e alertas em tempo real
Segurança: Autenticação, autorização, validação