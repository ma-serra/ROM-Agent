#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════════
 * ROM AGENT v3.5 - STRESS TEST DO PIPELINE ORCHESTRATOR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Testa a resiliência do sistema sob carga concorrente:
 * - Múltiplos usuários disparando pipelines simultaneamente
 * - Validação de fila concorrente (processConcurrent)
 * - Validação de PostgreSQL pool (sem estouro de conexões)
 * - Validação de timeout de 5 segundos
 * - Validação de Redis resilience (se disponível)
 *
 * Uso:
 *   node tests/orchestrator/stress-test-pipeline.js --users 10 --duration 60
 *
 * Opções:
 *   --users <N>       Número de usuários concorrentes (padrão: 5)
 *   --duration <sec>  Duração do teste em segundos (padrão: 30)
 *   --endpoint <url>  URL do endpoint (padrão: http://localhost:10000)
 *   --verbose         Modo verbose (logs detalhados)
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const CONFIG = {
  users: parseInt(getArg('users', '5')),
  durationSeconds: parseInt(getArg('duration', '30')),
  endpoint: getArg('endpoint', 'http://localhost:10000'),
  verbose: args.includes('--verbose'),

  // Timeouts
  requestTimeout: 5000, // 5 segundos (limite do sistema)
  connectionTimeout: 10000 // 10 segundos
};

// Mock de documentos para teste
const MOCK_DOCUMENTS = [
  'processo-001-recurso-especial',
  'processo-002-apelacao-civel',
  'processo-003-agravo-instrumento',
  'processo-004-habeas-corpus',
  'processo-005-recurso-extraordinario'
];

// ════════════════════════════════════════════════════════════════════════════
// MÉTRICAS
// ════════════════════════════════════════════════════════════════════════════

const METRICS = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  timeoutRequests: 0,
  serverErrors: 0,
  connectionErrors: 0,
  responseTimes: [],
  errors: {},
  startTime: Date.now(),
  endTime: null
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: HTTP REQUEST
// ════════════════════════════════════════════════════════════════════════════

function makeRequest(url, method, data, timeout = CONFIG.requestTimeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: timeout
    };

    const startTime = Date.now();

    const req = lib.request(options, (res) => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            duration
          });
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      reject({ error: err.message, duration, type: 'connection_error' });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      reject({ error: 'Request timeout', duration, type: 'timeout' });
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SIMULAÇÃO DE USUÁRIO
// ════════════════════════════════════════════════════════════════════════════

async function simulateUser(userId, documentId) {
  METRICS.totalRequests++;

  const requestStart = Date.now();

  try {
    const result = await makeRequest(
      `${CONFIG.endpoint}/api/orchestrator/run-pipeline`,
      'POST',
      {
        documentId,
        type: 'analise-completa',
        options: {
          model: 'sonnet',
          enableThinking: true
        }
      }
    );

    const duration = Date.now() - requestStart;
    METRICS.responseTimes.push(duration);

    if (result.statusCode === 200 && result.body.success) {
      METRICS.successfulRequests++;

      if (CONFIG.verbose) {
        console.log(`✅ [User ${userId}] Sucesso: ${result.body.workflowId} (${duration}ms)`);
      }

      return { success: true, workflowId: result.body.workflowId, duration };

    } else if (result.statusCode >= 500) {
      METRICS.serverErrors++;
      METRICS.failedRequests++;

      const errorKey = `HTTP ${result.statusCode}`;
      METRICS.errors[errorKey] = (METRICS.errors[errorKey] || 0) + 1;

      if (CONFIG.verbose) {
        console.log(`❌ [User ${userId}] Erro servidor: ${result.statusCode}`);
      }

      return { success: false, error: errorKey, duration };

    } else {
      METRICS.failedRequests++;

      const errorMsg = result.body.error || 'Erro desconhecido';
      METRICS.errors[errorMsg] = (METRICS.errors[errorMsg] || 0) + 1;

      if (CONFIG.verbose) {
        console.log(`⚠️  [User ${userId}] Falha: ${errorMsg}`);
      }

      return { success: false, error: errorMsg, duration };
    }

  } catch (err) {
    const duration = Date.now() - requestStart;
    METRICS.responseTimes.push(duration);

    if (err.type === 'timeout') {
      METRICS.timeoutRequests++;
      METRICS.failedRequests++;
      METRICS.errors['Timeout (>5s)'] = (METRICS.errors['Timeout (>5s)'] || 0) + 1;

      if (CONFIG.verbose) {
        console.log(`⏱️  [User ${userId}] Timeout após ${duration}ms`);
      }

      return { success: false, error: 'Timeout', duration };

    } else if (err.type === 'connection_error') {
      METRICS.connectionErrors++;
      METRICS.failedRequests++;
      METRICS.errors['Connection Error'] = (METRICS.errors['Connection Error'] || 0) + 1;

      if (CONFIG.verbose) {
        console.log(`🔌 [User ${userId}] Erro de conexão: ${err.error}`);
      }

      return { success: false, error: 'Connection Error', duration };

    } else {
      METRICS.failedRequests++;
      METRICS.errors['Unknown Error'] = (METRICS.errors['Unknown Error'] || 0) + 1;

      if (CONFIG.verbose) {
        console.log(`❓ [User ${userId}] Erro: ${err.error || err.message}`);
      }

      return { success: false, error: err.message, duration };
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO DO TESTE
// ════════════════════════════════════════════════════════════════════════════

async function runStressTest() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║  ROM AGENT v3.5 - STRESS TEST DO PIPELINE ORCHESTRATOR                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Configuração do teste:');
  console.log(`   • Usuários concorrentes: ${CONFIG.users}`);
  console.log(`   • Duração: ${CONFIG.durationSeconds} segundos`);
  console.log(`   • Endpoint: ${CONFIG.endpoint}`);
  console.log(`   • Timeout por request: ${CONFIG.requestTimeout}ms`);
  console.log(`   • Verbose: ${CONFIG.verbose ? 'Sim' : 'Não'}\n`);

  console.log('🚀 Iniciando teste de carga...\n');

  const testStartTime = Date.now();
  const testEndTime = testStartTime + (CONFIG.durationSeconds * 1000);

  // Array de promises para todos os usuários
  const userPromises = [];

  // Spawn de usuários concorrentes
  for (let userId = 1; userId <= CONFIG.users; userId++) {
    const userPromise = (async () => {
      while (Date.now() < testEndTime) {
        // Escolher documento aleatório
        const documentId = MOCK_DOCUMENTS[Math.floor(Math.random() * MOCK_DOCUMENTS.length)];

        // Executar request
        await simulateUser(userId, documentId);

        // Aguardar intervalo aleatório entre 1-3 segundos antes do próximo request
        const waitTime = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    userPromises.push(userPromise);
  }

  // Aguardar todos os usuários completarem
  await Promise.all(userPromises);

  METRICS.endTime = Date.now();

  // Exibir relatório
  displayReport();
}

// ════════════════════════════════════════════════════════════════════════════
// RELATÓRIO FINAL
// ════════════════════════════════════════════════════════════════════════════

function displayReport() {
  const totalDuration = (METRICS.endTime - METRICS.startTime) / 1000;
  const avgResponseTime = METRICS.responseTimes.length > 0
    ? Math.round(METRICS.responseTimes.reduce((a, b) => a + b, 0) / METRICS.responseTimes.length)
    : 0;

  const p50 = percentile(METRICS.responseTimes, 0.5);
  const p95 = percentile(METRICS.responseTimes, 0.95);
  const p99 = percentile(METRICS.responseTimes, 0.99);

  const successRate = METRICS.totalRequests > 0
    ? ((METRICS.successfulRequests / METRICS.totalRequests) * 100).toFixed(2)
    : 0;

  const requestsPerSecond = (METRICS.totalRequests / totalDuration).toFixed(2);

  console.log('\n\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║  RELATÓRIO FINAL - STRESS TEST                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📈 ESTATÍSTICAS GERAIS:');
  console.log(`   • Duração total: ${totalDuration.toFixed(2)}s`);
  console.log(`   • Total de requests: ${METRICS.totalRequests}`);
  console.log(`   • Requests/segundo: ${requestsPerSecond}`);
  console.log(`   • Taxa de sucesso: ${successRate}%\n`);

  console.log('✅ RESULTADOS:');
  console.log(`   • Sucesso: ${METRICS.successfulRequests} (${successRate}%)`);
  console.log(`   • Falhas: ${METRICS.failedRequests}`);
  console.log(`   • Timeouts (>5s): ${METRICS.timeoutRequests}`);
  console.log(`   • Erros servidor (5xx): ${METRICS.serverErrors}`);
  console.log(`   • Erros conexão: ${METRICS.connectionErrors}\n`);

  console.log('⏱️  TEMPOS DE RESPOSTA:');
  console.log(`   • Média: ${avgResponseTime}ms`);
  console.log(`   • P50 (mediana): ${p50}ms`);
  console.log(`   • P95: ${p95}ms`);
  console.log(`   • P99: ${p99}ms\n`);

  if (Object.keys(METRICS.errors).length > 0) {
    console.log('❌ ERROS DETALHADOS:');
    Object.entries(METRICS.errors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.log(`   • ${error}: ${count} ocorrências`);
      });
    console.log();
  }

  // Validações
  console.log('🔍 VALIDAÇÕES:');

  const validations = [
    {
      name: 'Taxa de sucesso >= 80%',
      pass: parseFloat(successRate) >= 80,
      value: `${successRate}%`
    },
    {
      name: 'P95 <= 5000ms (timeout configurado)',
      pass: p95 <= 5000,
      value: `${p95}ms`
    },
    {
      name: 'P99 <= 6000ms (margem de 20%)',
      pass: p99 <= 6000,
      value: `${p99}ms`
    },
    {
      name: 'Erros servidor < 10%',
      pass: (METRICS.serverErrors / METRICS.totalRequests) < 0.1,
      value: `${((METRICS.serverErrors / METRICS.totalRequests) * 100).toFixed(2)}%`
    },
    {
      name: 'Timeouts < 5%',
      pass: (METRICS.timeoutRequests / METRICS.totalRequests) < 0.05,
      value: `${((METRICS.timeoutRequests / METRICS.totalRequests) * 100).toFixed(2)}%`
    }
  ];

  let allPassed = true;

  validations.forEach(v => {
    const icon = v.pass ? '✅' : '❌';
    console.log(`   ${icon} ${v.name}: ${v.value}`);
    if (!v.pass) allPassed = false;
  });

  console.log('\n' + '═'.repeat(76));

  if (allPassed) {
    console.log('🎉 TESTE PASSOU! Sistema resiliente sob carga concorrente.');
  } else {
    console.log('⚠️  TESTE FALHOU! Sistema precisa de otimizações.');
  }

  console.log('═'.repeat(76) + '\n');

  // Exit code baseado no resultado
  process.exit(allPassed ? 0 : 1);
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function percentile(arr, p) {
  if (arr.length === 0) return 0;

  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;

  return Math.round(sorted[index]);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

runStressTest().catch(err => {
  console.error('\n❌ Erro fatal no teste:', err);
  process.exit(1);
});
