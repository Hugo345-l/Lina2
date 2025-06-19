/**
 * API Client para comunicação com o backend Lina
 * Gerencia todas as chamadas HTTP para o LangServe
 * 🧵 CHECKPOINT 1.4: Incluindo Thread Management
 */

class LinaAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json;charset=utf-8'
        };
        
        // 🧵 CHECKPOINT 1.4: Thread Management
        this.currentThreadId = null;
        this.userId = 'default_user'; // Por enquanto usuário fixo
    }

    /**
     * Verifica se o backend está funcionando
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.error('Health check error:', error);
            return false;
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Cria nova thread de conversação
     * @param {string} userId - ID do usuário
     * @param {object} metadata - Metadados opcionais da thread
     * @returns {Promise<{success: boolean, thread_id: string}>}
     */
    async createNewThread(userId = null, metadata = null) {
        try {
            const payload = {
                user_id: userId || this.userId,
                metadata: metadata
            };

            console.log('[API] 🧵 Criando nova thread:', payload);

            const response = await fetch(`${this.baseURL}/chat/new-thread`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 🧵 Thread criada:', data);

            if (data.success && data.thread_id) {
                this.currentThreadId = data.thread_id;
                console.log('[API] 🧵 Thread ID armazenado:', this.currentThreadId);
            }

            return data;

        } catch (error) {
            console.error('[API] 🧵 Erro ao criar thread:', error);
            throw error;
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Envia mensagem mantendo thread de conversação
     * @param {string} message - Mensagem do usuário
     * @param {string} threadId - ID da thread (opcional, usa currentThreadId se não fornecido)
     * @returns {Promise<{output: string, debug_info: object}>}
     */
    async sendMessage(message, threadId = null) {
        try {
            // 🧵 CHECKPOINT 1.4: Usar thread_id se disponível
            const useThreadId = threadId || this.currentThreadId;
            
            const payload = {
                input: {
                    input: message,
                    // 🧵 Incluir thread_id no payload
                    ...(useThreadId && { thread_id: useThreadId })
                }
            };

            console.log('[API] 🧵 Enviando mensagem com thread:', { 
                message, 
                thread_id: useThreadId, 
                payload 
            });

            const response = await fetch(`${this.baseURL}/chat/invoke`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] Resposta recebida:', data);
            console.log('[API] Chaves da resposta:', Object.keys(data));
            
            // LangServe pode envolver a resposta em diferentes estruturas
            let actualData = data;
            
            // Se há uma propriedade 'output' que é um objeto, usar ela
            if (data.output && typeof data.output === 'object' && data.output.output) {
                actualData = data.output;
                console.log('[API] Usando data.output como resposta real');
            }
            
            console.log('[API] Dados finais:', actualData);
            console.log('[API] Chaves dos dados finais:', Object.keys(actualData));
            console.log('[API] Tipo de output:', typeof actualData.output);
            console.log('[API] Tipo de debug_info:', typeof actualData.debug_info);

            // 🧵 CHECKPOINT 1.4: Atualizar thread_id se retornado no debug_info
            if (actualData.debug_info && actualData.debug_info.thread_id) {
                this.currentThreadId = actualData.debug_info.thread_id;
                console.log('[API] 🧵 Thread ID atualizado:', this.currentThreadId);
            }

            // Validar estrutura da resposta
            if (!actualData || typeof actualData !== 'object') {
                console.error('[API] Dados inválidos:', actualData);
                throw new Error('Resposta inválida do servidor');
            }

            if (!actualData.hasOwnProperty('output')) {
                console.error('[API] Propriedade output não encontrada. Chaves disponíveis:', Object.keys(actualData));
                throw new Error('Propriedade output não encontrada na resposta');
            }

            if (!actualData.hasOwnProperty('debug_info')) {
                console.error('[API] Propriedade debug_info não encontrada. Chaves disponíveis:', Object.keys(actualData));
                throw new Error('Propriedade debug_info não encontrada na resposta');
            }

            return {
                output: actualData.output,
                debug_info: actualData.debug_info
            };

        } catch (error) {
            console.error('[API] Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Inicia nova conversa (limpa thread atual)
     * @returns {Promise<{success: boolean, thread_id: string}>}
     */
    async startNewConversation() {
        try {
            console.log('[API] 🧵 Iniciando nova conversa...');
            
            const result = await this.createNewThread();
            
            if (result.success) {
                console.log('[API] 🧵 Nova conversa iniciada com thread:', result.thread_id);
            }
            
            return result;
            
        } catch (error) {
            console.error('[API] 🧵 Erro ao iniciar nova conversa:', error);
            throw error;
        }
    }

    /**
     * 🧵 CHECKPOINT 1.4: Obtém thread ID atual
     * @returns {string|null}
     */
    getCurrentThreadId() {
        return this.currentThreadId;
    }

    /**
     * 🧵 CHECKPOINT 1.4: Reseta thread atual
     */
    resetThread() {
        console.log('[API] 🧵 Resetando thread atual');
        this.currentThreadId = null;
    }

    /**
     * Testa a conexão com endpoint específico
     * @param {string} message - Mensagem de teste
     * @returns {Promise<object>}
     */
    async testEndpoint(message = 'Teste de conexão') {
        try {
            const payload = { input: message };
            
            const response = await fetch(`${this.baseURL}/test`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Test endpoint failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Test endpoint error:', error);
            throw error;
        }
    }

    /**
     * 📝 THREADS SIDEBAR: Lista threads do usuário
     * @param {string} userId - ID do usuário
     * @param {number} limit - Limite de threads a buscar
     * @returns {Promise<{success: boolean, threads: Array, groups: object}>}
     */
    async getUserThreads(userId = null, limit = 50) {
        try {
            const searchParams = new URLSearchParams({
                user_id: userId || this.userId,
                limit: limit.toString()
            });

            console.log('[API] 📝 Buscando threads do usuário:', { userId: userId || this.userId, limit });

            const response = await fetch(`${this.baseURL}/chat/threads?${searchParams}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 📝 Threads recebidas:', data);

            return data;

        } catch (error) {
            console.error('[API] 📝 Erro ao buscar threads:', error);
            throw error;
        }
    }

    /**
     * 📝 THREADS SIDEBAR: Obtém detalhes de uma thread específica
     * @param {string} threadId - ID da thread
     * @returns {Promise<object>}
     */
    async getThreadDetails(threadId) {
        try {
            console.log('[API] 📝 Buscando detalhes da thread:', threadId);

            const response = await fetch(`${this.baseURL}/chat/threads/${threadId}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 📝 Detalhes da thread:', data);

            return data;

        } catch (error) {
            console.error('[API] 📝 Erro ao buscar detalhes da thread:', error);
            throw error;
        }
    }

    /**
     * 📝 THREADS SIDEBAR: Atualiza título de uma thread
     * @param {string} threadId - ID da thread
     * @param {string} newTitle - Novo título
     * @returns {Promise<{success: boolean}>}
     */
    async updateThreadTitle(threadId, newTitle) {
        try {
            const payload = { title: newTitle };

            console.log('[API] 📝 Atualizando título da thread:', { threadId, newTitle });

            const response = await fetch(`${this.baseURL}/chat/threads/${threadId}/title`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 📝 Título atualizado:', data);

            return data;

        } catch (error) {
            console.error('[API] 📝 Erro ao atualizar título:', error);
            throw error;
        }
    }

    /**
     * 📝 THREADS SIDEBAR: Exclui uma thread
     * @param {string} threadId - ID da thread
     * @returns {Promise<{success: boolean}>}
     */
    async deleteThread(threadId) {
        try {
            console.log('[API] 📝 Excluindo thread:', threadId);

            const response = await fetch(`${this.baseURL}/chat/threads/${threadId}`, {
                method: 'DELETE',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 📝 Thread excluída:', data);

            return data;

        } catch (error) {
            console.error('[API] 📝 Erro ao excluir thread:', error);
            throw error;
        }
    }

    /**
     * 📝 NOVO: Busca histórico de mensagens de uma thread específica
     * @param {string} threadId - ID da thread
     * @param {number} limit - Limite de mensagens (padrão: 50)
     * @returns {Promise<{success: boolean, messages: Array, total_messages: number}>}
     */
    async getThreadMessages(threadId, limit = 50) {
        try {
            console.log('[API] 📝 Buscando mensagens da thread:', threadId);

            const response = await fetch(`${this.baseURL}/chat/threads/${threadId}/messages?limit=${limit}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] 📝 Mensagens da thread recebidas:', data);

            return data;

        } catch (error) {
            console.error('[API] 📝 Erro ao buscar mensagens da thread:', error);
            throw error;
        }
    }

    /**
     * 📝 THREADS SIDEBAR: Carrega thread completa com histórico de mensagens
     * @param {string} threadId - ID da thread
     * @returns {Promise<object>}
     */
    async loadThread(threadId) {
        try {
            console.log('[API] 📝 Carregando thread completa:', threadId);

            // Definir thread atual
            this.currentThreadId = threadId;

            // Buscar histórico de mensagens da thread
            const messagesResult = await this.getThreadMessages(threadId);

            if (messagesResult.success) {
                console.log('[API] 📝 Thread carregada com', messagesResult.total_messages, 'mensagens');
                
                return {
                    success: true,
                    thread_id: threadId,
                    messages: messagesResult.messages,
                    total_messages: messagesResult.total_messages,
                    message: 'Thread carregada com sucesso'
                };
            } else {
                throw new Error(messagesResult.error || 'Erro ao carregar mensagens da thread');
            }

        } catch (error) {
            console.error('[API] 📝 Erro ao carregar thread:', error);
            throw error;
        }
    }

    /**
     * Obtém informações do sistema
     * @returns {Promise<object>}
     */
    async getSystemInfo() {
        try {
            const health = await this.healthCheck();
            
            return {
                backend_status: health ? 'Online' : 'Offline',
                api_status: 'Ready',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('System info error:', error);
            return {
                backend_status: 'Error',
                api_status: 'Error',
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Instância global da API
window.linaAPI = new LinaAPI();
