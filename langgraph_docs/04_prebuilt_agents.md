# 4. Agentes Pré-construídos (`prebuilt`)

Para acelerar o desenvolvimento, o `langgraph` oferece agentes pré-construídos que encapsulam padrões comuns, como o ReAct (Reasoning and Acting). O principal deles é o `create_react_agent`.

## `create_react_agent`

Esta função de alto nível cria um grafo `langgraph` completo que implementa a lógica de um agente ReAct. Ele lida com o ciclo de chamada do modelo, uso de ferramentas e gerenciamento de estado, permitindo que você se concentre na lógica de negócios.

### Como Usar

Para criar um agente, você precisa fornecer:
1.  **Um modelo de linguagem (`model`):** Uma instância de um modelo de chat da LangChain (ex: `ChatOpenAI`, `ChatAnthropic`).
2.  **Uma lista de ferramentas (`tools`):** As ferramentas que o agente poderá utilizar.
3.  **(Opcional) Um prompt (`prompt`):** Um prompt de sistema para guiar o comportamento do agente.
4.  **(Opcional) Um checkpointer (`checkpointer`):** Necessário para funcionalidades como memória de longo prazo ou intervenção humana.

### Exemplo de `create_react_agent`

Este exemplo cria um agente simples que pode pesquisar na web.

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults

# 1. Defina as ferramentas
# Neste caso, usamos uma ferramenta pré-construída da LangChain Community
search_tool = TavilySearchResults(max_results=2)
tools = [search_tool]

# 2. Crie o agente
# O LangGraph lida com a vinculação das ferramentas ao modelo internamente
agent = create_react_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=tools,
    prompt="Você é um assistente de pesquisa prestativo."
)

# 3. Invoque o agente
# O agente executará o ciclo de pensamento e ação para responder à pergunta
query = {"messages": [("user", "Quais foram as principais notícias sobre IA hoje?")]}
for chunk in agent.stream(query):
    print(chunk)
    print("----")

# A resposta final estará no último chunk
final_response = list(agent.stream(query))[-1]
print(final_response)
```

### Vantagens de Usar Agentes Pré-construídos

-   **Simplicidade:** Reduz drasticamente o código boilerplate necessário para criar um agente funcional.
-   **Padrões Testados:** Implementa a lógica ReAct de forma robusta e testada pela comunidade.
-   **Extensibilidade:** Ainda permite personalização através de prompts, ferramentas customizadas e gerenciamento de estado.
-   **Integração:** Funciona perfeitamente com outras funcionalidades do `langgraph`, como `interrupt` para intervenção humana e `checkpointers` para memória.

### Memória de Curto Prazo (Conversacional)

Para que o agente se lembre de interações anteriores na mesma conversa, você precisa usar um `checkpointer` e um `thread_id`, assim como no exemplo de intervenção humana.

```python
from langgraph.checkpoint.memory import InMemorySaver

# ... (definição do agente como acima) ...
checkpointer = InMemorySaver()
agent = create_react_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=tools,
    checkpointer=checkpointer # Adiciona o checkpointer
)

# Use um ID de thread para manter o contexto
config = {"configurable": {"thread_id": "conversa_1"}}

# Primeira pergunta
agent.invoke({"messages": [("user", "Qual o tempo em São Paulo?")]}, config)

# Pergunta de acompanhamento na mesma conversa
# O agente vai se lembrar que a conversa é sobre São Paulo
agent.invoke({"messages": [("user", "E em Recife?")]}, config)
