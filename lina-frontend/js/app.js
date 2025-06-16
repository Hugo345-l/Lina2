/**
 * Aplicação Principal - Lina Frontend
 * Orquestra todos os componentes e inicializa a aplicação
 */

class LinaApp {
    constructor() {
        this.chatManager = null;
        this.debugPanel = null;
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
            
            // Verificar conectividade
            await this.checkConnectivity();
            
            // Configurar event listeners globais
            this.setupGlobalListeners();
            
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
            'toggleDebug'
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
