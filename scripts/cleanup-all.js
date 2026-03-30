#!/usr/bin/env node
/**
 * SCRIPT DE LIMPEZA COMPLETA
 * Remove todos os uploads, documentos do KB e arquivos temporários
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ACTIVE_PATHS } from '../lib/storage-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🧹 LIMPEZA COMPLETA DO SISTEMA\n');

// Função helper para deletar recursivamente
function deleteRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⏭️  Pasta não existe: ${dirPath}`);
    return 0;
  }

  let count = 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      count += deleteRecursive(filePath);
      fs.rmdirSync(filePath);
    } else {
      fs.unlinkSync(filePath);
      count++;
    }
  }

  return count;
}

// 1. Limpar uploads
console.log('📤 Limpando uploads...');
const uploadCount = deleteRecursive(ACTIVE_PATHS.upload);
console.log(`   ✅ ${uploadCount} arquivos de upload deletados`);

// 2. Limpar extraídos
console.log('📄 Limpando arquivos extraídos...');
const extractedCount = deleteRecursive(ACTIVE_PATHS.extracted);
console.log(`   ✅ ${extractedCount} arquivos extraídos deletados`);

// 3. Limpar processados
console.log('⚙️  Limpando arquivos processados...');
const processedCount = deleteRecursive(ACTIVE_PATHS.processed);
console.log(`   ✅ ${processedCount} arquivos processados deletados`);

// 4. Limpar KB
console.log('📚 Limpando Knowledge Base...');
const kbPath = ACTIVE_PATHS.kb || path.join(path.dirname(__dirname), 'data', 'kb');
let kbCount = 0;
if (fs.existsSync(kbPath)) {
  kbCount = deleteRecursive(kbPath);
  console.log(`   ✅ ${kbCount} arquivos do KB deletados`);
} else {
  console.log('   ⏭️  KB não existe');
}

// 5. Recriar pastas vazias
console.log('\n📁 Recriando estrutura de pastas...');
[ACTIVE_PATHS.upload, ACTIVE_PATHS.extracted, ACTIVE_PATHS.processed].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ ${dir}`);
  }
});

// 6. Limpar arquivo de documentos KB
const kbDocumentsFile = path.join(path.dirname(__dirname), 'data', 'kb-documents.json');
if (fs.existsSync(kbDocumentsFile)) {
  fs.writeFileSync(kbDocumentsFile, JSON.stringify({ documents: [] }, null, 2));
  console.log(`   ✅ kb-documents.json resetado`);
}

console.log('\n✅ LIMPEZA COMPLETA CONCLUÍDA!\n');
console.log(`📊 Total de arquivos deletados: ${uploadCount + extractedCount + processedCount + kbCount}`);
console.log('\n🚀 Sistema pronto para novos uploads!\n');
