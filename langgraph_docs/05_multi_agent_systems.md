# 5. Sistemas Multi-Agente

O `langgraph` é excelente para orquestrar múltiplos agentes que colaboram para resolver problemas complexos. Existem duas arquiteturas principais para isso: **Supervisor** e **Swarm (Enxame)**.

## Arquitetura de Supervisor

Neste padrão, um agente "supervisor" atua como um roteador inteligente. Ele recebe a tarefa inicial e a delega para o agente especialista mais apropriado. Após o especialista concluir sua parte, o controle retorna ao supervisor, que pode então delegar a próxima etapa para outro agente ou finalizar a tarefa.

-   **Vantagem:** Controle centralizado, fluxo de trabalho claro e hierárquico.
-   **Ideal para:** Tarefas que podem ser divididas em etapas sequenciais e distintas.

### Exemplo com `langgraph-supervisor`

O pacote `langgraph-supervisor` simplifica a criação dessa arquitetura.

```python
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

# 1. Defina as ferramentas e os agentes especialistas
def book_hotel(hotel_name: str):
    """Reserva um hotel."""
    return f"Reserva no '{hotel_name}' confirmada."

def book_flight(from_airport: str, to_airport: str):
    """Reserva um voo."""
    return f"Voo de {from_airport} para {to_airport} confirmado."

flight_assistant = create_react_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[book_flight],
    prompt="Você é um assistente de reserva de voos.",
    name="flight_assistant"
)

hotel_assistant = create_react_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[book_hotel],
    prompt="Você é um assistente de reserva de hotéis.",
    name="hotel_assistant"
)

# 2. Crie o supervisor
# O supervisor gerencia os agentes especialistas
supervisor = create_supervisor(
    agents=[flight_assistant, hotel_assistant],
    model=ChatOpenAI(model="gpt-4o"),
    prompt="Você gerencia um assistente de voos e um de hotéis. Delegue o trabalho para eles."
).compile()

# 3. Execute o sistema
query = {
    "messages": [
        ("user", "Reserve um voo de GRU para REC e uma estadia no Mar Hotel")
    ]
}
for chunk in supervisor.stream(query):
    print(chunk)
    print("----")
```

## Arquitetura Swarm (Enxame)

Neste padrão, não há um supervisor central. Os agentes podem passar o controle diretamente uns para os outros. Cada agente tem uma ferramenta de "handoff" (transferência) que lhe permite delegar a tarefa a outro agente específico.

-   **Vantagem:** Mais flexível e descentralizado. Permite uma colaboração mais dinâmica.
-   **Ideal para:** Tarefas onde a ordem de execução não é rígida e os agentes precisam colaborar de forma mais fluida.

### Exemplo com `langgraph-swarm`

O pacote `langgraph-swarm` facilita a criação de sistemas de enxame.

```python
from langgraph.prebuilt import create_react_agent
from langgraph_swarm import create_swarm, create_handoff_tool

# 1. Crie as ferramentas de handoff
transfer_to_hotel = create_handoff_tool(
    agent_name="hotel_assistant",
    description="Transfere para o assistente de hotéis.",
)
transfer_to_flight = create_handoff_tool(
    agent_name="flight_assistant",
    description="Transfere para o assistente de voos.",
)

# (Defina as ferramentas book_hotel e book_flight como no exemplo anterior)

# 2. Defina os agentes, incluindo as ferramentas de handoff
flight_assistant = create_react_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[book_flight, transfer_to_hotel], # Adiciona a ferramenta de handoff
    prompt="Você é um assistente de voos.",
    name="flight_assistant"
)

hotel_assistant = create_react_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[book_hotel, transfer_to_flight], # Adiciona a ferramenta de handoff
    prompt="Você é um assistente de hotéis.",
    name="hotel_assistant"
)

# 3. Crie o swarm
swarm = create_swarm(
    agents=[flight_assistant, hotel_assistant],
    default_active_agent="flight_assistant" # Define o agente inicial
).compile()

# 4. Execute o sistema
query = {
    "messages": [
        ("user", "Reserve um voo de GRU para REC e uma estadia no Mar Hotel")
    ]
}
for chunk in swarm.stream(query):
    print(chunk)
    print("----")
