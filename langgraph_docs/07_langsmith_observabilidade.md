# LangSmith - Observabilidade e Database Schema

## Visão Geral

LangSmith é uma plataforma unificada de observabilidade e avaliação para aplicações LLM, oferecendo rastreamento, debugging e monitoramento completo de agentes multi-agente.

## Conceitos Fundamentais

### Runs (Spans)
- **Run**: Uma unidade individual de trabalho ou operação dentro da aplicação LLM
- Pode ser: uma chamada para LLM, chain, prompt formatting, runnable lambda
- Equivalente a um "span" no OpenTelemetry

### Traces
- **Trace**: Uma coleção de runs relacionados a uma única operação
- Todos os runs são conectados por um único `trace_id`
- Exemplo: uma requisição do usuário → chain → LLM → output parser

### Projects
- **Project**: Coleção de traces
- Container para todas as traces relacionadas a uma aplicação ou serviço
- Permite organização e filtros

## Database Schema e Campos Disponíveis

### Run Data Format

```python
class Run:
    # Identificadores
    id: str                    # ID único do run
    trace_id: str             # ID do trace pai
    parent_run_id: str        # ID do run pai (se for subrun)
    
    # Metadados básicos
    name: str                 # Nome do run (ex: 'ChatOpenAI')
    run_type: str             # Tipo: 'llm', 'chain', 'tool', 'retriever'
    start_time: datetime      # Timestamp de início
    end_time: datetime        # Timestamp de fim
    
    # Dados de execução
    inputs: Dict              # Dados de entrada
    outputs: Dict             # Dados de saída
    error: str               # Mensagem de erro (se houver)
    
    # Observabilidade
    extra: Dict              # Dados extras personalizados
    tags: List[str]          # Tags para categorização
    session_id: str          # ID da sessão/thread
    
    # Métricas
    total_tokens: int        # Total de tokens usados
    prompt_tokens: int       # Tokens do prompt
    completion_tokens: int   # Tokens da resposta
    total_cost: float        # Custo total estimado
    
    # Status
    status: str              # 'success', 'error', 'pending'
    serialized: Dict         # Configuração serializada do componente
```

### Feedback Schema

```python
class Feedback:
    id: str                  # ID único do feedback
    run_id: str             # ID do run associado
    key: str                # Tag do feedback (ex: 'user_score')
    score: Union[float, int, bool, str]  # Valor do feedback
    value: str              # Valor adicional/comentário
    comment: str            # Comentário humano
    correction: Dict        # Correção sugerida
    created_at: datetime    # Timestamp de criação
    modified_at: datetime   # Timestamp de modificação
```

### Thread/Session Management

```python
# Campos para gerenciar threads
session_id: str           # ou thread_id, conversation_id
metadata: Dict = {
    "session_id": "thread_123",
    "conversation_id": "conv_456", 
    "thread_id": "thread_789",
    "user_id": "user_123"
}
```

## Configuração para LangGraph

### Setup Básico

```python
import os

# Configuração de ambiente
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "sua-api-key"
os.environ["LANGSMITH_PROJECT"] = "lina-multi-agent"
```

### Integração com LangGraph

```python
from langgraph.graph