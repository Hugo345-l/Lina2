/**
 * Gerenciador do painel de debug - VERSÃO EXPANDÍVEL
 * Controla métricas, estatísticas e histórico expandível de mensagens
 * CHECKPOINTS 2.3a e 2.3b - Reestruturação expandível do debug panel
 */

class DebugPanel {
    constructor() {
        this.panel = document.getElementById('debugPanel');
        this.toggleButton = document.getElementById('toggleDebug');
        
        // Elementos das métricas - Última Mensagem
        this.lastDuration = document.getElementById('lastDuration');
        this.lastCost = document.getElementById('lastCost');
        this.lastTokens = document.getElementById('lastTokens');
        this.lastModel = document.getElementById('lastModel');
        this.lastMessageId = document.getElementById('lastMessageId');
        
        // Elementos das métricas - Sessão
        this.sessionCost = document.getElementById('sessionCost');
        this.sessionMessages = document.getElementById('sessionMessages');
        this.sessionTokens = document.getElementById('sessionTokens');
        this.sessionTime = document.getElementById('sessionTime');
        this.currentThread = document.getElementById('currentThread');
        
        // Elementos do sistema
        this.backendStatus = document.getElementById('backendStatus');
        this.apiStatus = document.getElementById('apiStatus');
        
        // Histórico expandível
        this.messageHistory = document.getElementById('messageHistory');
        
        // Estado interno
        this.isCollapsed = false;
        this.sessionStartTime = Date.now();
        this.totalCost = 0;
        this.totalTokens = 0;
        this.totalMessages = 0;
        this.currentThreadId = null;
        
        // Histórico de mensagens (para histórico expandível)
        this.messageHistoryData = [];
        
        // ✅ CHECKPOINT 2.4: Estado de expansão das mensagens do histórico
        this.messageExpansionStates = {};
        
        // Estado das seções (colapsadas ou não)
        this.sectionStates = {
            lastMessage: true,    // expandida por padrão
            session: true,        // expandida por padrão
            history: true,        // expandida por padrão
            system: false         // colapsada por padrão
        };
        
        this.init();
    }

    init() {
        // Event listeners
        this.toggleButton.addEventListener('click', () => this.togglePanel());
        
        // 📱 CHECKPOINT 2.3a: Setup das seções colapsíveis
        this.setupCollapsibleSections();
        
        // 🔧 Setup do redimensionamento
        this.setupResizing();
        
        // Verificar status inicial
        this.checkSystemStatus();
        
        // Atualizar tempo de sessão periodicamente
        setInterval(() => this.updateSessionTime(), 1000);
        
        // Carregar estado salvo das seções
        this.loadSectionStates();
        
        // ✅ CHECKPOINT 2.4: Carregar estados de expansão das mensagens
        this.loadMessageExpansionStates();
        
        console.log('[Debug Panel] ✅ CHECKPOINT 2.3a - Seções colapsíveis configuradas');
        console.log('[Debug Panel] ✅ CHECKPOINT 2.3b - Histórico expandível configurado');
        console.log('[Debug Panel] ✅ CHECKPOINT 2.4 - Persistência de estado configurada');
        console.log('[Debug Panel] ✅ Redimensionamento configurado');
        console.log('[Debug Panel] Inicializado com suporte expandível');
    }

    /**
     * 📱 CHECKPOINT 2.3a: Setup das seções colapsíveis
     */
    setupCollapsibleSections() {
        console.log('[Debug Panel] 📱 CHECKPOINT 2.3a: Configurando seções colapsíveis');
        
        // Encontrar todos os headers de seção
        const sectionHeaders = document.querySelectorAll('.section-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const sectionName = header.getAttribute('data-section');
                this.toggleSection(sectionName);
            });
        });
        
        // Aplicar estado inicial das seções
        this.applyInitialSectionStates();
        
        console.log('[Debug Panel] 📱 Seções colapsíveis configuradas:', Object.keys(this.sectionStates));
    }

    /**
     * 📱 CHECKPOINT 2.3a: Alterna estado de uma seção
     */
    toggleSection(sectionName) {
        console.log(`[Debug Panel] 📱 Alternando seção: ${sectionName}`);
        
        // Inverter estado
        this.sectionStates[sectionName] = !this.sectionStates[sectionName];
        
        // Mapear nomes para IDs corretos do HTML
        const sectionIdMap = {
            'lastMessage': 'lastMessageSection',
            'session': 'sessionSection', 
            'history': 'historySection',
            'system': 'systemSection'
        };
        
        // Aplicar estado visual
        const sectionId = sectionIdMap[sectionName] || `${sectionName}Section`;
        const section = document.getElementById(sectionId);
        if (section) {
            if (this.sectionStates[sectionName]) {
                section.classList.remove('collapsed');
            } else {
                section.classList.add('collapsed');
            }
        }
        
        // Salvar estado no localStorage
        this.saveSectionStates();
        
        console.log(`[Debug Panel] 📱 Seção ${sectionName}: ${this.sectionStates[sectionName] ? 'expandida' : 'colapsada'}`);
    }

    /**
     * 📱 CHECKPOINT 2.3a: Aplicar estados iniciais das seções
     */
    applyInitialSectionStates() {
        // Mapear nomes para IDs corretos do HTML
        const sectionIdMap = {
            'lastMessage': 'lastMessageSection',
            'session': 'sessionSection', 
            'history': 'historySection',
            'system': 'systemSection'
        };
        
        Object.entries(this.sectionStates).forEach(([sectionName, isExpanded]) => {
            const sectionId = sectionIdMap[sectionName] || `${sectionName}Section`;
            const section = document.getElementById(sectionId);
            if (section) {
                if (isExpanded) {
                    section.classList.remove('collapsed');
                } else {
                    section.classList.add('collapsed');
                }
            }
        });
    }

    /**
     * 📱 CHECKPOINT 2.3a: Salvar estados das seções
     */
    saveSectionStates() {
        localStorage.setItem('debugPanelSectionStates', JSON.stringify(this.sectionStates));
    }

    /**
     * 📱 CHECKPOINT 2.3a: Carregar estados das seções
     */
    loadSectionStates() {
        const saved = localStorage.getItem('debugPanelSectionStates');
        if (saved) {
            try {
                this.sectionStates = { ...this.sectionStates, ...JSON.parse(saved) };
                this.applyInitialSectionStates();
                console.log('[Debug Panel] 📱 Estados das seções carregados:', this.sectionStates);
            } catch (error) {
                console.warn('[Debug Panel] 📱 Erro ao carregar estados das seções:', error);
            }
        }
    }

    /**
     * 🔧 Setup do redimensionamento do debug panel
     */
    setupResizing() {
        const resizeHandle = document.getElementById('resizeHandle');
        if (!resizeHandle) {
            console.warn('[Debug Panel] 🔧 Resize handle não encontrado');
            return;
        }

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        // Carregar largura salva
        const savedWidth = localStorage.getItem('debugPanelWidth');
        if (savedWidth) {
            this.panel.style.width = savedWidth + 'px';
        }

        // Mouse down no resize handle
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.panel).width, 10);
            
            this.panel.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            console.log('[Debug Panel] 🔧 Iniciando redimensionamento');
        });

        // Mouse move - redimensionar
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            // CORREÇÃO CRÍTICA: Inverter lógica para expandir corretamente para a esquerda
            const diffX = startX - e.clientX; // Diferença (positiva = arrastando para esquerda)
            const newWidth = startWidth + diffX; // Expandir quando arrastamos para esquerda

            // Limites de largura
            const minWidth = 280;
            const maxWidth = window.innerWidth * 0.6; // 60% da tela (aumentado para mais flexibilidade)

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                this.panel.style.width = newWidth + 'px';
                
                console.log(`[Debug Panel] 🔧 Redimensionando: ${newWidth}px`);
            }
        });

        // Mouse up - finalizar redimensionamento
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;

            isResizing = false;
            this.panel.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Salvar largura no localStorage
            const finalWidth = parseInt(document.defaultView.getComputedStyle(this.panel).width, 10);
            localStorage.setItem('debugPanelWidth', finalWidth);

            console.log('[Debug Panel] 🔧 Redimensionamento finalizado:', finalWidth + 'px');
        });

        console.log('[Debug Panel] 🔧 Redimensionamento configurado');
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
        
        // Message ID (novo campo)
        if (this.lastMessageId && debugInfo.message_id) {
            const shortMessageId = debugInfo.message_id.split('_').pop() || debugInfo.message_id.slice(-8);
            this.updateElement(this.lastMessageId, shortMessageId, 'model');
        }
        
        // Acumular dados da sessão
        this.totalCost += debugInfo.cost;
        this.totalTokens += debugInfo.tokens_used;
        
        // Atualizar sessão
        this.updateElement(this.sessionCost, `$${this.totalCost.toFixed(6)}`, 'cost');
        this.updateElement(this.sessionTokens, `${this.totalTokens}`, 'tokens');
        
        // 📝 CHECKPOINT 2.3b: Adicionar ao histórico expandível
        this.addToMessageHistory(debugInfo);
        
        // Marcar como atualizado
        this.panel.classList.add('has-updates');
        setTimeout(() => this.panel.classList.remove('has-updates'), 2000);
    }

    /**
     * 📝 CHECKPOINT 2.3b: Adiciona mensagem ao histórico expandível
     */
    addToMessageHistory(debugInfo) {
        console.log('[Debug Panel] 📝 CHECKPOINT 2.3b: Adicionando ao histórico expandível');
        
        // Criar objeto de histórico
        const historyItem = {
            id: debugInfo.message_id || `msg_${Date.now()}`,
            timestamp: new Date().toISOString(),
            userMessage: debugInfo.user_message || 'Mensagem do usuário',
            assistantResponse: debugInfo.assistant_response || 'Resposta da Lina',
            debugInfo: { ...debugInfo },
            status: 'success'
        };
        
        // Adicionar ao início do array (mais recente primeiro)
        this.messageHistoryData.unshift(historyItem);
        
        // Limitar histórico a 50 mensagens
        if (this.messageHistoryData.length > 50) {
            this.messageHistoryData = this.messageHistoryData.slice(0, 50);
        }
        
        // Renderizar histórico atualizado
        this.renderMessageHistory();
        
        console.log(`[Debug Panel] 📝 Histórico expandível atualizado: ${this.messageHistoryData.length} mensagens`);
    }

    /**
     * 📝 CHECKPOINT 2.3b: Renderiza o histórico de mensagens
     */
    renderMessageHistory() {
        if (!this.messageHistory) return;
        
        // Se não há mensagens, mostrar placeholder
        if (this.messageHistoryData.length === 0) {
            this.messageHistory.innerHTML = `
                <div class="history-placeholder">
                    <p>📭 Nenhuma mensagem ainda</p>
                    <small>Envie uma mensagem para ver o histórico expandível</small>
                </div>
            `;
            return;
        }
        
        // Renderizar lista de mensagens
        const historyHTML = this.messageHistoryData.map((item, index) => 
            this.renderHistoryItem(item, index)
        ).join('');
        
        this.messageHistory.innerHTML = historyHTML;
        
        // Adicionar event listeners para expansão
        this.setupHistoryItemListeners();
        
        // ✅ CHECKPOINT 2.4: Aplicar estados de expansão salvos
        this.applyMessageExpansionStates();
        
        console.log(`[Debug Panel] 📝 Histórico renderizado: ${this.messageHistoryData.length} itens`);
        console.log(`[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão aplicados: ${Object.keys(this.messageExpansionStates).length}`);
    }

    /**
     * 📝 CHECKPOINT 2.3b: Renderiza um item individual do histórico
     */
    renderHistoryItem(item, index) {
        const isLatest = index === 0;
        const timestamp = new Date(item.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Criar título resumido da mensagem
        const userMessagePreview = item.userMessage.length > 30 
            ? item.userMessage.substring(0, 30) + '...'
            : item.userMessage;
            
        return `
            <div class="history-item ${isLatest ? 'latest' : ''}" data-item-id="${item.id}">
                <div class="history-header">
                    <div class="history-summary">
                        <div class="history-title">
                            ${isLatest ? '📍' : '💬'} ${userMessagePreview}
                        </div>
                        <div class="history-meta">
                            <span>⏱️ ${item.debugInfo.duration}s</span>
                            <span>💰 $${item.debugInfo.cost.toFixed(6)}</span>
                            <span>🎯 ${item.debugInfo.tokens_used} tokens</span>
                            <span>🕐 ${timestamp}</span>
                        </div>
                    </div>
                    <button class="history-expand-btn" data-action="toggle-history" data-item-id="${item.id}">
                        ▼
                    </button>
                </div>
                <div class="history-details">
                    <div class="history-details-content">
                        <!-- Mensagem do Usuário -->
                        <div class="json-block">
                            <div class="json-header">👤 Mensagem do Usuário</div>
                            <div class="json-content">${this.escapeHtml(item.userMessage)}</div>
                        </div>
                        
                        <!-- Resposta da Lina -->
                        <div class="json-block">
                            <div class="json-header">🤖 Resposta da Lina</div>
                            <div class="json-content">${this.escapeHtml(item.assistantResponse)}</div>
                        </div>
                        
                        <!-- Debug Info Completo -->
                        <div class="json-block">
                            <div class="json-header">🔍 Debug Info Completo</div>
                            <div class="json-content">${this.formatDebugInfo(item.debugInfo)}</div>
                        </div>
                    </div>
                    <div class="history-status">
                        <span class="status-badge ${item.status}">${item.status === 'success' ? '✅ Sucesso' : '❌ Erro'}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 📝 CHECKPOINT 2.3b: Setup dos event listeners do histórico
     */
    setupHistoryItemListeners() {
        // Event listeners para botões de expansão do histórico
        const expandButtons = document.querySelectorAll('[data-action="toggle-history"]');
        
        expandButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = button.getAttribute('data-item-id');
                this.toggleHistoryItem(itemId);
            });
        });
    }

    /**
     * 📝 CHECKPOINT 2.3b: Alterna expansão de um item do histórico
     * ✅ CHECKPOINT 2.4: Com persistência no localStorage
     */
    toggleHistoryItem(itemId) {
        const historyItem = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!historyItem) return;
        
        const isExpanded = historyItem.classList.contains('expanded');
        
        if (isExpanded) {
            historyItem.classList.remove('expanded');
            // ✅ CHECKPOINT 2.4: Remover do estado de expansão
            delete this.messageExpansionStates[itemId];
            console.log(`[Debug Panel] 📝 Item do histórico colapsado: ${itemId}`);
        } else {
            // Fechar outros itens expandidos (opcional - comentar para permitir múltiplos abertos)
            document.querySelectorAll('.history-item.expanded').forEach(item => {
                if (item !== historyItem) {
                    item.classList.remove('expanded');
                    // ✅ CHECKPOINT 2.4: Remover do estado outros itens
                    const otherItemId = item.getAttribute('data-item-id');
                    if (otherItemId) delete this.messageExpansionStates[otherItemId];
                }
            });
            
            historyItem.classList.add('expanded');
            // ✅ CHECKPOINT 2.4: Salvar no estado de expansão
            this.messageExpansionStates[itemId] = true;
            console.log(`[Debug Panel] 📝 Item do histórico expandido: ${itemId}`);
        }
        
        // ✅ CHECKPOINT 2.4: Persistir estados no localStorage
        this.saveMessageExpansionStates();
    }

    /**
     * 📝 CHECKPOINT 2.3b: Formata debug info de forma legível
     */
    formatDebugInfo(debugInfo) {
        if (!debugInfo) return 'N/A';
        
        // Organizar campos importantes primeiro
        const organized = {
            '💰 Custo': `$${debugInfo.cost?.toFixed(6) || 'N/A'}`,
            '🎯 Tokens Totais': debugInfo.tokens_used || 'N/A',
            '📤 Tokens Prompt': debugInfo.prompt_tokens || 'N/A', 
            '📥 Tokens Resposta': debugInfo.completion_tokens || 'N/A',
            '⏱️ Duração': `${debugInfo.duration || 'N/A'}s`,
            '🤖 Modelo': debugInfo.model_name || 'N/A',
            '🆔 Message ID': debugInfo.message_id || 'N/A',
            '🧵 Thread ID': debugInfo.thread_id || 'N/A',
            '#️⃣ Sequência': debugInfo.message_sequence || 'N/A'
        };
        
        // Formatação limpa linha por linha
        let formatted = '';
        Object.entries(organized).forEach(([key, value]) => {
            formatted += `${key}: ${value}\n`;
        });
        
        return formatted.trim();
    }

    /**
     * 📝 CHECKPOINT 2.3b: Escapa HTML para segurança
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 📝 CHECKPOINT 2.3b: Limpa histórico de mensagens
     */
    clearMessageHistory() {
        this.messageHistoryData = [];
        this.renderMessageHistory();
        console.log('[Debug Panel] 📝 Histórico de mensagens limpo');
    }

    /**
     * 📝 CHECKPOINT 2.3b: Atualiza mensagem específica do histórico (para uso futuro)
     */
    updateHistoryMessage(messageId, userMessage, assistantResponse) {
        const item = this.messageHistoryData.find(item => item.id === messageId);
        if (item) {
            item.userMessage = userMessage;
            item.assistantResponse = assistantResponse;
            this.renderMessageHistory();
            console.log(`[Debug Panel] 📝 Mensagem do histórico atualizada: ${messageId}`);
        }
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
        
        // ✅ CHECKPOINT 2.4: Limpar message ID da última mensagem
        if (this.lastMessageId) {
            this.updateElement(this.lastMessageId, '-', '');
        }
        
        // ✅ CHECKPOINT 2.4: Limpar thread info
        this.currentThreadId = null;
        if (this.currentThread) {
            this.updateElement(this.currentThread, 'Nova sessão', 'info');
        }
        
        // ✅ CHECKPOINT 2.4: Limpar histórico expandível ao resetar sessão
        this.clearMessageHistory();
        
        console.log('[Debug Panel] ✅ CHECKPOINT 2.4: Sessão resetada completamente - histórico, métricas e thread');
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
     * ✅ CHECKPOINT 2.4: Salva estados de expansão das mensagens
     */
    saveMessageExpansionStates() {
        localStorage.setItem('debugPanelMessageExpansion', JSON.stringify(this.messageExpansionStates));
        console.log('[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão salvos:', Object.keys(this.messageExpansionStates).length);
    }

    /**
     * ✅ CHECKPOINT 2.4: Carrega estados de expansão das mensagens
     */
    loadMessageExpansionStates() {
        const saved = localStorage.getItem('debugPanelMessageExpansion');
        if (saved) {
            try {
                this.messageExpansionStates = JSON.parse(saved);
                console.log('[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão carregados:', Object.keys(this.messageExpansionStates).length);
            } catch (error) {
                console.warn('[Debug Panel] ✅ CHECKPOINT 2.4: Erro ao carregar estados de expansão:', error);
                this.messageExpansionStates = {};
            }
        }
    }

    /**
     * ✅ CHECKPOINT 2.4: Aplica estados de expansão salvos após renderização
     */
    applyMessageExpansionStates() {
        Object.entries(this.messageExpansionStates).forEach(([messageId, isExpanded]) => {
            const historyItem = document.querySelector(`[data-item-id="${messageId}"]`);
            if (historyItem && isExpanded) {
                historyItem.classList.add('expanded');
                console.log(`[Debug Panel] ✅ CHECKPOINT 2.4: Estado aplicado - ${messageId}: expandido`);
            }
        });
    }

    /**
     * ✅ CHECKPOINT 2.4: Limpa estados de expansão (usado no reset)
     */
    clearMessageExpansionStates() {
        this.messageExpansionStates = {};
        this.saveMessageExpansionStates();
        console.log('[Debug Panel] ✅ CHECKPOINT 2.4: Estados de expansão limpos');
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
