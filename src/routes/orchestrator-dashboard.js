/**
 * Orchestrator Dashboard API
 *
 * Endpoints REST para monitoramento em tempo real do sistema multi-agente
 * Integrado com StateManager, EventBus e MasterOrchestrator
 */

import express from 'express';

const router = express.Router();

// ============================================================================
// MIDDLEWARE DE VERIFICAÇÃO
// ============================================================================

function verificarDependencias(req, res, next) {
  const { masterOrchestrator, stateManager, eventBus } = req.app.locals;

  if (!masterOrchestrator || !stateManager || !eventBus) {
    return res.status(503).json({
      error: 'Serviço indisponível',
      message: 'MasterOrchestrator não está inicializado. Aguarde inicialização do sistema.',
      available: {
        orchestrator: !!masterOrchestrator,
        stateManager: !!stateManager,
        eventBus: !!eventBus
      }
    });
  }

  next();
}

// ============================================================================
// ENDPOINTS DE STATUS E SAÚDE
// ============================================================================

/**
 * GET /api/orchestrator/health
 * Verificação de saúde do sistema completo
 */
router.get('/health', verificarDependencias, async (req, res) => {
  try {
    const { masterOrchestrator, stateManager, eventBus } = req.app.locals;

    // Verificar conexões
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        orchestrator: {
          status: masterOrchestrator ? 'up' : 'down',
          activeWorkflows: masterOrchestrator?.activeWorkflows?.size || 0
        },
        stateManager: {
          status: stateManager ? 'up' : 'down',
          cacheEnabled: stateManager?.cacheEnabled || false,
          cacheHitRate: stateManager?.getMetrics?.()?.cacheHitRate || '0%'
        },
        eventBus: {
          status: eventBus ? 'up' : 'down',
          totalEvents: eventBus?.metrics?.totalEvents || 0,
          redisConnected: eventBus?.getMetrics?.()?.redisConnected || false
        },
        database: {
          status: 'unknown',
          type: 'PostgreSQL'
        },
        redis: {
          status: stateManager?.cacheEnabled ? 'up' : 'disabled'
        }
      }
    };

    // Testar conexão com banco de dados
    if (stateManager?.db) {
      try {
        await stateManager.db.query('SELECT 1');
        health.components.database.status = 'up';
      } catch (error) {
        health.components.database.status = 'down';
        health.components.database.error = error.message;
        health.status = 'degraded';
      }
    }

    // Determinar status geral
    const componentsDown = Object.values(health.components).filter(c => c.status === 'down').length;
    if (componentsDown > 0) {
      health.status = componentsDown >= 2 ? 'unhealthy' : 'degraded';
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/orchestrator/stats
 * Estatísticas gerais do sistema
 */
router.get('/stats', verificarDependencias, async (req, res) => {
  try {
    const { masterOrchestrator, stateManager, eventBus } = req.app.locals;

    // Métricas do orquestrador
    const orchestratorMetrics = await masterOrchestrator.getMetrics();

    // Métricas do StateManager
    const stateMetrics = stateManager.getMetrics();

    // Métricas do EventBus
    const eventMetrics = eventBus.getMetrics();

    // Estatísticas do banco de dados
    let dbStats = null;
    if (stateManager.db) {
      try {
        const workflowCount = await stateManager.db.query(
          'SELECT COUNT(*) as total FROM workflow_executions'
        );
        const agentCount = await stateManager.db.query(
          'SELECT COUNT(DISTINCT agent_id) as total FROM agent_states'
        );
        const metricsCount = await stateManager.db.query(
          'SELECT COUNT(*) as total FROM agent_metrics'
        );

        dbStats = {
          totalWorkflows: parseInt(workflowCount.rows[0].total),
          totalAgents: parseInt(agentCount.rows[0].total),
          totalMetrics: parseInt(metricsCount.rows[0].total)
        };
      } catch (error) {
        dbStats = { error: error.message };
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      orchestrator: orchestratorMetrics,
      stateManager: stateMetrics,
      eventBus: eventMetrics,
      database: dbStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE WORKFLOWS
// ============================================================================

/**
 * GET /api/orchestrator/workflows/active
 * Workflows ativos no momento
 */
router.get('/workflows/active', verificarDependencias, (req, res) => {
  try {
    const { masterOrchestrator } = req.app.locals;

    const activeWorkflows = Array.from(
      masterOrchestrator.activeWorkflows.entries()
    ).map(([id, execution]) => ({
      id,
      status: execution.status,
      type: execution.task?.type || 'unknown',
      startedAt: execution.startedAt,
      currentStage: execution.stages[execution.stages.length - 1]?.stage || 'iniciando',
      stagesCompleted: execution.stages.length,
      duration: execution.startedAt
        ? Math.floor((Date.now() - new Date(execution.startedAt).getTime()) / 1000)
        : 0
    }));

    res.json({
      total: activeWorkflows.length,
      workflows: activeWorkflows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/workflows/history
 * Histórico de workflows (últimos N)
 */
router.get('/workflows/history', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || null;

    const workflows = await stateManager.listWorkflows({
      limit,
      offset,
      status
    });

    res.json({
      total: workflows.length,
      limit,
      offset,
      workflows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/workflows/:workflowId
 * Detalhes de um workflow específico
 */
router.get('/workflows/:workflowId', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const { workflowId } = req.params;

    const execution = await stateManager.getWorkflowExecution(workflowId);

    if (!execution) {
      return res.status(404).json({
        error: 'Workflow não encontrado',
        workflowId
      });
    }

    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE AGENTES
// ============================================================================

/**
 * GET /api/orchestrator/agents/performance
 * Performance agregada por agente
 */
router.get('/agents/performance', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const period = req.query.period || '24h';

    // Calcular timestamp de início baseado no período
    const periodMs = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[period] || 86400000;

    const since = new Date(Date.now() - periodMs);

    // Buscar métricas de todos os agentes
    const result = await stateManager.db.query(
      `SELECT
        agent_id,
        COUNT(*) as total_executions,
        AVG(metric_value) as avg_execution_time,
        MIN(metric_value) as min_execution_time,
        MAX(metric_value) as max_execution_time,
        MAX(timestamp) as last_activity
      FROM agent_metrics
      WHERE metric_name = 'execution_time' AND timestamp >= $1
      GROUP BY agent_id
      ORDER BY total_executions DESC`,
      [since]
    );

    res.json({
      period,
      since: since.toISOString(),
      agents: result.rows.map(row => ({
        agentId: row.agent_id,
        totalExecutions: parseInt(row.total_executions),
        avgExecutionTime: parseFloat(row.avg_execution_time).toFixed(2),
        minExecutionTime: parseFloat(row.min_execution_time).toFixed(2),
        maxExecutionTime: parseFloat(row.max_execution_time).toFixed(2),
        lastActivity: row.last_activity
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/agents/:agentId/metrics
 * Métricas de um agente específico
 */
router.get('/agents/:agentId/metrics', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const { agentId } = req.params;
    const period = req.query.period || '24h';

    const periodMs = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[period] || 86400000;

    const since = new Date(Date.now() - periodMs);

    const metrics = await stateManager.getAgentMetrics(agentId, {
      since,
      limit: 1000
    });

    res.json({
      agentId,
      period,
      since: since.toISOString(),
      total: metrics.length,
      metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/agents/:agentId/state
 * Estado atual de um agente
 */
router.get('/agents/:agentId/state', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const { agentId } = req.params;

    const state = await stateManager.getAgentState(agentId);

    if (!state) {
      return res.status(404).json({
        error: 'Estado do agente não encontrado',
        agentId
      });
    }

    res.json({
      agentId,
      state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE EVENTOS
// ============================================================================

/**
 * GET /api/orchestrator/events
 * Eventos recentes do EventBus
 */
router.get('/events', verificarDependencias, (req, res) => {
  try {
    const { eventBus } = req.app.locals;
    const topic = req.query.topic || null;
    const limit = parseInt(req.query.limit) || 100;

    const events = eventBus.getRecentEvents(topic, limit);

    res.json({
      total: events.length,
      topic: topic || 'all',
      limit,
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/events/stream
 * Server-Sent Events para eventos em tempo real
 */
router.get('/events/stream', verificarDependencias, (req, res) => {
  const { eventBus } = req.app.locals;

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Enviar comentário inicial para manter conexão
  res.write(': connected\n\n');

  // Tópicos de eventos a monitorar
  const topics = [
    'agent.started',
    'agent.progress',
    'agent.completed',
    'agent.failed',
    'workflow.started',
    'workflow.stage.completed',
    'workflow.completed',
    'workflow.failed',
    'validation.failed',
    'citation.verified',
    'cost.updated'
  ];

  // Handler para eventos
  const eventHandler = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Subscrever a todos os tópicos
  topics.forEach(topic => {
    eventBus.subscribe(topic, eventHandler);
  });

  // Heartbeat para manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000); // 30 segundos

  // Cleanup quando cliente desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    topics.forEach(topic => {
      eventBus.unsubscribe(topic, eventHandler);
    });
  });
});

// ============================================================================
// ENDPOINTS DE AUDITORIA ROM
// ============================================================================

/**
 * GET /api/orchestrator/audit/rom
 * Logs de auditoria ROM
 */
router.get('/audit/rom', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;
    const workflowId = req.query.workflowId || null;
    const limit = parseInt(req.query.limit) || 50;

    if (workflowId) {
      // Buscar logs de um workflow específico
      const logs = await stateManager.getROMAutitLogs(workflowId);
      res.json({
        workflowId,
        total: logs.length,
        logs
      });
    } else {
      // Buscar logs recentes
      const result = await stateManager.db.query(
        `SELECT * FROM rom_audit_logs
         ORDER BY timestamp DESC
         LIMIT $1`,
        [limit]
      );

      res.json({
        total: result.rows.length,
        limit,
        logs: result.rows.map(row => ({
          ...row,
          audit_result: JSON.parse(row.audit_result),
          issues: JSON.parse(row.issues || '[]')
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/audit/stats
 * Estatísticas de auditoria ROM
 */
router.get('/audit/stats', verificarDependencias, async (req, res) => {
  try {
    const { stateManager } = req.app.locals;

    // Estatísticas agregadas
    const result = await stateManager.db.query(
      `SELECT
        stage,
        COUNT(*) as total_audits,
        SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN NOT passed THEN 1 ELSE 0 END) as failed_count,
        ROUND(AVG(CASE WHEN passed THEN 1.0 ELSE 0.0 END) * 100, 2) as pass_rate
      FROM rom_audit_logs
      GROUP BY stage
      ORDER BY total_audits DESC`
    );

    res.json({
      timestamp: new Date().toISOString(),
      statistics: result.rows.map(row => ({
        stage: row.stage,
        totalAudits: parseInt(row.total_audits),
        passed: parseInt(row.passed_count),
        failed: parseInt(row.failed_count),
        passRate: parseFloat(row.pass_rate)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE MCP SERVERS
// ============================================================================

/**
 * GET /api/orchestrator/mcp/status
 * Status dos MCP servers
 */
router.get('/mcp/status', verificarDependencias, async (req, res) => {
  try {
    const { mcpService, stateManager } = req.app.locals;

    // Obter status em tempo real do MCPIntegrationService
    let liveStatus = [];
    let metrics = null;

    if (mcpService) {
      liveStatus = mcpService.getServersStatus();
      metrics = mcpService.getMetrics();
    }

    // Tentar buscar dados persistidos do banco também
    let dbStatus = [];
    if (stateManager?.db) {
      try {
        const result = await stateManager.db.query(
          'SELECT * FROM mcp_server_status ORDER BY updated_at DESC'
        );

        dbStatus = result.rows.map(row => ({
          ...row,
          metadata: JSON.parse(row.metadata || '{}')
        }));
      } catch (error) {
        console.error('Erro ao buscar status MCP do DB:', error);
      }
    }

    // Merge de dados: priorizar liveStatus, complementar com dbStatus
    const serversMap = new Map();

    // Adicionar dados do banco primeiro
    dbStatus.forEach(server => {
      serversMap.set(server.server_name, {
        name: server.server_name,
        displayName: server.metadata.displayName || server.server_name,
        description: server.metadata.description || '',
        status: server.status,
        lastHealthCheck: server.last_health_check,
        errorCount: server.error_count,
        source: 'database'
      });
    });

    // Sobrescrever com dados em tempo real (mais atuais)
    liveStatus.forEach(server => {
      serversMap.set(server.name, {
        ...server,
        source: 'live'
      });
    });

    res.json({
      total: serversMap.size,
      servers: Array.from(serversMap.values()),
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/orchestrator/mcp/:serverName/invoke
 * Invoca uma ferramenta MCP
 */
router.post('/mcp/:serverName/invoke', verificarDependencias, async (req, res) => {
  try {
    const { mcpService } = req.app.locals;
    const { serverName } = req.params;
    const { toolName, args = {} } = req.body;

    if (!mcpService) {
      return res.status(503).json({
        error: 'MCP Integration Service não está disponível'
      });
    }

    if (!toolName) {
      return res.status(400).json({
        error: 'toolName é obrigatório'
      });
    }

    const result = await mcpService.invokeTool(serverName, toolName, args);

    res.json({
      serverName,
      toolName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/orchestrator/mcp/:serverName/start
 * Inicia um servidor MCP
 */
router.post('/mcp/:serverName/start', verificarDependencias, async (req, res) => {
  try {
    const { mcpService } = req.app.locals;
    const { serverName } = req.params;

    if (!mcpService) {
      return res.status(503).json({
        error: 'MCP Integration Service não está disponível'
      });
    }

    // Importar configuração
    const { MCP_SERVERS_CONFIG } = await import('../services/mcp-integration.js');
    const config = MCP_SERVERS_CONFIG[serverName];

    if (!config) {
      return res.status(404).json({
        error: `Servidor ${serverName} não encontrado`
      });
    }

    const result = await mcpService.startServer(serverName, config);

    res.json({
      serverName,
      message: 'Servidor iniciado com sucesso',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/orchestrator/mcp/:serverName/stop
 * Para um servidor MCP
 */
router.post('/mcp/:serverName/stop', verificarDependencias, async (req, res) => {
  try {
    const { mcpService } = req.app.locals;
    const { serverName } = req.params;

    if (!mcpService) {
      return res.status(503).json({
        error: 'MCP Integration Service não está disponível'
      });
    }

    await mcpService.stopServer(serverName);

    res.json({
      serverName,
      message: 'Servidor parado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orchestrator/mcp/metrics
 * Métricas dos servidores MCP
 */
router.get('/mcp/metrics', verificarDependencias, (req, res) => {
  try {
    const { mcpService } = req.app.locals;

    if (!mcpService) {
      return res.status(503).json({
        error: 'MCP Integration Service não está disponível'
      });
    }

    const metrics = mcpService.getMetrics();

    res.json({
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
