/**
 * API Client para comunicação com o backend Lina
 * Gerencia todas as chamadas HTTP para o LangServe
 */

class LinaAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json;charset=utf-8'
        };
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
     * Envia mensagem para a Lina via LangServe
     * @param {string} message - Mensagem do usuário
     * @returns {Promise<{output: string, debug_info: object}>}
     */
    async sendMessage(message) {
        try {
            const payload = {
                input: {
                    input: message
                }
            };

            console.log('[API] Enviando mensagem:', { message, payload });

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
