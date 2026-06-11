#!/usr/bin/env node

/**
 * ROM Agent - API Health Monitor
 *
 * Monitora a saúde da API https://iarom.com.br/api/health a cada 60 segundos
 * - Verifica status HTTP e componentes internos (PostgreSQL, Redis)
 * - Loga status detalhado no terminal
 * - Salva erros em logs/monitor-errors.log com detalhes dos componentes
 * - Dispara notificações macOS em caso de falha de qualquer componente
 *
 * Uso:
 *   node scripts/monitor-api.js
 *   npm run monitor:api
 *   pm2 start scripts/monitor-api.js --name "rom-api-monitor"
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // URL da API para monitorar (endpoint de health check robusto)
  apiUrl: process.env.MONITOR_URL || 'https://iarom.com.br/api/health',

  // Intervalo entre verificações (ms)
  interval: parseInt(process.env.MONITOR_INTERVAL) || 60000, // 60s

  // Timeout para cada requisição (ms)
  timeout: parseInt(process.env.MONITOR_TIMEOUT) || 10000, // 10s

  // Arquivo de log de erros
  errorLogPath: path.join(__dirname, '../logs/monitor-errors.log'),

  // Códigos de status considerados saudáveis
  healthyStatusCodes: [200, 301, 302, 304],

  // Códigos de status que disparam alerta
  alertStatusCodes: [500, 502, 503, 504]
};

// Cores ANSI para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Estatísticas
const stats = {
  totalChecks: 0,
  successCount: 0,
  errorCount: 0,
  lastSuccessTime: null,
  lastErrorTime: null,
  startTime: Date.now(),
  consecutiveErrors: 0,
  consecutiveSuccess: 0
};

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE LOG
// ═══════════════════════════════════════════════════════════════

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  const errorMsg = error ? ` - ${error.message}` : '';
  console.error(`${colors.gray}[${timestamp}]${colors.reset} ${colors.red}❌ ${message}${errorMsg}${colors.reset}`);
}

function logSuccess(message) {
  const timestamp = new Date().toISOString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors.green}✓ ${message}${colors.reset}`);
}

function logWarning(message) {
  const timestamp = new Date().toISOString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors.yellow}⚠ ${message}${colors.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE ARQUIVO
// ═══════════════════════════════════════════════════════════════

function ensureLogDirectory() {
  const logDir = path.dirname(CONFIG.errorLogPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    log(`Diretório de logs criado: ${logDir}`, 'cyan');
  }
}

function saveErrorToLog(errorData) {
  ensureLogDirectory();

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    url: errorData.url,
    statusCode: errorData.statusCode,
    error: errorData.error,
    responseTime: errorData.responseTime,
    consecutiveErrors: stats.consecutiveErrors,
    healthDetails: errorData.healthDetails || null
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(CONFIG.errorLogPath, logLine, 'utf-8');
  } catch (err) {
    logError('Falha ao salvar erro no arquivo de log', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICAÇÕES MACOS
// ═══════════════════════════════════════════════════════════════

function sendMacNotification(title, message, sound = true) {
  // Apenas em macOS
  if (process.platform !== 'darwin') {
    return;
  }

  const soundScript = sound ? ' sound name "Sosumi"' : '';
  const script = `display notification "${message}" with title "${title}"${soundScript}`;

  exec(`osascript -e '${script}'`, (error) => {
    if (error) {
      logError('Falha ao enviar notificação macOS', error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// MONITORAMENTO DA API
// ═══════════════════════════════════════════════════════════════

function checkApiHealth() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = https.get(CONFIG.apiUrl, {
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': 'ROM-Agent-Monitor/1.0'
      }
    }, (res) => {
      const responseTime = Date.now() - startTime;
      let body = '';

      // Coletar dados da resposta
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        let healthData = null;

        // Tentar parsear JSON se for application/json
        if (res.headers['content-type']?.includes('application/json')) {
          try {
            healthData = JSON.parse(body);
          } catch (error) {
            // Se falhar o parse, retornar sem healthData
            console.error('Falha ao parsear JSON:', error.message);
          }
        }

        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          responseTime,
          healthData
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout após ${CONFIG.timeout}ms`));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function performHealthCheck() {
  stats.totalChecks++;

  try {
    const result = await checkApiHealth();
    const { statusCode, responseTime, healthData } = result;

    // Verificar se status HTTP é saudável
    const isHealthyStatusCode = CONFIG.healthyStatusCodes.includes(statusCode);
    const isAlert = CONFIG.alertStatusCodes.includes(statusCode);

    // Validar dados internos do health check (se disponível)
    let internalHealthIssues = [];
    if (healthData) {
      // Verificar status geral
      if (healthData.status && healthData.status !== 'healthy') {
        internalHealthIssues.push(`Status: ${healthData.status}`);
      }

      // Verificar PostgreSQL
      if (healthData.postgres && healthData.postgres.available === false) {
        internalHealthIssues.push('PostgreSQL: indisponível');
      }

      // Verificar Redis
      if (healthData.redis && healthData.redis.available === false) {
        internalHealthIssues.push('Redis: indisponível');
      }
    }

    // Sistema está saudável se:
    // 1. Status HTTP OK
    // 2. Nenhum problema interno detectado
    const isFullyHealthy = isHealthyStatusCode && internalHealthIssues.length === 0;

    if (isFullyHealthy) {
      // Sucesso completo
      stats.successCount++;
      stats.consecutiveSuccess++;
      stats.consecutiveErrors = 0;
      stats.lastSuccessTime = Date.now();

      // Log com detalhes extras se disponível
      let detailsMsg = '';
      if (healthData?.postgres?.latency && healthData?.redis?.latency) {
        detailsMsg = ` (PG: ${healthData.postgres.latency}ms, Redis: ${healthData.redis.latency}ms)`;
      }

      logSuccess(`API OK - Status ${statusCode} - ${responseTime}ms${detailsMsg} - Uptime: ${getUptime()}`);

      // Se estava em erro e voltou, notificar recuperação
      if (stats.consecutiveSuccess === 1 && stats.errorCount > 0) {
        sendMacNotification(
          'ROM Agent - API Recuperada!',
          `API voltou ao normal apos ${stats.errorCount} erros`,
          true
        );
      }

    } else if (internalHealthIssues.length > 0) {
      // Status HTTP OK mas problemas internos detectados
      const issueDescription = internalHealthIssues.join(', ');
      handleError({
        url: CONFIG.apiUrl,
        statusCode,
        error: `Componentes com falha: ${issueDescription}`,
        responseTime,
        healthDetails: healthData
      });

    } else if (isAlert) {
      // Erro crítico de HTTP
      handleError({
        url: CONFIG.apiUrl,
        statusCode,
        error: `Status ${statusCode} - ${result.statusMessage}`,
        responseTime,
        healthDetails: healthData
      });

    } else {
      // Status inesperado mas não crítico
      logWarning(`Status inesperado: ${statusCode} - ${responseTime}ms`);
    }

  } catch (error) {
    // Erro de rede/timeout
    handleError({
      url: CONFIG.apiUrl,
      statusCode: null,
      error: error.message,
      responseTime: CONFIG.timeout
    });
  }

  // Exibir estatísticas a cada 10 checks
  if (stats.totalChecks % 10 === 0) {
    logStats();
  }
}

function handleError(errorData) {
  stats.errorCount++;
  stats.consecutiveErrors++;
  stats.consecutiveSuccess = 0;
  stats.lastErrorTime = Date.now();

  const statusMsg = errorData.statusCode
    ? `Status ${errorData.statusCode}`
    : 'Falha de conexão';

  // Log com detalhes dos componentes se disponível
  let componentDetails = '';
  if (errorData.healthDetails) {
    const details = [];
    if (errorData.healthDetails.postgres?.available === false) {
      details.push('PostgreSQL: offline');
    }
    if (errorData.healthDetails.redis?.available === false) {
      details.push('Redis: offline');
    }
    if (details.length > 0) {
      componentDetails = ` [${details.join(', ')}]`;
    }
  }

  logError(`${statusMsg} - ${errorData.error}${componentDetails} - ${errorData.responseTime}ms`);

  // Salvar no arquivo de log
  saveErrorToLog(errorData);

  // Disparar notificação macOS
  const alertTitle = errorData.statusCode
    ? `ROM Agent - Erro ${errorData.statusCode}!`
    : 'ROM Agent - API Offline!';

  const alertMessage = `${errorData.error}${componentDetails}\n${stats.consecutiveErrors} erros consecutivos`;

  sendMacNotification(alertTitle, alertMessage, true);

  // Alerta crítico se muitos erros consecutivos
  if (stats.consecutiveErrors === 5) {
    sendMacNotification(
      'ROM Agent - ALERTA CRITICO!',
      `API com ${stats.consecutiveErrors} falhas consecutivas!`,
      true
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════════

function getUptime() {
  const uptimeMs = Date.now() - stats.startTime;
  const hours = Math.floor(uptimeMs / 3600000);
  const minutes = Math.floor((uptimeMs % 3600000) / 60000);
  const seconds = Math.floor((uptimeMs % 60000) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
}

function logStats() {
  const successRate = stats.totalChecks > 0
    ? ((stats.successCount / stats.totalChecks) * 100).toFixed(1)
    : 0;

  console.log('');
  log('═'.repeat(70), 'cyan');
  log('  ESTATÍSTICAS DO MONITOR', 'cyan');
  log('═'.repeat(70), 'cyan');
  log(`  Total de verificações: ${stats.totalChecks}`, 'blue');
  log(`  Sucessos: ${colors.green}${stats.successCount}${colors.reset} | Erros: ${colors.red}${stats.errorCount}${colors.reset}`, 'reset');
  log(`  Taxa de sucesso: ${successRate}%`, successRate >= 95 ? 'green' : 'yellow');
  log(`  Erros consecutivos: ${stats.consecutiveErrors}`, stats.consecutiveErrors > 0 ? 'red' : 'green');
  log(`  Tempo de execução: ${getUptime()}`, 'blue');

  if (stats.lastSuccessTime) {
    const lastSuccess = new Date(stats.lastSuccessTime).toLocaleString('pt-BR');
    log(`  Último sucesso: ${lastSuccess}`, 'green');
  }

  if (stats.lastErrorTime) {
    const lastError = new Date(stats.lastErrorTime).toLocaleString('pt-BR');
    log(`  Último erro: ${lastError}`, 'red');
  }

  log('═'.repeat(70), 'cyan');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

function printBanner() {
  console.clear();
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           ROM AGENT - MONITOR DE SAÚDE DA API                ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  log(`URL monitorada: ${CONFIG.apiUrl}`, 'blue');
  log(`Intervalo: ${CONFIG.interval / 1000}s`, 'blue');
  log(`Timeout: ${CONFIG.timeout / 1000}s`, 'blue');
  log(`Arquivo de log: ${CONFIG.errorLogPath}`, 'blue');
  console.log('');
  log('Iniciando monitoramento... (Ctrl+C para parar)', 'green');
  console.log('');
}

function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('');
    log('Parando monitor...', 'yellow');
    logStats();
    log('Monitor encerrado.', 'green');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  printBanner();
  setupGracefulShutdown();
  ensureLogDirectory();

  // Primeira verificação imediata
  await performHealthCheck();

  // Verificações periódicas
  setInterval(async () => {
    await performHealthCheck();
  }, CONFIG.interval);
}

// Executar
main().catch(error => {
  logError('Erro fatal no monitor', error);
  process.exit(1);
});
