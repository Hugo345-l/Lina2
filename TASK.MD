# Roadmap Detalhado - Projeto Lina v2.0
*Assistente Pessoal Multi-Agente com Arquitetura de Grafo Observável*

## 📋 Visão Geral da Refatoração

**Status**: Refatoração Profunda em Andamento  
**Foco**: Backend First, Grafo Robusto, Observabilidade Total  
**UI Inicial**: LangGraph Studio (nativo)  
**Tecnologias Core**: LangGraph + LangChain + OpenRouter + SQLite

---

## ⚙️ **FASE SETUP: Configuração do Ambiente LangGraph Studio** (1 dia)

### **Objetivo**
Configurar e validar o ambiente de desenvolvimento com LangGraph CLI e Studio antes de iniciar a implementação.

### **Tarefa SETUP.1: Instalação e Configuração Base**

#### **Instalação do LangGraph CLI**
- [x] Instalar LangGraph CLI com suporte in-memory:
  ```bash
  pip install "langgraph-cli[inmem]>=0.1.55"
  ```
- [x] Verificar instalação:
  ```bash
  langgraph --help
  ```
- [x] Configurar conta LangSmith (necessária para LangGraph Studio):
  - [x] Criar conta em https://smith.langchain.com
  - [x] Gerar API key no LangSmith
  - [x] Configurar variável de ambiente `LANGSMITH_API_KEY`

#### **Configuração do Projeto Teste**
- [x] Criar estrutura mínima de projeto:
  ```
  lina-setup-test/
  ├── simple_agent.py
  ├── langgraph.json
  ├── requirements.txt
  └── .env
  ```
- [x] Implementar grafo mínimo funcional em `simple_agent.py`:
  - [x] Estado simples com mensagens
  - [x] Nó único que responde "Hello from LangGraph!"
  - [x] Compilação do grafo
- [x] Criar `langgraph.json` básico:
  ```json
  {
    "dependencies": ["."],
    "graphs": {
      "test_agent": "./simple_agent.py:graph"
    },
    "env": ".env"
  }
  ```
- [x] Configurar `.env` com:
  ```
  LANGSMITH_API_KEY=sua_api_key_aqui
  ```

### **Tarefa SETUP.2: Validação do LangGraph Studio**

#### **Teste do Servidor Local**
- [x] Executar servidor de desenvolvimento com `langgraph dev`.
- [x] Executar servidor de desenvolvimento com `langgraph up` (usando Docker).
- [x] Verificar se ambos os servidores iniciam corretamente.
- [x] Confirmar que o grafo é carregado sem erros em ambas as abordagens.

#### **Teste do LangGraph Studio Web**
- [x] Acessar LangGraph Studio e conectar aos servidores locais.
- [x] Fazer login com conta LangSmith.
- [x] Verificar se o grafo aparece na interface.
- [x] Testar execução do grafo.

### **Tarefa SETUP.3: Exploração das Funcionalidades**

#### **Teste de Funcionalidades Core**
- [x] **Visualização**: Confirmado que o grafo aparece visualmente.
- [x] **Execução**: Confirmado, com inputs de teste e verificação de outputs.
- [x] **Debug**: Funcionalidades de interrupção e passo-a-passo validadas.
- [x] **Estado**: Inspeção de estado entre nós validada.
- [x] **Threading**: Criação e alternância entre threads validada.
- [x] **Configuração**: Edição de configurações validada.

### **Tarefa SETUP.4: Documentação e Preparação**

#### **Documentação dos Achados**
- [x] Criar `SETUP_NOTES.md` documentando:
  - [x] Processo de instalação e configuração
  - [x] Estrutura mínima necessária do projeto
  - [x] Funcionalidades disponíveis no Studio
  - [x] Limitações identificadas
  - [x] Diferenças entre `langgraph dev` vs `langgraph up`
  - [x] Best practices para desenvolvimento

### **Critérios de Sucesso**
- [x] LangGraph CLI instalado e funcionando.
- [x] Servidor local (`dev` e `up`) iniciando sem erros.
- [x] LangGraph Studio acessível e funcional.
- [x] Grafo de teste executando corretamente.
- [x] Todas as funcionalidades core validadivas.
- [x] Documentação completa do setup.
- [x] Ambiente pronto para desenvolvimento do projeto principal.


---

## 🎯 **FASE 0: Preparação e Aprendizado** (2-3 dias)

### **Objetivo**
Entender profundamente LangGraph e validar conceitos antes de implementar.

### **Tarefa 0.1: Estudo Dirigido do LangGraph**
- [x] Estudar exemplos oficiais:
  - [x] [Multi-agent supervisor pattern](https://github.com/langchain-ai/langgraph/tree/main/examples/multi_agent)
  - [x] [ReAct agent implementation](https://github.com/langchain-ai/langgraph/tree/main/examples/react)
  - [x] [Human-in-the-loop patterns](https://github.com/langchain-ai/langgraph/tree/main/examples/human_in_the_loop)
- [x] Entender sistema de checkpoints e recuperação de estado
- [x] Explorar capacidades do LangGraph Studio
- [x] Documentar insights e padrões úteis

### **Tarefa 0.2: Prototipagem Conceitual**
- [ ] Criar `experiments/grafo_conceitual.py` com:
  - [ ] Grafo mínimo com 3 nós (Front, Memory, Tools)
  - [ ] Estado compartilhado simples
  - [ ] Roteamento básico entre nós
  - [ ] Logging detalhado de execução
- [ ] Validar no LangGraph Studio:
  - [ ] Visualização do grafo
  - [ ] Inspeção de estados
  - [ ] Timeline de execução
- [ ] Documentar aprendizados em `experiments/LEARNINGS.md`

---

## 🏗️ **FASE 1: Fundação do Grafo Multi-Agente** (1 semana)

### **Objetivo**
Construir a estrutura base do grafo com as três instâncias como conjuntos de nós especializados.

### **Tarefa 1.1: Arquitetura Base do Grafo**

#### **Implementação do Estado Unificado**
```python
# lina-backend/core/state.py
class LinaState(TypedDict):
    # Estados compartilhados
    messages: List[BaseMessage]
    current_user_intent: Dict
    thread_id: str
    user_id: str
    
    # Estados específicos
    front_context: Dict
    memory_context: Dict
    tool_context: Dict
    
    # Observabilidade
    execution_path: List[str]
    decisions: List[Dict]
    node_metrics: Dict[str, Dict]
    total_cost: float
    total_tokens: int
```

#### **Checklist**
- [ ] Criar estrutura de diretórios:
  ```
  lina-backend/
  ├── core/
  │   ├── state.py
  │   ├── nodes/
  │   │   ├── supervisor.py
  │   │   ├── front/
  │   │   ├── memory/
  │   │   └── tools/
  │   └── graph.py
  ├── mcps/
  ├── utils/
  └── main.py
  ```
- [ ] Implementar `LinaState` com tipagem completa
- [ ] Criar sistema de logging estruturado
- [ ] Configurar LangSmith tracing

### **Tarefa 1.2: Supervisor e Roteamento**

#### **Implementação**
- [ ] `supervisor_node`: Analisa intent e roteia
- [ ] Sistema de decisão com reasoning explícito
- [ ] Múltiplos caminhos possíveis:
  - [ ] Fast path (Front only)
  - [ ] Context path (Front → Memory → Front)
  - [ ] Action path (Front → Tools → Front)
  - [ ] Full path (Front → Memory → Tools → Front)

#### **Critérios de Decisão**
```python
def routing_decision(intent: Dict) -> str:
    """
    Retorna próximo nó baseado em:
    - Complexidade da tarefa
    - Necessidade de contexto histórico
    - Necessidade de ações externas
    - Preferências do usuário
    """
```

### **Tarefa 1.3: Nós da Lina-Front**

#### **Nós a Implementar**
- [ ] `front_interpreter`: Extração de intent e entities
- [ ] `quick_responder`: Respostas rápidas sem LLM
- [ ] `context_enricher`: Adiciona contexto da conversa atual
- [ ] `response_formatter`: Formata resposta final

#### **Ferramentas do Front**
- [ ] Calculadora simples
- [ ] Conversor de unidades
- [ ] Data/hora atual
- [ ] FAQ estático

### **Tarefa 1.4: Nós da Lina-Memory**

#### **Nós a Implementar**
- [ ] `memory_searcher`: Busca vetorial em histórico
- [ ] `pattern_analyzer`: Identifica padrões de uso
- [ ] `context_distiller`: Resume contexto relevante
- [ ] `memory_writer`: Salva novas memórias

#### **Setup Inicial**
- [ ] Configurar FAISS para vector store local
- [ ] Implementar sistema de embeddings
- [ ] Criar índices básicos

### **Tarefa 1.5: Nós da Lina-Tools**

#### **Nós a Implementar**
- [ ] `tool_selector`: Escolhe ferramenta apropriada
- [ ] `tool_executor`: Executa via MCP
- [ ] `result_validator`: Valida resultados
- [ ] `progress_reporter`: Reporta progresso de tarefas longas

#### **Preparação para MCPs**
- [ ] Interface abstrata para MCPs
- [ ] Sistema de registro de ferramentas
- [ ] Error handling robusto

### **Tarefa 1.6: Integração e Testes**

#### **Validações**
- [ ] Fluxo Fast Path funcionando
- [ ] Handoffs entre nós sem perda de contexto
- [ ] Estado consistente através do fluxo
- [ ] Métricas por nó sendo coletadas
- [ ] Visualização correta no LangGraph Studio

---

## 🔧 **FASE 2: MCPs Elementares** (1 semana)

### **Objetivo**
Implementar ferramentas básicas que demonstram capacidades de cada instância.

### **Tarefa 2.1: MCP Sistema de Arquivos**

#### **Funcionalidades**
- [ ] Listar arquivos em diretório
- [ ] Ler conteúdo de arquivo
- [ ] Criar arquivo com conteúdo
- [ ] Mover/renomear arquivos
- [ ] Buscar arquivos por padrão

#### **Segurança**
- [ ] Sandbox em diretório específico
- [ ] Validação de paths
- [ ] Limites de tamanho
- [ ] Tipos de arquivo permitidos

### **Tarefa 2.2: MCP Pesquisa Web**

#### **Funcionalidades**
- [ ] Buscar via DuckDuckGo API
- [ ] Extrair conteúdo de páginas
- [ ] Resumir resultados
- [ ] Cache de resultados

#### **Implementação**
- [ ] Rate limiting
- [ ] User agent apropriado
- [ ] Parsing robusto de HTML

### **Tarefa 2.3: MCP Tempo e Calendário**

#### **Funcionalidades Front (leves)**
- [ ] Data/hora atual
- [ ] Conversão de timezones
- [ ] Cálculos de data simples

#### **Funcionalidades Tools (complexas)**
- [ ] Criar eventos (mock inicial)
- [ ] Listar eventos
- [ ] Verificar disponibilidade

### **Tarefa 2.4: MCP Memória Local**

#### **Funcionalidades**
- [ ] Salvar conversa com embeddings
- [ ] Busca por similaridade
- [ ] Estatísticas de uso
- [ ] Exportar/importar memórias

### **Tarefa 2.5: Integração com Grafo**

#### **Implementação**
- [ ] Registrar MCPs nos nós apropriados
- [ ] Testar fluxos completos com ferramentas
- [ ] Ajustar roteamento baseado em ferramentas disponíveis
- [ ] Validar no LangGraph Studio

---

## 🧠 **FASE 3: Inteligência e Observabilidade** (2 semanas)

### **Objetivo**
Adicionar capacidades avançadas de memória e melhorar observabilidade.

### **Tarefa 3.1: Sistema de Memória Avançado**

#### **Implementações**
- [ ] Memória episódica (conversas completas)
- [ ] Memória semântica (conceitos e relações)
- [ ] Memória procedural (como fazer tarefas)
- [ ] Sistema de esquecimento (relevância temporal)

### **Tarefa 3.2: Análise de Padrões**

#### **Funcionalidades**
- [ ] Identificar horários preferenciais
- [ ] Detectar tarefas recorrentes
- [ ] Aprender preferências implícitas
- [ ] Gerar insights automáticos

### **Tarefa 3.3: Observabilidade Aprimorada**

#### **Implementações**
- [ ] Custom callbacks para LangSmith
- [ ] Métricas detalhadas por nó:
  - [ ] Latência
  - [ ] Tokens usados
  - [ ] Decisões tomadas
  - [ ] Confiança nas decisões
- [ ] Sistema de replay de execuções
- [ ] Exportação de traces para análise

### **Tarefa 3.4: Otimização de Performance**

#### **Melhorias**
- [ ] Cache inteligente de respostas
- [ ] Pré-computação de embeddings
- [ ] Roteamento otimizado por custo
- [ ] Execução paralela onde possível

---

## 🎨 **FASE 4: Interface Customizada** (quando grafo maduro)

### **Objetivo**
Criar interface específica para necessidades além do LangGraph Studio.

### **Tarefa 4.1: API de Observabilidade**

#### **Endpoints**
- [ ] `GET /execution/{id}/timeline`
- [ ] `GET /execution/{id}/state/{node}`
- [ ] `GET /execution/{id}/decisions`
- [ ] `GET /threads/{user_id}`
- [ ] `WebSocket /execution/live`

### **Tarefa 4.2: Frontend de Debug Avançado**

#### **Componentes**
- [ ] Timeline vertical interativa
- [ ] Visualização de grafo (D3.js/Mermaid)
- [ ] Inspetor de estado por nó
- [ ] Replay de execuções
- [ ] Comparação entre execuções

### **Tarefa 4.3: Analytics Dashboard**

#### **Métricas**
- [ ] Uso por tipo de fluxo
- [ ] Custo por usuário/período
- [ ] Taxa de sucesso por tipo de tarefa
- [ ] Padrões de uso temporal

---

## 📊 **Métricas de Validação por Fase**

### **Fase 1 - Fundação**
- [ ] Grafo com 10+ nós funcionando
- [ ] 4 tipos de fluxo implementados
- [ ] Estado consistente em todos os fluxos
- [ ] Traces completos no LangSmith

### **Fase 2 - MCPs**
- [ ] 4 MCPs funcionais
- [ ] 20+ operações disponíveis
- [ ] Taxa de sucesso > 95%
- [ ] Documentação completa de cada MCP

### **Fase 3 - Inteligência**
- [ ] 1000+ memórias armazenadas em testes
- [ ] Busca semântica < 100ms
- [ ] 5+ tipos de padrões detectados
- [ ] Redução de 30% no custo via otimização

### **Fase 4 - Interface**
- [ ] Timeline completa de execuções
- [ ] Visualização de grafo funcional
- [ ] Analytics em tempo real
- [ ] Export de dados para análise

---

## 🚫 **Anti-Padrões a Evitar**

1. **Não começar pela UI** - Backend primeiro!
2. **Não criar nós sem observabilidade** - Cada nó deve ser rastreável
3. **Não otimizar prematuramente** - Funcionalidade antes de performance
4. **Não acoplar nós desnecessariamente** - Manter modularidade
5. **Não pular testes no LangGraph Studio** - Validar cada etapa

---

## 📅 **Timeline Estimada**

- **Dia 1**: Fase SETUP completa
- **Semana 1**: Fase 0 + Início Fase 1
- **Semana 2**: Conclusão Fase 1 + Início Fase 2
- **Semana 3**: Conclusão Fase 2
- **Semanas 4-5**: Fase 3 completa
- **Semana 6+**: Fase 4 (se necessário)

---

## ✅ **Definition of Done**

Cada tarefa só está completa quando:
1. Código implementado e funcionando
2. Testes escritos e passando
3. Documentação atualizada
4. Validado no LangGraph Studio
5. Métricas de observabilidade funcionando
6. Code review (mesmo que self-review) feito

---

*Este roadmap é um documento vivo e será atualizado conforme aprendemos mais sobre o sistema.*
