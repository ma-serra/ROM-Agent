import Redis from 'ioredis';

/**
 * StateManager - Gerenciamento de estado persistente
 *
 * Implementa camada de persistência para estado de agentes, workflows
 * e métricas usando PostgreSQL (durável) + Redis (cache rápido).
 *
 * Arquitetura:
 * - PostgreSQL: Persistência durável, queries complexas, histórico
 * - Redis: Cache de leitura rápida, TTL automático, baixa latência
 *
 * Pattern: Write-Through Cache
 * - Escritas vão para PostgreSQL e Redis simultaneamente
 * - Leituras tentam Redis primeiro, fallback para PostgreSQL
 */
class StateManager {
  constructor(db, redisConfig = null) {
    // PostgreSQL connection pool
    this.db = db;

    // Redis client
    this.redis = null;
    this.cacheEnabled = false;

    if (redisConfig && redisConfig.enabled) {
      this.initializeRedis(redisConfig);
    }

    // Configuração de cache
    this.cachePrefix = 'agent:state:';
    this.defaultTTL = 3600; // 1 hora

    // Métricas
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      writes: 0,
      reads: 0
    };
  }

  /**
   * Inicializa conexão Redis
   */
  initializeRedis(config) {
    try {
      this.redis = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.redis.on('ready', () => {
        this.cacheEnabled = true;
        console.log('✅ StateManager conectado ao Redis');
      });

      this.redis.on('error', (err) => {
        console.error('Erro na conexão Redis (StateManager):', err);
        this.cacheEnabled = false;
      });

    } catch (error) {
      console.warn('Não foi possível conectar ao Redis. Cache desabilitado:', error.message);
      this.redis = null;
      this.cacheEnabled = false;
    }
  }

  /**
   * Salvar estado do agente
   *
   * @param {string} agentId - ID do agente
   * @param {object} state - Estado a salvar
   */
  async saveAgentState(agentId, state) {
    this.metrics.writes++;

    // PostgreSQL: persistência durável
    await this.db.query(
      `INSERT INTO agent_states (agent_id, state, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (agent_id)
       DO UPDATE SET state = $2, updated_at = NOW()`,
      [agentId, JSON.stringify(state)]
    );

    // Redis: cache rápido
    if (this.cacheEnabled && this.redis) {
      try {
        await this.redis.setex(
          `${this.cachePrefix}${agentId}`,
          this.defaultTTL,
          JSON.stringify(state)
        );
      } catch (error) {
        console.error(`Erro ao salvar cache Redis para ${agentId}:`, error);
      }
    }
  }

  /**
   * Recuperar estado do agente
   *
   * @param {string} agentId - ID do agente
   * @returns {object|null} Estado ou null se não existe
   */
  async getAgentState(agentId) {
    this.metrics.reads++;

    // Tentar Redis primeiro (cache)
    if (this.cacheEnabled && this.redis) {
      try {
        const cached = await this.redis.get(`${this.cachePrefix}${agentId}`);
        if (cached) {
          this.metrics.cacheHits++;
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error(`Erro ao ler cache Redis para ${agentId}:`, error);
      }
    }

    this.metrics.cacheMisses++;

    // Fallback para PostgreSQL
    const result = await this.db.query(
      'SELECT state FROM agent_states WHERE agent_id = $1',
      [agentId]
    );

    if (result.rows.length > 0) {
      const state = JSON.parse(result.rows[0].state);

      // Atualizar cache assíncrono
      if (this.cacheEnabled && this.redis) {
        this.redis.setex(
          `${this.cachePrefix}${agentId}`,
          this.defaultTTL,
          JSON.stringify(state)
        ).catch(err => console.error('Erro ao atualizar cache:', err));
      }

      return state;
    }

    return null;
  }

  /**
   * Deletar estado do agente
   *
   * @param {string} agentId - ID do agente
   */
  async deleteAgentState(agentId) {
    await this.db.query(
      'DELETE FROM agent_states WHERE agent_id = $1',
      [agentId]
    );

    if (this.cacheEnabled && this.redis) {
      await this.redis.del(`${this.cachePrefix}${agentId}`);
    }
  }

  /**
   * Salvar execução de workflow
   *
   * @param {string} workflowId - ID do workflow
   * @param {object} execution - Dados da execução
   */
  async saveWorkflowExecution(workflowId, execution) {
    await this.db.query(
      `INSERT INTO workflow_executions
       (workflow_id, workflow_type, execution_data, started_at, completed_at, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (workflow_id)
       DO UPDATE SET
         execution_data = $3,
         completed_at = $5,
         status = $6,
         error_message = $7`,
      [
        workflowId,
        execution.type || 'unknown',
        JSON.stringify(execution),
        execution.startedAt,
        execution.completedAt,
        execution.status,
        execution.error || null
      ]
    );
  }

  /**
   * Obter execução de workflow
   *
   * @param {string} workflowId - ID do workflow
   * @returns {object|null} Execução ou null
   */
  async getWorkflowExecution(workflowId) {
    const result = await this.db.query(
      'SELECT * FROM workflow_executions WHERE workflow_id = $1',
      [workflowId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        ...JSON.parse(row.execution_data),
        created_at: row.created_at
      };
    }

    return null;
  }

  /**
   * Listar workflows recentes
   *
   * @param {object} options - Opções de filtro
   * @returns {Array} Lista de workflows
   */
  async listWorkflows(options = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null,
      type = null
    } = options;

    let query = 'SELECT * FROM workflow_executions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND workflow_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);

    return result.rows.map(row => ({
      ...JSON.parse(row.execution_data),
      created_at: row.created_at
    }));
  }

  /**
   * Salvar métrica de agente
   *
   * @param {string} agentId - ID do agente
   * @param {string} metricName - Nome da métrica
   * @param {number} metricValue - Valor da métrica
   * @param {object} metadata - Metadados opcionais
   */
  async saveAgentMetric(agentId, metricName, metricValue, metadata = {}) {
    await this.db.query(
      `INSERT INTO agent_metrics (agent_id, metric_name, metric_value, metadata)
       VALUES ($1, $2, $3, $4)`,
      [agentId, metricName, metricValue, JSON.stringify(metadata)]
    );
  }

  /**
   * Obter métricas de agente
   *
   * @param {string} agentId - ID do agente
   * @param {object} options - Opções de filtro
   * @returns {Array} Métricas
   */
  async getAgentMetrics(agentId, options = {}) {
    const {
      metricName = null,
      since = null,
      limit = 100
    } = options;

    let query = 'SELECT * FROM agent_metrics WHERE agent_id = $1';
    const params = [agentId];
    let paramIndex = 2;

    if (metricName) {
      query += ` AND metric_name = $${paramIndex}`;
      params.push(metricName);
      paramIndex++;
    }

    if (since) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.db.query(query, params);

    return result.rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Salvar mensagem de conversação
   *
   * @param {string} agentId - ID do agente
   * @param {string} conversationId - ID da conversação
   * @param {string} role - 'user' ou 'assistant'
   * @param {string} content - Conteúdo da mensagem
   * @param {object} metadata - Metadados (tokens, model, etc.)
   */
  async saveConversationMessage(agentId, conversationId, role, content, metadata = {}) {
    await this.db.query(
      `INSERT INTO agent_conversations
       (agent_id, conversation_id, message_role, message_content, tokens_used, model)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        agentId,
        conversationId,
        role,
        content,
        metadata.tokens || null,
        metadata.model || null
      ]
    );
  }

  /**
   * Obter histórico de conversação
   *
   * @param {string} agentId - ID do agente
   * @param {string} conversationId - ID da conversação
   * @param {number} limit - Limite de mensagens
   * @returns {Array} Mensagens
   */
  async getConversationHistory(agentId, conversationId, limit = 100) {
    const result = await this.db.query(
      `SELECT * FROM agent_conversations
       WHERE agent_id = $1 AND conversation_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [agentId, conversationId, limit]
    );

    return result.rows.reverse(); // Ordem cronológica
  }

  /**
   * Salvar log de auditoria ROM
   *
   * @param {string} workflowId - ID do workflow
   * @param {string} stage - Etapa do pipeline
   * @param {string} agentId - ID do agente auditor
   * @param {object} auditResult - Resultado da auditoria
   */
  async saveROMAutitLog(workflowId, stage, agentId, auditResult) {
    await this.db.query(
      `INSERT INTO rom_audit_logs
       (workflow_id, stage, agent_id, audit_result, passed, issues)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workflowId,
        stage,
        agentId,
        JSON.stringify(auditResult),
        auditResult.passed || false,
        JSON.stringify(auditResult.issues || [])
      ]
    );
  }

  /**
   * Obter logs de auditoria de workflow
   *
   * @param {string} workflowId - ID do workflow
   * @returns {Array} Logs de auditoria
   */
  async getROMAutitLogs(workflowId) {
    const result = await this.db.query(
      `SELECT * FROM rom_audit_logs
       WHERE workflow_id = $1
       ORDER BY timestamp ASC`,
      [workflowId]
    );

    return result.rows.map(row => ({
      ...row,
      audit_result: JSON.parse(row.audit_result),
      issues: JSON.parse(row.issues || '[]')
    }));
  }

  /**
   * Obter métricas do StateManager
   *
   * @returns {object} Métricas
   */
  getMetrics() {
    const cacheHitRate = this.metrics.reads > 0
      ? (this.metrics.cacheHits / this.metrics.reads * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      cacheEnabled: this.cacheEnabled
    };
  }

  /**
   * Limpar cache Redis
   */
  async clearCache() {
    if (this.cacheEnabled && this.redis) {
      const keys = await this.redis.keys(`${this.cachePrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  /**
   * Fechar conexões
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export { StateManager };
