/**
 * 📝 THREADS SIDEBAR - JavaScript
 * Sistema de navegação de conversas
 * Segue padrões estabelecidos pelo DebugPanel e ChatManager
 */

class ThreadSidebar {
    constructor() {
        this.sidebar = document.getElementById('threadsSidebar');
        this.isCollapsed = false;
        this.isMobileOpen = false;
        this.threads = [];
        this.filteredThreads = [];
        this.currentFilter = '';
        this.activeThreadId = null;
        
        // Estados dos grupos (expandido/colapsado)
        this.groupStates = {
            today: true,
            yesterday: true,
            thisWeek: false,
            thisMonth: false,
            older: false
        };
        
        // Elementos do DOM
        this.elements = {
            newThreadBtn: document.getElementById('newThreadBtn'),
            searchBtn: document.getElementById('threadsSearchBtn'),
            collapseBtn: document.getElementById('threadsCollapseBtn'),
            expandBtn: document.getElementById('threadsExpandBtn'),
            searchContainer: document.getElementById('threadsSearch'),
            searchInput: document.getElementById('threadsSearchInput'),
            searchClear: document.getElementById('searchClear'),
            content: document.getElementById('threadsContent'),
            empty: document.getElementById('threadsEmpty'),
            loading: document.getElementById('threadsLoading'),
            resizeHandle: document.getElementById('threadsResizeHandle')
        };
        
        this.init();
    }

    init() {
        console.log('[Threads] 🚀 Inicializando sidebar de threads');
        
        try {
            // Setup componentes
            this.setupEventListeners();
            this.setupResizing();
            this.setupGroupToggling();
            this.loadState();
            
            // Carregar threads iniciais
            this.loadThreads();
            
            console.log('[Threads] ✅ Sidebar inicializada com sucesso');
        } catch (error) {
            console.error('[Threads] ❌ Erro na inicialização:', error);
        }
    }

    /**
     * Setup dos event listeners
     */
    setupEventListeners() {
        // Botão nova thread
        if (this.elements.newThreadBtn) {
            this.elements.newThreadBtn.addEventListener('click', () => {
                this.createNewThread();
            });
        }

        // Botão busca
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.toggleSearch();
            });
        }

        // Botão colapsar
        if (this.elements.collapseBtn) {
            this.elements.collapseBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // Botão expandir (header interno)
        if (this.elements.expandBtn) {
            this.elements.expandBtn.addEventListener('click', () => {
                this.expand();
            });
        }

        // CORREÇÃO: Conectar botão expandir global também
        const globalExpandBtn = document.getElementById('threadsExpandBtn');
        if (globalExpandBtn) {
            globalExpandBtn.addEventListener('click', () => {
                console.log('[Threads] 🔄 Botão de expansão clicado - expandindo sidebar');
                this.expand();
            });
        }

        // Input de busca
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            this.elements.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }

        // Botão limpar busca
        if (this.elements.searchClear) {
            this.elements.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Atalhos de teclado
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup dos atalhos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleCollapse();
            }
            
            // Ctrl/Cmd + Shift + F: Focar busca
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.focusSearch();
            }
        });
    }

    /**
     * Setup do redimensionamento - ADAPTADO do debug panel
     */
    setupResizing() {
        if (!this.elements.resizeHandle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        // Carregar largura salva
        const savedWidth = localStorage.getItem('threadsSidebarWidth');
        if (savedWidth) {
            this.sidebar.style.width = savedWidth + 'px';
        }

        // Mouse down
        this.elements.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.sidebar).width, 10);
            
            this.sidebar.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            console.log('[Threads] 🔧 Iniciando redimensionamento');
        });

        // Mouse move - LÓGICA NORMAL (direita expande)
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diffX = e.clientX - startX;
            const newWidth = startWidth + diffX;

            // Limites
            const minWidth = 250;
            const maxWidth = Math.min(400, window.innerWidth * 0.4);

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                this.sidebar.style.width = newWidth + 'px';
            }
        });

        // Mouse up
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;

            isResizing = false;
            this.sidebar.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Salvar largura
            const finalWidth = parseInt(document.defaultView.getComputedStyle(this.sidebar).width, 10);
            localStorage.setItem('threadsSidebarWidth', finalWidth);

            console.log('[Threads] 🔧 Redimensionamento finalizado:', finalWidth + 'px');
        });
    }

    /**
     * Setup do toggling de grupos
     */
    setupGroupToggling() {
        // Event delegation para headers de grupos
        if (this.elements.content) {
            this.elements.content.addEventListener('click', (e) => {
                const header = e.target.closest('.group-header');
                if (header) {
                    const groupName = header.getAttribute('data-toggle');
                    if (groupName) {
                        this.toggleGroup(groupName);
                    }
                }
            });
        }
    }

    /**
     * Carregar estado salvo
     */
    loadState() {
        try {
            // Carregar estados dos grupos
            const savedGroupStates = localStorage.getItem('threadsSidebarGroupStates');
            if (savedGroupStates) {
                this.groupStates = { ...this.groupStates, ...JSON.parse(savedGroupStates) };
            }

            // Carregar estado de collapse
            const savedCollapsed = localStorage.getItem('threadsSidebarCollapsed');
            if (savedCollapsed === 'true') {
                this.collapse();
            }

            console.log('[Threads] 📁 Estado carregado:', this.groupStates);
        } catch (error) {
            console.error('[Threads] ❌ Erro ao carregar estado:', error);
        }
    }

    /**
     * Salvar estado atual
     */
    saveState() {
        try {
            localStorage.setItem('threadsSidebarGroupStates', JSON.stringify(this.groupStates));
            localStorage.setItem('threadsSidebarCollapsed', this.isCollapsed.toString());
        } catch (error) {
            console.error('[Threads] ❌ Erro ao salvar estado:', error);
        }
    }

    /**
     * Carregar threads via API
     */
    async loadThreads() {
        try {
            console.log('[Threads] 📡 Carregando threads...');
            this.showLoading();
            
            // Usar API client existente
            if (!window.linaAPI) {
                throw new Error('LinaAPI não disponível');
            }

            const response = await fetch(window.linaAPI.baseURL + '/chat/threads?user_id=default_user');
            const data = await response.json();
            
            if (data.success) {
                this.threads = data.threads || [];
                this.filteredThreads = [...this.threads];
                
                console.log(`[Threads] ✅ ${this.threads.length} threads carregadas`);
                console.log(`[Threads] 📊 Grupos:`, Object.entries(data.groups || {}).map(([k, v]) => `${k}: ${v.length}`));
                
                this.renderThreads(data.groups || {});
            } else {
                throw new Error(data.error || 'Erro desconhecido ao carregar threads');
            }
            
        } catch (error) {
            console.error('[Threads] ❌ Erro ao carregar threads:', error);
            this.renderEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Renderizar threads organizadas por grupos
     */
    renderThreads(groups) {
        if (this.threads.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.hideEmpty();

        // Renderizar cada grupo
        Object.entries(groups).forEach(([groupName, threads]) => {
            this.renderThreadGroup(groupName, threads);
        });

        // Aplicar estados dos grupos
        this.applyGroupStates();

        // Destacar thread ativa se houver
        if (this.activeThreadId) {
            this.highlightActiveThread(this.activeThreadId);
        }
    }

    /**
     * Renderizar grupo específico
     */
    renderThreadGroup(groupName, threads) {
        const container = document.getElementById(`threads${this.capitalize(groupName)}`);
        const counter = document.getElementById(`count${this.capitalize(groupName)}`);
        
        if (!container) {
            console.warn(`[Threads] ⚠️ Container não encontrado para grupo: ${groupName}`);
            return;
        }

        // Atualizar contador
        if (counter) {
            counter.textContent = `(${threads.length})`;
        }

        // Se não há threads, limpar e esconder grupo
        if (threads.length === 0) {
            container.innerHTML = '';
            const groupElement = container.closest('.threads-group');
            if (groupElement) {
                groupElement.style.display = 'none';
            }
            return;
        }

        // Mostrar grupo e renderizar threads
        const groupElement = container.closest('.threads-group');
        if (groupElement) {
            groupElement.style.display = 'block';
        }

        const threadsHTML = threads.map(thread => this.renderThreadItem(thread)).join('');
        container.innerHTML = threadsHTML;

        console.log(`[Threads] 📁 Grupo ${groupName} renderizado: ${threads.length} threads`);
    }

    /**
     * Renderizar item individual de thread
     */
    renderThreadItem(thread) {
        const isActive = thread.id === this.activeThreadId;
        const preview = this.truncateText(thread.lastMessage || 'Nova conversa', 80);
        const timestamp = this.formatRelativeTime(thread.lastActivity);
        const cost = this.formatCost(thread.totalCost);
        
        // Extrair ID curto para exibição
        const shortId = this.extractShortThreadId(thread.id);
        
        // Título com ID se for padrão
        let displayTitle = thread.title;
        if (thread.title === 'Nova Conversa' || thread.title === 'Conversa') {
            displayTitle = `Thread ${shortId}`;
        }
        
        return `
            <div class="thread-item ${isActive ? 'active' : ''}" 
                 data-thread-id="${thread.id}"
                 onclick="window.threadSidebar.switchToThread('${thread.id}')"
                 title="Thread ID: ${thread.id}">
                <div class="thread-header">
                    <div class="thread-title">${this.escapeHtml(displayTitle)}</div>
                    <span class="thread-id">#${shortId}</span>
                </div>
                <div class="thread-preview">${this.escapeHtml(preview)}</div>
                <div class="thread-meta">
                    <span class="thread-count">${thread.messageCount} msgs</span>
                    <span class="thread-cost">${cost}</span>
                    <span class="thread-time">${timestamp}</span>
                </div>
            </div>
        `;
    }
    /**
     * Extrai ID curto da thread para exibição
     */
    extractShortThreadId(threadId) {
        if (!threadId) return 'unknown';
        
        // Extrair últimos 8 caracteres (hash)
        const match = threadId.match(/_([a-f0-9]{8})$/);
        if (match) {
            return match[1];
        }
        
        // Fallback: últimos 8 caracteres
        return threadId.slice(-8);
    }

    /**
     * Alternar para thread específica
     */
    async switchToThread(threadId) {
        try {
            console.log(`[Threads] 🧵 Alternando para thread: ${threadId}`);
            
            // Integração com chat manager existente
            if (window.chatManager && typeof window.chatManager.loadThread === 'function') {
                await window.chatManager.loadThread(threadId);
            } else {
                // Fallback: disparar evento personalizado
                window.dispatchEvent(new CustomEvent('threadSwitch', {
                    detail: { threadId }
                }));
            }
            
            // Atualizar estado visual
            this.setActiveThread(threadId);
            
            console.log(`[Threads] ✅ Thread ativa: ${threadId}`);
            
        } catch (error) {
            console.error(`[Threads] ❌ Erro ao alternar thread:`, error);
        }
    }

    /**
     * Definir thread ativa
     */
    setActiveThread(threadId) {
        this.activeThreadId = threadId;
        this.highlightActiveThread(threadId);
    }

    /**
     * Destacar thread ativa visualmente
     */
    highlightActiveThread(threadId) {
        // Remover active de todas
        document.querySelectorAll('.thread-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Adicionar active na atual
        const activeItem = document.querySelector(`[data-thread-id="${threadId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            
            // Scroll para thread ativa se necessário
            activeItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    /**
     * Criar nova thread
     */
    async createNewThread() {
        try {
            console.log('[Threads] 🔄 Criando nova thread...');
            
            // Integração com app existente
            if (window.linaApp && typeof window.linaApp.startNewConversation === 'function') {
                await window.linaApp.startNewConversation();
            } else {
                // Fallback: disparar evento
                window.dispatchEvent(new CustomEvent('newThread'));
            }
            
            // Recarregar threads após um breve delay
            setTimeout(() => {
                this.loadThreads();
            }, 500);
            
            console.log('[Threads] ✅ Nova thread criada');
            
        } catch (error) {
            console.error('[Threads] ❌ Erro ao criar nova thread:', error);
        }
    }

    /**
     * Toggle de busca
     */
    toggleSearch() {
        if (!this.elements.searchContainer) return;

        const isVisible = this.elements.searchContainer.style.display !== 'none';
        
        if (isVisible) {
            this.elements.searchContainer.style.display = 'none';
            this.clearSearch();
        } else {
            this.elements.searchContainer.style.display = 'block';
            this.elements.searchInput.focus();
        }
    }

    /**
     * Focar na busca
     */
    focusSearch() {
        if (this.elements.searchContainer.style.display === 'none') {
            this.toggleSearch();
        } else {
            this.elements.searchInput.focus();
        }
    }

    /**
     * Manipular busca
     */
    handleSearch(query) {
        this.currentFilter = query.toLowerCase().trim();
        
        if (this.currentFilter === '') {
            this.filteredThreads = [...this.threads];
        } else {
            this.filteredThreads = this.threads.filter(thread => 
                thread.title.toLowerCase().includes(this.currentFilter) ||
                thread.lastMessage.toLowerCase().includes(this.currentFilter)
            );
        }
        
        // Re-agrupar threads filtradas
        const filteredGroups = this.groupThreadsByDate(this.filteredThreads);
        this.renderThreads(filteredGroups);
        
        console.log(`[Threads] 🔍 Busca: "${query}" - ${this.filteredThreads.length} resultados`);
    }

    /**
     * Limpar busca
     */
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        this.handleSearch('');
    }

    /**
     * Toggle de grupo
     */
    toggleGroup(groupName) {
        this.groupStates[groupName] = !this.groupStates[groupName];
        this.applyGroupState(groupName);
        this.saveState();
        
        console.log(`[Threads] 📁 Grupo ${groupName}: ${this.groupStates[groupName] ? 'expandido' : 'colapsado'}`);
    }

    /**
     * Aplicar estado de um grupo específico
     */
    applyGroupState(groupName) {
        const header = document.querySelector(`[data-toggle="${groupName}"]`);
        const container = document.getElementById(`threads${this.capitalize(groupName)}`);
        
        if (!header || !container) return;

        const isExpanded = this.groupStates[groupName];
        
        header.classList.toggle('collapsed', !isExpanded);
        container.classList.toggle('collapsed', !isExpanded);
    }

    /**
     * Aplicar estados de todos os grupos
     */
    applyGroupStates() {
        Object.keys(this.groupStates).forEach(groupName => {
            this.applyGroupState(groupName);
        });
    }

    /**
     * Toggle de collapse da sidebar
     */
    toggleCollapse() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Colapsar sidebar
     */
    collapse() {
        this.isCollapsed = true;
        this.sidebar.classList.add('collapsed');
        
        // Atualizar layout principal
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.add('threads-collapsed');
        }
        
        // CORREÇÃO: Mostrar botão de expansão
        const expandBtn = document.getElementById('threadsExpandBtn');
        if (expandBtn) {
            expandBtn.style.display = 'flex';
        }
        
        this.saveState();
        console.log('[Threads] ◀ Sidebar colapsada - botão de expansão ativado');
    }

    /**
     * Expandir sidebar
     */
    expand() {
        this.isCollapsed = false;
        this.sidebar.classList.remove('collapsed');
        
        // Atualizar layout principal
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.remove('threads-collapsed');
        }
        
        // CORREÇÃO: Esconder botão de expansão
        const expandBtn = document.getElementById('threadsExpandBtn');
        if (expandBtn) {
            expandBtn.style.display = 'none';
        }
        
        this.saveState();
        console.log('[Threads] ▶ Sidebar expandida - botão de expansão desativado');
    }

    /**
     * Agrupar threads por data
     */
    groupThreadsByDate(threads) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            thisMonth: [],
            older: []
        };

        threads.forEach(thread => {
            try {
                const threadDate = new Date(thread.lastActivity);
                
                if (threadDate >= today) {
                    groups.today.push(thread);
                } else if (threadDate >= yesterday) {
                    groups.yesterday.push(thread);
                } else if (threadDate >= weekAgo) {
                    groups.thisWeek.push(thread);
                } else if (threadDate >= monthAgo) {
                    groups.thisMonth.push(thread);
                } else {
                    groups.older.push(thread);
                }
            } catch (error) {
                console.warn(`[Threads] ⚠️ Erro ao processar data da thread ${thread.id}:`, error);
                groups.older.push(thread);
            }
        });

        return groups;
    }

    /**
     * Estados visuais
     */
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'block';
        }
        this.hideEmpty();
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    }

    renderEmptyState() {
        this.hideLoading();
        if (this.elements.empty) {
            this.elements.empty.style.display = 'block';
        }
    }

    hideEmpty() {
        if (this.elements.empty) {
            this.elements.empty.style.display = 'none';
        }
    }

    /**
     * Utilitários
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatRelativeTime(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 1) {
                return 'Agora';
            } else if (diffHours < 24) {
                return `${diffHours}h`;
            } else if (diffDays < 7) {
                return `${diffDays}d`;
            } else {
                return date.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                });
            }
        } catch (error) {
            return 'Data inválida';
        }
    }

    formatCost(cost) {
        if (cost < 0.001) {
            return '<$0.001';
        }
        return `$${cost.toFixed(3)}`;
    }

    /**
     * API pública para integração
     */
    refresh() {
        this.loadThreads();
    }

    getActiveThreadId() {
        return this.activeThreadId;
    }

    syncWithChat(threadId) {
        this.setActiveThread(threadId);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('threadsSidebar')) {
        window.threadSidebar = new ThreadSidebar();
        console.log('[Threads] 🎯 ThreadSidebar disponível globalmente');
    }
});

// Exportar para uso global
window.ThreadSidebar = ThreadSidebar;
