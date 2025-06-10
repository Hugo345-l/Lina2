# Plano Detalhado: Fase 1 Revisada - MVP Funcional com Interface de Debug

**Data de Revisão:** 06/09/2025

**Objetivo Principal:** Entregar uma versão mínima viável (MVP) da Lina, consistindo em uma interface de chat Streamlit funcional conectada a um backend LangServe. A interface deve incluir um painel de debug básico que exibe métricas chave (custo, tokens, duração) obtidas da resposta estruturada do backend, permitindo testes e observabilidade iniciais.

---

## 1. Backend (`lina-backend/app.py` e novos arquivos)

### 1.1. Arquivo de Configuração de Preços (`pricing.json`)

*   **Ação:** Criar um arquivo `pricing.json` na pasta `lina-backend/config/`.
*   **Conteúdo:** Este arquivo armazenará os custos por token (input e output) para cada modelo LLM utilizado via OpenRouter.
    *   **Formato Exemplo:**
        ```json
        {
          "google/gemini-2.5-flash-preview-05-20": {
            "input_token_price": 0.00000035, 
            "output_token_price": 0.00000070 
          },
          "google/gemini-pro": { 
            "input_token_price": 0.00000050,
            "output_token_price": 0.00000150
          }
        }
        ```
    *   **Importante:** Os preços devem ser por *token individual*. É crucial verificar e usar os preços corretos fornecidos pelo OpenRouter para os modelos exatos em uso.
*   **Lógica de Carregamento:** O `lina-backend/app.py` deverá carregar este arquivo JSON no início para que a função de cálculo de custo possa utilizá-lo.

### 1.2. Modelos Pydantic para API (em `lina-backend/app.py` ou `lina-backend/models.py`)

*   **`ChatInput(BaseModel)`:**
    ```python
    from pydantic import BaseModel
    from typing import Optional, List, Dict, Any # Adicionar List, Dict, Any

    class ChatInput(BaseModel):
        input: str
        # thread_id: Optional[str] = None # Para futuro gerenciamento de sessão
    ```
*   **`DebugInfo(BaseModel)`:**
    ```python
    class DebugInfo(BaseModel):
        cost: float = 0.0
        tokens_used: int = 0
        prompt_tokens: int = 0
        completion_tokens: int = 0
        duration: float = 0.0 # Em segundos
        model_name: Optional[str] = None
        # flow_steps: List[Dict[str, Any]] = [] # Para quando LangGraph for implementado
    ```
*   **`ChatResponse(BaseModel)`:**
    ```python
    class ChatResponse(BaseModel):
        output: str  # Mensagem da Lina
        debug_info: DebugInfo
        # thread_id: Optional[str] = None 
    ```

### 1.3. Modificação da Chain Principal do LangServe (em `lina-backend/app.py`)

*   **Objetivo:** Alterar a chain para que ela retorne um dicionário com a mensagem e as métricas parciais, em vez de apenas uma string.
*   **Nova Lógica da Chain:** `LINA_PROMPT | get_llm() | RunnableLambda(format_response_with_debug_info)`
*   **Função `format_response_with_debug_info(llm_output: AIMessage) -> dict`:**
    *   Recebe o `AIMessage` do LLM.
    *   Extrai `message_content = llm_output.content`.
    *   Extrai metadados do LLM: `token_usage` (prompt, completion, total tokens) e `model_name` de `llm_output.response_metadata`.
        *   Garantir que `total_tokens` seja a soma de `prompt_tokens` e `completion_tokens` se não vier explicitamente.
    *   Chama a função `calculate_cost(model_name, prompt_tokens, completion_tokens, pricing_config)` para obter o custo.
        ```python
        # Função de cálculo de custo (a ser definida em app.py)
        # PRICING_CONFIG é o dict carregado do pricing.json
        def calculate_cost(model_name: str, prompt_tokens: int, completion_tokens: int, pricing_config: dict) -> float:
            model_prices = pricing_config.get(model_name, {})
            input_price = model_prices.get("input_token_price", 0.0)
            output_price = model_prices.get("output_token_price", 0.0)
            cost = (prompt_tokens * input_price) + (completion_tokens * output_price)
            return round(cost, 8) # Usar precisão adequada
        ```
    *   Retorna um dicionário:
        ```python
        return {
            "output": message_content,
            "debug_info_partial": {
                "cost": calculated_cost,
                "tokens_used": total_tokens,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "model_name": model_name,
            }
        }
        ```

### 1.4. Wrapper da API: `lina_api_wrapper` (em `lina-backend/app.py`)

*   **Objetivo:** Envolver a chamada da chain, medir a duração total e formatar a `ChatResponse` final.
*   **Lógica:**
    ```python
    import time 
    from langchain_core.runnables import RunnableLambda # Adicionar se não estiver
    from langchain_core.messages import AIMessage # Adicionar se não estiver

    # ... (definições de Pydantic, pricing_config, calculate_cost, format_response_with_debug_info)
    # ... (LINA_PROMPT, get_llm())
    # langserve_chain_core = LINA_PROMPT | get_llm() | RunnableLambda(format_response_with_debug_info)


    async def lina_api_wrapper(chat_input: ChatInput) -> ChatResponse:
        start_time = time.time()

        # Supondo que langserve_chain_core está definida como acima
        result_from_chain = await langserve_chain_core.ainvoke({"input": chat_input.input})

        duration_seconds = time.time() - start_time

        final_debug_info = DebugInfo(
            **result_from_chain["debug_info_partial"], 
            duration=round(duration_seconds, 3)
        )

        return ChatResponse(
            output=result_from_chain["output"],
            debug_info=final_debug_info
        )
    ```

### 1.5. Atualização do `add_routes` (LangServe em `lina-backend/app.py`)

*   **Objetivo:** Configurar o LangServe para usar o novo wrapper e os tipos de dados.
*   **Lógica:**
    ```python
    from langserve import add_routes 

    # ... (app FastAPI, lina_api_wrapper, ChatInput, ChatResponse)

    add_routes(
        app,
        lina_api_wrapper, 
        path="/chat",
        input_type=ChatInput,    
        output_type=ChatResponse, 
        playground_type="default" 
    )
    ```
    *   **Streaming:** Para a Fase 1, o foco é no endpoint `invoke`. A adaptação para streaming (`/chat/stream`) pode ser feita em uma iteração seguinte, exigindo um wrapper de streaming que formate os chunks.

### 1.6. Testes do Backend

*   Utilizar `lina-backend/test_backend.py` ou ferramentas como Postman/curl.
*   Verificar se `POST /chat/invoke` com `{"input": "mensagem"}` retorna a estrutura `ChatResponse` completa, incluindo `debug_info` com todos os campos esperados.

---

## 2. Frontend (`lina-streamlit-ui/app_st.py`)

### 2.1. Tema Dark Básico e CSS Organizado

*   Aplicar um tema dark simples via CSS.
*   **Estratégia:** Criar `lina-streamlit-ui/styles.css` e carregá-lo, ou definir o CSS como uma string em `styles.py` e usar `st.markdown(CSS_STRING, unsafe_allow_html=True)`.
    *   Focar em cores de fundo sólidas (`#1E1E2E`, `#2D2D44`), texto claro e uma cor de destaque.

### 2.2. Chat com Avatars Simples

*   Usar `st.chat_message(name="user", avatar="👤")` e `st.chat_message(name="Lina", avatar="🤖")`.
*   Estilizar os balões de mensagem com fundos diferentes via CSS, se necessário, para melhor distinção.

### 2.3. Debug Panel Básico

*   Implementar com `st.expander("🔍 Painel de Debug")`.
*   Dentro do expander, exibir as métricas do `st.session_state.debug_info` (que será o objeto `DebugInfo` da resposta do backend):
    *   `Custo Total: ${debug_data.cost:.6f}`
    *   `Duração: {debug_data.duration:.2f}s`
    *   `Modelo: {debug_data.model_name}`
    *   `Tokens: Total={debug_data.tokens_used}, Prompt={debug_data.prompt_tokens}, Comp.={debug_data.completion_tokens}`
    *   `Fluxo de Execução (Backend):` (Para Fase 1, mostrar um passo único: "✅ Processamento Principal ({debug_data.duration:.2f}s)")

### 2.4. Input Area Melhorada (Simples)

*   Aplicar CSS para `border-radius` e um sutil `box-shadow` ou mudança de cor da borda no `:focus` do `st.text_input` ou `st.chat_input`.

### 2.5. Processamento da Resposta do Backend

*   A função que envia a mensagem do usuário ao backend deve:
    *   Esperar uma resposta JSON e desserializá-la para um objeto `ChatResponse` (ou um dicionário com a mesma estrutura).
    *   Armazenar `response.debug_info` em `st.session_state.debug_info`.
    *   Adicionar `response.output` ao histórico de chat.
    *   Chamar `st.rerun()` para atualizar a UI.

### 2.6. Gerenciamento de Estado (`st.session_state`)

*   Inicializar no começo do script:
    ```python
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = [] # Lista de {"role": "user/assistant", "content": "..."}
    if 'debug_info' not in st.session_state:
        st.session_state.debug_info = None # Armazenará o objeto DebugInfo
    ```

---

## 3. Graph de Teste (Calculadora - Conceito para Fase 1)

*   **Objetivo:** Validar que o frontend consegue exibir o `debug_info` corretamente.
*   **Implementação Simplificada para Fase 1:**
    *   Criar um endpoint de teste no backend (ex: `POST /calculator/invoke`) que *não* usa LLM.
    *   Este endpoint recebe uma expressão matemática simples.
    *   Ele calcula o resultado.
    *   Retorna um `ChatResponse` simulado, onde `output` é o resultado do cálculo, e `debug_info` tem `cost=0.0`, `tokens_used=0`, `model_name="calculadora_local"`, e `duration` é o tempo que levou para calcular.
    *   O frontend pode ter uma forma de interagir com este endpoint para testar o painel de debug.

---

## 🏁 Resultado Esperado da Fase 1 Revisada

*   **Interface Streamlit Funcional:**
    *   Permite enviar mensagens para o backend da Lina.
    *   Exibe a conversa de forma clara.
    *   Apresenta um painel de debug colapsável.
*   **Painel de Debug Informativo:**
    *   Mostra o custo estimado da última interação com o LLM.
    *   Mostra o total de tokens, tokens de prompt e tokens de completude.
    *   Mostra a duração total da resposta do backend.
    *   Mostra o nome do modelo LLM utilizado.
    *   (Inicialmente) Mostra um "fluxo" de um único passo.
*   **Backend LangServe Modificado:**
    *   Retorna respostas no formato `ChatResponse`, incluindo o objeto `debug_info`.
    *   Calcula o custo básico com base no `pricing.json`.
    *   Extrai informações de tokens da resposta do LLM.
    *   Mede a duração da execução.
*   **Base Sólida:** Uma fundação robusta para as próximas fases, com observabilidade integrada na ferramenta de teste desde o início.

---
