from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# 1. Define o estado do grafo
class State(TypedDict):
  topic: str
  joke: str

# 2. Define os nós (funções)
def refine_topic(state: State):
    """Nó que refina o tópico da piada."""
    print("---REFINING TOPIC---")
    return {"topic": state["topic"] + " and cats"}

def generate_joke(state: State):
    """Nó que gera a piada."""
    print("---GENERATING JOKE---")
    return {"joke": f"This is a joke about {state['topic']}"}

# 3. Constrói o grafo
graph_builder = StateGraph(State)

# Adiciona os nós
graph_builder.add_node("refine_topic", refine_topic)
graph_builder.add_node("generate_joke", generate_joke)

# Define as arestas (o fluxo)
graph_builder.add_edge(START, "refine_topic") # Ponto de entrada
graph_builder.add_edge("refine_topic", "generate_joke")
graph_builder.add_edge("generate_joke", END) # Ponto de saída

# Compila o grafo para torná-lo executável
graph = graph_builder.compile()

# Executa o grafo com um estado inicial
initial_state = {"topic": "dogs"}
final_state = graph.invoke(initial_state)

print("\n---RESULT---")
print(final_state['joke'])
