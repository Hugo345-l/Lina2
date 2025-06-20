# 2. Uso de Ferramentas (Tool Using) com LangGraph

Um dos recursos mais poderosos do `langgraph` é a capacidade de criar agentes que utilizam ferramentas para interagir com o mundo exterior, como APIs, bancos de dados ou outras funções.

## Como Funciona o Uso de Ferramentas

O fluxo geral é:
1.  O modelo de linguagem (LLM) recebe uma entrada do usuário.
2.  O LLM determina que precisa usar uma ou mais ferramentas para responder e gera uma "chamada de ferramenta" (`tool_call`).
3.  O `langgraph` intercepta essa chamada e executa a função da ferramenta correspondente.
4.  O resultado da ferramenta é retornado ao LLM.
5.  O LLM usa o resultado para formular a resposta final ao usuário.

## Definindo Ferramentas

Você pode definir ferramentas de algumas maneiras. A mais comum é usando o decorador `@tool` da `langchain_core.tools`.

### Exemplo Simples com `@tool`

O decorador `@tool` converte automaticamente uma função Python em uma ferramenta que o LangChain/LangGraph pode entender, inferindo o esquema dos argumentos a partir das anotações de tipo e da docstring.

```python
from langchain_core.tools import tool

@tool
def get_weather(location: str) -> str:
    """Use esta função para obter a previsão do tempo para uma cidade específica."""
    if "são paulo" in location.lower():
        return "O tempo em São Paulo é ensolarado, com 25°C."
    elif "recife" in location.lower():
        return "O tempo em Recife é quente e úmido, com 30°C."
    else:
        return f"Não tenho a previsão do tempo para {location}."

@tool
def multiply(a: int, b: int) -> int:
    """Multiplica dois números."""
    return a * b
```

## Integrando Ferramentas ao Grafo

Para que o LLM possa usar as ferramentas, você precisa "vinculá-las" ao modelo e adicionar um nó específico para executá-las no seu grafo.

### `ToolNode`: O Nó Executor de Ferramentas

O `langgraph.prebuilt` fornece o `ToolNode`, um nó pré-construído que executa uma lista de ferramentas.

### Exemplo de Grafo com Ferramentas

Este exemplo mostra como construir um agente simples que pode chamar a ferramenta `get_weather`.

```python
from typing import Annotated
from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

# 1. Defina a ferramenta
@tool
def get_weather(location: str) -> str:
    """Obtém a previsão do tempo para uma cidade."""
    if "são paulo" in location.lower():
        return "Ensolarado, 25°C."
    return "Não sei."

tools = [get_weather]

# 2. Defina o estado do grafo
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# 3. Vincule as ferramentas ao modelo
model = ChatOpenAI(model="gpt-4o-mini")
model_with_tools = model.bind_tools(tools)

# 4. Defina os nós do grafo
def chatbot_node(state: AgentState):
    """Nó que chama o LLM."""
    return {"messages": [model_with_tools.invoke(state["messages"])]}

# O ToolNode executa as ferramentas
tool_node = ToolNode(tools=tools)

# 5. Construa o grafo
graph_builder = StateGraph(AgentState)
graph_builder.add_node("chatbot", chatbot_node)
graph_builder.add_node("tools", tool_node)

# 6. Defina as arestas
graph_builder.add_edge(START, "chatbot")
# Aresta condicional: decide se chama a ferramenta ou termina
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition, # Função pré-construída que verifica se há tool_calls
)
# Após executar a ferramenta, volta para o chatbot
graph_builder.add_edge("tools", "chatbot")

# 7. Compile e execute
graph = graph_builder.compile()
result = graph.invoke({"messages": [("user", "qual o tempo em São Paulo?")]})
print(result['messages'][-1].content)
```

Neste fluxo:
-   O `chatbot_node` chama o LLM.
-   O `tools_condition` verifica se a resposta do LLM contém uma `tool_call`.
    -   Se sim, o fluxo vai para o `tool_node`.
    -   Se não, o fluxo vai para `END`.
-   O `tool_node` executa a ferramenta e o resultado é adicionado ao estado.
-   O fluxo volta para o `chatbot_node` para que o LLM possa gerar a resposta final com base no resultado da ferramenta.
