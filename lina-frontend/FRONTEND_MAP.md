# 🗺️ Mapa do Frontend - Lina

## 📁 Estrutura de Arquivos

```
lina-frontend/
├── index.html              📄 Página principal da aplicação
├── css/
│   ├── main.css           🎨 Design system e estilos globais
│   ├── chat.css           💬 Interface de conversação
│   └── debug-panel.css    🔍 Painel de métricas
├── js/
│   ├── app.js             🚀 Orquestração principal
│   ├── chat.js            💭 Lógica do chat
│   ├── debug-panel.js     📊 Painel de debug
│   └── api.js             🌐 Cliente HTTP
└── FRONTEND_MAP.md        📋 Este arquivo (mapa)
```

---

## 🎨 **DESIGN SYSTEM E CORES**

### 📍 Localização: `css/main.css`

#### **Paleta de Cores Principais**
```css
:root {
  /* === CORES PRIMÁRIAS === */
  --primary-blue: #2563eb;        /* Azul principal da Lina */
  --primary-blue-hover: #1d4ed8;  /* Azul hover */
  --primary-blue-light: #3b82f6; /* Azul claro */
  
  /* === CORES DE FUNDO === */
  --bg-primary: #ffffff;          /* Fundo principal (branco) */
  --bg-secondary: #f8fafc;        /* Fundo secundário (cinza muito claro) */
  --bg-tertiary: #f1f5f9;         /* Fundo terciário */
  
  /* === TEXTO === */
  --text-primary: #1e293b;        /* Texto principal (cinza escuro) */
  --text-secondary: #64748b;      /* Texto secundário */
  --text-muted: #94a3b8;          /* Texto esmaecido */
  
  /* === FEEDBACK === */
  --success-green: #10b981;       /* Verde de sucesso */
  --warning-orange: #f59e0b;      /* Laranja de aviso */
  --error-red: #ef4444;           /* Vermelho de erro */
  --info-blue: #3b82f6;           /* Azul informativo */
  
  /* === BORDAS === */
  --border-light: #e2e8f0;        /* Borda clara */
  --border-medium: #cbd5e1;       /* Borda média */
  --border-dark: #94a3b8;         /* Borda escura */
}
```

#### **Como Alterar Cores**
- **Cor principal da Lina**: Altere `--primary-blue` em `:root`
- **Esquema de cores**: Modifique as variáveis CSS em `:root`
- **Temas**: Adicione novas variáveis ou sobrescreva as existentes

#### **Tipografia**
```css
/* Fonte principal: Inter (Google Fonts) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Hierarquia de tamanhos */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
```

---

## 💬 **INTERFACE DE CHAT**

### 📍 Localização: `css/chat.css` + `js/chat.js`

#### **Componentes CSS**
- `.chat-container`: Container principal do chat
- `.message-list`: Lista de mensagens
- `.message`: Mensagem individual
- `.message.user`: Mensagem do usuário (direita, azul)
- `.message.assistant`: Mensagem da Lina (esquerda, cinza)
- `.chat-input`: Container do input
- `.chat-input input`: Campo de texto
- `.chat-input button`: Botão de enviar

#### **Cores do Chat**
```css
/* Mensagem do usuário */
.message.user .message-content {
  background: var(--primary-blue);    /* Fundo azul */
  color: white;                       /* Texto branco */
}

/* Mensagem da Lina */
.message.assistant .message-content {
  background: var(--bg-tertiary);     /* Fundo cinza claro */
  color: var(--text-primary);         /* Texto escuro */
}
```

#### **Funcionalidades JavaScript (`chat.js`)**
- `ChatManager.sendMessage()`: Enviar mensagens
- `ChatManager.addMessage()`: Adicionar ao histórico
- `ChatManager.formatMessage()`: Formatação de mensagens
- `ChatManager.scrollToBottom()`: Auto-scroll

#### **Customizações Disponíveis**
- **Posição das mensagens**: Altere flexbox em `.message`
- **Aparência das bolhas**: Modifique `.message-content`
- **Animações**: Ajuste `@keyframes fadeIn`
- **Timestamps**: Controle visibilidade em `.message-time`

---

## 🔍 **DEBUG PANEL**

### 📍 Localização: `css/debug-panel.css` + `js/debug-panel.js`

#### **Estrutura Visual**
```
┌─────────────────┐
│ 🔍 Debug        │
├─────────────────┤
│ ⏱️ Última Interação │
│ TEMPO: 2.3s     │
│ CUSTO: $0.001   │
│ TOKENS: 206     │
│ MODELO: gemini  │
├─────────────────┤
│ 📊 Sessão       │
│ TOTAL: $0.05    │
│ MENSAGENS: 12   │
│ TOKENS: 1,240   │
│ TEMPO: 45s      │
├─────────────────┤
│ 💻 Sistema      │
│ STATUS: Online  │
└─────────────────┘
```

#### **Classes CSS Principais**
- `.debug-panel`: Container principal
- `.debug-section`: Seções do painel
- `.metric-row`: Linha de métrica
- `.metric-value`: Valor da métrica
- `.status-indicator`: Indicador de status

#### **Cores das Métricas**
```css
.metric-value.cost { color: var(--success-green); }    /* Verde para custo */
.metric-value.time { color: var(--info-blue); }        /* Azul para tempo */
.metric-value.tokens { color: var(--warning-orange); } /* Laranja para tokens */
.metric-value.model { color: var(--text-secondary); }  /* Cinza para modelo */
```

#### **Funcionalidades JavaScript (`debug-panel.js`)**
- `DebugPanel.updateMetrics()`: Atualizar métricas
- `DebugPanel.addToSession()`: Somar valores da sessão
- `DebugPanel.formatCost()`: Formatar valores monetários
- `DebugPanel.formatTime()`: Formatar tempo

---

## 🚀 **APLICAÇÃO PRINCIPAL**

### 📍 Localização: `js/app.js`

#### **Responsabilidades**
- **Inicialização**: Startup da aplicação
- **Orquestração**: Coordenação entre componentes
- **Health Check**: Verificação de conectividade
- **Event Listeners**: Atalhos de teclado globais
- **Error Handling**: Tratamento de erros globais

#### **Atalhos de Teclado**
```javascript
// Ctrl/Cmd + K: Focar no input do chat
// Ctrl/Cmd + D: Toggle debug panel
// Escape: Limpar input do chat
```

#### **Variáveis Globais Expostas**
```javascript
window.linaApp      // Aplicação principal
window.chatManager  // Gerenciador de chat
window.debugPanel   // Painel de debug
window.linaAPI      // Cliente da API
```

---

## 🌐 **API CLIENT**

### 📍 Localização: `js/api.js`

#### **Endpoints**
- `GET /health`: Health check do backend
- `POST /chat/invoke`: Enviar mensagem para Lina
- `POST /test`: Teste de conectividade

#### **Configurações**
```javascript
class LinaAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;  // URL do backend
    this.headers = {
      'Content-Type': 'application/json;charset=utf-8'
    };
  }
}
```

#### **Estrutura de Resposta Esperada**
```javascript
{
  "output": "Resposta da Lina aqui",
  "debug_info": {
    "cost": 0.00012,
    "tokens_used": 206,
    "prompt_tokens": 130,
    "completion_tokens": 76,
    "duration": 2.317,
    "model_name": "google/gemini-2.5-flash-preview-05-20",
    "thread_id": "thread_default_user_2cf207d1",
    "message_id": "msg_1705709612345"
  }
}
```

#### **Endpoints para Threading**
- `POST /chat/new-thread`: Criar nova thread de conversa
- Headers suportados: `X-Thread-ID` para continuar thread existente

---

## 🧵 **SISTEMA DE THREADING (NOVO - 16/06/2025)**

### 📍 Localização: `js/chat.js` + `js/debug-panel.js`

#### **🎯 FUNCIONALIDADE PRINCIPAL**
O frontend agora suporta **threads persistentes** que mantêm a memória de conversas entre sessões. Cada conversa é uma thread separada salva no SQLite do backend.

#### **🔧 Como Funciona**
1. **Primeira mensagem**: Frontend automaticamente cria uma nova thread
2. **Mensagens seguintes**: Continuam na mesma thread mantendo contexto
3. **Nova conversa**: Usuário pode iniciar nova thread via botão (futuro)
4. **Persistência**: Threads salvas no SQLite mesmo com restart do backend

#### **📊 Métricas por Thread**
```javascript
// Estrutura das métricas
{
  currentThread: {
    id: "thread_default_user_2cf207d1",
    sessionCost: 0.05,      // Custo acumulado da sessão
    sessionTokens: 1240,    // Tokens acumulados
    sessionMessages: 12,    // Número de mensagens
    sessionTime: 45         // Tempo total da sessão
  },
  lastMessage: {
    cost: 0.001,           // Custo da última mensagem
    tokens: 206,           // Tokens da última mensagem
    duration: 2.3,         // Duração da última mensagem
    model: "gemini-2.5-flash"
  }
}
```

#### **🧠 MEMÓRIA DE CONVERSA CONFIRMADA**
- ✅ **Teste realizado**: Segunda mensagem lembrou da primeira
- ✅ **Thread ID persistente**: Mantido entre mensagens
- ✅ **SQLite checkpointer**: Funcionando perfeitamente
- ✅ **Debug info enriquecido**: Thread ID visível no painel

#### **🔍 Logs de Threading**
```javascript
// Exemplos de logs que você verá no console:
[Chat] 🧵 Primeira mensagem - criando thread...
[API] 🧵 Thread criada: thread_default_user_2cf207d1
[Chat] 🧵 Conversa iniciada com thread: thread_default_user_2cf207d1
[Debug Panel] 🧵 Thread ativa: thread_default_user_2cf207d1
```

#### **💾 CHECKPOINT 2.4: PERSISTÊNCIA DE ESTADO (IMPLEMENTADO - 17/06/2025)**

##### **📍 Localização**
- **JavaScript**: `js/debug-panel.js` (funções de persistência)
- **Storage**: `localStorage` do navegador

##### **🔧 Funcionalidades de Persistência**
```javascript
// Funções implementadas:
saveMessageExpansionStates()    // Salva estados de expansão
loadMessageExpansionStates()    // Carrega estados salvos  
applyMessageExpansionStates()   // Aplica estados após renderização
clearMessageExpansionStates()   // Limpa estados (reset)
```

##### **⚡ Como Funciona**
1. **Expansão de mensagem**: Estado salvo automaticamente no localStorage
2. **Reload da página**: Estados são restaurados automaticamente
3. **Nova conversa**: Estados são limpos adequadamente
4. **Reset completo**: Função `resetSession()` limpa tudo

##### **📊 Estrutura dos Dados Salvos**
```javascript
// localStorage: 'debugPanelMessageExpansion'
{
  "msg_1705709612345": true,    // Mensagem expandida
  "msg_1705709698234": false,   // Mensagem colapsada (removida)
  "msg_1705709756789": true     // Outra mensagem expandida
}
```

##### **🔄 Reset Completo Implementado**
```javascript
// Função resetSession() expandida:
resetSession() {
  // ... limpeza de métricas existente ...
  
  // ✅ CHECKPOINT 2.4: Novos recursos
  if (this.lastMessageId) {
    this.updateElement(this.lastMessageId, '-', '');
  }
  
  // Limpar thread info
  this.currentThreadId = null;
  if (this.currentThread) {
    this.updateElement(this.currentThread, 'Nova sessão', 'info');
  }
  
  // Limpar histórico expandível
  this.clearMessageHistory();
  
  // Limpar estados de expansão
  this.clearMessageExpansionStates();
}
```

##### **🧵 Integração com Threading**
- **Nova thread**: Estados de expansão limpos automaticamente
- **Thread management**: `thread_id` resetado no JavaScript
- **Continuidade**: Estados mantidos dentro da mesma thread
- **Logs detalhados**: Persistência visível no console

##### **📋 Logs de Funcionamento**
```javascript
[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão salvos: 3
[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão carregados: 3
[Debug Panel] ✅ CHECKPOINT 2.4: Estado aplicado - msg_123: expandido
[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão limpos
[Debug Panel] ✅ CHECKPOINT 2.4: Sessão resetada completamente
```

#### **📱 Interface de Threading**
- **Thread ID atual**: Exibido discretamente no debug panel
- **Indicador de sessão**: Métricas acumuladas por thread
- **Logs detalhados**: Threading visível no console
- **Status visual**: Indicadores de thread ativa

#### **🔄 BOTÃO "NOVA CONVERSA" (IMPLEMENTADO - 16/06/2025)**

##### **📍 Localização**
- **HTML**: `index.html` (header entre título e status)
- **CSS**: `css/chat.css` (seção "Chat Actions")
- **JavaScript**: `js/app.js` (função `startNewConversation()`)

##### **🎨 Design e Aparência**
```html
<button id="newConversationBtn" class="new-conversation-btn">
  <span class="btn-icon">🔄</span>
  <span class="btn-text">Nova Conversa</span>
</button>
```

##### **🎨 Estilos CSS**
```css
.new-conversation-btn {
  background-color: var(--primary-color);  /* Azul primário */
  color: white;
  border-radius: var(--border-radius);
  hover: transform translateY(-1px);        /* Micro-animação */
  mobile: só ícone (texto oculto);         /* Responsivo */
}
```

##### **⚡ Funcionalidades**
- **Clique**: Inicia nova thread de conversa
- **Atalho**: Ctrl/Cmd+N (atalho de teclado)
- **Feedback visual**: Botão desabilita temporariamente + texto "Iniciando..."
- **Reset completo**: Limpa chat, reseta thread_id, zera métricas
- **Auto-focus**: Foca automaticamente no input após reset

##### **🔧 Fluxo Técnico**
1. **Usuário clica** no botão ou pressiona Ctrl/Cmd+N
2. **Frontend limpa** interface visualmente
3. **Thread ID resetado** para `null` (força nova thread)
4. **Métricas zeradas** no debug panel
5. **Mensagem de boas-vindas** exibida
6. **Próxima mensagem** criará automaticamente nova thread no backend

##### **📊 Logs de Funcionamento**
```javascript
[App] 🔄 Iniciando nova conversa...
[App] 🧵 Thread ID limpo - nova thread será criada na próxima mensagem  
[App] 📊 Métricas de sessão resetadas
[App] ✅ Nova conversa iniciada com sucesso
```

#### **🧵 DISPLAY DE THREAD ID (IMPLEMENTADO - 16/06/2025)**

##### **📍 Localização**
- **HTML**: `index.html` (header após botão Nova Conversa)
- **CSS**: `css/chat.css` (seção "Thread Info")
- **JavaScript**: `js/chat.js` (função `updateThreadDisplay()`)

##### **🎨 Design e Aparência**
```html
<div class="thread-info" id="threadInfo" style="display: none;">
  <span class="thread-label"><strong>Thread</strong></span>
  <span class="thread-id" id="currentThreadId">-</span>
</div>
```

##### **⚡ Funcionalidades**
- **Exibição automática**: Aparece após primeira mensagem ser enviada
- **Formato user-friendly**: Mostra últimos 8 caracteres hex do thread ID
- **Reset automático**: Desaparece ao iniciar nova conversa
- **Responsividade**: Design integrado ao header

##### **📊 Exemplo de Funcionamento**
```javascript
// Thread ID completo: "thread_default_user_b728dbf3"
// Exibido como: "Thread b728dbf3"
[Chat] 🧵 Thread ID exibido: b728dbf3
[Chat] 🧵 Thread ID ocultado  // Ao resetar
```

##### **🎨 Visual**
- **Label**: **"Thread"** em negrito (alterado de ícone 🧵)
- **ID**: Formato hex user-friendly
- **Posicionamento**: Discreto no header, não obstrutivo
- **Estado**: Visível apenas quando thread ativa

#### **🚀 Funcionalidades Futuras Preparadas**
- **Lista de threads**: Histórico de conversas
- **Thread naming**: Nomes personalizados para threads
- **Thread management**: UI para gerenciar múltiplas conversas
- **Thread info display**: Mostrar thread_id atual no header

---

## 🎛️ **CONFIGURAÇÕES E CUSTOMIZAÇÕES**

### **Layout Responsivo**
- **Breakpoint**: 768px (definido em `main.css`)
- **Mobile**: Debug panel fica embaixo no mobile
- **Desktop**: Debug panel fica ao lado

### **Animações**
- **Fade In**: `@keyframes fadeIn` para mensagens
- **Pulse**: Indicador de "digitando"
- **Smooth Scroll**: Scroll suave no histórico

### **Estados Visuais**
- **Conectado**: Indicador verde
- **Desconectado**: Indicador vermelho
- **Carregando**: Spinner animado
- **Erro**: Feedback visual em vermelho

### **Logs e Debug**
- **Console**: Logs detalhados em `console.log`
- **Prefixos**: `[App]`, `[Chat]`, `[API]`, `[Debug Panel]`
- **Níveis**: Info, Warning, Error

---

## 🔧 **COMO MODIFICAR ASPECTOS ESPECÍFICOS**

### **Alterar Cores do Tema**
1. Abra `css/main.css`
2. Modifique as variáveis em `:root`
3. Salve e recarregue a página

### **Mudar Layout do Chat**
1. Edite `css/chat.css`
2. Ajuste propriedades flexbox em `.message`
3. Modifique espaçamentos em `.message-content`

### **Adicionar Nova Métrica no Debug Panel**
1. Modifique `js/debug-panel.js`
2. Adicione nova linha em `updateMetrics()`
3. Estilize em `css/debug-panel.css`

### **Alterar URL do Backend**
1. Abra `js/api.js`
2. Modifique `baseURL` no constructor
3. Ou passe nova URL: `new LinaAPI('http://nova-url:8000')`

### **Customizar Atalhos de Teclado**
1. Edite `js/app.js`
2. Modifique event listeners em `setupKeyboardShortcuts()`

---

## 🎯 **FILOSOFIA DO DESIGN**

### **Inspiração: Tailwind UI + Toqan**
- **Simplicidade**: Interface limpa e minimalista
- **Funcionalidade**: Cada elemento tem propósito claro
- **Transparência**: Debug info sempre visível
- **Performance**: Zero frameworks pesados
- **Responsividade**: Funciona em qualquer dispositivo

### **Princípios de UX**
1. **Feedback imediato**: Usuário sempre sabe o que está acontecendo
2. **Transparência**: Custos e métricas sempre visíveis
3. **Simplicidade**: Interface não compete com o conteúdo
4. **Consistência**: Padrões visuais mantidos em toda aplicação
5. **Acessibilidade**: Cores contrastantes e boa legibilidade

---

## 📚 **REFERÊNCIAS EXTERNAS**

- **Fonte**: [Inter Font (Google Fonts)](https://fonts.google.com/specimen/Inter)
- **Ícones**: Caracteres Unicode (⏱️💰🎯🤖📊💻)
- **Design**: Inspirado no [Tailwind UI](https://tailwindui.com/)
- **Cores**: Baseadas no [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

## ✅ **FUNCIONALIDADES CONCLUÍDAS**

### 🔧 **Debug Panel - Resize Handle**
**Status**: ✅ **TOTALMENTE FUNCIONAL**

#### **Características**
- ✅ **Resize para esquerda**: Expande corretamente pegando espaço do chat
- ✅ **Visual feedback**: Handle visível com hover effects
- ✅ **Limites inteligentes**: Min 280px, max 60% da tela
- ✅ **Persistência**: Largura salva no localStorage
- ✅ **Responsividade**: Funciona em diferentes resoluções

#### **Localização**
- **Arquivo**: `js/debug-panel.js` → `setupResizing()`
- **CSS**: `css/debug-panel.css` → `.resize-handle`

---

### 📜 **Debug Panel - Scroll Geral**
**Status**: ✅ **TOTALMENTE FUNCIONAL**

#### **Características**
- ✅ **Scroll automático**: Flexbox gerencia altura dinamicamente
- ✅ **min-height: 0**: Permite flex item encolher quando necessário
- ✅ **Todas seções visíveis**: Funciona com todas seções expandidas
- ✅ **Scroll suave**: scroll-behavior implementado
- ✅ **Scrollbar customizada**: Visual integrado ao design system

#### **Localização**
- **Arquivo**: `css/debug-panel.css` → `.debug-content`

---

### 📱 **Debug Panel - Scroll Individual**
**Status**: ✅ **TOTALMENTE FUNCIONAL**

#### **Características**
- ✅ **Histórico expandível**: Scroll suave com max-height 400px
- ✅ **Seções independentes**: Cada seção com scroll próprio
- ✅ **flex-shrink: 0**: Evita encolhimento indesejado
- ✅ **Scrollbar responsiva**: 4px width, design limpo

#### **Localização**
- **Arquivo**: `css/debug-panel.css` → `.message-history`, `.section-content`

---

### 🎯 **Histórico Expandível Completo**
**Status**: ✅ **TOTALMENTE FUNCIONAL**

#### **Características**
- ✅ **Seções colapsíveis**: Todas as seções podem ser expandidas/colapsadas
- ✅ **Histórico por mensagem**: Cada mensagem pode ser expandida individualmente
- ✅ **Debug info detalhado**: JSON formatado e legível
- ✅ **Timestamps precisos**: Hora exata de cada mensagem
- ✅ **Status tracking**: Indicadores de sucesso/erro
- ✅ **Persistência de estado**: Estados das seções salvos no localStorage

#### **Localização**
- **JavaScript**: `js/debug-panel.js` → Funções de histórico expandível
- **CSS**: `css/debug-panel.css` → Estilos de histórico e JSON blocks

---


