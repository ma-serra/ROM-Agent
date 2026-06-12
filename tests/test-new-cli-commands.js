#!/usr/bin/env node

/**
 * Teste dos novos comandos de IA da CLI
 * Valida: analisar, parecer, resumo, redigir, pesquisar, prognostico
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
console.log(`${CORES.cyan}║  TESTE DOS NOVOS COMANDOS DE IA - CLI ROM AGENT          ║${CORES.reset}`);
console.log(`${CORES.cyan}╚═══════════════════════════════════════════════════════════╝${CORES.reset}\n`);

const cliPath = path.join(__dirname, '..', 'src', 'cli-advanced.js');

function testCommand(args, description, expectedInOutput) {
  return new Promise((resolve) => {
    console.log(`${CORES.yellow}▶ Testando:${CORES.reset} ${description}`);
    console.log(`${CORES.dim}  Comando: rom ${args.join(' ')}${CORES.reset}\n`);

    const proc = spawn('node', [cliPath, ...args], {
      env: { ...process.env, ANTHROPIC_API_KEY: 'test-key' }
    });

    let output = '';
    let timeout = setTimeout(() => {
      proc.kill();
    }, 5000); // 5 segundos timeout

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      // Verificar se contém a saída esperada
      const hasExpectedOutput = expectedInOutput.some(expected =>
        output.toLowerCase().includes(expected.toLowerCase())
      );

      // Para comandos de ajuda, não deve ter erro de sintaxe
      const hasSyntaxError = output.includes('SyntaxError') ||
                             output.includes('Cannot find module') ||
                             output.includes('ReferenceError');

      if (hasExpectedOutput && !hasSyntaxError) {
        console.log(`  ${CORES.green}✓ Passou${CORES.reset} - Output contém texto esperado\n`);
        resolve({ success: true, output });
      } else if (hasSyntaxError) {
        console.log(`  ${CORES.red}✗ Falhou${CORES.reset} - Erro de sintaxe detectado\n`);
        console.log(`${CORES.dim}${output.slice(0, 300)}${CORES.reset}\n`);
        resolve({ success: false, output });
      } else {
        console.log(`  ${CORES.yellow}⚠ Aviso${CORES.reset} - Texto esperado não encontrado\n`);
        console.log(`${CORES.dim}Output (primeiros 300 chars): ${output.slice(0, 300)}${CORES.reset}\n`);
        resolve({ success: false, output });
      }
    });
  });
}

async function runTests() {
  const tests = [
    {
      args: ['analisar'],
      desc: 'Comando analisar (deve exibir ajuda)',
      expected: ['uso:', 'arquivo_ou_texto', 'exemplo']
    },
    {
      args: ['parecer'],
      desc: 'Comando parecer (alias de analisar)',
      expected: ['parecer', 'análise', 'risco']
    },
    {
      args: ['resumo'],
      desc: 'Comando resumo (deve exibir ajuda com camadas)',
      expected: ['resumo executivo', 'camada', 'básico']
    },
    {
      args: ['redigir'],
      desc: 'Comando redigir (deve exibir ajuda)',
      expected: ['tipo-peca', 'cíveis', 'criminais']
    },
    {
      args: ['pesquisar'],
      desc: 'Comando pesquisar (deve exibir ajuda)',
      expected: ['jurisprudência', 'tribunal', 'termo']
    },
    {
      args: ['prognostico'],
      desc: 'Comando prognostico (deve exibir ajuda)',
      expected: ['prognóstico', 'caso', 'exemplo']
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testCommand(test.args, test.desc, test.expected);
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
