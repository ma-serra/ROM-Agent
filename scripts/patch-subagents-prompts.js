#!/usr/bin/env node
/**
 * Patch para Integração de System Prompt Base em subagents.js
 *
 * Adiciona infraestrutura de prompts transversais sem quebrar subagentes existentes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PATCH: INTEGRAÇÃO SYSTEM PROMPT BASE v3.3');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Ler arquivo original
  const subagentsPath = path.join(ROOT_DIR, 'src/modules/subagents.js');
  const originalContent = await fs.readFile(subagentsPath, 'utf-8');

  console.log('✓ Arquivo original lido: src/modules/subagents.js');

  // 2. Criar backup
  const backupPath = `${subagentsPath}.backup-prompts-${Date.now()}`;
  await fs.writeFile(backupPath, originalContent);
  console.log(`✓ Backup criado: ${path.basename(backupPath)}\n`);

  // 3. Ler system prompt base
  const basePromptPath = path.join(ROOT_DIR, 'data/prompts/reorganizados/system-prompt-base-transversal.md');
  const basePrompt = await fs.readFile(basePromptPath, 'utf-8');

  // 4. Construir código a inserir
  const codigoInserir = `
// ============================================================================
// SYSTEM PROMPT BASE TRANSVERSAL (v3.3)
// ============================================================================
// Diretrizes universais aplicáveis a todos os subagentes
// Gerado automaticamente pela integração de prompts do Claude Team

const SYSTEM_PROMPT_BASE_TRANSVERSAL = \`${basePrompt}\`;

/**
 * Compor prompt completo combinando base transversal + prompt específico
 * @param {string} promptEspecifico - Prompt específico do subagente
 * @returns {string} Prompt completo com diretrizes transversais
 */
function comporPromptComBase(promptEspecifico) {
  return \`\${SYSTEM_PROMPT_BASE_TRANSVERSAL}

---

# INSTRUÇÕES ESPECÍFICAS DO SUBAGENTE

\${promptEspecifico}\`;
}

/**
 * Carregar prompt de arquivo reorganizado
 * @param {string} relativePath - Caminho relativo em data/prompts/reorganizados/
 * @returns {Promise<string>} Conteúdo do prompt
 */
async function carregarPromptReorganizado(relativePath) {
  try {
    const fullPath = path.join(__dirname, '../data/prompts/reorganizados', relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(\`⚠️  Não foi possível carregar prompt: \${relativePath}\`);
    return '';
  }
}

// ============================================================================
`;

  // 5. Encontrar ponto de inserção (após os imports e config)
  const lines = originalContent.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// DEFINIÇÃO DOS SUBAGENTES') ||
        lines[i].includes('export const SUBAGENTES = {')) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    throw new Error('Não foi possível encontrar ponto de inserção no arquivo');
  }

  // 6. Inserir código
  lines.splice(insertIndex, 0, codigoInserir);
  const novoConteudo = lines.join('\n');

  // 7. Salvar arquivo modificado
  await fs.writeFile(subagentsPath, novoConteudo);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ PATCH APLICADO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Modificações aplicadas:');
  console.log('   ✓ SYSTEM_PROMPT_BASE_TRANSVERSAL adicionado');
  console.log('   ✓ Função comporPromptComBase() criada');
  console.log('   ✓ Função carregarPromptReorganizado() criada\n');

  console.log('⚠️  IMPORTANTE:');
  console.log('   • Os subagentes existentes NÃO foram modificados ainda');
  console.log('   • A infraestrutura está pronta para uso gradual');
  console.log('   • Para aplicar a um subagente específico, use comporPromptComBase()\n');

  console.log('📋 Exemplo de uso em um subagente:');
  console.log(`   systemPrompt: comporPromptComBase(\`
     Você é o Redator Cível especializado...
   \`)\n`);

  console.log('🔄 Rollback (se necessário):');
  console.log(`   cp ${path.basename(backupPath)} src/modules/subagents.js\n`);
}

main().catch(console.error);
