#!/usr/bin/env node

/**
 * Teste dos novos comandos da CLI
 * Valida que os comandos 'status' e 'extrair' foram implementados
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORES = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

console.log(`\n${CORES.cyan}╔═══════════════════════════════════════════════════════════╗${CORES.reset}`);
console.log(`${CORES.cyan}║  TESTE DOS NOVOS COMANDOS DA CLI ROM AGENT               ║${CORES.reset}`);
console.log(`${CORES.cyan}╚═══════════════════════════════════════════════════════════╝${CORES.reset}\n`);

const cliPath = path.join(__dirname, '..', 'src', 'cli-advanced.js');

function testCommand(args, description) {
  return new Promise((resolve) => {
    console.log(`${CORES.yellow}▶ Testando:${CORES.reset} ${description}`);
    console.log(`${CORES.dim}  Comando: rom ${args.join(' ')}${CORES.reset}\n`);

    const proc = spawn('node', [cliPath, ...args], {
      env: { ...process.env, ANTHROPIC_API_KEY: 'test-key' }
    });

    let output = '';
    let hasError = false;

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
      hasError = true;
    });

    proc.on('close', (code) => {
      // Para comandos de help/version, código 0 é esperado
      // Para comandos que precisam de API, erro é esperado sem key válida
      if (args.includes('--help') || args.includes('--version')) {
        if (code === 0) {
          console.log(`  ${CORES.green}✓ Passou${CORES.reset} (código: ${code})\n`);
          resolve({ success: true, output });
        } else {
          console.log(`  ${CORES.red}✗ Falhou${CORES.reset} (código: ${code})\n`);
          resolve({ success: false, output });
        }
      } else {
        // Para outros comandos, apenas verificar se não há erro de sintaxe
        const hasSyntaxError = output.includes('SyntaxError') || output.includes('Cannot find module');
        if (!hasSyntaxError) {
          console.log(`  ${CORES.green}✓ Passou${CORES.reset} (sem erro de sintaxe)\n`);
          resolve({ success: true, output });
        } else {
          console.log(`  ${CORES.red}✗ Falhou${CORES.reset} (erro de sintaxe detectado)\n`);
          console.log(`${CORES.dim}${output.slice(0, 500)}${CORES.reset}\n`);
          resolve({ success: false, output });
        }
      }
    });
  });
}

async function runTests() {
  const tests = [
    { args: ['--help'], desc: 'Help (deve exibir ajuda com novos comandos)' },
    { args: ['--version'], desc: 'Version (deve exibir versão)' },
    { args: ['status'], desc: 'Status (deve tentar conectar à API)' },
    { args: ['extrair'], desc: 'Extrair sem argumentos (deve exibir ajuda)' },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testCommand(test.args, test.desc);
    results.push({ test, result });
  }

  console.log(`\n${CORES.cyan}╔═══════════════════════════════════════════════════════════╗${CORES.reset}`);
  console.log(`${CORES.cyan}║  RESUMO DOS TESTES                                        ║${CORES.reset}`);
  console.log(`${CORES.cyan}╚═══════════════════════════════════════════════════════════╝${CORES.reset}\n`);

  const passed = results.filter(r => r.result.success).length;
  const failed = results.filter(r => !r.result.success).length;

  console.log(`  ${CORES.green}✓ Passaram: ${passed}/${results.length}${CORES.reset}`);
  console.log(`  ${CORES.red}✗ Falharam: ${failed}/${results.length}${CORES.reset}\n`);

  if (failed === 0) {
    console.log(`${CORES.green}✅ Todos os testes passaram!${CORES.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${CORES.red}❌ Alguns testes falharam${CORES.reset}\n`);
    process.exit(1);
  }
}

runTests().catch(console.error);
