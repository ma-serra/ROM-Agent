/**
 * Sistema de Emissao de Progresso em Tempo Real
 *
 * Permite enviar updates linha a linha para o usuario durante processamentos longos
 * Similar ao feedback visual do Claude.ai
 *
 * Features v2.0.0:
 * - TTL automatico de 30min para sessions
 * - Cleanup periodico de sessions antigas
 * - Limite de updates por session para evitar memory leaks
 *
 * @version 2.0.0
 * @since WS5 - SSE Streaming Optimization
 */

import EventEmitter from 'events';

// Configuracoes de TTL e cleanup
const SESSION_TTL = 30 * 60 * 1000; // 30 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
const MAX_UPDATES_PER_SESSION = 10000; // Limite de updates para evitar memory leak

class ProgressEmitter extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map(); // casoId -> { updates: [], startTime, status, lastActivity }

    // Iniciar cleanup periodico
    this._startCleanupTimer();

    // Metricas
    this.metrics = {
      totalSessionsCreated: 0,
      sessionsCleanedUp: 0,
      updatesDropped: 0
    };
  }

  /**
   * Inicia timer de cleanup periodico
   */
  _startCleanupTimer() {
    this._cleanupTimer = setInterval(() => {
      this._cleanupStaleSessions();
    }, CLEANUP_INTERVAL);

    // Nao bloquear shutdown do processo
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  /**
   * Remove sessions antigas (TTL expirado)
   */
  _cleanupStaleSessions() {
    const now = Date.now();
    let cleaned = 0;
    let recovered = 0;

    for (const [casoId, session] of this.sessions.entries()) {
      const lastActivity = session.lastActivity || session.startTime;
      const age = now - lastActivity;

      // 🔧 v3.6.2: RECOVERY AUTOMÁTICO - marcar sessões travadas como failed
      // Se sessão está em "processing" há mais de 30 minutos → provável crash/timeout
      const STUCK_TIMEOUT = 30 * 60 * 1000; // 30 minutos
      if (session.status === 'processing' && age > STUCK_TIMEOUT) {
        console.warn(`⚠️ [ProgressEmitter] Recovery: Sessão travada detectada: ${casoId} (${Math.round(age / 60000)}min)`);

        // Marcar como failed com mensagem de timeout
        session.status = 'failed';
        session.error = new Error(`Timeout de processamento excedido (${Math.round(age / 60000)}min sem atividade)`);

        this.addUpdate(casoId, 'error', '❌ Upload travado - sessão marcada como falha após 30min sem progresso', {
          recovered: true,
          stuckMinutes: Math.round(age / 60000)
        });

        this.emit('session-failed', {
          casoId,
          error: session.error.message,
          recovered: true
        });

        recovered++;
        continue; // Não deletar, apenas marcar como failed
      }

      // Remover se TTL expirou (apenas sessões completed/failed antigas)
      if (age > SESSION_TTL) {
        this.sessions.delete(casoId);
        cleaned++;

        this.emit('session-expired', {
          casoId,
          age,
          status: session.status
        });
      }
    }

    if (cleaned > 0 || recovered > 0) {
      this.metrics.sessionsCleanedUp += cleaned;
      console.log(`[ProgressEmitter] Cleanup: ${cleaned} expiradas, ${recovered} travadas recuperadas (TTL ${SESSION_TTL / 60000}min)`);
    }
  }

  /**
   * Obtem metricas do emitter
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size,
      sessionTTL: SESSION_TTL,
      timestamp: Date.now()
    };
  }

  /**
   * Iniciar sessao de progresso
   */
  startSession(casoId, metadata = {}) {
    this.sessions.set(casoId, {
      updates: [],
      startTime: Date.now(),
      lastActivity: Date.now(),
      status: 'processing',
      metadata,
      currentLayer: null,
      currentStep: null
    });

    this.metrics.totalSessionsCreated++;

    this.emit('session-start', {
      casoId,
      timestamp: new Date().toISOString(),
      metadata
    });

    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'system', '🚀 INICIANDO PROCESSAMENTO DO CASO');
    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'info', '');
  }

  /**
   * Adicionar update de progresso
   */
  addUpdate(casoId, type, message, data = {}) {
    const session = this.sessions.get(casoId);
    if (!session) {
      console.warn(`Sessao nao encontrada para caso ${casoId}`);
      return;
    }

    // Atualizar timestamp de atividade
    session.lastActivity = Date.now();

    // Verificar limite de updates para evitar memory leak
    if (session.updates.length >= MAX_UPDATES_PER_SESSION) {
      // Manter apenas os ultimos 50% dos updates
      const keepCount = Math.floor(MAX_UPDATES_PER_SESSION / 2);
      session.updates = session.updates.slice(-keepCount);
      this.metrics.updatesDropped += keepCount;
      console.warn(`[ProgressEmitter] Session ${casoId}: updates truncados (limite ${MAX_UPDATES_PER_SESSION})`);
    }

    const update = {
      type, // 'system', 'info', 'success', 'warning', 'error', 'layer', 'step', 'result'
      message,
      data,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - session.startTime
    };

    session.updates.push(update);

    // Emitir evento para SSE
    this.emit('update', {
      casoId,
      update
    });

    // Log no console também
    this._logToConsole(type, message, data);
  }

  /**
   * Marcar início de uma layer
   */
  startLayer(casoId, layerNumber, layerName) {
    const session = this.sessions.get(casoId);
    if (session) {
      session.currentLayer = layerNumber;
    }

    this.addUpdate(casoId, 'system', '');
    this.addUpdate(casoId, 'layer', `━━━ LAYER ${layerNumber}: ${layerName} ━━━`);
    this.addUpdate(casoId, 'info', '');
  }

  /**
   * Marcar conclusão de uma layer
   */
  completeLayer(casoId, layerNumber, result = {}) {
    this.addUpdate(casoId, 'success', `✅ Layer ${layerNumber} concluída`, result);
    this.addUpdate(casoId, 'info', '');
  }

  /**
   * Adicionar step dentro de uma layer
   */
  addStep(casoId, stepName, status = 'processing') {
    const session = this.sessions.get(casoId);
    if (session) {
      session.currentStep = stepName;
    }

    const icon = status === 'processing' ? '⏳' :
                 status === 'success' ? '✅' :
                 status === 'warning' ? '⚠️' : '❌';

    this.addUpdate(casoId, 'step', `${icon} ${stepName}`);
  }

  /**
   * Adicionar resultado/métrica
   */
  addResult(casoId, label, value) {
    this.addUpdate(casoId, 'result', `   ${label}: ${value}`);
  }

  /**
   * Adicionar informação contextual
   */
  addInfo(casoId, message) {
    this.addUpdate(casoId, 'info', `   ${message}`);
  }

  /**
   * Adicionar sucesso
   */
  addSuccess(casoId, message, data = {}) {
    this.addUpdate(casoId, 'success', `✅ ${message}`, data);
  }

  /**
   * Adicionar warning
   */
  addWarning(casoId, message, data = {}) {
    this.addUpdate(casoId, 'warning', `⚠️  ${message}`, data);
  }

  /**
   * Adicionar erro
   */
  addError(casoId, message, error = null) {
    this.addUpdate(casoId, 'error', `❌ ${message}`, {
      error: error ? error.message : null
    });
  }

  /**
   * Finalizar sessão com sucesso
   */
  completeSession(casoId, summary = {}) {
    const session = this.sessions.get(casoId);
    if (!session) return;

    session.status = 'completed';
    const totalTime = Date.now() - session.startTime;

    this.addUpdate(casoId, 'info', '');
    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'system', '🎉 PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'info', '');

    if (summary.totalDocuments) {
      this.addResult(casoId, '📄 Documentos processados', summary.totalDocuments);
    }
    if (summary.totalPages) {
      this.addResult(casoId, '📑 Páginas analisadas', summary.totalPages);
    }
    if (summary.totalWords) {
      this.addResult(casoId, '📝 Palavras extraídas', summary.totalWords.toLocaleString('pt-BR'));
    }
    if (summary.cacheHits !== undefined) {
      this.addResult(casoId, '💾 Taxa de cache hit', summary.cacheHitRate || '0%');
    }

    this.addInfo(casoId, '');
    this.addResult(casoId, '⏱️  Tempo total', this._formatTime(totalTime));
    this.addInfo(casoId, '');

    this.emit('session-complete', {
      casoId,
      totalTime,
      totalUpdates: session.updates.length,
      summary
    });
  }

  /**
   * Finalizar sessão com erro
   */
  failSession(casoId, error) {
    const session = this.sessions.get(casoId);
    if (!session) return;

    session.status = 'failed';
    const totalTime = Date.now() - session.startTime;

    this.addUpdate(casoId, 'info', '');
    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'error', '❌ ERRO NO PROCESSAMENTO');
    this.addUpdate(casoId, 'system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.addUpdate(casoId, 'info', '');
    this.addError(casoId, error.message);
    this.addInfo(casoId, '');
    this.addResult(casoId, '⏱️  Tempo até erro', this._formatTime(totalTime));

    this.emit('session-failed', {
      casoId,
      error: error.message,
      totalTime
    });
  }

  /**
   * Obter todos os updates de uma sessão
   */
  getSessionUpdates(casoId) {
    const session = this.sessions.get(casoId);
    return session ? session.updates : [];
  }

  /**
   * Obter status da sessão
   */
  getSessionStatus(casoId) {
    const session = this.sessions.get(casoId);
    if (!session) return null;

    return {
      status: session.status,
      currentLayer: session.currentLayer,
      currentStep: session.currentStep,
      elapsed: Date.now() - session.startTime,
      totalUpdates: session.updates.length
    };
  }

  /**
   * Limpar sessão
   */
  clearSession(casoId) {
    this.sessions.delete(casoId);
  }

  /**
   * Log no console com formatação
   */
  _logToConsole(type, message, data) {
    const prefix = {
      'system': '━━━',
      'layer': '📦',
      'step': '  ',
      'info': '   ',
      'success': '✅',
      'warning': '⚠️ ',
      'error': '❌',
      'result': '   '
    }[type] || '';

    const logMessage = `${prefix} ${message}`;

    if (type === 'error') {
      console.error(logMessage, data);
    } else if (type === 'warning') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Formatar tempo em formato legível
   */
  _formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
}

// Singleton
const progressEmitter = new ProgressEmitter();

export default progressEmitter;
export { ProgressEmitter };
