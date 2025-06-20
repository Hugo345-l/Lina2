# 3. Intervenção Humana (Human-in-the-Loop)

O `langgraph` se destaca na criação de fluxos de trabalho que podem ser pausados para aguardar a entrada, revisão ou aprovação de um humano. Isso é essencial para tarefas sensíveis, depuração ou quando o agente precisa de orientação.

## Como Funciona a Intervenção Humana

O mecanismo principal é a função `interrupt()` da `langgraph.types`.

1.  **Pausando o Grafo (`interrupt`)**: Quando um nó chama `interrupt()`, a execução do grafo é pausada. A função pode passar qualquer dado serializável (como um dicionário com uma pergunta) para a interface do usuário ou para o cliente que está executando o grafo.
2.  **Persistência de Estado**: Para que a interrupção funcione, o grafo **precisa** ser compilado com um "checkpointer" (como `MemorySaver`). O checkpointer salva o estado do grafo no momento da interrupção, permitindo que ele seja retomado mais tarde.
3.  **Retomando o Grafo (`Command`)**: O cliente que invocou o grafo pode retomá-lo enviando um objeto `Command(resume=...)`. O valor passado no `resume` é o que a função `interrupt()` retornará dentro do nó, permitindo que o fluxo continue com a entrada humana.

## Exemplo: Ferramenta com Aprovação Humana

Vamos criar uma ferramenta "sensível" que reserva um hotel, mas só completa a ação após a aprovação de um humano.

```python
import uuid
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition, create_react_agent
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import interrupt, Command
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# 1. Defina a ferramenta que precisa de aprovação
@tool
def book_hotel(hotel_name: str, days: int) -> str:
    """Reserva um hotel para um número específico de dias."""
    # Pausa a execução e espera pela entrada humana
    response = interrupt(
        f"Tentando reservar o hotel '{hotel_name}' por {days} dias. "
        "Por favor, aprove (approve), edite (edit) ou rejeite (reject)."
    )

    # Lógica para lidar com a resposta humana
    if response == "approve":
        # Lógica de reserva real iria aqui
        return f"Reserva no hotel '{hotel_name}' por {days} dias confirmada."
    elif isinstance(response, dict) and response.get("type") == "edit":
        new_hotel = response["args"]["hotel_name"]
        new_days = response["args"]["days"]
        return f"Reserva alterada e confirmada para '{new_hotel}' por {new_days} dias."
    else:
        return "Reserva cancelada pelo usuário."

# 2. Crie o agente com um checkpointer
# O checkpointer é OBRIGATÓRIO para o interrupt funcionar
checkpointer = InMemorySaver()

agent = create_react_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[book_hotel],
    checkpointer=checkpointer, # Vincula o checkpointer ao agente
)

# 3. Execute o grafo e lide com a interrupção
# O 'thread_id' é crucial para manter o estado da conversa
config = {"configurable": {"thread_id": str(uuid.uuid4())}}

# Primeira chamada: o agente vai parar na ferramenta
initial_query = {"messages": [("user", "reserve o Grand Hotel por 3 dias")]}
for chunk in agent.stream(initial_query, config):
    print(chunk)
    print("----")

# Neste ponto, a execução está pausada.
# O cliente (ou você, no terminal) pode inspecionar o estado e decidir o que fazer.

# Segunda chamada: retomando com a aprovação humana
# Para testar, você pode mudar para "reject" ou um dicionário de edição
human_input = "approve"
for chunk in agent.stream(Command(resume=human_input), config):
    print(chunk)
    print("----")
```

### Pontos Chave do Exemplo:

-   **`interrupt()`**: Pausa o fluxo e envia uma mensagem para o cliente.
-   **`InMemorySaver()`**: Um checkpointer simples que salva o estado do grafo em memória. Para produção, você usaria opções mais robustas como `SqliteSaver`.
-   **`thread_id`**: Essencial para que o `langgraph` saiba qual estado de conversa pausado deve ser retomado.
-   **`Command(resume=...)`**: O objeto usado para injetar a resposta humana de volta no grafo e continuar a execução.
