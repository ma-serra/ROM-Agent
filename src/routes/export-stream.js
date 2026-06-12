/**
 * ROM Agent - Export Streaming Routes (SSE)
 *
 * Rotas para exportação de conteúdo com streaming em tempo real.
 *
 * Fluxo:
 * 1. Cliente envia prompt ou conteúdo
 * 2. Se prompt: IA gera texto letra por letra via SSE
 * 3. Ao finalizar geração, compila documento (DOCX/PDF/etc)
 * 4. Envia documento final como evento "complete" com base64
 *
 * Endpoints:
 * - POST /api/export/stream/:format - Gera documento com streaming
 *
 * SSE Events:
 * - start: Início da geração
 * - chunk: Texto progressivo da IA (se usou prompt)
 * - progress: Progresso de compilação do documento
 * - complete: Documento final (base64) + metadados
 * - error: Erro durante geração
 *
 * @version 1.0.0
 */

import express from 'express';
import ExportService from '../services/export-service.js';
import { conversarStream } from '../modules/bedrock.js';
import { logger } from '../utils/logger.js';
import { buildSystemPrompt } from '../server-enhanced.js';

const router = express.Router();

// MIME types por formato
const MIME_TYPES = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  html: 'text/html; charset=utf-8',
  markdown: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8'
};

// Extensões de arquivo por formato
const EXTENSIONS = {
  docx: 'docx',
  pdf: 'pdf',
  html: 'html',
  markdown: 'md',
  txt: 'txt'
};

/**
 * Sanitiza nome de arquivo removendo caracteres inválidos
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200);
}

/**
 * POST /api/export/stream/:format
 *
 * Gera documento com streaming em tempo real via SSE
 *
 * Body:
 * {
 *   "message": "Redija uma petição inicial...",  // Prompt para IA (streaming) OU
 *   "content": "Texto já pronto",                 // Conteúdo já gerado (direto)
 *   "title": "Petição Inicial",
 *   "type": "legal_brief",
 *   "metadata": {},
 *   "template": "oab",
 *   "modelo": "anthropic.claude-sonnet-4-5-20250929-v1:0",  // Opcional
 *   "systemPrompt": "Você é um advogado..."  // Opcional
 * }
 *
 * Response (SSE):
 * - event: start → Início da geração
 * - event: chunk → Texto progressivo (se usou message)
 * - event: progress → Progresso de compilação
 * - event: complete → Documento final + metadados
 * - event: error → Erro
 */
router.post('/stream/:format', async (req, res) => {
  const startTime = Date.now();
  const requestId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let heartbeatInterval = null;

  try {
    const { format } = req.params;
    const {
      message,      // Prompt para IA gerar conteúdo
      content,      // Conteúdo já pronto (pula geração IA)
      title,
      type,
      metadata,
      template,
      modelo,
      systemPrompt,
      maxTokens,
      temperature
    } = req.body;

    // Validar formato
    if (!['docx', 'pdf', 'html', 'markdown', 'txt'].includes(format)) {
      return res.status(400).json({
        error: 'Formato inválido',
        details: `Formatos suportados: docx, pdf, html, markdown, txt`
      });
    }

    // Validar entrada: precisa de message OU content
    if (!message && !content) {
      return res.status(400).json({
        error: 'Entrada inválida',
        details: 'Forneça "message" (para geração IA) ou "content" (conteúdo pronto)'
      });
    }

    // Configurar timeouts expandidos (20 minutos)
    req.setTimeout(1200000);
    res.setTimeout(1200000);

    // Configurar headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    logger.info(`[${requestId}] Export stream iniciado`, {
      format,
      mode: message ? 'ai_generation' : 'direct_export',
      title: title || 'Documento ROM Agent'
    });

    // Write queue para prevenir race conditions
    const writeQueue = [];
    let isWriting = false;

    const safeWrite = (data) => {
      return new Promise((resolve) => {
        writeQueue.push({ data, resolve });
        processWriteQueue();
      });
    };

    const processWriteQueue = () => {
      if (isWriting || writeQueue.length === 0) return;
      if (res.writableEnded || res.destroyed) {
        writeQueue.length = 0;
        return;
      }

      isWriting = true;
      const { data, resolve } = writeQueue.shift();

      try {
        res.write(data);
        if (typeof res.flush === 'function') {
          res.flush();
        }
        resolve(true);
      } catch (err) {
        logger.error(`[${requestId}] Write failed:`, err.message);
        resolve(false);
      }

      isWriting = false;
      if (writeQueue.length > 0) {
        setImmediate(processWriteQueue);
      }
    };

    // Enviar evento de início
    await safeWrite(`data: ${JSON.stringify({
      type: 'start',
      requestId,
      format,
      mode: message ? 'ai_generation' : 'direct_export',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Heartbeat para manter conexão viva (a cada 5s)
    heartbeatInterval = setInterval(() => {
      if (res.writableEnded || res.destroyed || res.socket?.destroyed) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        return;
      }

      safeWrite(`: heartbeat ${Date.now()}\n\n`).catch(err => {
        logger.error(`[${requestId}] Heartbeat failed:`, err.message);
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      });
    }, 5000);

    const cleanupHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    let generatedContent = '';
    let chunkCount = 0;

    // MODO 1: Geração via IA com streaming
    if (message) {
      logger.info(`[${requestId}] Gerando conteúdo via IA...`);

      // Callback para chunks da IA
      const onChunk = (chunk) => {
        if (typeof chunk === 'string') {
          generatedContent += chunk;
          chunkCount++;

          safeWrite(`data: ${JSON.stringify({
            type: 'chunk',
            content: chunk,
            chunkIndex: chunkCount
          })}\n\n`).catch(err => {
            logger.error(`[${requestId}] Chunk write failed:`, err.message);
          });
        }
      };

      // Construir system prompt
      const finalSystemPrompt = systemPrompt || buildSystemPrompt({
        contextType: 'pecaJuridica',
        kbContext: ''
      });

      // Gerar via IA
      const resultado = await conversarStream(
        message,
        {
          modelo: modelo || 'anthropic.claude-sonnet-4-5-20250929-v1:0',
          systemPrompt: finalSystemPrompt,
          maxTokens: maxTokens || 16000,
          temperature: temperature || 0.7,
          historico: []
        },
        onChunk
      );

      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Falha na geração de conteúdo');
      }

      logger.info(`[${requestId}] Conteúdo gerado: ${generatedContent.length} chars, ${chunkCount} chunks`);

    } else {
      // MODO 2: Conteúdo já fornecido (pular geração IA)
      generatedContent = content;
      logger.info(`[${requestId}] Usando conteúdo fornecido: ${content.length} chars`);
    }

    // Enviar evento de progresso: compilando documento
    await safeWrite(`data: ${JSON.stringify({
      type: 'progress',
      stage: 'compiling',
      message: `Compilando documento ${format.toUpperCase()}...`,
      progress: 50
    })}\n\n`);

    // Gerar documento final usando ExportService
    logger.info(`[${requestId}] Compilando documento ${format.toUpperCase()}...`);

    const documentBuffer = await ExportService.export({
      content: generatedContent,
      format,
      title: title || 'Documento ROM Agent',
      type: type || 'generic',
      metadata: metadata || {},
      template: template || 'oab'
    });

    // Converter buffer para base64 (se binário)
    let documentData;
    let encoding = 'utf8';

    if (format === 'docx' || format === 'pdf') {
      documentData = Buffer.from(documentBuffer).toString('base64');
      encoding = 'base64';
    } else {
      documentData = documentBuffer;
      encoding = 'utf8';
    }

    const totalTime = Date.now() - startTime;
    const filename = `${sanitizeFilename(title || 'documento')}.${EXTENSIONS[format]}`;

    // Enviar evento de conclusão
    cleanupHeartbeat();

    await safeWrite(`data: ${JSON.stringify({
      type: 'complete',
      requestId,
      format,
      filename,
      mimeType: MIME_TYPES[format],
      encoding,
      data: documentData,
      metadata: {
        contentLength: generatedContent.length,
        documentSize: Buffer.byteLength(documentBuffer),
        totalChunks: chunkCount,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      }
    })}\n\n`);

    logger.info(`[${requestId}] Export stream concluído`, {
      format,
      filename,
      totalTime: `${totalTime}ms`,
      contentLength: generatedContent.length,
      documentSize: Buffer.byteLength(documentBuffer)
    });

    res.end();

  } catch (error) {
    logger.error(`[${requestId}] Export stream error:`, error);

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    if (!res.writableEnded) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        requestId,
        error: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
    }

    res.end();
  }
});

/**
 * GET /api/export/stream/status
 * Verifica status do serviço de exportação streaming
 */
router.get('/stream/status', (req, res) => {
  res.json({
    service: 'export-stream',
    status: 'operational',
    features: ['sse', 'ai_generation', 'progress_tracking'],
    formats: ['docx', 'pdf', 'html', 'markdown', 'txt'],
    templates: ['oab', 'abnt', 'moderno', 'compacto', 'classico']
  });
});

export default router;
