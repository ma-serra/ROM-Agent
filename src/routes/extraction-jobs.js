/**
 * ════════════════════════════════════════════════════════════════
 * ROM AGENT - EXTRACTION JOBS ROUTES
 * ════════════════════════════════════════════════════════════════
 * REST API for managing V2 extraction/analysis jobs
 * - GET /api/extraction-jobs - List user jobs
 * - GET /api/extraction-jobs/active - Get active jobs
 * - GET /api/extraction-jobs/:id - Get job details
 * - DELETE /api/extraction-jobs/:id - Delete job
 * - POST /api/extraction-jobs/:id/cancel - Cancel job
 * ════════════════════════════════════════════════════════════════
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ExtractionJob from '../models/ExtractionJob.js';
import logger from '../../lib/logger.js';

const router = express.Router();

/**
 * GET /api/extraction-jobs
 * List extraction jobs for current user
 */
router.get('/extraction-jobs', requireAuth, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const whereClause = {
      userId: req.session.user.id
    };

    if (status) {
      whereClause.status = status;
    }

    const jobs = await ExtractionJob.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(limit), 1000) // Cap at 1000
    });

    logger.debug('Listed extraction jobs', {
      userId: req.session.user.id,
      status: status || 'all',
      count: jobs.length
    });

    res.json({
      success: true,
      jobs,
      total: jobs.length
    });

  } catch (error) {
    logger.error('[ExtractionJobs] Error listing jobs', {
      error: error.message,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list extraction jobs'
    });
  }
});

/**
 * GET /api/extraction-jobs/active
 * Get active (pending/processing) jobs for current user
 */
router.get('/extraction-jobs/active', requireAuth, async (req, res) => {
  try {
    const jobs = await ExtractionJob.getActiveJobsForUser(req.session.user.id);

    logger.debug('Retrieved active extraction jobs', {
      userId: req.session.user.id,
      count: jobs.length
    });

    res.json({
      success: true,
      jobs,
      total: jobs.length
    });

  } catch (error) {
    logger.error('[ExtractionJobs] Error getting active jobs', {
      error: error.message,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get active jobs'
    });
  }
});

/**
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
});

/**
 * DELETE /api/extraction-jobs/:id
 * Delete extraction job (only if completed/failed/cancelled)
 */
router.delete('/extraction-jobs/:id', requireAuth, async (req, res) => {
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

    // Don't allow deletion of active jobs
    if (job.status === 'pending' || job.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active job. Wait for completion or cancel first.'
      });
    }

    await job.destroy();

    logger.info('Deleted extraction job', {
      jobId: req.params.id,
      userId: req.session.user.id,
      status: job.status
    });

    res.json({
      success: true,
      message: 'Extraction job deleted successfully'
    });

  } catch (error) {
    logger.error('[ExtractionJobs] Error deleting job', {
      error: error.message,
      jobId: req.params.id,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete extraction job'
    });
  }
});

/**
 * POST /api/extraction-jobs/:id/cancel
 * Cancel active extraction job
 */
router.post('/extraction-jobs/:id/cancel', requireAuth, async (req, res) => {
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

    if (job.status !== 'pending' && job.status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Job is not active, cannot cancel'
      });
    }

    job.status = 'cancelled';
    job.cancelledAt = new Date();
    await job.save();

    logger.info('Cancelled extraction job', {
      jobId: req.params.id,
      userId: req.session.user.id
    });

    res.json({
      success: true,
      message: 'Extraction job cancelled',
      job
    });

  } catch (error) {
    logger.error('[ExtractionJobs] Error cancelling job', {
      error: error.message,
      jobId: req.params.id,
      userId: req.session.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cancel extraction job'
    });
  }
});

/**
 * POST /api/extraction-jobs/cleanup-orphaned
 * ADMIN: Cancel orphaned jobs (stuck in processing after server restart)
 * Query param: secret=mota2323kb
 */
router.post('/extraction-jobs/cleanup-orphaned', async (req, res) => {
  try {
    // Security check
    if (req.query.secret !== 'mota2323kb') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Find jobs that are stuck in 'processing' or 'pending' for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const orphanedJobs = await ExtractionJob.findAll({
      where: {
        status: ['pending', 'processing'],
        createdAt: {
          [ExtractionJob.sequelize.Sequelize.Op.lt]: thirtyMinutesAgo
        }
      }
    });

    logger.info(`🧹 Cleanup: Found ${orphanedJobs.length} orphaned extraction jobs`);

    const cancelledIds = [];

    for (const job of orphanedJobs) {
      job.status = 'failed';
      job.error = 'Job orphaned - server restarted during processing';
      job.completed_at = new Date();
      await job.save();

      cancelledIds.push(job.id);
      logger.info(`   ✅ Cancelled orphaned job: ${job.id}`);
    }

    res.json({
      success: true,
      message: `${cancelledIds.length} orphaned job(s) cancelled`,
      cancelled: cancelledIds.length,
      jobs: cancelledIds
    });

  } catch (error) {
    logger.error('❌ Error cleaning up orphaned jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
