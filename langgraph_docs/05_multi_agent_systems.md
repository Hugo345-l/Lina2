# Sistemas Multi-Agente

O LangGraph é ideal para orquestrar múltiplos agentes que colaboram para resolver um problema. Existem vários padrões para conseguir isso.

## Padrão Supervisor

Neste padrão, um "supervisor" LLM atua como um roteador, delegando tarefas para agentes trabalhadores especializados.

### Implementação

1.  **Definir Agentes Trabalhadores**: Crie agentes especializados (por exemplo, `research_agent`, `math_agent`) usando `create_react_agent`.
2.  **Definir Ferramentas de Handoff**: Crie ferramentas que os agentes podem usar para delegar tarefas uns aos outros ou de volta ao supervisor. A primitiva `Command(goto=...)` é usada para transferir o controle.
3.  **Definir o Supervisor**: Crie um agente supervisor que tenha acesso às ferramentas de handoff.
4.  **Construir o Grafo**: Adicione os agentes como nós e defina as arestas para que o controle sempre retorne ao supervisor após a conclusão de uma tarefa.

### Exemplo de Supervisor

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.types import Command, Send

# ... (definição do research_agent e math_agent) ...

def create_task_description_handoff_tool(*, agent_name: str, description: str | None = None):
    # ... (cria uma ferramenta que retorna um Command(goto=...)) ...

supervisor_agent = create_react_agent(
    model="openai:gpt-4.1",
    tools=[assign_to_research_agent_with_description, assign_to_math_agent_with_description],
    # ... (prompt do supervisor) ...
)

supervisor_graph = (
    StateGraph(MessagesState)
    .add_node(supervisor_agent, destinations=("research_agent", "math_agent", END))
    .add_node(research_agent)
    .add_node(math_agent)
    .add_edge(START, "supervisor")
    .add_edge("research_agent", "supervisor")
    .add_edge("math_agent", "supervisor")
    .compile()
)
```

## Padrão Swarm

O `langgraph-swarm` é um pacote que simplifica a criação de sistemas onde os agentes podem passar o controle diretamente uns para os outros.

```python
from langgraph_swarm import create_swarm, create_handoff_tool

# Ferramentas de Handoff
transfer_to_hotel_assistant = create_handoff_tool(...)
transfer_to_flight_assistant = create_handoff_tool(...)

# Agentes
flight_assistant = create_react_agent(
    model="anthropic:claude-3-5-sonnet-latest",
    tools=[book_flight, transfer_to_hotel_assistant],
    name="flight_assistant"
)
hotel_assistant = create_react_agent(
    model="anthropic:claude-3-5-sonnet-latest",
    tools=[book_hotel, transfer_to_flight_assistant],
    name="hotel_assistant"
)

# Criar o Swarm
swarm = create_swarm(
    agents=[flight_assistant, hotel_assistant],
    default_active_agent="flight_assistant"
).compile()

# Executar
swarm.invoke(...)
