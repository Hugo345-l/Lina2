# Guia de Início Rápido do LangGraph

Esta seção aborda os conceitos básicos para começar a usar o LangGraph, incluindo a instalação, a criação de um agente simples e a definição de um fluxo de trabalho básico.

## Instalação

Para começar, você precisa instalar os pacotes necessários.

```bash
pip install -U langgraph langchain
```

Se você planeja usar modelos da Anthropic, também precisará instalar a biblioteca específica:

```bash
pip install langchain-anthropic
```

## Criando um Agente ReAct Simples

Um dos componentes pré-construídos mais úteis do LangGraph é o `create_react_agent`. Ele permite que você crie rapidamente um agente que pode usar ferramentas.

```python
from langgraph.prebuilt import create_react_agent

def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

agent = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",
    tools=[get_weather],
    prompt="You are a helpful assistant"
)

# Executando o agente
agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather in sf"}]}
)
```

## Definindo um Fluxo de Trabalho (Workflow) Básico

O `StateGraph` é o principal bloco de construção para criar fluxos de trabalho no LangGraph. Você define um estado e, em seguida, adiciona nós e arestas para criar um grafo.

### 1. Definir o Estado

O estado é um `TypedDict` que define a estrutura de dados que será passada entre os nós.

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
```

### 2. Inicializar o `StateGraph`

```python
from langgraph.graph import StateGraph

graph_builder = StateGraph(State)
```

### 3. Definir os Nós

Os nós são funções que operam no estado.

```python
from langchain.chat_models import init_chat_model

llm = init_chat_model("anthropic:claude-3-5-sonnet-latest")

def chatbot(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

graph_builder.add_node("chatbot", chatbot)
```

### 4. Definir as Arestas

As arestas conectam os nós. `START` e `END` são nós especiais.

```python
from langgraph.graph import START, END

graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)
```

### 5. Compilar o Grafo

Finalmente, compile o grafo para torná-lo executável.

```python
graph = graph_builder.compile()
```

## Visualizando o Grafo

Você pode visualizar a estrutura do seu grafo usando a biblioteca `IPython`.

```python
from IPython.display import Image, display

try:
    display(Image(graph.get_graph().draw_mermaid_png()))
except Exception:
    # Requer dependências extras e é opcional
    pass
