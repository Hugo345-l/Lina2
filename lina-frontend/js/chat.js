/**
 * Gerenciador da interface de chat
 * Controla mensagens, input e interações do usuário
 * 🧵 CHECKPOINT 1.4: Incluindo Thread Management
 */

class ChatManager {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatForm = document.getElementById('chatForm');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.messageCount = 0;
        this.isProcessing = false;
        
        // 🧵 CHECKPOINT 1.4: Thread Management
        this.currentThreadId = null;
        this.conversationStarted = false;
        
        this.init();
    }

    init() {
        // Event listeners
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('input', () => this.handleInputChange());
        
        // Focus no input
        this.messageInput.focus();
        
        console.log('[Chat] Inicializado');
    }

    /**
     * Manipula envio de mensagem via form
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;
        
        await this.sendMessage(message);
    }

    /**
     * Manipula teclas especiais no input
     */
    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    /**
     * Manipula mudanças no input
     */
    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isProcessing;
    }

    /**
     * 🧵 CHECKPOINT 1.4: Envia mensagem para a Lina com thread management
     */
    async sendMessage(message) {
        try {
            this.setProcessing(true);
            
            // 🧵 CHECKPOINT 1.4: Iniciar thread se for primeira mensagem
            if (!this.conversationStarted) {
                console.log('[Chat] 🧵 Primeira mensagem - criando thread...');
                await this.startNewConversation();
            }
            
            // Adicionar mensagem do usuário
            this.addMessage(message, 'user');
            
            // Limpar input
            this.messageInput.value = '';
            this.handleInputChange();
            
            // Mostrar indicador de digitação
            const typingId = this.showTypingIndicator();
            
            // 🧵 CHECKPOINT 1.4: Enviar para API com thread ID
            const response = await window.linaAPI.sendMessage(message, this.currentThreadId);
            
            // Remover indicador de digitação
            this.removeTypingIndicator(typingId);
            
            // 🧵 CHECKPOINT 1.4: Atualizar thread ID se retornado
            if (response.debug_info && response.debug_info.thread_id) {
                this.currentThreadId = response.debug_info.thread_id;
                console.log('[Chat] 🧵 Thread ID atualizado:', this.currentThreadId);
                this.updateThreadDisplay();
            }
            
            // Adicionar resposta da Lina
            this.addMessage(response.output, 'assistant');
            
            // Atualizar debug panel
            if (window.debugPanel) {
                window.debugPanel.updateMetrics(response.debug_info);
            }
            
        } catch (error) {
            console.error('[Chat] Erro ao enviar mensagem:', error);
            
            // Remover indicador de digitação se existir
            const typingElement = document.querySelector('.typing-message');
            if (typingElement) {
                typingElement.remove();
            }
            
            // Mostrar mensagem de erro
            this.addMessage(`Erro: ${error.message}`, 'error');
            
        } finally {
            this.setProcessing(false);
            this.messageInput.focus();
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Inicia nova conversa com thread
     */
    async startNewConversation() {
        try {
            console.log('[Chat] 🧵 Iniciando nova conversa...');
            
            const result = await window.linaAPI.startNewConversation();
            
            if (result.success) {
                this.currentThreadId = result.thread_id;
                this.conversationStarted = true;
                console.log('[Chat] 🧵 Conversa iniciada com thread:', this.currentThreadId);
                
                // Atualizar debug panel com thread ID
                if (window.debugPanel) {
                    window.debugPanel.updateThreadInfo(this.currentThreadId);
                }
            } else {
                console.error('[Chat] 🧵 Erro ao iniciar conversa:', result.message);
                throw new Error(result.message || 'Erro ao criar thread');
            }
            
        } catch (error) {
            console.error('[Chat] 🧵 Erro ao iniciar nova conversa:', error);
            // Permitir continuar sem thread (fallback)
            this.conversationStarted = true;
            throw error;
        }
    }

    /**
     * Adiciona mensagem ao chat
     */
    addMessage(content, type = 'assistant') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message animate-fade-in`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.innerHTML = this.formatMessage(content);
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = this.formatTime(new Date());
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        this.messageCount++;
        
        // Atualizar contador no debug panel
        if (window.debugPanel) {
            window.debugPanel.updateSessionCount(this.messageCount);
        }
    }

    /**
     * Formata mensagem (básico - pode ser expandido para Markdown)
     */
    formatMessage(content) {
        // Escape HTML básico
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Quebras de linha
        return escaped.replace(/\n/g, '<br>');
    }

    /**
     * Formata timestamp
     */
    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Mostra indicador de digitação
     */
    showTypingIndicator() {
        const typingId = `typing-${Date.now()}`;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message typing-message animate-fade-in';
        typingElement.id = typingId;
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = `
            <span>Lina está digitando</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        typingElement.appendChild(typingContent);
        this.messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
        
        return typingId;
    }

    /**
     * Remove indicador de digitação
     */
    removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }

    /**
     * Scroll para o final do chat
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Define estado de processamento
     */
    setProcessing(processing) {
        this.isProcessing = processing;
        this.sendButton.disabled = processing || !this.messageInput.value.trim();
        
        if (processing) {
            this.loadingOverlay.classList.add('active');
            this.messageInput.disabled = true;
        } else {
            this.loadingOverlay.classList.remove('active');
            this.messageInput.disabled = false;
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Limpa o chat e reseta thread
     */
    clearChat() {
        console.log('[Chat] 🧵 Limpando chat e resetando thread...');
        
        // Manter apenas a mensagem de boas-vindas
        const systemMessage = this.messagesContainer.querySelector('.system-message');
        this.messagesContainer.innerHTML = '';
        if (systemMessage) {
            this.messagesContainer.appendChild(systemMessage);
        }
        
        // 🧵 CHECKPOINT 1.4: Reset thread state
        this.currentThreadId = null;
        this.conversationStarted = false;
        this.messageCount = 0;
        
        // 🧵 CHECKPOINT 2.2: Ocultar thread ID display
        this.updateThreadDisplay();
        
        // Reset API thread
        if (window.linaAPI) {
            window.linaAPI.resetThread();
        }
        
        if (window.debugPanel) {
            window.debugPanel.updateSessionCount(0);
            window.debugPanel.updateThreadInfo(null);
        }
        
        console.log('[Chat] 🧵 Chat limpo e thread resetada');
    }

    /**
     * 🧵 CHECKPOINT 1.4: Força nova conversa (reset completo)
     */
    async forceNewConversation() {
        try {
            console.log('[Chat] 🧵 Forçando nova conversa...');
            
            this.clearChat();
            
            // Forçar criação de nova thread na próxima mensagem
            this.conversationStarted = false;
            
            console.log('[Chat] 🧵 Preparado para nova conversa');
            
        } catch (error) {
            console.error('[Chat] 🧵 Erro ao forçar nova conversa:', error);
        }
    }

    /**
     * 🧵 CHECKPOINT 2.2: Atualiza exibição do Thread ID no header
     */
    updateThreadDisplay() {
        const threadInfo = document.getElementById('threadInfo');
        const threadIdElement = document.getElementById('currentThreadId');
        
        if (this.currentThreadId) {
            // Formatar thread ID para exibição user-friendly
            const displayId = this.formatThreadIdForDisplay(this.currentThreadId);
            threadIdElement.textContent = displayId;
            threadInfo.style.display = 'flex';
            console.log('[Chat] 🧵 Thread ID exibido:', displayId);
        } else {
            threadInfo.style.display = 'none';
            console.log('[Chat] 🧵 Thread ID ocultado');
        }
    }

    /**
     * 🧵 CHECKPOINT 2.2: Formata Thread ID para exibição amigável
     */
    formatThreadIdForDisplay(threadId) {
        if (!threadId) return '-';
        
        // Extrair parte relevante do thread ID
        // Ex: "thread_default_user_2cf207d1" -> "2cf207d1"
        const match = threadId.match(/_([a-f0-9]{8})$/);
        if (match) {
            return match[1];
        }
        
        // Fallback: últimos 8 caracteres
        return threadId.slice(-8);
    }

    /**
     * 🧵 CHECKPOINT 1.4: Obtém informações da thread atual
     */
    getThreadInfo() {
        return {
            currentThreadId: this.currentThreadId,
            conversationStarted: this.conversationStarted,
            messageCount: this.messageCount
        };
    }

    /**
     * Obtém estatísticas do chat
     */
    getStats() {
        return {
            messageCount: this.messageCount,
            isProcessing: this.isProcessing,
            // 🧵 CHECKPOINT 1.4: Incluir info de thread
            threadId: this.currentThreadId,
            conversationStarted: this.conversationStarted
        };
    }
}

// Instância global do chat
window.chatManager = null;
