# 6. Guia Completo do LangGraph Studio

O LangGraph Studio é uma interface de usuário web interativa que serve como um centro de controle para desenvolver, depurar e visualizar seus agentes `langgraph`. Ele é uma ferramenta indispensável para entender o fluxo de execução e o estado do seu grafo em tempo real.

## Parte 1: Setup no Windows

Este guia detalha o passo a passo para configurar e executar o LangGraph Studio no ambiente Windows.

### Pré-requisitos

-   **Python:** Garanta que você tenha o Python 3.8+ instalado. Verifique com `python --version`.
-   **Ambiente Virtual (Altamente Recomendado):** Isolar as dependências do projeto é uma prática essencial.

    ```bash
    # 1. Navegue até a pasta do seu projeto no terminal (CMD ou PowerShell)
    cd caminho/para/seu/projeto

    # 2. Crie um ambiente virtual
    python -m venv .venv

    # 3. Ative o ambiente virtual
    # No CMD:
    .\.venv\Scripts\activate
    # No PowerShell:
    .\.venv\Scripts\Activate.ps1
    ```
    Seu prompt do terminal deve mudar para indicar que o ambiente está ativo (ex: `(.venv) C:\...`).

### Passo 1: Instalar a CLI do LangGraph

O Studio é parte da Interface de Linha de Comando (CLI) do `langgraph`. Instale-a com o extra `[inmem]` para habilitar o servidor de desenvolvimento local.

```bash
pip install -U "langgraph-cli[inmem]"
```

### Passo 2: Preparar um Grafo para Visualização

O Studio precisa de um grafo para exibir. Crie um arquivo Python (ex: `main.py`) no seu projeto com um agente `langgraph`.

**Exemplo de `main.py`:**
```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults

# Para este exemplo, instale as dependências:
# pip install langchain-openai tavily-python

# Configure sua chave de API da OpenAI como variável de ambiente
# set OPENAI_API_KEY=sua_chave_aqui

search_tool = TavilySearchResults(max_results=2)

# A CLI procura por uma variável global chamada 'graph' ou 'agent'
agent = create_react_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[search_tool],
    prompt="Você é um assistente de pesquisa prestativo."
)
```

### Passo 3: Iniciar o Servidor e o Studio

Com o ambiente virtual ativado e no diretório do projeto, execute:

```bash
langgraph dev
```

Este comando irá:
1.  **Encontrar seu grafo:** Ele buscará a variável `agent` (ou `graph`) no seu arquivo Python.
2.  **Iniciar o servidor:** Um servidor local será iniciado em `http://127.0.0.1:2024`.
3.  **Abrir o Studio:** Seu navegador padrão abrirá a interface do LangGraph Studio.

---

## Parte 2: Como o LangGraph Studio Funciona

O Studio oferece uma janela para a "mente" do seu agente.

### A Interface

A tela é dividida em três partes principais:
1.  **Painel de Chat (Direita):** Onde você interage com seu agente, enviando mensagens como um usuário faria.
2.  **Visualização do Grafo (Centro):** Um diagrama que mostra os nós e as arestas do seu agente. Durante a execução, ele destaca o caminho que está sendo percorrido.
3.  **Painel de Execução (Esquerda):** Uma lista sequencial de todos os "passos" (execuções de nós) que ocorreram.

### Fluxo de Depuração Típico

1.  **Envie uma Mensagem:** Digite uma consulta no painel de chat e envie.
2.  **Observe o Fluxo:** Veja o destaque passar de nó em nó no diagrama central. Por exemplo, em um agente ReAct, você verá o fluxo ir do `agent` (onde o LLM "pensa") para o `tools` (onde a ferramenta é executada) e de volta para o `agent`.
3.  **Inspecione os Passos:** Clique em qualquer passo no painel esquerdo. Isso abrirá uma visão detalhada mostrando:
    -   **Entrada (`Input`):** O estado do grafo *antes* daquele nó ser executado.
    -   **Saída (`Output`):** O dicionário que o nó retornou, mostrando como o estado foi modificado.
    -   **Logs:** Quaisquer `print()` ou logs que seu nó tenha gerado.

Esta capacidade de inspecionar o estado em cada ponto é a ferramenta de depuração mais poderosa do Studio. Você pode ver exatamente quais `tool_calls` o LLM gerou, qual foi o resultado da ferramenta e como o LLM usou esse resultado para formular a próxima resposta.

### Lidando com Interrupções (`Human-in-the-Loop`)

Se o seu grafo usa a função `interrupt()`, o Studio brilhará ainda mais.
-   Quando a execução chega a um `interrupt`, ela pausa.
-   O painel de chat se transformará em um formulário ou campo de entrada, exibindo a mensagem que você passou para o `interrupt`.
-   Você pode fornecer sua resposta ou aprovação diretamente na interface e clicar para retomar a execução. O grafo continuará de onde parou, usando a sua entrada.

### Solução de Problemas

-   **Grafo não encontrado:** Renomeie a variável do seu grafo compilado para `agent` ou `graph`.
-   **Problemas de conexão `localhost`:** Use `langgraph dev --tunnel` para criar um URL público temporário.
