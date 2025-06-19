/**
 * Aplicação Principal - Lina Frontend
 * Orquestra todos os componentes e inicializa a aplicação
 */

class LinaApp {
    constructor() {
        this.chatManager = null;
        this.debugPanel = null;
        this.threadSidebar = null; // 📝 THREADS SIDEBAR
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            console.log('[App] Inicializando Lina Frontend...');
            
            // Aguardar DOM carregar
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startApp());
            } else {
                this.startApp();
            }
            
        } catch (error) {
            console.error('[App] Erro na inicialização:', error);
            this.showError('Erro ao inicializar aplicação');
        }
    }

    /**
     * Inicia componentes da aplicação
     */
    async startApp() {
        try {
            console.log('[App] Iniciando componentes...');
            
            // Verificar elementos essenciais
            this.checkRequiredElements();
            
            // Inicializar debug panel primeiro
            this.debugPanel = new DebugPanel();
            window.debugPanel = this.debugPanel;
            
            // Carregar estado salvo
            this.debugPanel.loadState();
            
            // Inicializar chat manager
            this.chatManager = new ChatManager();
            window.chatManager = this.chatManager;
            
            // 📝 THREADS SIDEBAR: Inicializar se elemento existir
            if (document.getElementById('threadsSidebar')) {
                this.threadSidebar = window.threadSidebar || null; // Pode ser inicializada por threads-sidebar.js
                if (this.threadSidebar) {
                    console.log('[App] 📝 ThreadSidebar detectada e integrada');
                } else {
                    console.log('[App] 📝 ThreadSidebar não foi inicializada ainda - aguardando...');
                }
            }
            
            // Verificar conectividade
            await this.checkConnectivity();
            
            // Configurar event listeners globais
            this.setupGlobalListeners();
            
            // 📝 THREADS SIDEBAR: Configurar integração
            this.setupThreadsIntegration();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('[App] ✅ Lina Frontend inicializada com sucesso!');
            
            // Mostrar mensagem de boas-vindas no console
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('[App] Erro ao iniciar:', error);
            this.showError(`Erro ao iniciar: ${error.message}`);
        }
    }

    /**
     * Verifica se elementos essenciais existem
     */
    checkRequiredElements() {
        const requiredElements = [
            'chatMessages',
            'messageInput',
            'sendButton',
            'chatForm',
            'debugPanel',
            'toggleDebug',
            'newConversationBtn'
        ];

        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                throw new Error(`Elemento obrigatório não encontrado: ${elementId}`);
            }
        }
    }

    /**
     * Verifica conectividade com backend
     */
    async checkConnectivity() {
        try {
            console.log('[App] Verificando conectividade...');
            
            const isHealthy = await window.linaAPI.healthCheck();
            
            if (isHealthy) {
                console.log('[App] ✅ Backend conectado');
            } else {
                console.warn('[App] ⚠️ Backend não respondeu ao health check');
                this.showWarning('Backend pode estar offline');
            }
            
        } catch (error) {
            console.error('[App] ❌ Erro de conectividade:', error);
            this.showWarning('Não foi possível conectar ao backend');
        }
    }

    /**
     * Configura event listeners globais
     */
    setupGlobalListeners() {
        // Event listener para botão "Nova Conversa"
        const newConversationBtn = document.getElementById('newConversationBtn');
        if (newConversationBtn) {
            newConversationBtn.addEventListener('click', () => {
                this.startNewConversation();
            });
        }

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl+K ou Cmd+K para focar no input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.chatManager.messageInput.focus();
            }
            
            // Ctrl+D ou Cmd+D para toggle debug panel
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.debugPanel.togglePanel();
            }
            
            // Ctrl+N ou Cmd+N para nova conversa
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.startNewConversation();
            }
            
            // Escape para limpar input
            if (e.key === 'Escape') {
                this.chatManager.messageInput.value = '';
                this.chatManager.handleInputChange();
            }
        });

        // Detectar mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                // Verificar status quando página volta ao foco
                this.debugPanel.checkSystemStatus();
            }
        });

        // Detectar mudanças de conectividade
        window.addEventListener('online', () => {
            console.log('[App] Conexão restaurada');
            this.debugPanel.checkSystemStatus();
        });

        window.addEventListener('offline', () => {
            console.log('[App] Conexão perdida');
            this.showWarning('Conexão com internet perdida');
        });

        // Log de erros não capturados
        window.addEventListener('error', (e) => {
            console.error('[App] Erro não capturado:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('[App] Promise rejeitada:', e.reason);
        });
    }

    /**
     * 📝 THREADS SIDEBAR: Configura integração entre componentes
     */
    setupThreadsIntegration() {
        // Event listener para mudança de thread
        window.addEventListener('threadSwitch', (e) => {
            const { threadId } = e.detail;
            console.log('[App] 📝 Evento threadSwitch recebido:', threadId);
            
            if (this.chatManager && typeof this.chatManager.loadThread === 'function') {
                this.chatManager.loadThread(threadId);
            }
        });

        // Event listener para criação de nova thread
        window.addEventListener('newThread', () => {
            console.log('[App] 📝 Evento newThread recebido');
            this.startNewConversation();
        });

        // Sincronizar thread sidebar quando thread muda no chat
        if (this.chatManager) {
            // Hook para quando nova thread é criada
            const originalSendMessage = this.chatManager.sendMessage;
            if (originalSendMessage) {
                this.chatManager.sendMessage = async function(...args) {
                    const result = await originalSendMessage.apply(this, args);
                    
                    // Atualizar sidebar após nova mensagem
                    if (window.threadSidebar && typeof window.threadSidebar.refresh === 'function') {
                        setTimeout(() => {
                            window.threadSidebar.refresh();
                        }, 1000);
                    }
                    
                    return result;
                };
            }
        }

        console.log('[App] 📝 Integração com ThreadSidebar configurada');
    }

    /**
     * 📝 THREADS SIDEBAR: Integrar sidebar quando ela for carregada
     */
    integrateThreadSidebar() {
        if (window.threadSidebar && !this.threadSidebar) {
            this.threadSidebar = window.threadSidebar;
            console.log('[App] 📝 ThreadSidebar integrada posteriormente');
            
            // Configurar integração se ainda não foi feita
            this.setupThreadsIntegration();
        }
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        console.error(`[App] ${message}`);
        
        // Tentar mostrar no chat se disponível
        if (this.chatManager) {
            this.chatManager.addMessage(`❌ ${message}`, 'error');
        }
    }

    /**
     * Mostra mensagem de aviso
     */
    showWarning(message) {
        console.warn(`[App] ${message}`);
        
        // Tentar mostrar no chat se disponível
        if (this.chatManager) {
            this.chatManager.addMessage(`⚠️ ${message}`, 'system');
        }
    }

    /**
     * Mostra mensagem de boas-vindas no console
     */
    showWelcomeMessage() {
        console.log('%c🤖 Lina Frontend', 'font-size: 20px; font-weight: bold; color: #2563eb;');
        console.log('%cAssistente Pessoal Multi-Agente', 'font-size: 14px; color: #64748b;');
        console.log('%c─────────────────────────────────', 'color: #e2e8f0;');
        console.log('%c✨ Aplicação carregada com sucesso!', 'color: #10b981; font-weight: bold;');
        console.log('%c📚 Atalhos disponíveis:', 'color: #1e293b; font-weight: bold;');
        console.log('%c   • Ctrl/Cmd + K: Focar no input', 'color: #64748b;');
        console.log('%c   • Ctrl/Cmd + D: Toggle debug panel', 'color: #64748b;');
        console.log('%c   • Escape: Limpar input', 'color: #64748b;');
        console.log('%c─────────────────────────────────', 'color: #e2e8f0;');
        console.log('%c🔗 Variáveis globais:', 'color: #1e293b; font-weight: bold;');
        console.log('%c   • window.linaApp: Aplicação principal', 'color: #64748b;');
        console.log('%c   • window.chatManager: Gerenciador de chat', 'color: #64748b;');
        console.log('%c   • window.debugPanel: Painel de debug', 'color: #64748b;');
        console.log('%c   • window.linaAPI: Cliente da API', 'color: #64748b;');
    }

    /**
     * Inicia uma nova conversa (nova thread)
     */
    async startNewConversation() {
        console.log('[App] 🔄 Iniciando nova conversa...');
        
        try {
            // Mostrar feedback visual no botão
            const newConversationBtn = document.getElementById('newConversationBtn');
            if (newConversationBtn) {
                newConversationBtn.disabled = true;
                const originalText = newConversationBtn.querySelector('.btn-text').textContent;
                newConversationBtn.querySelector('.btn-text').textContent = 'Iniciando...';
                
                // Restaurar após 1 segundo
                setTimeout(() => {
                    newConversationBtn.disabled = false;
                    newConversationBtn.querySelector('.btn-text').textContent = originalText;
                }, 1000);
            }
            
            // Limpar chat visualmente
            if (this.chatManager) {
                this.chatManager.clearChat();
                // Limpar thread_id atual para forçar criação de nova thread
                this.chatManager.currentThreadId = null;
                console.log('[App] 🧵 Thread ID limpo - nova thread será criada na próxima mensagem');
            }
            
            // Resetar métricas da sessão
            if (this.debugPanel) {
                this.debugPanel.resetSession();
                console.log('[App] 📊 Métricas de sessão resetadas');
            }
            
            // Mostrar mensagem de boas-vindas da nova conversa
            if (this.chatManager) {
                this.chatManager.addMessage(
                    '👋 Nova conversa iniciada! Como posso ajudar você hoje?', 
                    'system'
                );
            }
            
            // Focar no input para o usuário começar
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
            
            console.log('[App] ✅ Nova conversa iniciada com sucesso');
            
        } catch (error) {
            console.error('[App] ❌ Erro ao iniciar nova conversa:', error);
            this.showError('Erro ao iniciar nova conversa');
        }
    }

    /**
     * Reinicia a aplicação
     */
    async restart() {
        console.log('[App] Reiniciando aplicação...');
        
        try {
            // Limpar chat
            if (this.chatManager) {
                this.chatManager.clearChat();
            }
            
            // Resetar sessão do debug panel
            if (this.debugPanel) {
                this.debugPanel.resetSession();
            }
            
            // Verificar conectividade novamente
            await this.checkConnectivity();
            
            console.log('[App] ✅ Aplicação reiniciada');
            
        } catch (error) {
            console.error('[App] Erro ao reiniciar:', error);
            this.showError('Erro ao reiniciar aplicação');
        }
    }

    /**
     * Obtém status da aplicação
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            components: {
                chatManager: !!this.chatManager,
                debugPanel: !!this.debugPanel,
                api: !!window.linaAPI
            },
            chat: this.chatManager ? this.chatManager.getStats() : null,
            session: this.debugPanel ? this.debugPanel.getSessionData() : null
        };
    }
}

// Inicializar aplicação quando script carregar
console.log('[App] Script carregado, inicializando...');
const linaApp = new LinaApp();

// Disponibilizar globalmente para debug
window.linaApp = linaApp;

// Verificar se todas as dependências estão carregadas
if (typeof LinaAPI === 'undefined') {
    console.error('[App] LinaAPI não carregada - verifique se api.js foi incluído');
}

if (typeof ChatManager === 'undefined') {
    console.error('[App] ChatManager não carregada - verifique se chat.js foi incluído');
}

if (typeof DebugPanel === 'undefined') {
    console.error('[App] DebugPanel não carregada - verifique se debug-panel.js foi incluído');
}
