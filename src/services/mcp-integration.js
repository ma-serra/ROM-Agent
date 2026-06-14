/**
 * MCP Integration Service
 *
 * Gerenciador de servidores MCP (Model Context Protocol) do projeto ROM-Completo
 * - Conecta aos 3 servidores: autos, jurisprudencia, tribunais2grau
 * - Health checks periódicos
 * - Exposição de ferramentas para subagentes
 * - Logging de eventos no EventBus
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuração dos servidores MCP disponíveis
 */
const MCP_SERVERS_CONFIG = {
  autos: {
    name: 'autos',
    displayName: 'Autos MCP Server',
    description: 'Inventário de autos via MNI (PJe/eproc/Projudi/ESAJ) com trava de integridade',
    path: path.join(process.cwd(), 'projeto-rom-completo/rom-agent/mcp/autos'),
    main: 'dist/index.js',
    enabled: true,
    healthCheckInterval: 60000, // 1 minuto
    restartOnFailure: true,
    maxRestarts: 3
  },
  jurisprudencia: {
    name: 'jurisprudencia',
    displayName: 'Jurisprudência MCP Server',
    description: 'Acesso a jurisprudência (STJ/STF/tribunais) e verificação de citações',
    path: path.join(process.cwd(), 'projeto-rom-completo/rom-agent/mcp/jurisprudencia'),
    main: 'dist/index.js',
    enabled: true,
    healthCheckInterval: 60000,
    restartOnFailure: true,
    maxRestarts: 3
  },
  tribunais2grau: {
    name: 'tribunais2grau',
    displayName: 'Tribunais 2º Grau MCP Server',
    description: 'Segundo grau nacional (TJ/TRF/TRT) via DataJud e portais',
    path: path.join(process.cwd(), 'projeto-rom-completo/rom-agent/mcp/tribunais2grau'),
    main: 'dist/index.js',
    enabled: true,
    healthCheckInterval: 60000,
    restartOnFailure: true,
    maxRestarts: 3
  }
};

/**
 * Classe gerenciadora de servidores MCP
 */
class MCPIntegrationService {
  constructor(eventBus = null, stateManager = null) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Map de processos ativos: serverName → { process, status, tools, restarts }
    this.servers = new Map();

    // Map de health check intervals
    this.healthCheckIntervals = new Map();

    // Métricas
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  /**
   * Inicializa todos os servidores MCP habilitados
   */
  async initializeAll() {
    console.log('🔌 Inicializando servidores MCP...');

    const results = [];

    for (const [serverName, config] of Object.entries(MCP_SERVERS_CONFIG)) {
      if (config.enabled) {
        try {
          const result = await this.startServer(serverName, config);
          results.push({ serverName, success: true, ...result });
        } catch (error) {
          console.error(`❌ Erro ao iniciar ${serverName}:`, error.message);
          results.push({ serverName, success: false, error: error.message });

          // Atualizar status no banco
          await this.updateServerStatus(serverName, 'error', error.message);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ ${successCount}/${results.length} servidores MCP inicializados`);

    return results;
  }

  /**
   * Inicia um servidor MCP específico
   *
   * @param {string} serverName - Nome do servidor
   * @param {object} config - Configuração do servidor
   */
  async startServer(serverName, config) {
    console.log(`🚀 Iniciando servidor MCP: ${config.displayName}...`);

    // Verificar se o servidor já está rodando
    if (this.servers.has(serverName)) {
      const existing = this.servers.get(serverName);
      if (existing.status === 'running') {
        console.log(`⚠️ Servidor ${serverName} já está rodando`);
        return { status: 'already_running' };
      }
    }

    try {
      // Verificar se o diretório existe
      const fs = await import('fs/promises');
      const serverPath = path.join(config.path, config.main);

      try {
        await fs.access(serverPath);
      } catch (error) {
        throw new Error(`Servidor ${serverName} não encontrado em: ${serverPath}`);
      }

      // Spawn do processo Node.js
      const serverProcess = spawn('node', [config.main], {
        cwd: config.path,
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      });

      // Estado do servidor
      const serverState = {
        process: serverProcess,
        status: 'starting',
        config,
        tools: [],
        startedAt: new Date(),
        lastHealthCheck: null,
        errorCount: 0,
        restarts: 0,
        pid: serverProcess.pid
      };

      this.servers.set(serverName, serverState);

      // Handlers de eventos do processo
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[${serverName}] stdout:`, output.substring(0, 200));

        // Detectar inicialização bem-sucedida
        if (output.includes('Server started') || output.includes('ready')) {
          serverState.status = 'running';
          console.log(`✅ Servidor ${serverName} iniciado (PID: ${serverState.pid})`);

          this.publishEvent('mcp.server.started', {
            serverName,
            displayName: config.displayName,
            pid: serverState.pid
          });

          this.updateServerStatus(serverName, 'running');
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[${serverName}] stderr:`, error.substring(0, 200));

        serverState.errorCount++;

        this.publishEvent('mcp.server.error', {
          serverName,
          error: error.substring(0, 500)
        });
      });

      serverProcess.on('exit', (code, signal) => {
        console.log(`🔴 Servidor ${serverName} encerrado (code: ${code}, signal: ${signal})`);

        serverState.status = 'stopped';

        this.publishEvent('mcp.server.stopped', {
          serverName,
          code,
          signal
        });

        this.updateServerStatus(serverName, 'stopped', `Exited with code ${code}`);

        // Auto-restart se configurado
        if (config.restartOnFailure && serverState.restarts < config.maxRestarts) {
          console.log(`♻️ Reiniciando ${serverName} (tentativa ${serverState.restarts + 1}/${config.maxRestarts})...`);

          setTimeout(() => {
            serverState.restarts++;
            this.startServer(serverName, config);
          }, 5000); // 5 segundos de delay
        }
      });

      serverProcess.on('error', (error) => {
        console.error(`❌ Erro no processo ${serverName}:`, error);
        serverState.status = 'error';
        serverState.errorCount++;

        this.updateServerStatus(serverName, 'error', error.message);
      });

      // Iniciar health checks periódicos
      if (config.healthCheckInterval) {
        this.startHealthCheck(serverName, config.healthCheckInterval);
      }

      // Aguardar 2 segundos para verificar se iniciou
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (serverState.status === 'running') {
        await this.updateServerStatus(serverName, 'running');
        return { status: 'running', pid: serverState.pid };
      } else {
        throw new Error(`Servidor ${serverName} não iniciou corretamente`);
      }

    } catch (error) {
      console.error(`❌ Erro ao iniciar servidor ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Para um servidor MCP
   *
   * @param {string} serverName - Nome do servidor
   */
  async stopServer(serverName) {
    const serverState = this.servers.get(serverName);

    if (!serverState) {
      throw new Error(`Servidor ${serverName} não encontrado`);
    }

    console.log(`🛑 Parando servidor ${serverName}...`);

    // Parar health check
    this.stopHealthCheck(serverName);

    // Kill do processo
    if (serverState.process && !serverState.process.killed) {
      serverState.process.kill('SIGTERM');

      // Force kill após 5 segundos
      setTimeout(() => {
        if (!serverState.process.killed) {
          serverState.process.kill('SIGKILL');
        }
      }, 5000);
    }

    serverState.status = 'stopped';
    await this.updateServerStatus(serverName, 'stopped');

    this.publishEvent('mcp.server.stopped', { serverName });
  }

  /**
   * Inicia health checks periódicos
   *
   * @param {string} serverName - Nome do servidor
   * @param {number} interval - Intervalo em ms
   */
  startHealthCheck(serverName, interval) {
    // Parar health check existente se houver
    this.stopHealthCheck(serverName);

    const intervalId = setInterval(async () => {
      await this.performHealthCheck(serverName);
    }, interval);

    this.healthCheckIntervals.set(serverName, intervalId);
  }

  /**
   * Para health checks
   *
   * @param {string} serverName - Nome do servidor
   */
  stopHealthCheck(serverName) {
    const intervalId = this.healthCheckIntervals.get(serverName);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(serverName);
    }
  }

  /**
   * Executa health check em um servidor
   *
   * @param {string} serverName - Nome do servidor
   */
  async performHealthCheck(serverName) {
    const serverState = this.servers.get(serverName);

    if (!serverState) {
      return;
    }

    try {
      // Verificar se o processo ainda está vivo
      const isAlive = serverState.process && !serverState.process.killed;

      if (isAlive) {
        serverState.lastHealthCheck = new Date();
        serverState.status = 'running';

        await this.updateServerStatus(serverName, 'running', null, {
          lastHealthCheck: serverState.lastHealthCheck,
          errorCount: serverState.errorCount
        });
      } else {
        serverState.status = 'stopped';
        await this.updateServerStatus(serverName, 'stopped', 'Process not alive');
      }

    } catch (error) {
      console.error(`❌ Health check falhou para ${serverName}:`, error);
      serverState.errorCount++;

      await this.updateServerStatus(serverName, 'error', error.message);
    }
  }

  /**
   * Invoca uma ferramenta MCP
   *
   * @param {string} serverName - Nome do servidor
   * @param {string} toolName - Nome da ferramenta
   * @param {object} args - Argumentos da ferramenta
   * @returns {Promise<object>} Resultado da ferramenta
   */
  async invokeTool(serverName, toolName, args = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const serverState = this.servers.get(serverName);

      if (!serverState) {
        throw new Error(`Servidor ${serverName} não encontrado`);
      }

      if (serverState.status !== 'running') {
        throw new Error(`Servidor ${serverName} não está rodando (status: ${serverState.status})`);
      }

      console.log(`🔧 Invocando ferramenta ${toolName} em ${serverName}...`);

      // Publicar evento de início
      this.publishEvent('mcp.tool.invoked', {
        serverName,
        toolName,
        args: Object.keys(args)
      });

      // Simular invocação de ferramenta via MCP protocol
      // Em produção, isso seria uma requisição JSON-RPC via stdio
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: `tools/${toolName}`,
        params: args
      };

      // Enviar para stdin do processo
      serverState.process.stdin.write(JSON.stringify(request) + '\n');

      // Aguardar resposta (timeout de 30s)
      const result = await this.waitForResponse(serverState, request.id, 30000);

      const responseTime = Date.now() - startTime;
      this.metrics.responseTimes.push(responseTime);
      this.metrics.successfulRequests++;

      // Calcular média
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }
      this.metrics.averageResponseTime =
        this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

      // Publicar evento de sucesso
      this.publishEvent('mcp.tool.completed', {
        serverName,
        toolName,
        responseTime
      });

      return result;

    } catch (error) {
      this.metrics.failedRequests++;

      console.error(`❌ Erro ao invocar ${toolName} em ${serverName}:`, error);

      this.publishEvent('mcp.tool.failed', {
        serverName,
        toolName,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Aguarda resposta do servidor MCP (stub - implementação real usaria JSON-RPC)
   *
   * @param {object} serverState - Estado do servidor
   * @param {number} requestId - ID da requisição
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<object>} Resposta
   */
  async waitForResponse(serverState, requestId, timeout) {
    // Stub: em produção real, isso seria um listener no stdout parseando JSON-RPC
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout aguardando resposta do servidor MCP'));
      }, timeout);

      // Simular resposta
      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          jsonrpc: '2.0',
          id: requestId,
          result: {
            success: true,
            message: 'Tool executed (stub response)'
          }
        });
      }, 100);
    });
  }

  /**
   * Obtém status de todos os servidores
   *
   * @returns {Array} Lista de status
   */
  getServersStatus() {
    const status = [];

    for (const [serverName, serverState] of this.servers.entries()) {
      status.push({
        name: serverName,
        displayName: serverState.config.displayName,
        description: serverState.config.description,
        status: serverState.status,
        pid: serverState.pid,
        startedAt: serverState.startedAt,
        lastHealthCheck: serverState.lastHealthCheck,
        errorCount: serverState.errorCount,
        restarts: serverState.restarts,
        tools: serverState.tools
      });
    }

    return status;
  }

  /**
   * Obtém métricas globais
   *
   * @returns {object} Métricas
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0
        ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Publica evento no EventBus
   *
   * @param {string} topic - Tópico do evento
   * @param {object} payload - Dados do evento
   */
  publishEvent(topic, payload) {
    if (this.eventBus) {
      this.eventBus.publish(topic, payload, {
        source: 'mcp-integration'
      }).catch(err => console.error('Erro ao publicar evento:', err));
    }
  }

  /**
   * Atualiza status do servidor no banco de dados
   *
   * @param {string} serverName - Nome do servidor
   * @param {string} status - Status atual
   * @param {string} errorMessage - Mensagem de erro (opcional)
   * @param {object} metadata - Metadados extras (opcional)
   */
  async updateServerStatus(serverName, status, errorMessage = null, metadata = {}) {
    if (!this.stateManager || !this.stateManager.db) {
      return;
    }

    try {
      const config = MCP_SERVERS_CONFIG[serverName];

      await this.stateManager.db.query(
        `INSERT INTO mcp_server_status (server_name, status, last_health_check, error_count, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (server_name)
         DO UPDATE SET
           status = $2,
           last_health_check = $3,
           error_count = COALESCE($4, mcp_server_status.error_count),
           metadata = $5,
           updated_at = NOW()`,
        [
          serverName,
          status,
          metadata.lastHealthCheck || new Date(),
          metadata.errorCount || 0,
          JSON.stringify({
            displayName: config?.displayName || serverName,
            description: config?.description || '',
            errorMessage,
            ...metadata
          })
        ]
      );
    } catch (error) {
      console.error(`Erro ao atualizar status de ${serverName} no DB:`, error);
    }
  }

  /**
   * Fecha todos os servidores e limpa recursos
   */
  async closeAll() {
    console.log('🔌 Encerrando todos os servidores MCP...');

    for (const serverName of this.servers.keys()) {
      try {
        await this.stopServer(serverName);
      } catch (error) {
        console.error(`Erro ao parar ${serverName}:`, error);
      }
    }

    this.servers.clear();
    this.healthCheckIntervals.clear();

    console.log('✅ Todos os servidores MCP encerrados');
  }
}

export { MCPIntegrationService, MCP_SERVERS_CONFIG };
export default MCPIntegrationService;
