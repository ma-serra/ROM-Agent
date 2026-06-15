#!/usr/bin/env node
/**
 * ROM Agent - Reprocessamento de Documentos da KB
 *
 * Reprocessa todos os PDFs da KB com o motor enhanced:
 * - Checagem de densidade (chars/página)
 * - Extração estruturada com pdfplumber
 * - OCR automático para PDFs escaneados
 *
 * Uso: node scripts/reprocess-kb-documents.js [user_id]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { processFile } from '../lib/extractor-pipeline.js';
import { getPostgresPool } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Encontrar todos os PDFs em um diretório
 */
async function findPDFs(directory) {
  const pdfs = [];

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        // Recursivo em subdiretórios
        const subPdfs = await findPDFs(fullPath);
        pdfs.push(...subPdfs);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        pdfs.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Erro ao ler diretório ${directory}: ${error.message}`);
  }

  return pdfs;
}

/**
 * Reprocessar um PDF individual
 */
async function reprocessPDF(pdfPath) {
  const fileName = path.basename(pdfPath);

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📄 Reprocessando: ${fileName}`);
  console.log(`${'═'.repeat(80)}`);

  try {
    // Callback de progresso
    const onProgress = (stage, percent) => {
      console.log(`   [${percent}%] ${stage}`);
    };

    // Processar arquivo com novo motor
    const result = await processFile(pdfPath, onProgress);

    if (result.success) {
      console.log(`\n✅ Sucesso!`);
      console.log(`   Método: ${result.method || 'N/A'}`);
      console.log(`   Palavras: ${result.wordCount || 0}`);
      console.log(`   Caracteres: ${result.charCount || 0}`);
      console.log(`   Tokens estimados: ${result.estimatedTokens || 0}`);
      console.log(`   Arquivo extraído: ${result.extracted || 'N/A'}`);

      if (result.structured && result.structured.length > 0) {
        console.log(`   Documentos estruturados: ${result.structured.length}`);
      }

      return {
        success: true,
        file: fileName,
        path: pdfPath,
        method: result.method,
        stats: {
          wordCount: result.wordCount,
          charCount: result.charCount,
          estimatedTokens: result.estimatedTokens
        }
      };
    } else {
      console.log(`\n❌ Falha: ${result.error || 'Erro desconhecido'}`);

      return {
        success: false,
        file: fileName,
        path: pdfPath,
        error: result.error
      };
    }
  } catch (error) {
    console.log(`\n❌ Erro ao processar: ${error.message}`);

    return {
      success: false,
      file: fileName,
      path: pdfPath,
      error: error.message
    };
  }
}

/**
 * Main
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║  ROM AGENT - REPROCESSAMENTO DE DOCUMENTOS DA KB                       ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  console.log('║  Aplica motor enhanced:                                                ║');
  console.log('║  ✓ Checagem de densidade (chars/página < 100 = SCAN)                  ║');
  console.log('║  ✓ Extração estruturada com pdfplumber (tabelas preservadas)          ║');
  console.log('║  ✓ OCR automático para PDFs escaneados                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  // Diretórios a serem processados
  const directories = [
    path.join(ROOT_DIR, 'data', 'kb'),
    path.join(ROOT_DIR, 'data', 'uploads')
  ];

  const allPDFs = [];

  for (const dir of directories) {
    console.log(`🔍 Buscando PDFs em: ${dir}`);

    try {
      await fs.access(dir);
      const pdfs = await findPDFs(dir);
      console.log(`   Encontrados: ${pdfs.length} PDFs\n`);
      allPDFs.push(...pdfs);
    } catch (error) {
      console.log(`   ⚠️  Diretório não existe ou inacessível\n`);
    }
  }

  if (allPDFs.length === 0) {
    console.log('⚠️  Nenhum PDF encontrado para reprocessar.\n');
    console.log('Certifique-se de que existem arquivos em:');
    console.log('  • data/kb/');
    console.log('  • data/uploads/\n');
    return;
  }

  console.log(`📊 Total de PDFs encontrados: ${allPDFs.length}\n`);
  console.log('🚀 Iniciando reprocessamento...\n');

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allPDFs.length; i++) {
    const pdfPath = allPDFs[i];

    console.log(`\n[${i + 1}/${allPDFs.length}]`);

    const result = await reprocessPDF(pdfPath);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Pequena pausa entre processamentos (evitar sobrecarga)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Relatório final
  console.log('\n\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║  RELATÓRIO FINAL DE REPROCESSAMENTO                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Estatísticas:`);
  console.log(`   Total de arquivos: ${allPDFs.length}`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log(`   Taxa de sucesso: ${((successCount / allPDFs.length) * 100).toFixed(1)}%\n`);

  // Listar falhas
  if (failCount > 0) {
    console.log(`❌ Arquivos com falha:\n`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.file}`);
      console.log(`     Erro: ${r.error}\n`);
    });
  }

  // Métricas agregadas
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const totalWords = successfulResults.reduce((sum, r) => sum + (r.stats?.wordCount || 0), 0);
    const totalChars = successfulResults.reduce((sum, r) => sum + (r.stats?.charCount || 0), 0);
    const totalTokens = successfulResults.reduce((sum, r) => sum + (r.stats?.estimatedTokens || 0), 0);

    console.log(`📈 Métricas totais (arquivos com sucesso):\n`);
    console.log(`   Palavras: ${totalWords.toLocaleString()}`);
    console.log(`   Caracteres: ${totalChars.toLocaleString()}`);
    console.log(`   Tokens estimados: ${totalTokens.toLocaleString()}\n`);
  }

  console.log('✅ Reprocessamento concluído!\n');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
