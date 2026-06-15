#!/usr/bin/env node
/**
 * INTEGRATION: Endpoint do Orchestrator no Server Enhanced
 *
 * Adiciona:
 * 1. Import do orchestratorRoutes
 * 2. Import e inicialização do MasterOrchestrator
 * 3. Registro da rota /api/orchestrator
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SERVER_FILE = path.join(ROOT_DIR, 'src/server-enhanced.js');

async function applyIntegration() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  INTEGRATION: ORCHESTRATOR ENDPOINT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ler arquivo
  let content = await fs.readFile(SERVER_FILE, 'utf-8');

  // Backup
  const backupPath = `${SERVER_FILE}.backup-orchestrator-${Date.now()}`;
  await fs.writeFile(backupPath, content);
  console.log(`✓ Backup criado: ${path.basename(backupPath)}\n`);

  // 1. Adicionar import do orchestratorRoutes após analyticsRoutes
  if (!content.includes('import orchestratorRoutes')) {
    const importLine = "import analyticsRoutes from './routes/analytics.js'; // Analytics de usabilidade";
    const newImport = `${importLine}
import orchestratorRoutes from './routes/orchestrator.js'; // Pipeline ROM de 5 etapas`;

    content = content.replace(importLine, newImport);
    console.log('✓ Import orchestratorRoutes adicionado\n');
  }

  // 2. Adicionar import do MasterOrchestrator após os outros imports de services
  if (!content.includes('import { MasterOrchestrator }')) {
    const serviceImportsEnd = "import { loadStructuredFilesFromKB } from './middleware/kb-loader.js';";
    const newImports = `${serviceImportsEnd}
import { MasterOrchestrator } from './services/master-orchestrator.js';
import { EventBus } from './services/event-bus.js';
import { StateManager } from './services/state-manager.js';`;

    content = content.replace(serviceImportsEnd, newImports);
    console.log('✓ Imports MasterOrchestrator, EventBus, StateManager adicionados\n');
  }

  // 3. Adicionar inicialização do MasterOrchestrator após inicialização do app
  // Procurar pela linha de inicialização do Express
  const appInit = "const app = express();";
  const orchestratorInit = `const app = express();

// ════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO DO MASTER ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════
// Orquestrador Mestre para pipeline ROM de 5 etapas
// Inicializado aqui para estar disponível em app.locals para todas as rotas

let masterOrchestrator = null;

async function initializeMasterOrchestrator() {
  try {
    console.log('🎯 [Orchestrator] Inicializando MasterOrchestrator...');

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  [Orchestrator] ANTHROPIC_API_KEY não configurada');
      return null;
    }

    // Aguardar pool do PostgreSQL estar disponível
    const pool = getPostgresPool();

    if (!pool) {
      console.warn('⚠️  [Orchestrator] PostgreSQL pool não disponível');
    }

    // Redis é opcional
    const redis = null; // TODO: Implementar Redis se necessário

    masterOrchestrator = new MasterOrchestrator(apiKey, pool, redis);

    console.log('✅ [Orchestrator] MasterOrchestrator inicializado com sucesso');

    return masterOrchestrator;

  } catch (error) {
    console.error('❌ [Orchestrator] Erro ao inicializar:', error.message);
    return null;
  }
}

// Inicializar em background (não bloqueia startup)
initializeMasterOrchestrator().then(orchestrator => {
  if (orchestrator) {
    app.locals.masterOrchestrator = orchestrator;
    console.log('✅ [Orchestrator] Disponível em app.locals.masterOrchestrator');
  }
}).catch(error => {
  console.error('❌ [Orchestrator] Falha na inicialização:', error.message);
});

// ════════════════════════════════════════════════════════════════════════
`;

  if (!content.includes('initializeMasterOrchestrator')) {
    content = content.replace(appInit, orchestratorInit);
    console.log('✓ Inicialização do MasterOrchestrator adicionada\n');
  }

  // 4. Registrar rota /api/orchestrator após as rotas de analytics
  const analyticsRoute = "app.use('/api/analytics', analyticsRoutes); // Analytics de usabilidade";
  const orchestratorRoute = `${analyticsRoute}
app.use('/api', orchestratorRoutes); // Pipeline ROM de 5 etapas
logger.info('✅ [ROUTES] /api/orchestrator registrado');`;

  if (!content.includes('/api/orchestrator registrado')) {
    content = content.replace(analyticsRoute, orchestratorRoute);
    console.log('✓ Rota /api/orchestrator registrada\n');
  }

  // Salvar arquivo modificado
  await fs.writeFile(SERVER_FILE, content);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ INTEGRATION APLICADA COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Modificações aplicadas:');
  console.log('   ✓ Import orchestratorRoutes adicionado');
  console.log('   ✓ Import MasterOrchestrator adicionado');
  console.log('   ✓ Inicialização do MasterOrchestrator em background');
  console.log('   ✓ app.locals.masterOrchestrator configurado');
  console.log('   ✓ Rota /api/orchestrator registrada\n');

  console.log('🎯 Endpoints disponíveis:');
  console.log('   • POST /api/orchestrator/run-pipeline');
  console.log('   • GET  /api/orchestrator/workflows/:id');
  console.log('   • GET  /api/orchestrator/workflows\n');

  console.log('🔄 Rollback (se necessário):');
  console.log(`   cp ${path.basename(backupPath)} src/server-enhanced.js\n`);
}

applyIntegration().catch(console.error);
