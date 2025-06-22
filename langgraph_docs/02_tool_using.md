# Usando Ferramentas com LangGraph

O LangGraph se destaca na criação de agentes que podem usar ferramentas para interagir com o mundo exterior. Esta seção aborda como definir ferramentas, vinculá-las a um modelo e usá-las em um grafo.

## Definindo Ferramentas

Você pode definir ferramentas de duas maneiras principais:

1.  **Usando o decorador `@tool`**: Esta é a maneira mais fácil de criar uma ferramenta. O LangGraph inspecionará a função e inferirá o esquema.

    ```python
    from langchain_core.tools import tool

    @tool
    def multiply(a: int, b: int) -> int:
        """Multiply two numbers."""
        return a * b
    ```

2.  **Funções Python Padrão**: Você também pode usar funções Python normais. O `ToolNode` ou o `create_react_agent` as converterão em ferramentas LangChain.

    ```python
    def multiply(a: int, b: int) -> int:
        """Multiply two numbers."""
        return a * b
    ```

## Vinculando Ferramentas a um Modelo

Para que um modelo saiba sobre suas ferramentas, você precisa vinculá-las a ele.

```python
from langchain.chat_models import init_chat_model

model = init_chat_model(model="claude-3-5-haiku-latest")
model_with_tools = model.bind_tools([multiply])

# O modelo agora pode invocar a ferramenta
model_with_tools.invoke("what's 42 x 7?")
```

## Usando `ToolNode`

O `ToolNode` é um nó pré-construído que executa ferramentas.

```python
from langgraph.prebuilt import ToolNode

# Crie um nó que pode executar qualquer uma das ferramentas na lista
tool_node = ToolNode([get_weather, get_coolest_cities])

# Invoque o nó com uma mensagem contendo tool_calls
tool_node.invoke({"messages": [...]})
```

## Exemplo Completo com `ToolNode`

Aqui está um exemplo completo de como usar o `ToolNode` em um grafo.

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

class State(TypedDict):
    messages: Annotated[list, add_messages]

graph_builder = StateGraph(State)

# Defina suas ferramentas
tool = TavilySearch(max_results=2)
tools = [tool]
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

graph_builder.add_node("chatbot", chatbot)

# Adicione o ToolNode
tool_node = ToolNode(tools=[tool])
graph_builder.add_node("tools", tool_node)

# Aresta condicional para decidir se deve chamar as ferramentas
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
# Aresta para voltar ao chatbot após a execução da ferramenta
graph_builder.add_edge("tools", "chatbot")

graph_builder.set_entry_point("chatbot")
graph = graph_builder.compile()
