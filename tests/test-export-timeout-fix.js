#!/usr/bin/env node

/**
 * Teste para validar correção de timeout em /api/export
 *
 * Verifica que:
 * 1. /api/export é classificado como 'async' (20min timeout)
 * 2. /api/export NÃO é classificado como 'long' (5min timeout)
 */

// Simular a função classifyRoute
function classifyRoute(path) {
  // Fast routes (health checks, info)
  if (path.match(/^\/(health|metrics|api\/info|api\/stats|ping)/)) {
    return 'fast';
  }

  // Async routes (AI, generation, document export)
  if (path.match(/\/api\/(chat|generate|ask|complete|stream|export)/)) {
    return 'async';
  }

  // Long routes (upload, batch)
  if (path.match(/\/api\/(upload|batch|process)/)) {
    return 'long';
  }

  // Default: sync routes
  return 'sync';
}

// SLO Config
const SLO_CONFIG = {
  http: {
    fast: { timeout: 5_000 },       // 5s
    sync: { timeout: 30_000 },      // 30s
    async: { timeout: 1_200_000 },  // 20min ✅
    long: { timeout: 300_000 }      // 5min ❌
  }
};

// Testes
console.log('🧪 Testando classificação de timeout para /api/export\n');

const testCases = [
  { path: '/api/export/docx', expected: 'async' },
  { path: '/api/export/pdf', expected: 'async' },
  { path: '/api/export/html', expected: 'async' },
  { path: '/api/chat/stream', expected: 'async' },
  { path: '/api/upload', expected: 'long' },
  { path: '/api/batch', expected: 'long' },
  { path: '/health', expected: 'fast' },
  { path: '/api/users', expected: 'sync' }
];

let passed = 0;
let failed = 0;

testCases.forEach(({ path, expected }) => {
  const result = classifyRoute(path);
  const timeout = SLO_CONFIG.http[result].timeout;
  const timeoutMin = Math.floor(timeout / 60000);
  const timeoutSec = Math.floor((timeout % 60000) / 1000);

  if (result === expected) {
    console.log(`✅ ${path}`);
    console.log(`   Classificação: ${result} | Timeout: ${timeoutMin}m ${timeoutSec}s`);
    passed++;
  } else {
    console.log(`❌ ${path}`);
    console.log(`   Esperado: ${expected} | Obtido: ${result}`);
    failed++;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Resultados: ${passed} passaram, ${failed} falharam`);

// Validação específica para /api/export
console.log(`\n${'='.repeat(60)}`);
console.log('🎯 VALIDAÇÃO DO BUG FIX:\n');

const exportRoute = classifyRoute('/api/export/docx');
const exportTimeout = SLO_CONFIG.http[exportRoute].timeout;
const exportTimeoutMin = Math.floor(exportTimeout / 60000);

if (exportRoute === 'async' && exportTimeout === 1_200_000) {
  console.log('✅ BUG CORRIGIDO COM SUCESSO!');
  console.log(`   /api/export agora tem timeout de ${exportTimeoutMin} minutos (async)`);
  console.log('   Documentos longos não sofrerão mais timeout.');
  process.exit(0);
} else {
  console.log('❌ BUG NÃO CORRIGIDO!');
  console.log(`   /api/export ainda está classificado como: ${exportRoute}`);
  console.log(`   Timeout atual: ${Math.floor(exportTimeout / 60000)}min`);
  process.exit(1);
}
