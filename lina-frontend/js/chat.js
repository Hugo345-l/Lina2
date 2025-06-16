/**
 * Gerenciador da interface de chat
 * Controla mensagens, input e interações do usuário
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
     * Envia mensagem para a Lina
     */
    async sendMessage(message) {
        try {
            this.setProcessing(true);
            
            // Adicionar mensagem do usuário
            this.addMessage(message, 'user');
            
            // Limpar input
            this.messageInput.value = '';
            this.handleInputChange();
            
            // Mostrar indicador de digitação
            const typingId = this.showTypingIndicator();
            
            // Enviar para API
            const response = await window.linaAPI.sendMessage(message);
            
            // Remover indicador de digitação
            this.removeTypingIndicator(typingId);
            
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
     * Limpa o chat
     */
    clearChat() {
        // Manter apenas a mensagem de boas-vindas
        const systemMessage = this.messagesContainer.querySelector('.system-message');
        this.messagesContainer.innerHTML = '';
        if (systemMessage) {
            this.messagesContainer.appendChild(systemMessage);
        }
        
        this.messageCount = 0;
        
        if (window.debugPanel) {
            window.debugPanel.updateSessionCount(0);
        }
    }

    /**
     * Obtém estatísticas do chat
     */
    getStats() {
        return {
            messageCount: this.messageCount,
            isProcessing: this.isProcessing
        };
    }
}

// Instância global do chat
window.chatManager = null;
