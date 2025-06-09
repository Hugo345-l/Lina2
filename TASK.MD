# Roadmap Detalhado - Projeto Lina
*Assistente Pessoal Multi-Agente*

## 📋 Visão Geral

**Orçamento**: $50/mês  
**Tecnologias Core**: LangGraph + LangChain + OpenRouter (Gemini/Claude/GPT) + SQLite

---

## 🏗️ **FASE 1: Fundação e Interface**

### **Tarefa 1.1: Setup do Ambiente de Desenvolvimento**

#### **Checklist Técnico**
- [x] Criar ambiente virtual Python 3.12
  ```bash
  python -m venv venv-lina
  source venv-lina/bin/activate  # Linux/Mac
  # venv-lina\Scripts\activate   # Windows
  ```
- [x] Instalar dependências base (via requirements.txt)
  ```bash
  pip install langchain langchain-openai langgraph langserve
  pip install sqlite3 python-dotenv pydantic
  ```
- [x] Criar arquivo .gitignore para proteger segredos e ignorar arquivos desnecessários.
- [x] Configurar OpenRouter
  - [x] Criar conta em https://openrouter.ai/ (Concluído pelo usuário)
  - [x] Gerar API key no dashboard (Concluído pelo usuário)
  - [x] Configurar `.env` file: (Concluído pelo usuário com a adição da OPENROUTER_API_KEY ao .env.keys)
    ```
    OPENROUTER_API_KEY=your_key_here
    ```
- [ ] Setup SQLite com WAL mode (Será configurado/verificado durante a implementação do checkpoint LangGraph)
- [x] Teste hello-world LangGraph com OpenRouter (Teste realizado com `test_openrouter.py` usando `google/gemini-2.5-flash-preview-05-20`)
  ```python
  from langchain_openai import ChatOpenAI
  
  llm = ChatOpenAI(
      model="google/gemini-2.5-flash-preview-05-20", # Modelo default da Lina
      openai_api_base="https://openrouter.ai/api/v1",
      openai_api_key="YOUR_OPENROUTER_KEY"
  )
  ```

#### **Entregáveis**
- ✅ Ambiente funcional com todas dependências (instaladas via requirements.txt)
- ✅ Arquivo .gitignore configurado.
- ✅ OpenRouter configurado e testado (Chave API adicionada pelo usuário ao .env.keys e comunicação com LLM validada)
- ✅ Teste básico LangGraph executando com múltiplos modelos (Validado via `test_openrouter.py`)
- [ ] Documentação de setup (Parcialmente coberto pelas ações no TASK.MD)

---

### **Tarefa 1.2: Implementação do Agent Chat UI**

#### **Checklist Técnico**
- [x] Clone do Agent Chat UI oficial
  ```bash
  git clone https://github.com/langchain-ai/agent-chat-ui
  cd agent-chat-ui
  npm install
  ```
- [x] Customização básica para "Lina"
  - [ ] Logo/branding (Minimizado para protótipo)
  - [ ] Cores e tema (Minimizado para protótipo)
  - [x] Texto de boas-vindas (Título alterado para "Lina")
- [x] Configuração de environment variables
- [ ] Teste de conexão com backend (Pendente da Tarefa 1.3)

#### **Entregáveis**
- [ ] Interface de chat funcional (Visualmente pronta, funcionalidade pendente do backend)
- [x] Branding "Lina" aplicado (Título alterado)
- [ ] Conexão com backend estabelecida (Pendente da Tarefa 1.3)

#### **Critérios de Sucesso**
- Interface carrega sem erros - OK
- Chat básico funcional - pendente backand
- Visual personalizado para Lina - (Minimizado para protótipo)

---

### **Tarefa 1.3: Backend LangServe Básico**

#### **Checklist Técnico**
- [ ] Estrutura básica do projeto
  ```
  lina-backend/
  ├── app.py
  ├── agents/
  ├── utils/
  ├── config/
  └── requirements.txt
  ```
- [ ] Servidor LangServe básico
- [ ] Endpoints essenciais
  - [ ] `/invoke` - Chamadas síncronas
  - [ ] `/stream` - Streaming responses
  - [ ] `/health` - Health check
- [ ] Integração LangSmith para observabilidade
- [ ] Configuração CORS para frontend

#### **Entregáveis**
- ✅ Servidor LangServe funcional
- ✅ Endpoints básicos operacionais
- ✅ Logging e observabilidade

#### **Testes**
- [ ] Teste de endpoints via curl/postman
- [ ] Verificação de logs LangSmith
- [ ] Conexão frontend-backend

---

### **Tarefa 1.4: Primeiro Agente "Lina-Front" Básico**

#### **Checklist Técnico**
- [ ] Definição da personalidade base
  ```python
  LINA_PERSONALITY = """
  Você é Lina, um assistente pessoal inteligente e proativo.
  Características:
  - Amigável mas profissional
  - Proativa em sugerir melhorias
  - Transparente sobre limitações
  - Focada em resolver problemas
  """
  ```
- [ ] Implementação do agente base com OpenRouter
  ```python
  from langchain_openai import ChatOpenAI
  
  # Model routing inteligente por task
  llm_conversational = ChatOpenAI(
      model="google/gemini-2.0-flash-exp",  # Para conversação
      openai_api_base="https://openrouter.ai/api/v1"
  )
  
  llm_reasoning = ChatOpenAI(
      model="anthropic/claude-3.5-sonnet",  # Para reasoning complexo
      openai_api_base="https://openrouter.ai/api/v1"
  )
  ```
- [ ] Ferramentas básicas
  - [ ] Web search
  - [ ] Calculator
  - [ ] Current time/date
- [ ] Sistema de responses estruturadas
- [ ] Tratamento de erros básico
- [ ] Model fallback automático

#### **Funcionalidades Core**
- [ ] Conversação natural
- [ ] Resposta a perguntas básicas
- [ ] Execução de pesquisas web
- [ ] Cálculos simples
- [ ] Informações de tempo/data

#### **Entregáveis**
- ✅ Agente Lina-Front funcional
- ✅ Personalidade consistente
- ✅ Ferramentas básicas operacionais

#### **Critérios de Sucesso**
- Conversas naturais e coerentes
- Execução correta de ferramentas
- Personalidade Lina perceptível

---

## 🏗️ **FASE 2: Arquitetura Multi-Instância**

### **Tarefa 2.1: Design da Comunicação Inter-Instâncias**

#### **Checklist Técnico**
- [ ] Definição de message schemas
  ```python
  class InterInstanceMessage:
      sender: str  # front/memory/tools
      recipient: str
      type: str  # query/response/notification
      content: dict
      timestamp: datetime
      correlation_id: str
  ```
- [ ] Protocolos de handoff
- [ ] Message routing via LangGraph
- [ ] Sistema de acknowledgment
- [ ] Error handling entre instâncias

#### **Padrões de Comunicação**
- [ ] Front → Memory (logging requests)
- [ ] Front → Tools (task execution)
- [ ] Tools → Memory (result logging)
- [ ] Memory → Front (context updates)

#### **Entregáveis**
- ✅ Documentação de protocolos
- ✅ Message schemas definidos
- ✅ Routing básico implementado

---

### **Tarefa 2.2: Implementação Lina-Memory Base**

#### **Checklist Técnico**
- [ ] Schema do banco SQLite
  ```sql
  CREATE TABLE conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      content TEXT,
      timestamp DATETIME,
      metadata JSON
  );
  
  CREATE TABLE system_metrics (
      id INTEGER PRIMARY KEY,
      metric_name TEXT,
      value REAL,
      timestamp DATETIME
  );
  ```
- [ ] Sistema de logging automático
- [ ] Tracking de costs/performance
- [ ] APIs para consulta histórica
- [ ] Sistema de sumarização

#### **Funcionalidades Core**
- [ ] Armazenar todas conversas
- [ ] Métricas de sistema
- [ ] Custos por operação
- [ ] Histórico de performance
- [ ] Context summaries

#### **Entregáveis**
- ✅ Instância Memory funcional
- ✅ Banco de dados estruturado
- ✅ APIs de consulta operacionais

---

### **Tarefa 2.3: Implementação Lina-Tools Base**

#### **Checklist Técnico**
- [ ] Framework para MCPs
  ```python
  class BaseMCP:
      def __init__(self, config):
          self.config = config
      
      async def execute(self, action, params):
          # Implementation
          pass
  ```
- [ ] MCP para file system
- [ ] MCP para web search
- [ ] Task execution tracking
- [ ] Sistema de monitoring básico

#### **MCPs Iniciais**
- [ ] **FileSystemMCP**: CRUD de arquivos
- [ ] **WebSearchMCP**: Pesquisas web
- [ ] **SystemMCP**: Info do sistema

#### **Entregáveis**
- ✅ Instância Tools funcional
- ✅ Framework MCP implementado
- ✅ MCPs básicos operacionais

---

### **Tarefa 2.4: Integração das Três Instâncias**

#### **Checklist Técnico**
- [ ] LangGraph workflow completo
- [ ] Handoffs inteligentes
- [ ] Testing end-to-end
- [ ] Performance optimization
- [ ] Error recovery

#### **Fluxos de Teste**
- [ ] User query → Front → Tools → Memory → Front → User
- [ ] Proactive notification flow
- [ ] Error handling flow
- [ ] Context persistence flow

#### **Entregáveis**
- ✅ Sistema integrado funcional
- ✅ Três instâncias comunicando
- ✅ Fluxos end-to-end validados

#### **Critérios de Sucesso**
- Comunicação fluida entre instâncias
- Latência < 5 segundos para tasks complexas
- Error recovery funcional

---

## 🔌 **FASE 3: MCPs e Funcionalidades Core**

### **Tarefa 3.1: MCP Google Workspace**

#### **Checklist Técnico**
- [ ] OAuth2 setup
  ```python
  from google.auth.transport.requests import Request
  from google.oauth2.credentials import Credentials
  from google_auth_oauthlib.flow import InstalledAppFlow
  ```
- [ ] **Gmail Integration**
  - [ ] Ler emails
  - [ ] Enviar emails
  - [ ] Filtros e busca
- [ ] **Calendar Integration**
  - [ ] Listar eventos
  - [ ] Criar eventos
  - [ ] Modificar eventos
- [ ] **Drive Integration**
  - [ ] Listar arquivos
  - [ ] Upload/download
  - [ ] Organização de pastas

#### **Funcionalidades Específicas**
- [ ] "Listar emails não lidos"
- [ ] "Agendar reunião para amanhã às 14h"
- [ ] "Encontrar apresentação do projeto X"
- [ ] "Enviar relatório por email"

#### **Entregáveis**
- ✅ MCP Google Workspace completo
- ✅ Autenticação OAuth2 funcional
- ✅ Todas funcionalidades testadas

---

### **Tarefa 3.2: MCP WhatsApp**

#### **Checklist Técnico**
- [ ] WhatsApp Web API setup
- [ ] Autenticação via QR code
- [ ] **Sending Messages**
  - [ ] Mensagens de texto
  - [ ] Imagens
  - [ ] Documentos
- [ ] **Receiving Messages**
  - [ ] Webhook setup
  - [ ] Message parsing
  - [ ] Contact identification

#### **Funcionalidades Específicas**
- [ ] Enviar lembretes via WhatsApp
- [ ] Receber comandos via WhatsApp
- [ ] Notificações proativas

#### **Entregáveis**
- ✅ MCP WhatsApp funcional
- ✅ Comunicação bidirecional
- ✅ Multi-channel experience

#### **Considerações**
- **Alternativa**: Se WhatsApp Web API for complexo, começar com Telegram Bot API

---

### **Tarefa 3.3: MCP Sistema Operacional**

#### **Checklist Técnico**
- [ ] **File Operations**
  ```python
  import os, shutil, pathlib
  # Operações seguras de arquivo
  ```
- [ ] **Application Launching**
  - [ ] Abrir aplicações
  - [ ] Gerenciar processos
- [ ] **System Monitoring**
  - [ ] CPU/RAM usage
  - [ ] Disk space
  - [ ] Network status
- [ ] **Safety Measures**
  - [ ] Whitelist de operações
  - [ ] Confirmation para ações críticas

#### **Funcionalidades Específicas**
- [ ] "Abrir VSCode na pasta do projeto"
- [ ] "Verificar espaço em disco"
- [ ] "Organizar downloads por tipo"

#### **Entregáveis**
- ✅ MCP OS funcional e seguro
- ✅ Operações básicas de sistema
- ✅ Safety measures implementadas

---

### **Tarefa 3.4: Testing e Refinamento**

#### **Checklist de Testes**
- [ ] **Unit Tests** para cada MCP
- [ ] **Integration Tests** entre MCPs
- [ ] **End-to-End Tests** de workflows
- [ ] **Performance Tests**
- [ ] **Security Tests**

#### **Refinements**
- [ ] Error handling robusto
- [ ] Performance optimization
- [ ] User experience polish
- [ ] Documentation updates

#### **Entregáveis**
- ✅ Suite de testes completa
- ✅ MCPs refinados e otimizados
- ✅ Documentação atualizada

---

## 🧠 **FASE 4: Inteligência e Proatividade**

### **Tarefa 4.1: Sistema de Monitoramento Proativo**

#### **Checklist Técnico**
- [ ] **Monitoring Framework**
  ```python
  class ProactiveMonitor:
      def __init__(self):
          self.watchers = []
      
      async def add_watcher(self, source, condition, action):
          # Implementation
  ```
- [ ] **Email Monitoring**
  - [ ] Emails importantes
  - [ ] Deadlines mencionados
- [ ] **Calendar Monitoring**
  - [ ] Próximos eventos
  - [ ] Conflitos de horário
- [ ] **System Monitoring**
  - [ ] Performance issues
  - [ ] Storage warnings

#### **Notifications Proativas**
- [ ] "Você tem reunião em 15 minutos"
- [ ] "Email urgente do chefe"
- [ ] "Deadline do projeto amanhã"

#### **Entregáveis**
- ✅ Sistema de monitoring ativo
- ✅ Notifications proativas funcionais
- ✅ Configurações customizáveis

---

### **Tarefa 4.2: Inteligência Contextual**

#### **Checklist Técnico**
- [ ] **Context Tracking**
  - [ ] Current projects
  - [ ] Recent activities
  - [ ] User preferences
- [ ] **Pattern Recognition**
  - [ ] Horários preferenciais
  - [ ] Tipos de tarefa frequentes
  - [ ] Contatos importantes
- [ ] **Adaptive Suggestions**
  - [ ] Based on context
  - [ ] Time-aware
  - [ ] Personalized

#### **Funcionalidades**
- [ ] Sugestões contextuais
- [ ] Lembretes inteligentes
- [ ] Autocomplete de tarefas
- [ ] Priorização automática

#### **Entregáveis**
- ✅ Context awareness funcional
- ✅ Suggestions relevantes
- ✅ Adaptive behavior

---

### **Tarefa 4.3: Sistema de Learning e Melhoria**

#### **Checklist Técnico**
- [ ] **Performance Analytics**
  ```python
  class LearningEngine:
      def analyze_interactions(self):
          # Success rates, response times, user satisfaction
      
      def suggest_improvements(self):
          # Automated optimization suggestions
  ```
- [ ] **Pattern Analysis**
  - [ ] Success/failure patterns
  - [ ] User behavior patterns
  - [ ] Performance bottlenecks
- [ ] **Auto-optimization**
  - [ ] Prompt refinement
  - [ ] Tool selection optimization
  - [ ] Response caching

#### **Métricas de Learning**
- [ ] Task success rate
- [ ] User satisfaction
- [ ] Response accuracy
- [ ] Cost efficiency

#### **Entregáveis**
- ✅ Learning engine funcional
- ✅ Auto-optimization ativo
- ✅ Performance metrics dashboard

---

### **Tarefa 4.4: Refinamento da Personalidade**

#### **Checklist Técnico**
- [ ] **Personality Consistency**
  - [ ] Tone guidelines
  - [ ] Response patterns
  - [ ] Behavioral rules
- [ ] **Contextual Adaptation**
  - [ ] Formal vs casual
  - [ ] Work vs personal
  - [ ] Urgent vs routine
- [ ] **Signature Behaviors**
  - [ ] Proactive suggestions
  - [ ] Follow-up questions
  - [ ] Confirmation patterns

#### **Personality Traits**
- [ ] **Proativa**: Antecipa necessidades
- [ ] **Eficiente**: Foca em resultados
- [ ] **Transparente**: Explica limitações
- [ ] **Adaptável**: Ajusta ao contexto

#### **Entregáveis**
- ✅ Personalidade consistente
- ✅ Behavioral guidelines documented
- ✅ User feedback integration

---

## ✨ **FASE 5: Polish e Optimization**

### **Tarefa 5.1: Optimization de Performance**

#### **Checklist Técnico**
- [ ] **Performance Profiling**
  - [ ] Response time analysis
  - [ ] Memory usage profiling
  - [ ] API call optimization
- [ ] **Caching Strategies**
  ```python
  from functools import lru_cache
  import redis  # Se necessário
  
  @lru_cache(maxsize=128)
  def cached_operation(params):
      # Implementation
  ```
- [ ] **Database Optimization**
  - [ ] Query optimization
  - [ ] Indexing strategy
  - [ ] Connection pooling
- [ ] **LLM Call Optimization**
  - [ ] Prompt caching
  - [ ] Response caching
  - [ ] Model routing

#### **Performance Targets**
- [ ] Response time < 3s (90th percentile)
- [ ] Memory usage < 2GB
- [ ] Cost per interaction < $0.10

#### **Entregáveis**
- ✅ Sistema otimizado
- ✅ Performance benchmarks
- ✅ Cost analysis completa

---

### **Tarefa 5.2: Security e Safety Hardening**

#### **Checklist de Security**
- [ ] **Input Validation**
  - [ ] SQL injection protection
  - [ ] Command injection protection
  - [ ] XSS protection
- [ ] **Access Controls**
  - [ ] Authentication required
  - [ ] Rate limiting
  - [ ] Permission system
- [ ] **Data Protection**
  - [ ] Encryption at rest
  - [ ] Secure API keys
  - [ ] Privacy compliance
- [ ] **Safety Measures**
  - [ ] Operation whitelisting
  - [ ] Confirmation for critical actions
  - [ ] Audit logging

#### **Security Tests**
- [ ] Penetration testing básico
- [ ] Input fuzzing
- [ ] Access control testing

#### **Entregáveis**
- ✅ Sistema securizado
- ✅ Security audit completo
- ✅ Safety measures documentadas

---

### **Tarefa 5.3: Documentation e Deployment Preparation**

#### **Documentation Package**
- [ ] **User Manual**
  - [ ] Como usar a Lina
  - [ ] Funcionalidades disponíveis
  - [ ] Troubleshooting
- [ ] **Technical Documentation**
  - [ ] Architecture overview
  - [ ] API documentation
  - [ ] Configuration guide
- [ ] **Deployment Guide**
  - [ ] Setup instructions
  - [ ] Dependencies
  - [ ] Environment configuration

#### **Deployment Preparation**
- [ ] Docker containerization
- [ ] Environment variables setup
- [ ] Backup strategy
- [ ] Monitoring setup

#### **Entregáveis**
- ✅ Documentation completa
- ✅ Deployment ready
- ✅ Backup strategy implementada

---

### **Tarefa 5.4: Final Testing e Validation**

#### **Testing Final**
- [ ] **End-to-End Testing**
  - [ ] User workflows completos
  - [ ] Multi-channel testing
  - [ ] Error scenario testing
- [ ] **Performance Validation**
  - [ ] Load testing
  - [ ] Stress testing
  - [ ] Memory leak testing
- [ ] **User Acceptance Testing**
  - [ ] Real-world scenarios
  - [ ] User feedback collection
  - [ ] Bug fixing

#### **Final Validation**
- [ ] Todos requisitos atendidos
- [ ] Performance targets alcançados
- [ ] Security measures validadas
- [ ] Documentation completa

#### **Entregáveis**
- ✅ Sistema totalmente testado
- ✅ Validation report
- ✅ Production-ready Lina

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

## 🚨 **Riscos e Mitigações**

### **Riscos Técnicos**
- **API Limits**: Implementar rate limiting e caching
- **Performance**: Profiling contínuo e optimization
- **Integration Issues**: Testing extensive de MCPs

### **Riscos de Projeto**
- **Scope Creep**: Manter foco no MVP
- **Timeline**: Buffer de 20% em cada fase
- **Budget**: Monitoring de custos semanal

### **Riscos de Segurança**
- **Data Privacy**: Encryption e access controls
- **System Access**: Whitelist e confirmations
- **API Security**: Key rotation e monitoring

---

## 🎯 **Próximos Passos Imediatos**

1. **Confirmar environment setup** (Python 3.12 + VSCode ✅)
2. **Criar conta Google Cloud** para Gemini API
3. **Começar Tarefa 1.1** - Setup do ambiente
4. **Definir schedule semanal** de desenvolvimento
5. **Setup de tracking** de progress e métricas

---

*Este roadmap é vivo e será atualizado conforme o projeto evolui. Cada tarefa incluirá retrospective e lessons learned para melhorar as próximas fases.*

---

## 📋 **BACKLOG PÓS-MVP**

### **🔐 Autenticação e Segurança**
- [ ] Sistema de autenticação de usuário
- [ ] Proteção de dados sensíveis (Google Workspace)
- [ ] Sistema de permissões granular para MCPs
- [ ] Secure storage de API keys
- [ ] Audit logging de ações sensíveis

### **🛡️ Resilience e Recovery**
- [ ] Error recovery automático
- [ ] Retry mechanisms inteligentes para MCPs
- [ ] Graceful degradation quando tools falham
- [ ] Circuit breaker pattern para APIs externas
- [ ] Fallback strategies para cada MCP

### **⚙️ Configuration Management**
- [ ] Interface de configuração para usuário
- [ ] Settings de proatividade e notificações
- [ ] Management centralizado de API keys
- [ ] Backup/restore de configurações
- [ ] Import/export de settings

### **🧪 Testing Strategy Avançada**
- [ ] Suite completa de unit tests
- [ ] Integration tests entre instâncias
- [ ] End-to-end testing de workflows complexos
- [ ] Load testing e performance benchmarks
- [ ] Chaos engineering para resilience

### **🚀 Deployment e Maintenance**
- [ ] Sistema de updates sem downtime
- [ ] Backup/restore automático
- [ ] Health monitoring e alerting
- [ ] Performance analytics dashboard
- [ ] Automated deployment pipeline

### **📱 Expansões de Interface**
- [ ] App móvel nativo
- [ ] Interface de voz (STT/TTS)
- [ ] Desktop app (Electron)
- [ ] Browser extension
- [ ] API pública para integrações

### **🧠 Inteligência Avançada**
- [ ] Machine learning para user patterns
- [ ] Predictive scheduling
- [ ] Advanced context understanding
- [ ] Multi-user collaboration features
- [ ] Enterprise-grade analytics

### **🔌 MCPs Avançados**
- [ ] IoT devices integration
- [ ] Banking/Finance APIs
- [ ] E-commerce platforms
- [ ] Social media management
- [ ] CRM/ERP integrations

---
