# Plano Detalhado: Fase 1 Revisada - MVP Funcional com Interface de Debug

**Data de Revisão:** 06/09/2025

## Contexto: Lições Aprendidas com Desafios Anteriores no Backend

Antes de detalhar as tarefas desta fase, é crucial revisitar os aprendizados de um ciclo de desenvolvimento anterior que envolveu o backend LangServe. Compreender esses pontos ajudará a evitar a repetição de erros e a guiar as decisões técnicas.

### 🚨 O Problema Inicial
O backend estava funcional, com testes passando e endpoints (`/chat/invoke`, `/chat/stream`) operacionais via LangServe, aceitando o payload no formato `{"input": {"input": "mensagem"}}`. Tentativas de "melhorar" o código levaram ao erro 422 (Unprocessable Entity).

### 🔍 Sequência de Erros Observados
1.  **Erro 422 Unprocessable Entity**: `'Input should be a valid dictionary or instance of ChatInput'`.
    *   **Causa**: Incompatibilidade entre o formato de entrada esperado pelo LangServe (após modificações na configuração do `add_routes` com `input_type=dict`) e o que estava sendo enviado ou como o Pydantic model `ChatInput` estava sendo interpretado.
2.  **Servidor Fechando Imediatamente**: Logs mostravam `INFO: Application startup complete.` seguido por `INFO: Shutting down` e `INFO: Application shutdown complete.`.
    *   **Causa**: Modificações no código (provavelmente na tentativa de corrigir o erro 422 ou ao introduzir uma chain LCEL mais complexa) causaram um erro silencioso que impedia o servidor Uvicorn de se manter ativo.
3.  **Connection Refused**: `[WinError 10061] Nenhuma conexão pôde ser feita porque a máquina de destino as recusou`.
    *   **Causa**: Consequência direta do Erro 2; o servidor não estava rodando, impedindo que os testes ou a interface se conectassem.

### 🔄 Ciclo Vicioso dos "Fixes"
O processo de tentativa e erro seguiu um padrão problemático:
Código funcionando → Tentativa de "melhorar" → Erro 422 → Mais tentativas de correção (ex: mudar `input_type`) → Servidor instável/fechando → Mudanças adicionais na chain ou configuração → Connection refused → Confusão e mais "correções" que distanciavam o código do estado funcional original.

### 🧠 Análise das Tentativas de Correção
*   **Mudar `input_type=dict` em `add_routes`**:
    *   **Original (funcional)**: `add_routes(app, langserve_chain, path="/chat")` (provavelmente com `with_types` implícito ou configurado corretamente antes).
    *   **Mudança (problemática)**: `add_routes(app, chain.with_types(input_type=dict, output_type=ChatResponse))`
    *   **Resultado**: Erro 422, pois o LangServe esperava um dicionário genérico, mas a validação interna ou a chain ainda poderiam estar esperando a estrutura do `ChatInput` ou o formato aninhado.
*   **Implementar LCEL Complexo**: Uma chain como `RunnableLambda(_prepare_input_and_start_time) | RunnablePassthrough.assign(...) | RunnableLambda(_build_final_chat_response)` introduziu complexidade que dificultou o debug e contribuiu para a instabilidade.
*   **Confusão com Formatos de Payload**: Testar com `{"input": "texto"}` e `{"input": {"input": "texto"}}` sem clareza de qual era o esperado pela configuração atual do LangServe levou a resultados inconsistentes.

### 💡 Principais Aprendizados para Esta Fase
1.  **Lei da Complexidade Desnecessária**: Se algo funciona, entenda *profundamente* por que funciona antes de tentar modificar ou "melhorar". Mudanças devem ser incrementais e testadas individualmente.
2.  **LangServe e Suas Convenções**:
    *   O formato `{"input": {"input": "mensagem"}}` é uma característica do LangServe quando se usa um Pydantic model como `input_type` que tem um campo chamado `input`. A camada externa é o envelope do LangServe, e a interna é a estrutura do Pydantic.
    *   O playground (`/chat/playground/` ou o tipo especificado em `add_routes`) é a fonte da verdade para o formato de payload esperado.
    *   Usar `with_types(input_type=ChatInput)` (onde `ChatInput` é um `BaseModel`) é geralmente a forma correta de definir tipos de entrada e saída para validação e geração de esquema OpenAPI.
3.  **Debugging em Cascata é Perigoso**: Ao encontrar um erro, a primeira ação deveria ser reverter para o último estado funcional conhecido. Corrigir um erro introduzindo mais mudanças sem isolar a causa raiz leva a um ciclo de problemas.
4.  **Over-Engineering vs. Simplicidade**: A solução original, provavelmente uma chain mais simples (`PROMPT | LLM | StrOutputParser` ou similar) com `add_routes(app, chain, input_type=ChatInput, output_type=ChatResponse, path="/chat")`, era mais robusta. A tentativa de adicionar camadas de abstração ou lógicas complexas prematuramente foi prejudicial.
5.  **Documentação vs. Realidade do Playground**: Exemplos de documentação podem não se aplicar diretamente. O playground do LangServe mostra o formato exato que a configuração *atual* do `add_routes` espera.

### 🎯 Estratégias que Funcionaram (e devem ser mantidas)
*   **Volta ao Básico**: Restaurar a versão funcional e fazer mudanças incrementais.
*   **Diagnóstico Sistemático**: Isolar o problema (servidor, cliente, configuração). Usar logs do Uvicorn.
*   **Aceitar as Convenções do Framework**: Se o LangServe, com `input_type=ChatInput` (onde `ChatInput` tem um campo `input`), espera `{"input": {"input": "SUA_MENSAGEM"}}`, então esse é o formato a ser usado.

### 📚 Lições para o Futuro (Aplicáveis a Esta Fase)
*   **Regra de Ouro**: "Se funciona, primeiro entenda por que funciona, depois melhore incrementalmente."
*   **Estratégia de Mudanças**: Backup da versão funcional; uma mudança por vez; teste imediato; rollback rápido se quebrar.
*   **Debugging Efetivo**: Isolar o problema; reproduzir consistentemente; ter um estado funcional conhecido para reverter; fazer a menor mudança possível para testar uma hipótese.

Com esses aprendizados em mente, o plano detalhado abaixo para a Fase 1 Revisada visa construir sobre uma base sólida, priorizando a clareza da configuração do LangServe e a integração incremental com a interface Streamlit.

---

**Objetivo Principal:** Entregar uma versão mínima viável (MVP) da Lina, consistindo em uma interface de chat Streamlit funcional conectada a um backend LangServe. A interface deve incluir um painel de debug básico que exibe métricas chave (custo, tokens, duração) obtidas da resposta estruturada do backend, permitindo testes e observabilidade iniciais.

---

## 1. Backend (`lina-backend/app.py` e novos arquivos)

### 1.1. Arquivo de Configuração de Preços (`pricing.json`)
*   **Status:** Concluído.

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
*   **Status:** Concluído.

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
*   **Status:** Concluído.

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
*   **Status:** Concluído. Retorna `dict` via `model_dump()`.

*   **Objetivo:** Envolver a chamada da chain, medir a duração total e formatar a `ChatResponse` final.
*   **Lógica:**
    ```python
    # ... (definições de Pydantic, pricing_config, calculate_cost, format_response_with_debug_info)
    # ... (LINA_PROMPT, get_llm())
    # langserve_chain_core = LINA_PROMPT | get_llm() | RunnableLambda(format_response_with_debug_info)

    def lina_api_wrapper(input_data: dict) -> dict: # Retorna dict
        start_time = time.time()
        # ... (extração de user_message de input_data) ...
        result_from_chain = langserve_chain_core.invoke({"input": user_message})
        duration_seconds = time.time() - start_time
        final_debug_info = DebugInfo(
            **result_from_chain["debug_info_partial"], 
            duration=round(duration_seconds, 3)
        )
        chat_response_obj = ChatResponse(
            output=result_from_chain["output"],
            debug_info=final_debug_info
        )
        return chat_response_obj.model_dump() # Retorna dict
    ```

### 1.5. Atualização do `add_routes` (LangServe em `lina-backend/app.py`)
*   **Status:** Concluído. `input_type` e `output_type` removidos.

*   **Objetivo:** Configurar o LangServe para usar o novo wrapper e os tipos de dados.
*   **Lógica:**
    ```python
    from langserve import add_routes 
    api_endpoint_runnable = RunnableLambda(lina_api_wrapper)
    add_routes(
        app,
        api_endpoint_runnable, 
        path="/chat",
        # input_type e output_type removidos
        playground_type="default",
        enabled_endpoints=["invoke", "batch", "playground"] 
    )
    ```
    *   **Streaming:** Para a Fase 1, o foco é no endpoint `invoke`. A adaptação para streaming (`/chat/stream`) pode ser feita em uma iteração seguinte, exigindo um wrapper de streaming que formate os chunks.

### 1.6. Testes do Backend
*   **Status:** Concluído. Testes em `test_backend.py` para `/chat/invoke` passam, confirmando que o backend retorna o `dict` JSON esperado.

*   Utilizar `lina-backend/test_backend.py` ou ferramentas como Postman/curl.
*   Verificar se `POST /chat/invoke` com `{"input": {"input": "mensagem"}}` retorna a estrutura `ChatResponse` (como `dict`) completa, incluindo `debug_info` com todos os campos esperados.

---

## 2. Frontend (`lina-streamlit-ui/app_st.py`)
*   **Status Geral (10/06/2025):** Implementado, mas com problema crítico no parsing/exibição da resposta do backend.

### 2.1. Tema Dark Básico e CSS Organizado
*   **Status:** Concluído.

*   Aplicar um tema dark simples via CSS.
*   **Estratégia:** Criar `lina-streamlit-ui/styles.css` e carregá-lo, ou definir o CSS como uma string em `styles.py` e usar `st.markdown(CSS_STRING, unsafe_allow_html=True)`.
    *   Focar em cores de fundo sólidas (`#1E1E2E`, `#2D2D44`), texto claro e uma cor de destaque.

### 2.2. Chat com Avatars Simples
*   **Status:** Concluído.

*   Usar `st.chat_message(name="user", avatar="👤")` e `st.chat_message(name="Lina", avatar="🤖")`.
*   Estilizar os balões de mensagem com fundos diferentes via CSS, se necessário, para melhor distinção.

### 2.3. Debug Panel Básico
*   **Status:** Implementado, mas não funcional devido ao problema de parsing da resposta.

*   Implementar com `st.expander("🔍 Painel de Debug")`.
*   Dentro do expander, exibir as métricas do `st.session_state.debug_info` (que será o objeto `DebugInfo` da resposta do backend):
    *   `Custo Total: ${debug_data.cost:.6f}`
    *   `Duração: {debug_data.duration:.2f}s`
    *   `Modelo: {debug_data.model_name}`
    *   `Tokens: Total={debug_data.tokens_used}, Prompt={debug_data.prompt_tokens}, Comp.={debug_data.completion_tokens}`
    *   `Fluxo de Execução (Backend):` (Para Fase 1, mostrar um passo único: "✅ Processamento Principal ({debug_data.duration:.2f}s)")

### 2.4. Input Area Melhorada (Simples)
*   **Status:** Concluído.

*   Aplicar CSS para `border-radius` e um sutil `box-shadow` ou mudança de cor da borda no `:focus` do `st.text_input` ou `st.chat_input`.

### 2.5. Processamento da Resposta do Backend
*   **Status:** Implementado com várias tentativas de correção, mas ainda falhando em parsear corretamente a resposta para exibição.

*   A função que envia a mensagem do usuário ao backend deve:
    *   Esperar uma resposta JSON e desserializá-la para um objeto `ChatResponse` (ou um dicionário com a mesma estrutura).
    *   Armazenar `response.debug_info` em `st.session_state.debug_info`.
    *   Adicionar `response.output` ao histórico de chat.
    *   Chamar `st.rerun()` para atualizar a UI.

### 2.6. Gerenciamento de Estado (`st.session_state`)
*   **Status:** Concluído.

*   Inicializar no começo do script:
    ```python
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = [] # Lista de {"role": "user/assistant", "content": "..."}
    if 'debug_info' not in st.session_state:
        st.session_state.debug_info = None # Armazenará o objeto DebugInfo
    ```

---

## 3. Graph de Teste (Calculadora - Conceito para Fase 1)
*   **Status:** Não implementado. Foco na correção do fluxo principal.

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
    *   Retorna respostas no formato `ChatResponse` (como `dict` via `model_dump()`), incluindo o objeto `debug_info`.
    *   Calcula o custo básico com base no `pricing.json`.
    *   Extrai informações de tokens da resposta do LLM.
    *   Mede a duração da execução.
*   **Base Sólida:** Uma fundação robusta para as próximas fases, com observabilidade integrada na ferramenta de teste desde o início.

---
## 📝 Resumo do Estado Atual e Lições Aprendidas (10/06/2025)

Após um ciclo de desenvolvimento e depuração focado em fazer o backend LangServe (`lina-backend/app.py`) comunicar-se corretamente com o frontend Streamlit (`lina-streamlit-ui/app_st.py`) e exibir informações de debug, o estado é o seguinte:

**Avanços Conquistados:**
1.  **Backend Robusto:**
    *   O servidor `lina-backend/app.py` está funcional e o endpoint `/chat/invoke` retorna um dicionário JSON estruturado corretamente (contendo `output` e `debug_info`), conforme validado pelos testes em `test_backend.py`.
    *   A questão da serialização de objetos Pydantic pelo LangServe foi resolvida utilizando `model_dump()` na função `lina_api_wrapper` para garantir que um dicionário puro seja retornado.
    *   A configuração de `add_routes` foi ajustada para não especificar `input_type` nem `output_type`, permitindo que o LangServe lide melhor com o dicionário retornado.
    *   Cálculo de custo, extração de tokens e medição de duração estão implementados no backend.
2.  **Frontend Conectado:**
    *   A interface `lina-streamlit-ui/app_st.py` consegue enviar requisições para o backend e receber respostas.
    *   Foram feitas várias iterações na lógica de tratamento de payload e de resposta no frontend.

**Principal Problema Pendente:**
*   **Parsing/Exibição da Resposta no Streamlit:** Apesar dos avanços e do backend agora enviar um dicionário JSON correto (verificado pelos testes do `test_backend.py`), a interface Streamlit (conforme imagem de 10/06/2025, 01:29 AM) ainda:
    1.  Exibe a resposta completa do backend (o dicionário JSON como uma string literal: `"{'output': '...', 'debug_info': {...}}"`) no balão de chat da Lina, em vez de apenas o valor da chave `'output'`.
    2.  Não popula corretamente o "Painel de Debug" com os dados de `debug_info`. Os valores aparecem zerados ou com placeholders como "N/A" ou "Formato Antigo Detectado", indicando que a lógica em `lina-streamlit-ui/app_st.py` não está conseguindo extrair e utilizar os dados do dicionário `debug_info` que é parte da resposta.

**Lições Aprendidas Chave (Iteração Atual):**
1.  **A Importância do `.model_dump()`:** Para interações com LangServe onde se retorna estruturas Pydantic através de `RunnableLambda`s, converter explicitamente para `dict` com `.model_dump()` é crucial para evitar problemas de serialização (onde o LangServe pode acabar tratando o objeto como uma string).
2.  **Flexibilidade no `add_routes`:** Em alguns casos, especialmente com wrappers, remover `input_type` e `output_type` de `add_routes` e deixar o LangServe inferir ou tratar os dados como dicionários pode ser mais robusto.
3.  **Depuração Detalhada Frontend-Backend:** O problema atual demonstra que mesmo com um backend enviando dados corretos (verificado por testes diretos da API), a forma como o frontend recebe, parseia e utiliza esses dados é uma etapa crítica que também precisa de depuração cuidadosa. A exibição da string literal no chat e o painel de debug não funcional são sintomas de um problema no parsing do JSON ou na subsequente atribuição de valores no código Streamlit.

**Próximo Passo Crítico:**
*   **Corrigir o parsing da resposta JSON no `lina-streamlit-ui/app_st.py`:** É necessário revisar a seção `try...except` que processa `response_data_dict = response.json()`. O objetivo é garantir que:
    *   `assistant_response_content` receba apenas o valor de `response_data_dict['output']`.
    *   `st.session_state.debug_info` seja populado com um objeto `DebugInfo` instanciado a partir do dicionário `response_data_dict['debug_info']`.

Resolver este último ponto de parsing no frontend é essencial para concluir os objetivos da Fase 1 Revisada e ter uma interface de debug verdadeiramente funcional.
