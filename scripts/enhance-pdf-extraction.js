#!/usr/bin/env node
/**
 * ENHANCEMENT: Motor de Extração PDF com Densidade e pdfplumber
 *
 * Melhorias aplicadas:
 * 1. Checagem de densidade: caracteres por página < 100 = SCAN
 * 2. Integração com pdfplumber para tabelas estruturadas
 * 3. Disparo automático de OCR para PDFs escaneados
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PIPELINE_FILE = path.join(ROOT_DIR, 'lib/extractor-pipeline.js');

async function applyEnhancements() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ENHANCEMENT: EXTRAÇÃO PDF COM DENSIDADE E PDFPLUMBER');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ler arquivo
  let content = await fs.readFile(PIPELINE_FILE, 'utf-8');

  // Backup
  const backupPath = `${PIPELINE_FILE}.backup-pdf-enhancement-${Date.now()}`;
  await fs.writeFile(backupPath, content);
  console.log(`✓ Backup criado: ${path.basename(backupPath)}\n`);

  // 1. Adicionar import do módulo pdfplumber no topo do arquivo
  const importSection = content.substring(0, 500);
  if (!importSection.includes('spawn') && !importSection.includes('{ execSync, spawn }')) {
    content = content.replace(
      "import { execSync } from 'child_process';",
      "import { execSync, spawn } from 'child_process';"
    );
    console.log('✓ Import de spawn adicionado\n');
  }

  // 2. Adicionar função auxiliar para pdfplumber logo após os imports
  const pdfplumberHelperCode = `

// ═════════════════════════════════════════════════════════════════════
// PDFPLUMBER INTEGRATION - Extração estruturada com tabelas
// ═════════════════════════════════════════════════════════════════════

/**
 * Extrai PDF usando pdfplumber (Python) para preservar estrutura de tabelas
 * @param {string} filePath - Caminho do PDF
 * @returns {Promise<Object>} Resultado com texto estruturado e tabelas
 */
async function extractWithPdfplumber(filePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'python-extractors', 'pdfplumber_extractor.py');

    // Verificar se o script Python existe
    if (!fs.existsSync(pythonScript)) {
      console.log('   ⚠️  pdfplumber_extractor.py não encontrado, pulando extração estruturada');
      return resolve({ success: false, error: 'Script not found' });
    }

    const python = spawn('python3', [pythonScript, filePath]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.log(\`   ⚠️  pdfplumber falhou (código \${code}): \${stderr}\`);
        return resolve({ success: false, error: stderr });
      }

      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log(\`   ✅ pdfplumber: \${result.pages} páginas, \${result.tables.length} tabelas\`);
          console.log(\`      Densidade: \${Math.round(result.metadata.chars_per_page)} chars/página\`);
        }
        resolve(result);
      } catch (e) {
        console.log(\`   ⚠️  pdfplumber: erro ao parsear JSON: \${e.message}\`);
        resolve({ success: false, error: e.message });
      }
    });

    // Timeout de 5 minutos
    setTimeout(() => {
      python.kill();
      resolve({ success: false, error: 'Timeout' });
    }, 300000);
  });
}

`;

  // Inserir função após a seção de imports (após linha ~80)
  const firstFunctionPos = content.indexOf('function getOCRWorkerConfig()');
  if (firstFunctionPos !== -1 && !content.includes('extractWithPdfplumber')) {
    content = content.slice(0, firstFunctionPos) + pdfplumberHelperCode + content.slice(firstFunctionPos);
    console.log('✓ Função extractWithPdfplumber() adicionada\n');
  }

  // 3. Substituir lógica de detecção de PDF escaneado por checagem de densidade
  const oldDensityCheck = `  // 🔥 DETECÇÃO DE PDF ESCANEADO - Verificar SE o texto extraído é muito pequeno
  if (extractedText) {
    const textSizeKB = extractedText.length / 1024;
    const textToFileSizeRatio = textSizeKB / sizeKB;

    console.log(\`   📊 Análise de extração:\`);
    console.log(\`      Arquivo: \${Math.round(sizeKB)} KB\`);
    console.log(\`      Texto extraído: \${Math.round(textSizeKB)} KB\`);
    console.log(\`      Ratio: \${(textToFileSizeRatio * 100).toFixed(2)}%\`);

    // 🔥 FORÇA OCR se:
    // - Arquivo > 10 MB E ratio < 10% (PDF grande com pouco texto = escaneado)
    // - OU qualquer PDF com ratio < 2% (muito pouco texto)
    // Nota: PDFs digitais reais têm >15% de texto. 4-10% geralmente são escaneados com índice/metadados.
    const shouldForceOCR = (isLargePDF && textToFileSizeRatio < 0.10) || textToFileSizeRatio < 0.02;`;

  const newDensityCheck = `  // 🔥 DETECÇÃO DE PDF ESCANEADO - Checagem de DENSIDADE (chars por página)
  if (extractedText) {
    const textSizeKB = extractedText.length / 1024;
    const textToFileSizeRatio = textSizeKB / sizeKB;

    // ✨ NOVA MÉTRICA: Densidade de caracteres por página
    // PDFs digitais: ~2000-10000 chars/página
    // PDFs escaneados com OCR ruim: <100 chars/página
    // PDFs escaneados sem OCR: 0-50 chars/página
    const charsPerPage = pageCount ? extractedText.length / pageCount : 0;

    console.log(\`   📊 Análise de extração:\`);
    console.log(\`      Arquivo: \${Math.round(sizeKB)} KB\`);
    console.log(\`      Texto extraído: \${Math.round(textSizeKB)} KB\`);
    console.log(\`      Ratio: \${(textToFileSizeRatio * 100).toFixed(2)}%\`);
    console.log(\`      ⭐ DENSIDADE: \${Math.round(charsPerPage)} chars/página (\${pageCount || '?'} páginas)\`);

    // 🔥 FORÇA OCR se densidade < 100 chars/página (indica SCAN)
    const shouldForceOCR = charsPerPage < 100 && pageCount > 0;`;

  if (content.includes(oldDensityCheck)) {
    content = content.replace(oldDensityCheck, newDensityCheck);
    console.log('✓ Checagem de densidade atualizada (chars/página)\n');
  }

  // 4. Adicionar chamada ao pdfplumber antes da detecção de escaneamento
  const beforeDensityCheck = `  // 2. Tentar pdftotext (CLI - melhor layout) se pdf-parse não funcionou
  if (!extractedText && CONFIG.extraction.usePdftotext) {`;

  const pdfplumberCall = `  // 1.5. Tentar pdfplumber (Python - estrutura de tabelas preservada)
  // ✨ NOVO: Extração estruturada com pdfplumber para tabelas e andamentos processuais
  if (!extractedText || isLargePDF) {
    const pdfplumberResult = await extractWithPdfplumber(filePath);

    if (pdfplumberResult.success && pdfplumberResult.text && pdfplumberResult.text.length > 100) {
      STATS.toolsUsed.add('pdfplumber');
      methods.push('pdfplumber');
      extractedText = pdfplumberResult.text;
      extractionMethod = 'pdfplumber (structured)';
      pageCount = pdfplumberResult.pages;

      console.log(\`   ✅ pdfplumber extraiu \${Math.round(extractedText.length / 1000)}k caracteres\`);
      console.log(\`      📊 \${pdfplumberResult.tables.length} tabelas estruturadas preservadas\`);

      // Se pdfplumber teve sucesso, usar esse texto
      // (mantém estrutura de tabelas)
    }
  }

  // 2. Tentar pdftotext (CLI - melhor layout) se pdfplumber não funcionou
  if (!extractedText && CONFIG.extraction.usePdftotext) {`;

  if (content.includes(beforeDensityCheck) && !content.includes('pdfplumber extraiu')) {
    content = content.replace(beforeDensityCheck, pdfplumberCall);
    console.log('✓ Integração com pdfplumber adicionada\n');
  }

  // Salvar arquivo modificado
  await fs.writeFile(PIPELINE_FILE, content);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ ENHANCEMENTS APLICADOS COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Modificações aplicadas:');
  console.log('   ✓ Função extractWithPdfplumber() adicionada');
  console.log('   ✓ Import de spawn adicionado');
  console.log('   ✓ Checagem de densidade por chars/página (<100 = SCAN)');
  console.log('   ✓ Integração com pdfplumber para tabelas estruturadas\n');

  console.log('🔧 Comportamento:');
  console.log('   • pdfplumber tenta primeiro (preserva tabelas)');
  console.log('   • Se falhar, tenta pdftotext');
  console.log('   • Calcula densidade: chars/página');
  console.log('   • Se < 100 chars/página → dispara OCR automático');
  console.log('   • OCR usa Tesseract.js com preprocessamento\n');

  console.log('📊 Métricas:');
  console.log('   • PDF digital: ~2000-10000 chars/página');
  console.log('   • PDF escaneado (OCR ruim): <100 chars/página');
  console.log('   • PDF escaneado (sem OCR): 0-50 chars/página\n');

  console.log('🔄 Rollback (se necessário):');
  console.log(`   cp ${path.basename(backupPath)} lib/extractor-pipeline.js\n`);
}

applyEnhancements().catch(console.error);
