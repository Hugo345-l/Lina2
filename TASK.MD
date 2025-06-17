# Roadmap Detalhado - Projeto Lina
*Assistente Pessoal Multi-Agente*

## 📋 Visão Geral

**Orçamento**: $50/mês  
**Tecnologias Core**: LangGraph + LangChain + OpenRouter (Gemini/Claude/GPT) + SQLite
**Modelo LLM Padrão (via OpenRouter)**: `google/gemini-2.5-flash-preview-05-20` (Temperatura: 0.8)

---

## 🏗️ **FASE 1: Fundação e Interface**

### **Tarefa 1.1: Setup do Ambiente de Desenvolvimento**

#### **Checklist Técnico**
- [x] Criar ambiente virtual Python 3.12
- [x] Instalar dependências base (via requirements.txt)
- [x] Criar arquivo .gitignore para proteger segredos e ignorar arquivos desnecessários
- [x] Configurar OpenRouter
  - [x] Criar conta em https://openrouter.ai/
  - [x] Gerar API key no dashboard
  - [x] Configurar variável de ambiente OPENROUTER_API_KEY
- [x] Teste hello-world LangGraph com OpenRouter usando `google/gemini-2.5-flash-preview-05-20`

#### **Entregáveis**
- [x] Ambiente funcional com todas dependências
- [x] Arquivo .gitignore configurado
- [x] OpenRouter configurado e testado
- [x] Teste básico LangGraph executando

---

### **Tarefa 1.2: Implementação da Interface de Chat (HTML/CSS/JavaScript)**

**Status (16/06/2025): ✅ CONCLUÍDO.**

Interface web moderna desenvolvida com HTML, CSS e JavaScript puro, inspirada no design do Toqan.

#### **Checklist Técnico**
- [x] Criar estrutura de arquivos `lina-frontend/`
  - [x] `index.html` (página principal)
  - [x] `css/main.css` (estilos gerais e layout)
  - [x] `css/chat.css` (estilos específicos do chat)
  - [x] `css/debug-panel.css` (estilos do painel de debug)
  - [x] `js/app.js` (aplicação principal e orquestração)
  - [x] `js/chat.js` (lógica da interface de chat)
  - [x] `js/debug-panel.js` (lógica do painel de debug)
  - [x] `js/api.js` (comunicação com backend LangServe)
  - [x] `FRONTEND_MAP.md` (documentação da estrutura)
- [x] Desenvolver `index.html` com estrutura básica de chat e painel de debug
- [x] Implementar estilos CSS para o layout e componentes
- [x] Desenvolver `app.js` para orquestrar a aplicação
- [x] Desenvolver `chat.js` para gerenciar a interface de chat
- [x] Desenvolver `debug-panel.js` para exibir métricas de execução
- [x] Desenvolver `api.js` para comunicação com o backend LangServe
- [x] Resolver problemas de CORS e parsing de resposta do LangServe

#### **Entregáveis**
- [x] Interface web completa e funcional (HTML/CSS/JS), conectada ao backend LangServe
- [x] Chat operacional com histórico de mensagens
- [x] Painel de debug transparente mostrando métricas de execução
- [x] Documentação completa da estrutura frontend

#### **Critérios de Sucesso**
- [x] Interface carrega sem erros e com layout esperado
- [x] Usuário consegue enviar mensagens e receber respostas da Lina
- [x] Painel de debug exibe corretamente as métricas do backend
- [x] Conexão frontend-backend estável e funcional

#### **Resolução de Problemas (16/06/2025):**
- ✅ **CORS resolvido**: Configuração adequada no backend FastAPI
- ✅ **Parsing LangServe**: Correção na estrutura de resposta para lidar com encapsulamento do LangServe
- ✅ **Design System**: Interface moderna inspirada no Tailwind UI com design consistente
- ✅ **Comunicação Backend**: API client robusto com logs detalhados e tratamento de erros
- ✅ **Debug Panel**: Métricas de custo, tokens, tempo e modelo exibidas em tempo real

---

### **Tarefa 1.3: Backend LangServe Básico**

**Status (16/06/2025): ✅ CONCLUÍDO.**

#### **Checklist Técnico**
- [x] Estrutura básica do projeto (`lina-backend/`)
- [x] Servidor LangServe básico (`lina-backend/app.py`)
- [x] Endpoints essenciais
  - [x] `/chat/invoke` - Chamadas síncronas
  - [x] `/health` - Health check
  - [x] `/test` - Endpoint de teste
- [x] Integração LangSmith para observabilidade
- [x] Configuração CORS para frontend
- [x] Respostas estruturadas com debug info (custo, tokens, duração)
- [x] Sistema de fallback de modelos

#### **Entregáveis**
- [x] Servidor LangServe funcional
- [x] Endpoints básicos operacionais
- [x] Logging e observabilidade via LangSmith
- [x] Resposta estruturada com métricas detalhadas

#### **Funcionalidades Implementadas**
- [x] Personalidade base da Lina definida
- [x] Integração com OpenRouter/Gemini
- [x] Cálculo automático de custos
- [x] Métricas de performance em tempo real
- [x] Tratamento de erros robusto

---

### **Tarefa 1.3.1: Sistema de Threading com SQLite Checkpointer + Upgrades de UI**

**Status (16/06/2025): 🟡 CHECKPOINT 1.1 CONCLUÍDO** - SQLite Checkpointer otimizado implementado com sucesso.

#### **📋 Objetivo**
Transformar o sistema atual de "runs isolados" em um sistema de threads persistentes com debug granular por mensagem, preparando a base para testes de performance, comparação de modelos e futura arquitetura multi-agente.

#### **🔧 PARTE 1: Backend - Threading com SQLite Checkpointer**

##### **1.1 Configuração do Checkpointer**
- [x] Importar `SqliteSaver` do LangGraph
- [x] Criar arquivo SQLite `lina_conversations.db` na raiz do projeto
- [x] Configurar checkpointer com conexão SQLite usando WAL mode para performance
- [x] Integrar o checkpointer ao chain atual (sem quebrar funcionalidade existente)

**🧪 CHECKPOINT 1.1: Teste de Checkpointer Básico** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Verificar se arquivo `lina_conversations.db` foi criado na raiz
- [x] ✅ Testar se backend ainda inicia sem erros após integração do checkpointer
- [x] ✅ Enviar mensagem simples e confirmar que resposta ainda funciona normalmente
- [x] ✅ Verificar no SQLite que dados estão sendo persistidos (usar SQLite browser)
- [x] ✅ Reiniciar backend e confirmar que ainda funciona (persistência básica)

**✅ Resultados do CHECKPOINT 1.1:**
- 🗄️ **SQLite Database criado**: `lina_conversations.db` (4096 bytes)
- 🚀 **WAL Mode ativo**: Verificado via `PRAGMA journal_mode` → "wal"
- 📊 **Tabelas LangGraph**: `checkpoints` e `writes` criadas automaticamente
- ⚡ **Performance otimizada**: Configurações conforme documentação LangChain aplicadas
- 🔧 **Backend estável**: Health check e testes funcionando normalmente
- 🎯 **StateGraph funcional**: MessagesState + AgentState implementado corretamente

##### **1.2 Modificação do Wrapper Principal**
- [x] Adicionar parâmetro `thread_id` ao `lina_api_wrapper`
- [x] Implementar lógica de geração automática de `thread_id` quando não fornecido
- [x] Criar configuração `{"configurable": {"thread_id": thread_id}}` para o LangGraph
- [x] Passar a config na execução do chain
- [x] Manter toda funcionalidade atual intacta

**🧪 CHECKPOINT 1.2: Teste de Thread ID Básico** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Testar mensagem sem `thread_id` → deve gerar automaticamente
- [x] ✅ Testar mensagem com `thread_id` específico → deve usar o fornecido
- [x] ✅ Confirmar que funcionalidade atual não foi quebrada (mensagens funcionam)
- [x] ✅ Verificar logs do backend para ver `thread_id` sendo processado
- [x] ✅ Usar SQLite browser para confirmar threads separadas no banco

**✅ Resultados do CHECKPOINT 1.2:**
- 🧵 **Thread ID gerado automaticamente**: `thread_default_user_72e98192`
- 🔧 **Configuração LangGraph**: Thread config passada corretamente na execução
- ✅ **Funcionalidade preservada**: Sistema anterior funciona normalmente
- 📊 **Logs funcionais**: Thread ID visível nos logs do backend e frontend
- 🗄️ **SQLite funcional**: Threads separadas persistidas no banco de dados

##### **1.3 Enriquecimento do Debug Info**
- [x] Adicionar `thread_id` ao `debug_info` retornado
- [x] Gerar `message_id` único para cada mensagem (timestamp ou UUID)
- [x] Incluir número sequencial da mensagem na thread
- [x] Preparar estrutura para futura informação de fluxo multi-agente
- [x] Manter compatibilidade com frontend atual

**🧪 CHECKPOINT 1.3: Teste de Debug Info Enriquecido** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Verificar se `debug_info` agora inclui `thread_id` na resposta
- [x] ✅ Confirmar que `message_id` é único a cada mensagem
- [x] ✅ Testar que número sequencial incrementa corretamente (1, 2, 3...)
- [x] ✅ Validar que frontend ainda exibe métricas corretamente
- [x] ✅ Inspecionar resposta JSON completa no debug panel ou console

**✅ Resultados do CHECKPOINT 1.3:**
- 🧵 **Thread ID no debug_info**: Incluído corretamente em todas as respostas
- 🆔 **Message ID único**: Gerado automaticamente para cada mensagem
- 📊 **Debug info enriquecido**: Estrutura preparada para expansão futura
- ✅ **Compatibilidade frontend**: Interface continua funcionando perfeitamente
- 🔍 **JSON inspecionável**: Debug panel exibe todas as métricas corretamente

##### **1.4 Endpoint para Nova Thread**
- [x] Criar endpoint `POST /chat/new-thread` que retorna novo `thread_id`
- [x] Implementar lógica de limpeza/reset se necessário
- [x] Adicionar headers opcionais para `thread_id` em `/chat/invoke`
- [x] Documentar novos parâmetros e respostas

**🧪 CHECKPOINT 1.4: Teste de Endpoint Nova Thread** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Testar endpoint `/chat/new-thread` via Postman ou curl
- [x] ✅ Verificar se retorna `thread_id` válido no formato esperado
- [x] ✅ Confirmar que endpoint `/chat/invoke` aceita `thread_id` no header
- [x] ✅ Testar fluxo: nova thread → mensagem → resposta com metrics corretos
- [x] ✅ Validar que diferentes `thread_ids` mantêm conversas separadas

**✅ Resultados do CHECKPOINT 1.4:**
- 🌐 **Endpoint `/chat/new-thread`**: Implementado e funcional
- 🧵 **Thread ID automático**: Frontend cria thread automaticamente na primeira mensagem
- 🔄 **Thread management**: Frontend mantém thread_id entre mensagens
- 💾 **Persistência funcional**: Conversas separadas por thread mantidas no SQLite
- 🧠 **Memória de conversa**: Segunda mensagem lembrou da primeira (teste confirmado)

#### **🎨 PARTE 2: Frontend - UI para Threading**

##### **2.1 Interface de Nova Conversa**
- [x] Adicionar botão "Nova Conversa" no header ao lado do título "Lina"
- [x] Implementar visual clean com ícone + texto
- [x] Posicionar de forma não obstrutiva mas acessível
- [x] Estilizar seguindo design system existente (azul primário)

**🧪 CHECKPOINT 2.1: Teste de Botão Nova Conversa** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Verificar se botão aparece corretamente no header
- [x] ✅ Testar se clique no botão executa função (mesmo que vazia inicialmente)
- [x] ✅ Confirmar que layout não quebrou com adição do botão
- [x] ✅ Validar que estilo segue design system (cores, espaçamento)
- [x] ✅ Testar responsividade em mobile (botão ainda acessível)

**✅ Resultados do CHECKPOINT 2.1:**
- 🎨 **Botão implementado**: Visual clean com ícone 🔄 e texto "Nova Conversa"
- 🎯 **Posicionamento**: Header entre título e status, não obstrutivo
- 🎨 **Design system**: Azul primário, hover effects, responsividade mobile
- ⚡ **Funcionalidade**: Event listener configurado, função startNewConversation implementada
- ⌨️ **Atalho**: Ctrl/Cmd+N para nova conversa
- 📱 **Mobile**: Texto oculto em telas pequenas (só ícone)

##### **2.2 Display de Thread Info**
- [x] Criar área discreta no header mostrando `thread_id` atual
- [x] Formatar ID de forma user-friendly (ex: "Thread: abc123")
- [x] Implementar visual integrado ao design system
- [x] Tornar visível mas não proeminente
- [x] Responsividade mobile (ocultar emoji em telas pequenas)

**🧪 CHECKPOINT 2.2: Teste de Display Thread ID** ✅ **CONCLUÍDO (16/06/2025)**
- [x] ✅ Verificar se `thread_id` aparece no header após primeira mensagem
- [x] ✅ Confirmar formato user-friendly (não UUID bruto)
- [x] ✅ Testar que thread ID muda quando backend gera novo
- [x] ✅ Validar que área não interfere com outros elementos do header
- [x] ✅ Testar funcionalidade de reset (desaparece com Nova Conversa)

**✅ Resultados do CHECKPOINT 2.2:**
- 🎨 **Thread ID exibido**: Format user-friendly `🧵 b728dbf3` (últimos 8 caracteres hex)
- 🔄 **Reset funcional**: Thread ID desaparece corretamente ao clicar "Nova Conversa"
- 🆔 **IDs únicos**: Cada nova thread gera ID diferente (`16416d95` → `b728dbf3`)
- 📱 **Responsividade**: Design funciona em desktop e mobile
- ✅ **Integração**: Visual integrado ao design system sem interferir em outros elementos
- 🧵 **Threading funcional**: Backend cria threads separadas no SQLite corretamente

##### **2.3 Debug Panel - Reestruturação Expandível**
- [ ] **"📱 Última Mensagem"**: métricas da call atual (colapsível)
- [ ] **"📊 Sessão Atual"**: totais acumulados da thread (colapsível)
- [ ] **"📝 Histórico de Mensagens"**: lista expandível de todas as mensagens da thread atual
  - [ ] Cada mensagem mostra timestamp e resumo (ex: "14:30 - Pergunta sobre clima")
  - [ ] **Click para expandir** cada mensagem individual mostrando:
    - [ ] `message_id` completo
    - [ ] Request/response JSON formatado
    - [ ] Métricas detalhadas (custo, tokens prompt/completion, duração)
    - [ ] Modelo usado e configurações
    - [ ] Logs de execução (se disponíveis)
    - [ ] Status de sucesso/erro
- [ ] Manter seção "💻 Sistema" existente
- [ ] Scroll independente para o histórico de mensagens
- [ ] Busca/filtro no histórico (futuro)

**🧪 CHECKPOINT 2.3a: Teste de Seções Básicas do Debug Panel**
- [ ] ✅ Verificar que seção "Última Mensagem" funciona como antes
- [ ] ✅ Testar que seção "Sessão Atual" acumula corretamente
- [ ] ✅ Confirmar que seção "Sistema" ainda funciona
- [ ] ✅ Validar que layout das seções não quebrou
- [ ] ✅ Testar colapso/expansão das seções se implementado

**🧪 CHECKPOINT 2.3b: Teste de Histórico Expandível**
- [ ] ✅ Verificar se nova seção "Histórico de Mensagens" aparece
- [ ] ✅ Testar se mensagens são adicionadas à lista após cada envio
- [ ] ✅ Confirmar que timestamp e resumo aparecem corretamente
- [ ] ✅ Testar click para expandir/colapsar mensagem individual
- [ ] ✅ Validar que JSON é exibido formatado quando expandido
- [ ] ✅ Testar scroll independente se histórico for longo

##### **2.4 Lógica de Reset e Tracking**
- [ ] Implementar função para limpar chat visual
- [ ] Criar função para reset de métricas da sessão
- [ ] **Limpar histórico expandível** ao criar nova thread
- [ ] Manter histórico de "última mensagem" sempre atualizado
- [ ] Gerenciar estado do `thread_id` atual no JavaScript
- [ ] Persistir estado de expansão das mensagens no localStorage

**🧪 CHECKPOINT 2.4: Teste de Reset e Tracking**
- [ ] ✅ Testar função de limpar chat (mensagens removidas visualmente)
- [ ] ✅ Verificar reset de métricas (sessão volta para zero)
- [ ] ✅ Confirmar que histórico expandível é limpo corretamente
- [ ] ✅ Testar que `thread_id` é atualizado no JavaScript após reset
- [ ] ✅ Validar persistência no localStorage (expansão de mensagens)

#### **🔄 PARTE 3: Integração e Fluxo**

##### **3.1 Fluxo de Nova Conversa**
- [ ] Usuário clica "Nova Conversa"
- [ ] Frontend chama endpoint `/chat/new-thread`
- [ ] Backend retorna novo `thread_id`
- [ ] Frontend limpa interface, reseta contadores **e limpa histórico expandível**
- [ ] Próxima mensagem usa o novo `thread_id`

**🧪 CHECKPOINT 3.1: Teste de Fluxo Nova Conversa Completo**
- [ ] ✅ Clicar "Nova Conversa" e verificar chamada à API no Network tab
- [ ] ✅ Confirmar que backend retorna `thread_id` válido
- [ ] ✅ Verificar que interface é limpa (chat vazio, métricas zeradas)
- [ ] ✅ Testar que `thread_id` é atualizado no header
- [ ] ✅ Enviar mensagem e confirmar que usa novo `thread_id`
- [ ] ✅ Validar que histórico expandível foi limpo completamente

##### **3.2 Fluxo de Mensagem com Threading**
- [ ] Usuário envia mensagem
- [ ] Frontend inclui `thread_id` atual (se existir)
- [ ] Backend processa com config de thread
- [ ] Retorna resposta + `debug_info` enriquecido
- [ ] Frontend atualiza "última mensagem" + soma na sessão **+ adiciona ao histórico expandível**

**🧪 CHECKPOINT 3.2: Teste de Fluxo Mensagem com Threading**
- [ ] ✅ Enviar mensagem e verificar que `thread_id` é incluído no request
- [ ] ✅ Confirmar que backend processa com thread correto
- [ ] ✅ Verificar que resposta inclui `debug_info` enriquecido
- [ ] ✅ Testar que debug panel atualiza todas as seções corretamente
- [ ] ✅ Validar que nova mensagem aparece no histórico expandível
- [ ] ✅ Confirmar que métricas da sessão acumulam corretamente

##### **3.3 Persistência Automática**
- [ ] Backend automaticamente salva estado da thread no SQLite
- [ ] Conversas ficam persistentes entre restarts do servidor
- [ ] Frontend pode recuperar `thread_id` via URL ou localStorage (futuro)
- [ ] Debug info mantém rastreabilidade completa **com histórico por mensagem**

**🧪 CHECKPOINT 3.3: Teste de Persistência Automática**
- [ ] ✅ Enviar várias mensagens e verificar que são salvas no SQLite
- [ ] ✅ Reiniciar backend e confirmar que dados persistem
- [ ] ✅ Testar múltiplas threads e verificar separação no banco
- [ ] ✅ Validar que todos os `debug_info` são mantidos
- [ ] ✅ Confirmar rastreabilidade completa por `message_id`

#### **📊 PARTE 4: Validação e Testes**

##### **4.1 Testes de Threading**
- [ ] Criar múltiplas conversas e verificar `thread_ids` únicos
- [ ] Testar persistência reiniciando backend
- [ ] Validar que conversas não "vazam" entre threads
- [ ] Confirmar que SQLite está sendo populado corretamente

**🧪 CHECKPOINT 4.1: Teste de Threading Robusto**
- [ ] ✅ Criar 3+ threads diferentes e confirmar IDs únicos
- [ ] ✅ Enviar mensagens em cada thread e verificar separação
- [ ] ✅ Reiniciar backend e testar se todas threads persistem
- [ ] ✅ Usar SQLite browser para inspecionar estrutura dos dados
- [ ] ✅ Testar "vazamento" enviando mensagem em thread A e verificando que não aparece em thread B

##### **4.2 Testes de Debug Panel**
- [ ] Verificar que "última mensagem" atualiza a cada call
- [ ] Confirmar que "sessão atual" acumula corretamente
- [ ] **Testar expansão/colapso de mensagens individuais**
- [ ] **Validar que histórico é limpo corretamente em nova thread**
- [ ] Testar reset de sessão com "Nova Conversa"
- [ ] Validar que `thread_id` é exibido corretamente

**🧪 CHECKPOINT 4.2: Teste de Debug Panel Completo**
- [ ] ✅ Enviar 5+ mensagens e verificar atualização de "última mensagem"
- [ ] ✅ Confirmar acúmulo correto em "sessão atual" (custo, tokens, tempo)
- [ ] ✅ Testar expansão de 3+ mensagens no histórico
- [ ] ✅ Criar nova thread e verificar que histórico foi limpo
- [ ] ✅ Testar todas funcionalidades de reset
- [ ] ✅ Validar exibição correta do `thread_id` em todas situações

##### **4.3 Testes de Performance**
- [ ] Comparar tempos de resposta antes/depois do threading
- [ ] Verificar que SQLite não adiciona latência perceptível
- [ ] **Testar performance com histórico longo (50+ mensagens)**
- [ ] Testar com múltiplas threads simultâneas
- [ ] Monitorar crescimento do arquivo SQLite

**🧪 CHECKPOINT 4.3: Teste de Performance Final**
- [ ] ✅ Medir tempo de resposta médio e comparar com baseline anterior
- [ ] ✅ Verificar que latência adicional < 200ms
- [ ] ✅ Enviar 50+ mensagens e medir performance da interface
- [ ] ✅ Testar 3+ threads simultâneas (abas diferentes ou scripts)
- [ ] ✅ Monitorar tamanho do arquivo SQLite e growth rate
- [ ] ✅ Confirmar que performance não degrada com histórico longo

#### **🎯 PARTE 5: Preparação para Futuro**

##### **5.1 Estrutura Extensível**
- [ ] Preparar `debug_info` para futuros campos multi-agente
- [ ] Documentar estrutura de dados para próximas iterações
- [ ] Manter compatibilidade backward para não quebrar durante evolução
- [ ] Comentar código pensando na expansão futura

##### **5.2 Logging e Observabilidade**
- [ ] Adicionar logs detalhados de criação/uso de threads
- [ ] Implementar tracking de performance do checkpointing
- [ ] Preparar métricas para análise posterior
- [ ] Manter compatibilidade com LangSmith tracing

#### **✅ Critérios de Sucesso**

**Backend:**
- [ ] SQLite criado e populado automaticamente
- [ ] `Thread_id` gerado e gerenciado corretamente
- [ ] `Debug_info` enriquecido com metadados de thread
- [ ] Compatibilidade mantida com frontend atual

**Frontend:**
- [ ] Botão "Nova Conversa" funcional e bem integrado
- [ ] `Thread_id` visível de forma discreta
- [ ] Debug panel separando "última mensagem" vs "sessão" **vs "histórico expandível"**
- [ ] **Cada mensagem individual pode ser expandida com detalhes técnicos completos**
- [ ] Reset de interface funcionando perfeitamente

**Integração:**
- [ ] Fluxo completo de nova thread + mensagens funcionando
- [ ] Persistência entre restarts do backend
- [ ] Performance mantida ou melhorada
- [ ] Base preparada para evolução multi-agente

#### **🎨 Mockup da Interface Final - Debug Panel Expandível**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Lina - Assistente Pessoal    Thread: abc123    [🔄 Nova Conversa]  🟢 Conectada │
└──────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┬────────────────────────────┐
│  CHAT PRINCIPAL                                 │  🔍 DEBUG                  │
│                                                 │                            │
│  💬 Usuário: "Oi Lina!"                        │  📱 Última Mensagem        │
│      20:05                                      │  ┌──────────────────────┐   │
│                                                 │  │ ⏱️ TEMPO: 1.2s       │   │
│  🤖 Lina: "Oi! Como posso ajudar?"            │  │ 💰 CUSTO: $0.000088  │   │
│      20:05                                      │  │ 🎯 TOKENS: 189       │   │
│                                                 │  │ 🤖 MODELO: gemini    │   │
│  💬 Usuário: "Qual a previsão do tempo?"       │  │ 📧 MSG_ID: msg_003   │   │
│      20:06                                      │  └──────────────────────┘   │
│                                                 │                            │
│  🤖 Lina: "Vou verificar a previsão..."       │  📊 Sessão Atual           │
│      20:06                                      │  ┌──────────────────────┐   │
│                                                 │  │ 💚 TOTAL: $0.000451  │   │
│  💬 Usuário: "Agenda reunião para amanhã"      │  │ 📈 MENSAGENS: 4      │   │
│      20:07                                      │  │ 🔵 TOKENS: 908       │   │
│                                                 │  │ 🕐 TEMPO: 8.2s       │   │
│  🤖 Lina: "Verificando sua agenda..."          │  │ 💾 THREAD: abc123    │   │
│      20:07                                      │  └──────────────────────┘   │
│                                                 │                            │
│  ┌─────────────────────────────────────────┐   │  📝 Histórico Expandível   │
│  │ Digite sua mensagem...                  │   │  ┌──────────────────────┐   │
│  └─────────────────────────────────────────┘   │  │ ▼ 20:07 Agenda reunião│   │
│                                    [📤 Enviar] │  │   msg_004 • $0.00012 │   │
│                                                 │  │   ⏱️ 2.1s 🎯 203t    │   │
│                                                 │  │   📤 Request JSON... │   │
│                                                 │  │   📥 Response JSON..│   │
│                                                 │  │                      │   │
│                                                 │  │ ▶ 20:06 Previsão tempo│  │
│                                                 │  │   msg_003 • $0.00009 │   │
│                                                 │  │                      │   │
│                                                 │  │ ▶ 20:05 Cumprimento  │   │
│                                                 │  │   msg_002 • $0.00006 │   │
│                                                 │  │                      │   │
│                                                 │  │ ▶ 20:05 Oi Lina     │   │
│                                                 │  │   msg_001 • $0.00004 │   │
│                                                 │  └──────────────────────┘   │
│                                                 │                            │
│                                                 │  💻 Sistema                │
│                                                 │  ┌──────────────────────┐   │
│                                                 │  │ 🟢 BACKEND: Online   │   │
│                                                 │  │ 🗄️ DB: 4 threads     │   │
│                                                 │  │ 🔗 LANGSMITH: Ativo │   │
│                                                 │  └──────────────────────┘   │
└─────────────────────────────────────────────────┴────────────────────────────┘
```

#### **🔍 Detalhamento do "Histórico Expandível"**

**Estado Colapsado (▶):**
```
▶ 20:06 Previsão do tempo
  msg_003 • $0.000088 • ⏱️ 1.8s • 🎯 156t
```

**Estado Expandido (▼):**
```
▼ 20:06 Previsão do tempo  
  msg_003 • $0.000088 • ⏱️ 1.8s • 🎯 156t
  ┌─────────────────────────────────────────┐
  │ 📤 REQUEST:                             │
  │ {                                       │
  │   "input": "Qual a previsão do tempo?" │
  │   "thread_id": "abc123"                 │
  │ }                                       │
  │                                         │
  │ 📥 RESPONSE:                            │
  │ {                                       │
  │   "output": "Vou verificar...",         │
  │   "debug_info": {                       │
  │     "cost": 0.000088,                   │
  │     "tokens_used": 156,                 │
  │     "prompt_tokens": 89,                │
  │     "completion_tokens": 67,            │
  │     "duration": 1.847,                  │
  │     "model_name": "gemini-2.5-flash",   │
  │     "message_id": "msg_003",            │
  │     "thread_id": "abc123",              │
  │     "message_sequence": 3               │
  │   }                                     │
  │ }                                       │
  │                                         │
  │ ✅ Status: Success                      │
  │ 🕐 Timestamp: 2025-06-16T20:06:15Z     │
  └─────────────────────────────────────────┘
```

#### **🚀 Preparação para Multi-Agente (Futuro)**
O debug panel expandido pode evoluir para mostrar fluxo entre instâncias:
```
▼ 20:07 Agenda reunião complexa
  msg_004 • $0.000180 • ⏱️ 3.2s • 🎯 312t
  ┌─────────────────────────────────────────┐
  │ 🔄 Fluxo Multi-Agente Detalhado:        │
  │ ├─ 🎭 Lina-Front: 0.8s (interpretação)  │
  │ ├─ 🧠 Lina-Memory: 0.3s (contexto)     │
  │ └─ 🛠️ Lina-Tools: 2.1s (Google Cal)    │
  │                                         │
  │ 📡 MCPs Chamados:                       │
  │ ├─ gmail.read_emails() → 0.4s           │
  │ ├─ calendar.list_events() → 0.6s        │
  │ └─ calendar.create_event() → 1.1s       │
  │                                         │
  │ 📊 Breakdown de Custos:                 │
  │ ├─ Front: $0.000034 (89t)              │
  │ ├─ Memory: $0.000021 (54t)             │
  │ └─ Tools: $0.000125 (169t)             │
  └─────────────────────────────────────────┘
```

---

### **Tarefa 1.4: Primeiro Agente "Lina-Front" Básico**

**Status: 🟡 PARCIALMENTE CONCLUÍDO** - Base implementada, ferramentas pendentes.

#### **Checklist Técnico**
- [x] Definição da personalidade base
- [x] Implementação do agente base com OpenRouter
- [x] Sistema de respostas estruturadas
- [x] Model fallback automático
- [ ] Implementar ferramentas básicas:
  - [ ] Busca web (via MCP WebSearch)
  - [ ] Calculadora
  - [ ] Informações de tempo/data
- [ ] Tratamento de erros avançado
- [ ] Testes unitários para funcionalidades

#### **Funcionalidades Core**
- [x] Conversação natural
- [x] Personalidade consistente
- [ ] Execução de pesquisas web
- [ ] Cálculos simples
- [ ] Informações de tempo/data

#### **Entregáveis**
- [x] Agente Lina-Front funcional para conversação básica
- [x] Personalidade consistente
- [ ] Ferramentas básicas operacionais
- [ ] Testes automatizados

---

## 🏗️ **FASE 2: Arquitetura Multi-Instância**

### **Tarefa 2.1: Design da Comunicação Inter-Instâncias**

#### **Checklist Técnico**
- [ ] Definição de message schemas
- [ ] Protocolos de handoff
- [ ] Message routing via LangGraph
- [ ] Sistema de acknowledgment
- [ ] Error handling entre instâncias

#### **Entregáveis**
- [ ] Documentação de protocolos
- [ ] Message schemas definidos
- [ ] Routing básico implementado

---

### **Tarefa 2.2: Implementação Lina-Memory Base**

#### **Checklist Técnico**
- [ ] Schema do banco SQLite
- [ ] Sistema de logging automático
- [ ] Tracking de costs/performance
- [ ] APIs para consulta histórica
- [ ] Sistema de sumarização

#### **Entregáveis**
- [ ] Instância Memory funcional
- [ ] Banco de dados estruturado
- [ ] APIs de consulta operacionais

---

### **Tarefa 2.3: Implementação Lina-Tools Base**

#### **Checklist Técnico**
- [ ] Framework para MCPs
- [ ] MCP para file system
- [ ] MCP para web search
- [ ] Task execution tracking
- [ ] Sistema de monitoring básico

#### **Entregáveis**
- [ ] Instância Tools funcional
- [ ] Framework MCP implementado
- [ ] MCPs básicos operacionais

---

### **Tarefa 2.4: Integração das Três Instâncias**

#### **Checklist Técnico**
- [ ] LangGraph workflow completo
- [ ] Handoffs inteligentes
- [ ] Testing end-to-end
- [ ] Performance optimization
- [ ] Error recovery

#### **Entregáveis**
- [ ] Sistema integrado funcional
- [ ] Três instâncias comunicando
- [ ] Fluxos end-to-end validados

---

## 🔌 **FASE 3: MCPs e Funcionalidades Core**

### **Tarefa 3.1: MCP Google Workspace**

#### **Checklist Técnico**
- [ ] OAuth2 setup
- [ ] Gmail Integration (ler/enviar emails)
- [ ] Calendar Integration (eventos/agendamento)
- [ ] Drive Integration (arquivos/organização)

#### **Entregáveis**
- [ ] MCP Google Workspace completo
- [ ] Autenticação OAuth2 funcional
- [ ] Todas funcionalidades testadas

---

### **Tarefa 3.2: MCP WhatsApp**

#### **Checklist Técnico**
- [ ] WhatsApp Web API setup
- [ ] Autenticação via QR code
- [ ] Sending/Receiving Messages
- [ ] Contact management

#### **Entregáveis**
- [ ] MCP WhatsApp funcional
- [ ] Comunicação bidirecional
- [ ] Multi-channel experience

---

### **Tarefa 3.3: MCP Sistema Operacional**

#### **Checklist Técnico**
- [ ] File Operations
- [ ] Application Launching
- [ ] System Monitoring
- [ ] Safety Measures

#### **Entregáveis**
- [ ] MCP OS funcional e seguro
- [ ] Operações básicas de sistema
- [ ] Safety measures implementadas

---

### **Tarefa 3.4: Testing e Refinamento**

#### **Checklist de Testes**
- [ ] Unit Tests para cada MCP
- [ ] Integration Tests entre MCPs
- [ ] End-to-End Tests de workflows
- [ ] Performance Tests
- [ ] Security Tests

#### **Entregáveis**
- [ ] Suite de testes completa
- [ ] MCPs refinados e otimizados
- [ ] Documentação atualizada

---

## 🧠 **FASE 4: Inteligência e Proatividade**

### **Tarefa 4.1: Sistema de Monitoramento Proativo**

#### **Funcionalidades**
- [ ] Email Monitoring
- [ ] Calendar Monitoring
- [ ] System Monitoring
- [ ] Notifications Proativas

#### **Entregáveis**
- [ ] Sistema de monitoring ativo
- [ ] Notifications proativas funcionais
- [ ] Configurações customizáveis

---

### **Tarefa 4.2: Inteligência Contextual**

#### **Funcionalidades**
- [ ] Context Tracking
- [ ] Pattern Recognition
- [ ] Adaptive Suggestions

#### **Entregáveis**
- [ ] Context awareness funcional
- [ ] Suggestions relevantes
- [ ] Adaptive behavior

---

### **Tarefa 4.3: Sistema de Learning e Melhoria**

#### **Funcionalidades**
- [ ] Performance Analytics
- [ ] Pattern Analysis
- [ ] Auto-optimization

#### **Entregáveis**
- [ ] Learning engine funcional
- [ ] Auto-optimization ativo
- [ ] Performance metrics dashboard

---

### **Tarefa 4.4: Refinamento da Personalidade**

#### **Funcionalidades**
- [ ] Personality Consistency
- [ ] Contextual Adaptation
- [ ] Signature Behaviors

#### **Entregáveis**
- [ ] Personalidade consistente
- [ ] Behavioral guidelines documented
- [ ] User feedback integration

---

## ✨ **FASE 5: Polish e Optimization**

### **Tarefa 5.1: Optimization de Performance**
- [ ] Performance Profiling
- [ ] Caching Strategies
- [ ] Database Optimization
- [ ] LLM Call Optimization

### **Tarefa 5.2: Security e Safety Hardening**
- [ ] Input Validation
- [ ] Access Controls
- [ ] Data Protection
- [ ] Safety Measures

### **Tarefa 5.3: Documentation e Deployment Preparation**
- [ ] User Manual
- [ ] Technical Documentation
- [ ] Deployment Guide

### **Tarefa 5.4: Final Testing e Validation**
- [ ] End-to-End Testing
- [ ] Performance Validation
- [ ] User Acceptance Testing

---

## 📊 **Métricas de Sucesso**

### **Performance Técnica**
- ⏱️ Response time médio < 3 segundos
- 📈 Uptime > 99%
- ✅ Accuracy rate > 95%
- 💾 Memory usage < 2GB RAM

### **Cost Efficiency**
- 💰 Operating cost < $50/mês
- 💸 Cost per interaction < $0.10
- 📉 50% cost reduction target em 6 meses

### **User Experience**
- ⭐ User satisfaction > 4.5/5
- ✅ Task completion rate > 90%
- 🎯 Proactive notification relevance > 80%
- 🔄 User retention > 85% após 1 mês

### **Capabilities**
- 🔌 5+ MCPs integrados
- 🛠️ 20+ tipos de tarefas
- 📱 3+ plataformas (multi-channel)
- 🧠 Learning demonstrável

---

## 🎯 **Estado Atual do Projeto (16/06/2025)**

### **✅ Concluído**
- Ambiente de desenvolvimento configurado
- Interface web moderna HTML/CSS/JS funcional
- Backend LangServe operacional
- Integração frontend-backend estável
- Debug panel com métricas em tempo real
- Personalidade base da Lina implementada
- Documentação da estrutura frontend

### **🟡 Em Progresso**
- Ferramentas básicas (busca web, calculadora, tempo/data)
- Testes unitários e de integração

### **⏳ Próximos Passos**
1. Implementar ferramentas básicas na Tarefa 1.4
2. Começar arquitetura multi-instância (Fase 2)
3. Implementar sistema de persistência SQLite
4. Desenvolver primeiros MCPs

---

*Este roadmap é atualizado conforme o projeto evolui. Cada tarefa inclui retrospective e lessons learned para melhorar as próximas fases.*
