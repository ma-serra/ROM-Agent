/**
 * ════════════════════════════════════════════════════════════════
 * ROM AGENT - ORCHESTRATOR ROUTES
 * ════════════════════════════════════════════════════════════════
 * REST API para execução do pipeline ROM de 5 etapas via web
 * - POST /api/orchestrator/run-pipeline - Iniciar pipeline completo
 * - GET /api/orchestrator/workflows/:id - Status do workflow
 * - GET /api/orchestrator/workflows - Listar workflows do usuário
 * ════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import logger from '../../lib/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/orchestrator/run-pipeline
 *
 * Inicia pipeline ROM de 5 etapas em background:
 * 1. Leitura Integral → 2. Extração → 3. Diagnóstico → 4. Redação → 5. Auditoria
 *
 * Body: {
 *   documentId: string,        // ID do documento na KB
 *   type: string,              // 'recurso-especial', 'apelacao', etc.
 *   options: {
 *     model: string,           // 'sonnet', 'opus', 'haiku'
 *     enableThinking: boolean  // Extended Thinking
 *   }
 * }
 */
router.post('/orchestrator/run-pipeline', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const userName = req.session.user.name || req.session.user.email;

  try {
    const { documentId, type = 'analise-completa', options = {} } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'documentId é obrigatório'
      });
    }

    logger.info('[Orchestrator] Iniciando pipeline ROM', {
      userId,
      userName,
      documentId,
      type,
      options
    });

    // 1. Buscar documento na KB do usuário
    const kbPath = path.join(process.cwd(), 'data', 'kb', userId);
    const extractedPath = path.join(process.cwd(), 'data', 'extracted');

    // Procurar arquivo de texto extraído
    const extractedFiles = await fs.readdir(extractedPath);
    const matchingFile = extractedFiles.find(f =>
      f.includes(documentId) && f.endsWith('.txt')
    );

    if (!matchingFile) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado na KB',
        hint: 'Certifique-se de que o arquivo foi processado e está em data/extracted/'
      });
    }

    const documentPath = path.join(extractedPath, matchingFile);
    const documentText = await fs.readFile(documentPath, 'utf-8');

    logger.debug('[Orchestrator] Documento carregado', {
      documentId,
      path: documentPath,
      sizeKB: Math.round(documentText.length / 1024)
    });

    // 2. Obter MasterOrchestrator (injetado no app.locals)
    const masterOrchestrator = req.app.locals.masterOrchestrator;

    if (!masterOrchestrator) {
      logger.error('[Orchestrator] MasterOrchestrator não disponível');
      return res.status(503).json({
        success: false,
        error: 'Orquestrador não inicializado',
        hint: 'Sistema em inicialização, tente novamente em alguns segundos'
      });
    }

    // 3. Iniciar pipeline em background
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Responder imediatamente com workflowId
    res.json({
      success: true,
      message: 'Pipeline iniciado em background',
      workflowId,
      stages: 5,
      estimatedTime: '5-15 minutos',
      type,
      documentId
    });

    // 4. Executar pipeline em background (não await!)
    executePipelineInBackground({
      workflowId,
      documentId,
      documentText,
      type,
      options,
      userId,
      userName,
      masterOrchestrator,
      kbPath,
      extractedPath
    }).catch(error => {
      logger.error('[Orchestrator] Erro no pipeline background', {
        error: error.message,
        stack: error.stack,
        workflowId,
        userId
      });
    });

  } catch (error) {
    logger.error('[Orchestrator] Erro ao iniciar pipeline', {
      error: error.message,
      userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar pipeline',
      message: error.message
    });
  }
});

/**
 * Executa pipeline ROM em background e salva resultado na KB
 */
async function executePipelineInBackground({
  workflowId,
  documentId,
  documentText,
  type,
  options,
  userId,
  userName,
  masterOrchestrator,
  kbPath,
  extractedPath
}) {
  const startTime = Date.now();

  logger.info('[Orchestrator BG] Pipeline iniciado', {
    workflowId,
    userId,
    documentId,
    type
  });

  try {
    // Executar pipeline ROM de 5 etapas
    const result = await masterOrchestrator.executeHybridWorkflow({
      type,
      input: documentText,
      context: {
        documentId,
        userId,
        userName,
        enableThinking: options.enableThinking !== false, // Default: true
        forceModel: options.model || 'sonnet',
        workflowId
      }
    });

    const duration = Date.now() - startTime;
    const durationMin = Math.round(duration / 60000);

    logger.info('[Orchestrator BG] Pipeline completado', {
      workflowId,
      userId,
      duration,
      durationMin,
      stages: result.stages?.length || 0
    });

    // Salvar resultado consolidado na KB do usuário
    await saveResultToKB({
      result,
      workflowId,
      documentId,
      userId,
      kbPath,
      extractedPath,
      duration
    });

    logger.info('[Orchestrator BG] Resultado salvo na KB', {
      workflowId,
      userId
    });

  } catch (error) {
    logger.error('[Orchestrator BG] Erro no pipeline', {
      error: error.message,
      stack: error.stack,
      workflowId,
      userId,
      duration: Date.now() - startTime
    });

    // Publicar evento de falha
    await masterOrchestrator.eventBus.publish('workflow.failed', {
      workflowId,
      error: error.message,
      userId
    });
  }
}

/**
 * Salva resultado do pipeline na KB do usuário
 */
async function saveResultToKB({
  result,
  workflowId,
  documentId,
  userId,
  kbPath,
  extractedPath,
  duration
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 1. Consolidar resultado das 5 etapas
  const consolidatedReport = `╔════════════════════════════════════════════════════════════════════════╗
║  ROM AGENT - ANÁLISE COMPLETA DO PROCESSO                               ║
║  Pipeline de 5 Etapas com Extended Thinking                            ║
╚════════════════════════════════════════════════════════════════════════╝

INFORMAÇÕES DO PROCESSAMENTO:
==============================
Workflow ID: ${workflowId}
Documento ID: ${documentId}
Usuário: ${userId}
Data: ${new Date().toLocaleString('pt-BR')}
Duração: ${Math.round(duration / 60000)} minutos
Modelo: Claude 3.7 Sonnet (Extended Thinking)

════════════════════════════════════════════════════════════════════════════

ETAPA 1: LEITURA INTEGRAL
==========================
${result.stages[0]?.result?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

ETAPA 2: EXTRAÇÃO DE DADOS ESTRUTURADOS
========================================
${result.stages[1]?.result?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

ETAPA 3: DIAGNÓSTICO JURÍDICO
==============================

3.1. ADMISSIBILIDADE
--------------------
${result.stages[2]?.result?.[0]?.result?.response || 'Não disponível'}

3.2. ANÁLISE JURIMÉTRICA
------------------------
${result.stages[2]?.result?.[1]?.result?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

ETAPA 4: REDAÇÃO
================
${result.stages[3]?.result?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

ETAPA 5: AUDITORIA
==================

5.1. AUDITORIA DE ADMISSIBILIDADE
----------------------------------
${result.stages[4]?.result?.[0]?.result?.response || 'Não disponível'}

5.2. VERIFICAÇÃO DE CITAÇÕES
-----------------------------
${result.stages[4]?.result?.[1]?.result?.response || 'Não disponível'}

5.3. REVISÃO DE FIDEDIGNIDADE
------------------------------
${result.stages[4]?.result?.[2]?.result?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

RESULTADO FINAL:
================
${result.finalResult?.response || 'Não disponível'}

════════════════════════════════════════════════════════════════════════════

AUDITORIA CONSOLIDADA:
======================
${JSON.stringify(result.auditoria, null, 2)}

════════════════════════════════════════════════════════════════════════════

ESTATÍSTICAS:
=============
- Total de etapas: ${result.stages?.length || 0}
- Tokens utilizados: ${result.stages.reduce((sum, s) => sum + (s.result?.tokens?.total_tokens || 0), 0)}
- Agentes executados: ${result.stages.reduce((sum, s) => sum + (Array.isArray(s.result) ? s.result.length : 1), 0)}

════════════════════════════════════════════════════════════════════════════
Gerado por ROM Agent - Sistema de IA Jurídica
https://iarom.com.br
════════════════════════════════════════════════════════════════════════════
`;

  // 2. Salvar relatório na KB do usuário
  const reportFileName = `ANALISE_COMPLETA_${documentId}_${timestamp}.txt`;
  const reportPath = path.join(kbPath, reportFileName);

  // Garantir que diretório da KB existe
  await fs.mkdir(kbPath, { recursive: true });

  await fs.writeFile(reportPath, consolidatedReport, 'utf-8');

  logger.info('[Orchestrator] Relatório salvo na KB', {
    path: reportPath,
    sizeKB: Math.round(consolidatedReport.length / 1024)
  });

  // 3. Também salvar em data/extracted/structured/ para acesso rápido
  const structuredPath = path.join(extractedPath, 'structured');
  await fs.mkdir(structuredPath, { recursive: true });

  const structuredReportPath = path.join(structuredPath, reportFileName);
  await fs.writeFile(structuredReportPath, consolidatedReport, 'utf-8');

  logger.info('[Orchestrator] Relatório duplicado em extracted/structured', {
    path: structuredReportPath
  });

  return {
    reportPath,
    structuredReportPath,
    fileName: reportFileName,
    sizeKB: Math.round(consolidatedReport.length / 1024)
  };
}

/**
 * GET /api/orchestrator/workflows/:id
 * Consulta status de um workflow específico
 */
router.get('/orchestrator/workflows/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const masterOrchestrator = req.app.locals.masterOrchestrator;

    if (!masterOrchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Orquestrador não disponível'
      });
    }

    // Buscar workflow ativo
    const workflow = masterOrchestrator.activeWorkflows.get(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado',
        hint: 'Workflow pode ter sido concluído e removido da memória'
      });
    }

    res.json({
      success: true,
      workflow: {
        id: workflow.id,
        type: workflow.type,
        status: workflow.status,
        startedAt: workflow.startedAt,
        currentStage: workflow.stages[workflow.stages.length - 1]?.stage || 'iniciando',
        totalStages: 5,
        completedStages: workflow.stages.length
      }
    });

  } catch (error) {
    logger.error('[Orchestrator] Erro ao consultar workflow', {
      error: error.message,
      workflowId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Erro ao consultar workflow'
    });
  }
});

/**
 * GET /api/orchestrator/workflows
 * Lista workflows do usuário (ativos e recentes)
 */
router.get('/orchestrator/workflows', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const masterOrchestrator = req.app.locals.masterOrchestrator;

    if (!masterOrchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Orquestrador não disponível'
      });
    }

    // Listar workflows ativos
    const activeWorkflows = Array.from(masterOrchestrator.activeWorkflows.values())
      .filter(w => w.task?.context?.userId === userId)
      .map(w => ({
        id: w.id,
        type: w.type,
        status: w.status,
        startedAt: w.startedAt,
        currentStage: w.stages[w.stages.length - 1]?.stage || 'iniciando',
        totalStages: 5,
        completedStages: w.stages.length
      }));

    res.json({
      success: true,
      workflows: activeWorkflows,
      total: activeWorkflows.length
    });

  } catch (error) {
    logger.error('[Orchestrator] Erro ao listar workflows', {
      error: error.message,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Erro ao listar workflows'
    });
  }
});

/**
 * GET /api/orchestrator/events/stream
 * Server-Sent Events (SSE) para progresso em tempo real do pipeline
 */
router.get('/orchestrator/events/stream', requireAuth, async (req, res) => {
  const { workflowId } = req.query;

  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desabilitar buffering nginx

  logger.info('[Orchestrator SSE] Cliente conectado', {
    workflowId,
    userId: req.session.user.id
  });

  const masterOrchestrator = req.app.locals.masterOrchestrator;

  if (!masterOrchestrator || !masterOrchestrator.eventBus) {
    res.write(`data: ${JSON.stringify({ error: 'EventBus não disponível' })}\n\n`);
    res.end();
    return;
  }

  // Enviar ping inicial
  res.write(`data: ${JSON.stringify({ type: 'connected', workflowId })}\n\n`);

  // Handler para eventos do EventBus
  const eventHandler = (event) => {
    // Filtrar apenas eventos do workflow específico (se especificado)
    if (workflowId && event.payload?.workflowId !== workflowId) {
      return;
    }

    // Filtrar apenas eventos do usuário atual
    if (event.payload?.userId && event.payload.userId !== req.session.user.id) {
      return;
    }

    try {
      res.write(`event: ${event.topic}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      logger.error('[Orchestrator SSE] Erro ao enviar evento', { error: err.message });
    }
  };

  // Subscrever aos eventos relevantes
  const topics = [
    'workflow.started',
    'workflow.stage.started',
    'workflow.stage.completed',
    'workflow.completed',
    'workflow.failed',
    'agent.started',
    'agent.completed',
    'agent.failed'
  ];

  topics.forEach(topic => {
    masterOrchestrator.eventBus.subscribe(topic, eventHandler);
  });

  // Enviar ping a cada 30 segundos para manter conexão viva
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch (err) {
      clearInterval(pingInterval);
    }
  }, 30000);

  // Cleanup quando cliente desconectar
  req.on('close', () => {
    logger.info('[Orchestrator SSE] Cliente desconectado', { workflowId });

    clearInterval(pingInterval);

    // Remover subscriptions
    topics.forEach(topic => {
      masterOrchestrator.eventBus.removeListener(topic, eventHandler);
    });
  });
});

export default router;
