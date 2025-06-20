# 1. Introdução e Primeiros Passos com LangGraph

Este documento cobre os conceitos básicos para começar a desenvolver com `langgraph`.

## Instalação

Para usar o `langgraph`, você precisa instalá-lo via `pip`. É recomendado também instalar `langsmith` para depuração e `langchain-openai` (ou outro provedor de modelo) para interagir com LLMs.

```bash
pip install -U langgraph langsmith langchain-openai
```

Para utilizar a Interface de Linha de Comando (CLI) do `langgraph`, que é muito útil para desenvolvimento, instale-a com o extra `inmem`:

```bash
pip install -U "langgraph-cli[inmem]"
```

## Conceitos Fundamentais

A principal abstração no `langgraph` é o **Grafo de Estados (`StateGraph`)**. Ele é composto por:

-   **Estado (`State`):** Um `TypedDict` do Python que define a estrutura de dados que será passada entre os nós do grafo. Ele representa o estado da sua aplicação em qualquer ponto.
-   **Nós (`Nodes`):** Funções Python que realizam o trabalho. Cada nó recebe o estado atual como argumento e retorna um dicionário que atualiza esse estado.
-   **Arestas (`Edges`):** Conexões que definem o fluxo de execução. Você define de qual nó para qual nó o estado deve passar. Existem também arestas condicionais, que podem rotear o fluxo com base em uma função.
-   **`START` e `END`:** Nós especiais que marcam o início e o fim do fluxo do grafo.

### Exemplo Básico: Gerador de Piadas

Este exemplo demonstra como criar um grafo simples com dois nós.

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# 1. Defina a estrutura do estado
class JokeState(TypedDict):
  topic: str
  joke: str

# 2. Defina as funções dos nós
def refine_topic(state: JokeState) -> dict:
    """Este nó adiciona um detalhe ao tópico da piada."""
    print("---REFINING TOPIC---")
    return {"topic": state["topic"] + " and cats"}

def generate_joke(state: JokeState) -> dict:
    """Este nó gera a piada com base no tópico refinado."""
    print("---GENERATING JOKE---")
    return {"joke": f"Here is a joke about {state['topic']}"}

# 3. Construa o grafo
graph_builder = StateGraph(JokeState)

# Adicione os nós ao grafo
graph_builder.add_node("refine_topic", refine_topic)
graph_builder.add_node("generate_joke", generate_joke)

# Conecte os nós com arestas para definir o fluxo
graph_builder.add_edge(START, "refine_topic")
graph_builder.add_edge("refine_topic", "generate_joke")
graph_builder.add_edge("generate_joke", END)

# 4. Compile o grafo
graph = graph_builder.compile()

# 5. Execute o grafo
initial_state = {"topic": "dogs"}
final_state = graph.invoke(initial_state)

print("\n---FINAL RESULT---")
print(final_state['joke'])
```

## Servidor de Desenvolvimento

A CLI do `langgraph` é uma ferramenta poderosa para desenvolvimento local.

-   **Para iniciar o servidor:**
    ```bash
    langgraph dev
    ```
    Este comando inicia um servidor local e abre o **LangGraph Studio** no seu navegador. O Studio permite visualizar a execução do seu grafo passo a passo, inspecionar o estado e depurar de forma interativa.

-   **Para iniciar com depuração remota:**
    ```bash
    langgraph dev --debug-port 5678
    ```
    Isso permite que você anexe um depurador como o do VS Code ou PyCharm.
