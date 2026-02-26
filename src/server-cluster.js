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

if (isRender) {
  console.log(`⚙️  Ambiente RENDER detectado - Limitando workers para ${numCPUs} (RAM: 2GB)`);
}

if (cluster.isPrimary) {
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

  console.log(`\n🔄 Criando ${numCPUs} workers (um por CPU)...\n`);

  // Criar um worker para cada CPU
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${worker.process.pid} iniciado (CPU ${i + 1}/${numCPUs})`);
  }

  // Contador de workers online
  let workersOnline = 0;

  // Quando um worker fica online
  cluster.on('online', (worker) => {
    workersOnline++;
    if (workersOnline === numCPUs) {
      console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
      console.log(`║  🎉 TODOS OS ${numCPUs} WORKERS ESTÃO ONLINE!                        ║`);
      console.log(`║  🚀 Servidor rodando com MÁXIMA PERFORMANCE                  ║`);
      console.log(`║  📊 Balanceamento de carga automático ativo                  ║`);
      console.log(`║  💪 Usando 100% dos recursos do processador                  ║`);
      console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
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
  // Worker process - importa e executa o servidor MELHORADO
  const serverPath = path.join(__dirname, 'server-enhanced.js');

  // Importa dinamicamente o servidor e chama startServer() explicitamente
  import(serverPath).then(async (module) => {
    try {
      // Call the exported startServer function explicitly
      const serverInfo = await module.startServer();
      console.log(`[Worker ${process.pid}] ✅ Servidor ENHANCED iniciado em ${serverInfo.host}:${serverInfo.port}`);
      console.log(`[Worker ${process.pid}] ✅ WebSocket server pronto para receber conexões`);
    } catch (error) {
      console.error(`[Worker ${process.pid}] ❌ Erro ao iniciar servidor:`, error.message);
      // Don't exit immediately - let cluster manager handle worker restart
      setTimeout(() => process.exit(1), 1000);
    }
  }).catch(error => {
    console.error(`[Worker ${process.pid}] ❌ Erro ao importar módulo:`, error);
    process.exit(1);
  });
}
