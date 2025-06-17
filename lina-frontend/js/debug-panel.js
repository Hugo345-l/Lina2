/**
 * Gerenciador do painel de debug
 * Controla métricas, estatísticas e informações do sistema
 */

class DebugPanel {
    constructor() {
        this.panel = document.getElementById('debugPanel');
        this.toggleButton = document.getElementById('toggleDebug');
        
        // Elementos das métricas
        this.lastDuration = document.getElementById('lastDuration');
        this.lastCost = document.getElementById('lastCost');
        this.lastTokens = document.getElementById('lastTokens');
        this.lastModel = document.getElementById('lastModel');
        
        this.sessionCost = document.getElementById('sessionCost');
        this.sessionMessages = document.getElementById('sessionMessages');
        this.sessionTokens = document.getElementById('sessionTokens');
        this.sessionTime = document.getElementById('sessionTime');
        
        this.backendStatus = document.getElementById('backendStatus');
        this.apiStatus = document.getElementById('apiStatus');
        
        // Estado interno
        this.isCollapsed = false;
        this.sessionStartTime = Date.now();
        this.totalCost = 0;
        this.totalTokens = 0;
        this.totalMessages = 0;
        
        this.init();
    }

    init() {
        // Event listeners
        this.toggleButton.addEventListener('click', () => this.togglePanel());
        
        // Verificar status inicial
        this.checkSystemStatus();
        
        // Atualizar tempo de sessão periodicamente
        setInterval(() => this.updateSessionTime(), 1000);
        
        console.log('[Debug Panel] Inicializado');
    }

    /**
     * Alterna visibilidade do painel
     */
    togglePanel() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.panel.classList.add('collapsed');
            document.querySelector('.app-container').classList.add('debug-collapsed');
        } else {
            this.panel.classList.remove('collapsed');
            document.querySelector('.app-container').classList.remove('debug-collapsed');
        }
        
        // Salvar preferência no localStorage
        localStorage.setItem('debugPanelCollapsed', this.isCollapsed);
    }

    /**
     * Atualiza métricas da última interação
     */
    updateMetrics(debugInfo) {
        console.log('[Debug Panel] Atualizando métricas:', debugInfo);
        
        // Última interação
        this.updateElement(this.lastDuration, `${debugInfo.duration}s`, 'duration');
        this.updateElement(this.lastCost, `$${debugInfo.cost.toFixed(6)}`, 'cost');
        this.updateElement(this.lastTokens, `${debugInfo.tokens_used}`, 'tokens');
        this.updateElement(this.lastModel, this.formatModelName(debugInfo.model_name), 'model');
        
        // Acumular dados da sessão
        this.totalCost += debugInfo.cost;
        this.totalTokens += debugInfo.tokens_used;
        
        // Atualizar sessão
        this.updateElement(this.sessionCost, `$${this.totalCost.toFixed(6)}`, 'cost');
        this.updateElement(this.sessionTokens, `${this.totalTokens}`, 'tokens');
        
        // Marcar como atualizado
        this.panel.classList.add('has-updates');
        setTimeout(() => this.panel.classList.remove('has-updates'), 2000);
    }

    /**
     * Atualiza contador de mensagens da sessão
     */
    updateSessionCount(count) {
        this.totalMessages = count;
        this.updateElement(this.sessionMessages, `${count}`, 'messages');
    }

    /**
     * 🧵 CHECKPOINT 1.4: Atualiza informações de thread
     */
    updateThreadInfo(threadId) {
        console.log('[Debug Panel] 🧵 Atualizando thread info:', threadId);
        
        // Procurar elemento de thread info (se existir no HTML)
        const threadElement = document.getElementById('currentThread');
        if (threadElement) {
            if (threadId) {
                // Mostrar apenas parte relevante do thread_id
                const shortThreadId = threadId.split('_').slice(-2).join('_'); // últimas 2 partes
                this.updateElement(threadElement, shortThreadId, 'thread');
            } else {
                this.updateElement(threadElement, 'Não iniciada', 'warning');
            }
        }
        
        // Atualizar log no console para debug
        if (threadId) {
            console.log(`[Debug Panel] 🧵 Thread ativa: ${threadId}`);
        }
    }

    /**
     * Atualiza tempo de sessão
     */
    updateSessionTime() {
        const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = minutes > 0 
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;
            
        this.updateElement(this.sessionTime, timeString, 'time');
    }

    /**
     * Verifica status do sistema
     */
    async checkSystemStatus() {
        try {
            this.updateElement(this.backendStatus, 'Verificando...', 'warning');
            this.updateElement(this.apiStatus, 'Verificando...', 'warning');
            
            const systemInfo = await window.linaAPI.getSystemInfo();
            
            // Backend status
            const backendClass = systemInfo.backend_status === 'Online' ? 'success' : 'error';
            this.updateElement(this.backendStatus, systemInfo.backend_status, backendClass);
            
            // API status
            const apiClass = systemInfo.api_status === 'Ready' ? 'success' : 'error';
            this.updateElement(this.apiStatus, systemInfo.api_status, apiClass);
            
            // Atualizar indicador de conexão
            this.updateConnectionStatus(systemInfo.backend_status === 'Online');
            
        } catch (error) {
            console.error('[Debug Panel] Erro ao verificar status:', error);
            this.updateElement(this.backendStatus, 'Erro', 'error');
            this.updateElement(this.apiStatus, 'Erro', 'error');
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Atualiza elemento com animação
     */
    updateElement(element, value, type = '') {
        if (!element) return;
        
        element.textContent = value;
        element.className = `metric-value ${type}`;
        
        // Animação de atualização
        element.classList.add('updating');
        setTimeout(() => element.classList.remove('updating'), 500);
    }

    /**
     * Formata nome do modelo
     */
    formatModelName(modelName) {
        if (!modelName) return 'N/A';
        
        // Extrair parte principal do nome
        const parts = modelName.split('/');
        return parts[parts.length - 1] || modelName;
    }

    /**
     * Atualiza status de conexão no header
     */
    updateConnectionStatus(isConnected) {
        const statusIndicator = document.getElementById('connectionStatus');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            if (isConnected) {
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Conectada';
            } else {
                statusIndicator.className = 'status-indicator disconnected';
                statusText.textContent = 'Desconectada';
            }
        }
    }

    /**
     * Reseta métricas da sessão
     */
    resetSession() {
        this.sessionStartTime = Date.now();
        this.totalCost = 0;
        this.totalTokens = 0;
        this.totalMessages = 0;
        
        // Limpar valores
        this.updateElement(this.sessionCost, '$0.000', 'cost');
        this.updateElement(this.sessionMessages, '0', 'messages');
        this.updateElement(this.sessionTokens, '0', 'tokens');
        this.updateElement(this.sessionTime, '0s', 'time');
        
        // Limpar última interação
        this.updateElement(this.lastDuration, '-', '');
        this.updateElement(this.lastCost, '-', '');
        this.updateElement(this.lastTokens, '-', '');
        this.updateElement(this.lastModel, '-', '');
    }

    /**
     * Obtém dados para exportação/relatório
     */
    getSessionData() {
        return {
            startTime: new Date(this.sessionStartTime).toISOString(),
            duration: Date.now() - this.sessionStartTime,
            totalCost: this.totalCost,
            totalTokens: this.totalTokens,
            totalMessages: this.totalMessages,
            averageCostPerMessage: this.totalMessages > 0 ? this.totalCost / this.totalMessages : 0,
            averageTokensPerMessage: this.totalMessages > 0 ? this.totalTokens / this.totalMessages : 0
        };
    }

    /**
     * Carrega estado salvo
     */
    loadState() {
        const collapsed = localStorage.getItem('debugPanelCollapsed');
        if (collapsed === 'true') {
            this.togglePanel();
        }
    }
}

// Instância global do debug panel
window.debugPanel = null;
