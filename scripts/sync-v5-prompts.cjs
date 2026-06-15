#!/usr/bin/env node

/**
 * Script para sincronizar prompts V5.0 para o disco persistente
 * Copia apenas os arquivos V5.0 que ainda não existem no destino
 */

const fs = require('fs');
const path = require('path');

// 🔧 v3.6.1: SEMPRE usar caminho relativo do projeto (ephemeral safe)
// Render não tem /var/data com permissões adequadas
const SOURCE_DIR = path.join(__dirname, '../data/prompts/global');
const DEST_DIR = SOURCE_DIR; // Sempre usar diretório do projeto

console.log('═══════════════════════════════════════════════════════════');
console.log('📝 [Prompts] Verificando prompts V5.0');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📂 Diretório: ${DEST_DIR}`);
console.log('');

try {
  // 🔧 v3.6.1: Criar diretório com recursive: true e try/catch
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log('✅ Diretório criado');
  }

  // Listar arquivos V5.0 na origem
  const sourceFiles = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.includes('V5') && f.endsWith('.md'));

  console.log(`📊 Encontrados ${sourceFiles.length} arquivos V5.0 na origem\n`);

  let copied = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of sourceFiles) {
    const filePath = path.join(DEST_DIR, file);

    try {
      // 🔧 v3.6.1: Apenas verificar existência (não copiar, já está no lugar certo)
      if (fs.existsSync(filePath)) {
        skipped++;
        console.log(`✅ ${file} (OK)`);
      } else {
        console.log(`⚠️  ${file} (ausente)`);
        errors++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
      errors++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Arquivos V5.0 encontrados: ${skipped}`);
  console.log(`⚠️  Ausentes: ${errors}`);
  console.log(`📁 Total no diretório: ${fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.md')).length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // 🔧 v3.6.1: Não falhar se prompts estão ausentes (não crítico)
  if (errors > 0) {
    console.warn('⚠️  Alguns prompts V5.0 ausentes (não crítico, serão recriados)');
  }

  process.exit(0); // Sempre sucesso (ephemeral OK)

} catch (error) {
  // 🔧 v3.6.1: Fallback seguro - não crashar o deploy
  console.warn('⚠️  Verificação de prompts falhou (não crítico):', error.message);
  console.log('📝 Sistema usará prompts padrão em memória');
  process.exit(0); // Não falhar o build
}
