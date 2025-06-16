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
    "model_name": "google/gemini-2.5-flash-preview-05-20"
  }
}
```

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

**🎉 Interface construída com amor e atenção aos detalhes!**
