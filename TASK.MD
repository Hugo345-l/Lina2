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
