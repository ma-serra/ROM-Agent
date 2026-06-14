#!/usr/bin/env node
/**
 * Run All Orchestrator Tests
 *
 * Executa todos os testes de integração do sistema multi-agente
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  'event-bus.test.js',
  'state-manager.test.js',
  'master-orchestrator.test.js'
];

console.log('\n🧪 Executando testes de integração do Orquestrador Multi-Agente\n');
console.log('='.repeat(70));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = join(__dirname, testFile);

    console.log(`\n📋 Executando: ${testFile}`);
    console.log('-'.repeat(70));

    const testProcess = spawn('node', ['--test', testPath], {
      stdio: 'inherit'
    });

    testProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} - PASSOU\n`);
        passedTests++;
      } else {
        console.log(`❌ ${testFile} - FALHOU (exit code: ${code})\n`);
        failedTests++;
      }
      totalTests++;
      resolve(code);
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Erro ao executar ${testFile}:`, error);
      failedTests++;
      totalTests++;
      resolve(1);
    });
  });
}

async function main() {
  for (const testFile of tests) {
    await runTest(testFile);
  }

  console.log('='.repeat(70));
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('='.repeat(70));
  console.log(`Total de arquivos de teste: ${totalTests}`);
  console.log(`✅ Passaram: ${passedTests}`);
  console.log(`❌ Falharam: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
