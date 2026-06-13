/**
 * ROM Agent - Output Exporter
 * Exportação de resultados da CLI em múltiplos formatos (MD, DOCX)
 */

import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

// Import CommonJS module (docx-exporter.cjs)
const require = createRequire(import.meta.url);
const { exportToDocx } = require('../../lib/docx-exporter.cjs');

// ============================================================================
// CORES ANSI PARA FEEDBACK
// ============================================================================

const CORES = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

// ============================================================================
// FUNÇÃO PRINCIPAL DE EXPORTAÇÃO
// ============================================================================

/**
 * Exporta resultado de comando CLI para arquivo
 *
 * @param {Object} options - Opções de exportação
 * @param {string} options.conteudo - Conteúdo textual a ser exportado
 * @param {string} options.outputPath - Caminho do arquivo de saída
 * @param {string} options.format - Formato (md|docx)
 * @param {string} options.titulo - Título do documento
 * @param {string} options.comando - Nome do comando que gerou o resultado
 * @param {Object} options.metadata - Metadados adicionais
 * @returns {Promise<string>} Caminho do arquivo criado
 */
export async function exportarResultado(options) {
  const {
    conteudo,
    outputPath,
    format = 'md',
    titulo = 'Documento ROM Agent',
    comando = 'rom',
    metadata = {}
  } = options;

  if (!conteudo) {
    throw new Error('Conteúdo vazio - nada a exportar');
  }

  if (!outputPath) {
    throw new Error('Caminho de saída não especificado (use --output <arquivo>)');
  }

  // Resolver caminho absoluto
  const resolvedPath = path.resolve(outputPath);
  const dir = path.dirname(resolvedPath);

  // Garantir que diretório existe
  await fs.mkdir(dir, { recursive: true });

  // Exportar conforme formato
  let finalPath;

  if (format.toLowerCase() === 'docx') {
    finalPath = await exportarDocx(conteudo, resolvedPath, titulo, comando, metadata);
  } else {
    // Markdown (padrão)
    finalPath = await exportarMarkdown(conteudo, resolvedPath, titulo, comando, metadata);
  }

  console.log(`\n${CORES.green}✓ Arquivo salvo com sucesso:${CORES.reset}`);
  console.log(`  ${CORES.cyan}${finalPath}${CORES.reset}\n`);

  return finalPath;
}

// ============================================================================
// EXPORTAÇÃO MARKDOWN
// ============================================================================

/**
 * Exporta para Markdown (.md)
 */
async function exportarMarkdown(conteudo, outputPath, titulo, comando, metadata) {
  // Adicionar .md se não tiver extensão
  let finalPath = outputPath;
  if (!path.extname(outputPath)) {
    finalPath = `${outputPath}.md`;
  } else if (path.extname(outputPath).toLowerCase() !== '.md') {
    finalPath = outputPath.replace(/\.[^.]+$/, '.md');
  }

  // Construir documento Markdown com metadados
  const dataHora = new Date().toLocaleString('pt-BR');

  const documento = `# ${titulo}

**Gerado por:** ROM Agent CLI
**Comando:** \`${comando}\`
**Data:** ${dataHora}

---

${conteudo}

---

*Documento gerado automaticamente pelo ROM Agent v2.0*
`;

  await fs.writeFile(finalPath, documento, 'utf-8');
  return finalPath;
}

// ============================================================================
// EXPORTAÇÃO DOCX
// ============================================================================

/**
 * Exporta para DOCX usando lib/docx-exporter.cjs
 */
async function exportarDocx(conteudo, outputPath, titulo, comando, metadata) {
  // Adicionar .docx se não tiver extensão
  let finalPath = outputPath;
  if (!path.extname(outputPath)) {
    finalPath = `${outputPath}.docx`;
  } else if (path.extname(outputPath).toLowerCase() !== '.docx') {
    finalPath = outputPath.replace(/\.[^.]+$/, '.docx');
  }

  // Configurar opções para exportToDocx
  const opcoes = {
    titulo: titulo,
    subtitulo: `Gerado por: ${comando}`,
    conteudo: conteudo,
    timbrado: {
      escritorio: 'ROM Agent - Redator de Obras Magistrais',
      oab: 'CLI v2.0',
      endereco: 'Gerado automaticamente',
      email: 'Comando: ' + comando,
      telefone: '',
      site: ''
    },
    metadata: {
      autor: 'ROM Agent CLI v2.0',
      assunto: titulo,
      palavrasChave: ['ROM', 'CLI', 'Jurídico', comando, ...(metadata.palavrasChave || [])]
    }
  };

  // Chamar exportToDocx (retorna caminho do arquivo)
  const filepath = await exportToDocx(opcoes, finalPath);

  return filepath;
}

// ============================================================================
// VALIDAÇÃO DE FORMATO
// ============================================================================

/**
 * Valida formato de exportação
 * @param {string} format - Formato solicitado
 * @returns {boolean} True se válido
 */
export function validarFormato(format) {
  const formatosValidos = ['md', 'docx', 'markdown'];
  return formatosValidos.includes(format.toLowerCase());
}

/**
 * Normaliza formato para valor canônico
 * @param {string} format - Formato informado
 * @returns {string} Formato normalizado
 */
export function normalizarFormato(format) {
  const f = format.toLowerCase();
  if (f === 'markdown') return 'md';
  return f;
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  exportarResultado,
  validarFormato,
  normalizarFormato
};
