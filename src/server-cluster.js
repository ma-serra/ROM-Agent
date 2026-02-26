/**
 * ROM Agent - Servidor Multi-Core com Clustering
 * Usa todos os processadores disponíveis para máxima performance
 */

import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Número de CPUs disponíveis
const totalCPUs = os.cpus().length;

// 🔧 LIMITE DE WORKERS baseado no ambiente
const isRender = process.env.RENDER === 'true';
const WEB_CONCURRENCY = parseInt(process.env.WEB_CONCURRENCY || '0', 10);
const MAX_WORKERS_RENDER = 4; // Render Standard: máx 4 workers (2GB RAM / ~500MB por worker + documentos grandes)

// ✅ PRIORIDADE: WEB_CONCURRENCY > MAX_WORKERS_RENDER > totalCPUs
const numCPUs = WEB_CONCURRENCY > 0
  ? WEB_CONCURRENCY
  : (isRender ? Math.min(totalCPUs, MAX_WORKERS_RENDER) : totalCPUs);

console.error('[DEBUG-CLUSTER] ========================================');
console.error('[DEBUG-CLUSTER] INÍCIO DO SERVER-CLUSTER.JS');
console.error('[DEBUG-CLUSTER] totalCPUs=' + totalCPUs);
console.error('[DEBUG-CLUSTER] WEB_CONCURRENCY=' + process.env.WEB_CONCURRENCY);
console.error('[DEBUG-CLUSTER] numCPUs calculado=' + numCPUs);
console.error('[DEBUG-CLUSTER] isRender=' + isRender);
console.error('[DEBUG-CLUSTER] cluster.isPrimary=' + cluster.isPrimary);
console.error('[DEBUG-CLUSTER] ========================================');

if (isRender) {
  console.log(`⚙️  Ambiente RENDER detectado - Limitando workers para ${numCPUs} (RAM: 2GB)`);
  console.error('[DEBUG-CLUSTER] Log de ambiente Render executado');
}

if (cluster.isPrimary) {
  console.error('[DEBUG-CLUSTER] ENTRANDO NO BLOCO PRIMARY');

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗  ██████╗ ███╗   ███╗                              ║
║   ██╔══██╗██╔═══██╗████╗ ████║                              ║
║   ██████╔╝██║   ██║██╔████╔██║                              ║
║   ██╔══██╗██║   ██║██║╚██╔╝██║                              ║
║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║                              ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝                              ║
║                                                              ║
║   🚀 SERVIDOR MULTI-CORE INICIANDO                          ║
║   CPUs Físicas: ${totalCPUs.toString().padEnd(2)} | Workers: ${numCPUs.toString().padEnd(2)}                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
  console.error('[DEBUG-CLUSTER] Banner ASCII impresso');

  console.log(`\n🔄 Criando ${numCPUs} workers (um por CPU)...\n`);
  console.error('[DEBUG-CLUSTER] Iniciando loop de fork de ' + numCPUs + ' workers');

  // Criar um worker para cada CPU
  for (let i = 0; i < numCPUs; i++) {
    console.error('[DEBUG-CLUSTER] Forking worker ' + (i + 1) + '/' + numCPUs);
    const worker = cluster.fork();
    console.error('[DEBUG-CLUSTER] Worker forked com PID=' + worker.process.pid);
    console.log(`✅ Worker ${worker.process.pid} iniciado (CPU ${i + 1}/${numCPUs})`);
    console.error('[DEBUG-CLUSTER] Log de worker iniciado executado');
  }

  console.error('[DEBUG-CLUSTER] Loop de fork completado');

  // Contador de workers online
  let workersOnline = 0;
  console.error('[DEBUG-CLUSTER] Registrando listener de evento "online"');

  // Quando um worker fica online
  cluster.on('online', (worker) => {
    console.error('[DEBUG-CLUSTER] Evento "online" disparado para worker PID=' + worker.process.pid);
    workersOnline++;
    console.error('[DEBUG-CLUSTER] workersOnline=' + workersOnline + '/' + numCPUs);
    if (workersOnline === numCPUs) {
      console.error('[DEBUG-CLUSTER] ★★★ TODOS OS WORKERS ONLINE ★★★');
      console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
      console.log(`║  🎉 TODOS OS ${numCPUs} WORKERS ESTÃO ONLINE!                        ║`);
      console.log(`║  🚀 Servidor rodando com MÁXIMA PERFORMANCE                  ║`);
      console.log(`║  📊 Balanceamento de carga automático ativo                  ║`);
      console.log(`║  💪 Usando 100% dos recursos do processador                  ║`);
      console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
      console.error('[DEBUG-CLUSTER] Banner de "todos online" impresso');
    }
  });

  // Se um worker morrer, criar um novo
  cluster.on('exit', (worker, code, signal) => {
    console.log(`\n⚠️  Worker ${worker.process.pid} morreu (code: ${code}, signal: ${signal})`);
    console.log(`🔄 Criando novo worker para substituir...`);

    const newWorker = cluster.fork();
    console.log(`✅ Novo worker ${newWorker.process.pid} criado\n`);
  });

  // Estatísticas a cada 60 segundos
  setInterval(() => {
    const workers = Object.values(cluster.workers);
    console.log(`\n📊 Estatísticas do Cluster:`);
    console.log(`   Workers ativos: ${workers.length}`);
    console.log(`   CPUs em uso: ${numCPUs}`);
    console.log(`   Uptime: ${Math.floor(process.uptime())}s\n`);
  }, 60000);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM recebido. Desligando workers gracefully...\n');

    for (const id in cluster.workers) {
      console.log(`🛑 Desligando worker ${cluster.workers[id].process.pid}...`);
      cluster.workers[id].kill();
    }
  });

  process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT recebido. Desligando workers gracefully...\n');

    for (const id in cluster.workers) {
      console.log(`🛑 Desligando worker ${cluster.workers[id].process.pid}...`);
      cluster.workers[id].kill();
    }

    process.exit(0);
  });

} else {
  console.error('[DEBUG-WORKER-' + process.pid + '] ========================================');
  console.error('[DEBUG-WORKER-' + process.pid + '] WORKER PROCESS INICIANDO');
  console.error('[DEBUG-WORKER-' + process.pid + '] PID=' + process.pid);
  console.error('[DEBUG-WORKER-' + process.pid + '] ========================================');

  // Worker process - importa e executa o servidor MELHORADO
  const serverPath = path.join(__dirname, 'server-enhanced.js');
  console.error('[DEBUG-WORKER-' + process.pid + '] serverPath=' + serverPath);

  // Importa dinamicamente o servidor e chama startServer() explicitamente
  console.error('[DEBUG-WORKER-' + process.pid + '] Iniciando import() do módulo...');
  import(serverPath).then(async (module) => {
    console.error('[DEBUG-WORKER-' + process.pid + '] ★★★ MÓDULO IMPORTADO COM SUCESSO ★★★');
    console.error('[DEBUG-WORKER-' + process.pid + '] Verificando module.startServer: ' + typeof module.startServer);

    try {
      console.error('[DEBUG-WORKER-' + process.pid + '] Chamando module.startServer()...');
      const serverInfo = await module.startServer();
      console.error('[DEBUG-WORKER-' + process.pid + '] ★★★ startServer() COMPLETOU ★★★');
      console.error('[DEBUG-WORKER-' + process.pid + '] serverInfo.host=' + serverInfo.host);
      console.error('[DEBUG-WORKER-' + process.pid + '] serverInfo.port=' + serverInfo.port);
      console.log(`[Worker ${process.pid}] ✅ Servidor ENHANCED iniciado em ${serverInfo.host}:${serverInfo.port}`);
      console.log(`[Worker ${process.pid}] ✅ WebSocket server pronto para receber conexões`);
      console.error('[DEBUG-WORKER-' + process.pid + '] Logs de confirmação impressos');
    } catch (error) {
      console.error('[DEBUG-WORKER-' + process.pid + '] ❌ ERRO no try block: ' + error.message);
      console.error('[DEBUG-WORKER-' + process.pid + '] Stack: ' + error.stack);
      console.error(`[Worker ${process.pid}] ❌ Erro ao iniciar servidor:`, error.message);
      // Don't exit immediately - let cluster manager handle worker restart
      setTimeout(() => process.exit(1), 1000);
    }
  }).catch(error => {
    console.error('[DEBUG-WORKER-' + process.pid + '] ❌ ERRO no import(): ' + error.message);
    console.error('[DEBUG-WORKER-' + process.pid + '] Stack: ' + error.stack);
    console.error(`[Worker ${process.pid}] ❌ Erro ao importar módulo:`, error);
    process.exit(1);
  });

  console.error('[DEBUG-WORKER-' + process.pid + '] import() disparado (async), continuando...');
}
