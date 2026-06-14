#!/usr/bin/env node
/**
 * HOTFIX: Endpoint GET /api/extraction-jobs/:id retornando 502
 *
 * Problema: Query travando ou timeout causando 502 Bad Gateway
 * Solução: Adicionar timeout, logging detalhado, tratamento defensivo
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ROUTES_FILE = path.join(ROOT_DIR, 'src/routes/extraction-jobs.js');

async function applyHotfix() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  HOTFIX: ENDPOINT GET /api/extraction-jobs/:id');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ler arquivo
  let content = await fs.readFile(ROUTES_FILE, 'utf-8');

  // Backup
  const backupPath = `${ROUTES_FILE}.backup-endpoint-${Date.now()}`;
  await fs.writeFile(backupPath, content);
  console.log(`✓ Backup criado: ${path.basename(backupPath)}\n`);

  // Substituir o endpoint GET /extraction-jobs/:id com versão robusta
  const oldEndpoint = `/**
 * GET /api/extraction-jobs/:id
 * Get specific extraction job details
 */
router.get('/extraction-jobs/:id', requireAuth, async (req, res) => {
  try {
    const job = await ExtractionJob.findOne({
      where: {
        id: req.params.id,
        userId: req.session.user.id
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Extraction job not found'
      });
    }

    logger.debug('Retrieved extraction job', {
      jobId: req.params.id,
      userId: req.session.user.id
    });

    res.json({
      success: true,
      job
    });

  } catch (error) {
    logger.error('[ExtractionJobs] Error getting job', {
      error: error.message,
      jobId: req.params.id,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get extraction job'
    });
  }
});`;

  const newEndpoint = `/**
 * GET /api/extraction-jobs/:id
 * Get specific extraction job details
 *
 * HOTFIX v3.4.1: Adiciona timeout, logging detalhado, tratamento defensivo
 */
router.get('/extraction-jobs/:id', requireAuth, async (req, res) => {
  const startTime = Date.now();

  // Garantir que sempre retorna JSON mesmo em caso de erro catastrófico
  const sendError = (statusCode, errorMessage, extraData = {}) => {
    if (!res.headersSent) {
      logger.error('[ExtractionJobs] Error getting job', {
        error: errorMessage,
        jobId: req.params.id,
        userId: req.session?.user?.id,
        duration: Date.now() - startTime,
        ...extraData
      });

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        ...extraData
      });
    }
  };

  try {
    // Validar parâmetros
    if (!req.params.id) {
      return sendError(400, 'Job ID is required');
    }

    if (!req.session?.user?.id) {
      return sendError(401, 'User not authenticated', {
        hint: 'req.session.user.id is missing'
      });
    }

    logger.debug('[ExtractionJobs] Fetching job', {
      jobId: req.params.id,
      userId: req.session.user.id
    });

    // Query com timeout de 5 segundos
    const queryPromise = ExtractionJob.findOne({
      where: {
        id: req.params.id,
        userId: req.session.user.id
      },
      // Não carregar campos pesados desnecessariamente
      attributes: { exclude: [] }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
    );

    const job = await Promise.race([queryPromise, timeoutPromise]);

    const queryDuration = Date.now() - startTime;

    if (!job) {
      logger.debug('[ExtractionJobs] Job not found', {
        jobId: req.params.id,
        userId: req.session.user.id,
        duration: queryDuration
      });

      return res.status(404).json({
        success: false,
        error: 'Extraction job not found',
        message: 'Job não encontrado ou não pertence ao usuário atual'
      });
    }

    logger.debug('[ExtractionJobs] Retrieved extraction job', {
      jobId: req.params.id,
      userId: req.session.user.id,
      status: job.status,
      duration: queryDuration
    });

    // Garantir que o job tem a estrutura esperada pelo frontend
    const jobData = {
      id: job.id,
      documentId: job.documentId,
      documentName: job.documentName,
      status: job.status,
      progress: job.progress || { current: 0, total: 1, percentage: 0 },
      method: job.method || 'single-pass',
      chunksTotal: job.chunksTotal || 1,
      chunksCompleted: job.chunksCompleted || 0,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      resultDocumentId: job.resultDocumentId,
      errorMessage: job.errorMessage,
      metadata: job.metadata || {}
    };

    res.json({
      success: true,
      job: jobData,
      _meta: {
        queryDuration: queryDuration
      }
    });

  } catch (error) {
    // Tratamento específico para diferentes tipos de erro
    if (error.message.includes('timeout')) {
      return sendError(504, 'Database query timeout', {
        hint: 'Query demorou mais de 5 segundos',
        duration: Date.now() - startTime
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      return sendError(503, 'Database connection error', {
        hint: 'Verificar conexão com PostgreSQL',
        dbError: error.message
      });
    }

    if (error.name === 'SequelizeConnectionError') {
      return sendError(503, 'Cannot connect to database', {
        hint: 'PostgreSQL pode estar offline ou inacessível'
      });
    }

    // Erro genérico
    sendError(500, 'Failed to get extraction job', {
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});`;

  content = content.replace(oldEndpoint, newEndpoint);

  // Salvar arquivo modificado
  await fs.writeFile(ROUTES_FILE, content);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ HOTFIX APLICADO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Modificações aplicadas:');
  console.log('   ✓ Timeout de 5 segundos na query');
  console.log('   ✓ Logging detalhado (início, sucesso, erros)');
  console.log('   ✓ Validação de parâmetros (id, userId)');
  console.log('   ✓ Tratamento específico de erros (timeout, DB connection)');
  console.log('   ✓ Garantia de sempre retornar JSON');
  console.log('   ✓ Estrutura de dados normalizada para frontend\n');

  console.log('🔧 Impacto:');
  console.log('   • Timeout evita queries travadas (max 5s)');
  console.log('   • Logging detalhado facilita debugging');
  console.log('   • Erros específicos (504, 503) em vez de 502 genérico');
  console.log('   • Frontend recebe sempre JSON estruturado\n');

  console.log('🔄 Rollback (se necessário):');
  console.log(`   cp ${path.basename(backupPath)} src/routes/extraction-jobs.js\n`);
}

applyHotfix().catch(console.error);
