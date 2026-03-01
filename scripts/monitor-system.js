#!/usr/bin/env node
/**
 * ROM Agent - Sistema de Monitoramento Automático
 *
 * Este script verifica as métricas do sistema periodicamente e:
 * - Exibe status no console
 * - Gera alertas quando thresholds são ultrapassados
 * - Pode enviar notificações (email, Slack, etc)
 * - Registra histórico de métricas
 *
 * Uso:
 *   node scripts/monitor-system.js              # Verificação única
 *   node scripts/monitor-system.js --watch      # Monitoramento contínuo (a cada 5 min)
 *   node scripts/monitor-system.js --interval 60 # Monitoramento a cada 1 min
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração
const CONFIG = {
  url: process.env.MONITOR_URL || 'https://iarom.com.br/api/metrics',
  localUrl: 'http://localhost:10000/api/metrics',
  interval: parseInt(process.env.MONITOR_INTERVAL || '300', 10), // 5 minutos default
  logFile: path.join(__dirname, '../logs/monitoring.log'),
  alertFile: path.join(__dirname, '../logs/alerts.log'),
  historyFile: path.join(__dirname, '../logs/metrics-history.jsonl'),
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailTo: process.env.ALERT_EMAIL
};

// Garantir que diretório de logs existe
const logsDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Fetch métricas do servidor
 */
async function fetchMetrics(url) {
  return new Promise((resolve, reject) => {
    const urlToUse = url || CONFIG.url;
    const client = urlToUse.startsWith('https') ? https : require('http');

    client.get(urlToUse, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const metrics = JSON.parse(data);
          resolve(metrics);
        } catch (error) {
          reject(new Error(`Failed to parse metrics: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Formatar status com cor
 */
function colorizeStatus(status) {
  switch (status) {
    case 'healthy':
      return `${colors.green}${status}${colors.reset}`;
    case 'warning':
      return `${colors.yellow}${status}${colors.reset}`;
    case 'critical':
      return `${colors.red}${status}${colors.reset}`;
    default:
      return status;
  }
}

/**
 * Exibir métricas no console
 */
function displayMetrics(metrics) {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bright}ROM Agent - System Monitoring${colors.reset}`);
  console.log(`Time: ${new Date(metrics.timestamp).toLocaleString()}`);
  console.log('='.repeat(70));

  // Status Geral
  console.log(`\n${colors.bright}Overall Status:${colors.reset} ${colorizeStatus(metrics.overall_status)}`);

  // Uptime
  console.log(`\n${colors.bright}Uptime:${colors.reset} ${metrics.uptime.formatted} (${colorizeStatus(metrics.uptime.status)})`);

  // Memory
  console.log(`\n${colors.bright}Memory:${colors.reset}`);
  console.log(`  RSS: ${metrics.memory.rss.mb} MB (${metrics.memory.rss.percent}%) - ${colorizeStatus(metrics.memory.rss.status)}`);
  console.log(`  Heap: ${metrics.memory.heap.used.mb}/${metrics.memory.heap.total.mb} MB (${metrics.memory.heap.percent}%) - ${colorizeStatus(metrics.memory.heap.status)}`);
  console.log(`  ${colors.dim}Limits: Warning=${metrics.memory.limits.warning_mb}MB, Critical=${metrics.memory.limits.critical_mb}MB${colors.reset}`);

  // Database
  console.log(`\n${colors.bright}Database:${colors.reset}`);
  console.log(`  Status: ${colorizeStatus(metrics.database.status)}`);
  if (metrics.database.latency_ms !== null) {
    console.log(`  Latency: ${metrics.database.latency_ms}ms`);
  }
  console.log(`  Pool: ${metrics.database.pool.total} total, ${metrics.database.pool.idle} idle, ${metrics.database.pool.waiting} waiting`);

  // Cache
  console.log(`\n${colors.bright}Cache:${colors.reset}`);
  console.log(`  Active Sessions: ${metrics.cache.active_sessions} (${colorizeStatus(metrics.cache.status)})`);

  // System
  console.log(`\n${colors.bright}System:${colors.reset}`);
  console.log(`  Node: ${metrics.system.node_version}`);
  console.log(`  Platform: ${metrics.system.platform}`);
  console.log(`  PID: ${metrics.system.pid}`);
  console.log(`  Commit: ${metrics.system.git_commit}`);

  // Alerts
  if (metrics.alerts && metrics.alerts.length > 0) {
    console.log(`\n${colors.bright}${colors.red}ALERTS (${metrics.alerts.length}):${colors.reset}`);
    metrics.alerts.forEach((alert, index) => {
      const levelColor = alert.level === 'critical' ? colors.red :
                        alert.level === 'warning' ? colors.yellow : colors.cyan;
      console.log(`\n  ${index + 1}. [${levelColor}${alert.level.toUpperCase()}${colors.reset}] ${alert.category}`);
      console.log(`     ${alert.message}`);
      console.log(`     ${colors.dim}→ ${alert.recommendation}${colors.reset}`);
    });
  } else {
    console.log(`\n${colors.green}${colors.bright}No alerts - System healthy!${colors.reset}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Salvar métricas no histórico
 */
function saveMetricsHistory(metrics) {
  try {
    const historyEntry = {
      timestamp: metrics.timestamp,
      overall_status: metrics.overall_status,
      memory_rss_mb: metrics.memory.rss.mb,
      memory_rss_percent: metrics.memory.rss.percent,
      heap_percent: metrics.memory.heap.percent,
      db_latency_ms: metrics.database.latency_ms,
      db_status: metrics.database.status,
      cache_sessions: metrics.cache.active_sessions,
      uptime_seconds: metrics.uptime.seconds,
      alerts_count: metrics.alerts.length,
      alerts: metrics.alerts.map(a => ({
        level: a.level,
        category: a.category,
        message: a.message
      }))
    };

    fs.appendFileSync(CONFIG.historyFile, JSON.stringify(historyEntry) + '\n');
  } catch (error) {
    console.error(`${colors.red}Failed to save metrics history: ${error.message}${colors.reset}`);
  }
}

/**
 * Registrar alertas em arquivo
 */
function logAlerts(metrics) {
  if (metrics.alerts && metrics.alerts.length > 0) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Overall: ${metrics.overall_status.toUpperCase()} - ${metrics.alerts.length} alert(s)\n`;

    fs.appendFileSync(CONFIG.alertFile, logEntry);

    metrics.alerts.forEach((alert, index) => {
      const alertEntry = `  ${index + 1}. [${alert.level.toUpperCase()}] ${alert.category}: ${alert.message}\n`;
      fs.appendFileSync(CONFIG.alertFile, alertEntry);
    });

    fs.appendFileSync(CONFIG.alertFile, '\n');
  }
}

/**
 * Enviar notificação Slack (se configurado)
 */
async function sendSlackNotification(metrics) {
  if (!CONFIG.slackWebhook || metrics.alerts.length === 0) {
    return;
  }

  const criticalAlerts = metrics.alerts.filter(a => a.level === 'critical');
  const warningAlerts = metrics.alerts.filter(a => a.level === 'warning');

  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return;
  }

  const color = criticalAlerts.length > 0 ? 'danger' : 'warning';
  const emoji = criticalAlerts.length > 0 ? ':rotating_light:' : ':warning:';

  const message = {
    text: `${emoji} ROM Agent Monitoring Alert`,
    attachments: [
      {
        color: color,
        title: `System Status: ${metrics.overall_status.toUpperCase()}`,
        fields: [
          {
            title: 'Critical Alerts',
            value: criticalAlerts.length.toString(),
            short: true
          },
          {
            title: 'Warning Alerts',
            value: warningAlerts.length.toString(),
            short: true
          },
          {
            title: 'Memory Usage',
            value: `${metrics.memory.rss.mb}MB (${metrics.memory.rss.percent}%)`,
            short: true
          },
          {
            title: 'Database Latency',
            value: `${metrics.database.latency_ms}ms`,
            short: true
          }
        ],
        footer: `ROM Agent Monitoring | ${new Date().toLocaleString()}`,
        mrkdwn_in: ['text']
      }
    ]
  };

  // Add alert details
  if (metrics.alerts.length > 0) {
    const alertsText = metrics.alerts.map((a, i) =>
      `${i + 1}. [${a.level.toUpperCase()}] ${a.category}: ${a.message}`
    ).join('\n');

    message.attachments.push({
      color: color,
      title: 'Alert Details',
      text: alertsText,
      mrkdwn_in: ['text']
    });
  }

  try {
    const response = await fetch(CONFIG.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      console.error(`${colors.red}Failed to send Slack notification: ${response.statusText}${colors.reset}`);
    } else {
      console.log(`${colors.green}Slack notification sent${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Failed to send Slack notification: ${error.message}${colors.reset}`);
  }
}

/**
 * Executar monitoramento uma vez
 */
async function runMonitoring() {
  try {
    console.log(`${colors.dim}Fetching metrics from ${CONFIG.url}...${colors.reset}`);

    const metrics = await fetchMetrics();

    // Exibir no console
    displayMetrics(metrics);

    // Salvar histórico
    saveMetricsHistory(metrics);

    // Registrar alertas
    logAlerts(metrics);

    // Enviar notificações se habilitado
    if (CONFIG.enableNotifications) {
      await sendSlackNotification(metrics);
    }

    return metrics;
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error fetching metrics:${colors.reset} ${error.message}`);
    console.error(`${colors.dim}Make sure the server is running at ${CONFIG.url}${colors.reset}`);
    throw error;
  }
}

/**
 * Monitoramento contínuo
 */
async function watchMode(intervalSeconds) {
  console.log(`${colors.bright}${colors.cyan}Starting continuous monitoring...${colors.reset}`);
  console.log(`Interval: ${intervalSeconds} seconds`);
  console.log(`URL: ${CONFIG.url}`);
  console.log(`Press Ctrl+C to stop\n`);

  // Primeira execução imediata
  await runMonitoring();

  // Executar periodicamente
  setInterval(async () => {
    await runMonitoring();
  }, intervalSeconds * 1000);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const watchFlag = args.includes('--watch') || args.includes('-w');
  const intervalIndex = args.indexOf('--interval');
  const interval = intervalIndex >= 0 ? parseInt(args[intervalIndex + 1], 10) : CONFIG.interval;

  if (watchFlag) {
    await watchMode(interval);
  } else {
    await runMonitoring();
    process.exit(0);
  }
}

// Execute
main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
