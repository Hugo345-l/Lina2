# Agentes Pré-Construídos (Prebuilt Agents)

O LangGraph oferece agentes pré-construídos que simplificam a criação de padrões comuns de agentes. O mais notável é o `create_react_agent`.

## `create_react_agent`

Este construtor de alto nível cria um agente que segue o padrão ReAct (Reasoning and Acting). Ele gerencia o ciclo de chamada do modelo, execução de ferramentas e atualização do estado.

### Funcionalidades Principais

-   **Gerenciamento de Estado**: Usa `AgentState` para rastrear mensagens.
-   **Execução de Ferramentas**: Invoca ferramentas automaticamente com base nas `tool_calls` do modelo.
-   **Memória**: Suporta memória de curto prazo (conversacional) através de `checkpointer`.
-   **Customização**: Permite a customização de estado, prompts e ganchos (hooks).

### Exemplo de Uso

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver

# 1. Defina suas ferramentas
def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

# 2. Crie um checkpointer para a memória
checkpointer = InMemorySaver()

# 3. Crie o agente
agent = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",
    tools=[get_weather],
    checkpointer=checkpointer
)

# 4. Invoque o agente com um ID de thread para manter o contexto
config = {"configurable": {"thread_id": "1"}}
sf_response = agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather in sf"}]},
    config
)

# Continue a conversa
ny_response = agent.invoke(
    {"messages": [{"role": "user", "content": "what about new york?"}]},
    config
)
```

### Customizando o Estado

Você pode estender o `AgentState` para adicionar seus próprios campos de estado.

```python
from langgraph.prebuilt.chat_agent_executor import AgentState

class CustomState(AgentState):
    user_name: str

agent = create_react_agent(
    # ...
    state_schema=CustomState,
)

agent.invoke({
    "messages": "hi!",
    "user_name": "Jane"
})
```

### Ganchos (Hooks)

O `create_react_agent` suporta um `pre_model_hook` que é chamado antes de cada invocação do modelo. Isso é útil para tarefas como o corte de mensagens.

```python
from langchain_core.messages.utils import trim_messages, count_tokens_approximately

def pre_model_hook(state):
    trimmed_messages = trim_messages(
        state["messages"],
        strategy="last",
        token_counter=count_tokens_approximately,
        max_tokens=384,
    )
    return {"llm_input_messages": trimmed_messages}

agent = create_react_agent(
    # ...
    pre_model_hook=pre_model_hook,
)
