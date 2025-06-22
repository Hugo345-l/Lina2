# Intervenção Humana (Human-in-the-Loop)

O LangGraph fornece primitivas poderosas para pausar a execução de um grafo e solicitar a intervenção humana. Isso é essencial para tarefas que exigem validação, edição ou feedback.

## As Primitivas: `interrupt` e `Command`

-   **`interrupt(payload)`**: Pausa a execução do grafo no nó atual e retorna um objeto `Interrupt` para o cliente. O `payload` pode ser qualquer valor serializável em JSON que você queira expor ao humano.
-   **`Command(resume=...)`**: É usado para retomar um grafo pausado. O valor passado para `resume` é o que a chamada `interrupt` retornará dentro do grafo.

## Exemplo: Pausando para Edição

Este exemplo mostra como pausar o grafo para que um humano possa revisar e editar um resumo gerado por LLM.

```python
from typing import TypedDict
import uuid
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from langgraph.types import interrupt, Command
from langgraph.checkpoint.memory import MemorySaver

# 1. Definir o Estado
class State(TypedDict):
    summary: str

# 2. Definir os Nós
def generate_summary(state: State) -> State:
    return {"summary": "O gato sentou no tapete e olhou para as estrelas."}

def human_review_edit(state: State) -> State:
    # Pausa o grafo e espera pela entrada humana
    result = interrupt({
        "task": "Por favor, revise e edite o resumo gerado, se necessário.",
        "generated_summary": state["summary"]
    })
    # Atualiza o estado com o texto editado
    return {"summary": result["edited_summary"]}

def downstream_use(state: State) -> State:
    print(f"✅ Usando o resumo editado: {state['summary']}")
    return state

# 3. Construir o Grafo
builder = StateGraph(State)
builder.add_node("generate_summary", generate_summary)
builder.add_node("human_review_edit", human_review_edit)
builder.add_node("downstream_use", downstream_use)

builder.set_entry_point("generate_summary")
builder.add_edge("generate_summary", "human_review_edit")
builder.add_edge("human_review_edit", "downstream_use")
builder.add_edge("downstream_use", END)

# 4. Compilar com um Checkpointer
# A interrupção requer um checkpointer para salvar o estado do grafo.
checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)

# 5. Executar o Grafo
config = {"configurable": {"thread_id": uuid.uuid4()}}
result = graph.invoke({}, config=config)

# O `result` conterá a chave especial `__interrupt__`
print(result["__interrupt__"])

# 6. Retomar o Grafo
edited_summary = "O gato deitou no tapete, olhando pacificamente para o céu noturno."
resumed_result = graph.invoke(
    Command(resume={"edited_summary": edited_summary}),
    config=config
)
print(resumed_result)
```

## Roteamento Baseado na Entrada Humana

Você pode usar `Command(goto="...")` para rotear a execução para diferentes nós com base na decisão do humano.

```python
from typing import Literal

def human_approval(state: State) -> Command[Literal["approved_path", "rejected_path"]]:
    decision = interrupt(...)

    if decision == "approve":
        return Command(goto="approved_path", update={"decision": "approved"})
    else:
        return Command(goto="rejected_path", update={"decision": "rejected"})
