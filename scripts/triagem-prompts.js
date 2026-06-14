#!/usr/bin/env node
/**
 * Script de Triagem e Padronização de Prompts Importados
 *
 * Funcionalidades:
 * 1. Lê todos os arquivos de importar-prompts/
 * 2. Analisa conteúdo para identificar área jurídica
 * 3. Renomeia seguindo padrão: <area>-<nome_da_peca>.md
 * 4. Remove duplicados mantendo versão mais recente
 * 5. Extrai regras genéricas do escritório
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const IMPORT_DIR = path.join(ROOT_DIR, 'importar-prompts');
const OUTPUT_DIR = path.join(ROOT_DIR, 'data/prompts/reorganizados');

// Mapeamento de área jurídica por palavras-chave
const AREA_KEYWORDS = {
  'civel': ['cível', 'apelação cível', 'contestação', 'ação de cobrança', 'ação indenização', 'contrarrazões', 'civil'],
  'criminal': ['criminal', 'habeas corpus', 'apelação criminal', 'penal', 'embargos criminal'],
  'trabalhista': ['trabalhista', 'reclamação trabalhista', 'trab_', 'CLT', 'TST'],
  'tributario': ['tributário', 'planejamento tributário', 'fiscal', 'ICMS', 'ISS', 'IPTU'],
  'processual': ['análise processo', 'análise de autos', 'análise temporal', 'prazos', 'feriados'],
  'recursos': ['agravo', 'embargos', 'recurso especial', 'recurso extraordinário', 'STJ', 'STF'],
  'metodos': ['métodos', 'metodologia', 'master', 'consolidado', 'diretrizes', 'técnica hierárquica'],
  'geral': ['leia-me', 'upload', 'README', 'instruções gerais']
};

// Tipos de peça
const TIPO_PECA = {
  'apelacao': ['apelação', 'apelacao'],
  'contrarrazoes': ['contrarrazões', 'contrarrazoes'],
  'contestacao': ['contestação', 'contestacao'],
  'agravo': ['agravo interno', 'agravo de instrumento', 'agravo'],
  'embargos': ['embargos de declaração', 'embargos declaracao'],
  'memoriais': ['memoriais', 'memorial'],
  'habeas-corpus': ['habeas corpus', 'HC'],
  'analise': ['análise', 'analise processual'],
  'planejamento': ['planejamento'],
  'metodos': ['métodos', 'metodologia'],
  'diretrizes': ['diretrizes redacionais', 'diretrizes']
};

/**
 * Identificar área jurídica do prompt
 */
function identificarArea(filename, content) {
  const searchText = (filename + ' ' + content.substring(0, 2000)).toLowerCase();

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return area;
      }
    }
  }

  return 'geral';
}

/**
 * Identificar tipo de peça
 */
function identificarTipo(filename, content) {
  const searchText = (filename + ' ' + content.substring(0, 2000)).toLowerCase();

  for (const [tipo, keywords] of Object.entries(TIPO_PECA)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return tipo;
      }
    }
  }

  // Tentar extrair do nome do arquivo
  const match = filename.match(/P_([A-Z_]+)/);
  if (match) {
    return match[1].toLowerCase().replace(/_/g, '-');
  }

  return 'generico';
}

/**
 * Extrair versão do arquivo
 */
function extrairVersao(filename) {
  // Procurar por V12_3, V3_0, etc
  const versionMatch = filename.match(/V(\d+)_(\d+)/i);
  if (versionMatch) {
    return parseFloat(`${versionMatch[1]}.${versionMatch[2]}`);
  }

  // Procurar por (1), (2), etc (duplicados do sistema)
  const dupMatch = filename.match(/\((\d+)\)/);
  if (dupMatch) {
    return parseInt(dupMatch[1]);
  }

  return 0;
}

/**
 * Analisar todos os arquivos
 */
async function analisarArquivos() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  TRIAGEM E PADRONIZAÇÃO DE PROMPTS IMPORTADOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const files = await fs.readdir(IMPORT_DIR);
  console.log(`📂 Arquivos encontrados: ${files.length}\n`);

  const analises = [];
  const regrasGenericas = [];

  for (const file of files) {
    const filepath = path.join(IMPORT_DIR, file);
    const stat = await fs.stat(filepath);

    if (!stat.isFile()) continue;

    // Ler conteúdo
    const content = await fs.readFile(filepath, 'utf-8');

    // Análise
    const area = identificarArea(file, content);
    const tipo = identificarTipo(file, content);
    const versao = extrairVersao(file);

    // Verificar se é regra genérica
    const isGenerico = area === 'geral' || area === 'metodos' ||
                       file.includes('DIRETRIZES') ||
                       file.includes('METODOS') ||
                       file.includes('LEIA-ME');

    if (isGenerico) {
      regrasGenericas.push({
        arquivo: file,
        conteudo: content,
        tipo: tipo
      });
    }

    // Novo nome
    const extension = path.extname(file);
    let novoNome;

    if (area === 'metodos' || tipo === 'metodos' || tipo === 'diretrizes') {
      novoNome = `metodos-${tipo}${extension}`;
    } else if (area === 'geral') {
      novoNome = `geral-${tipo}${extension}`;
    } else {
      novoNome = `${area}-${tipo}${extension}`;
    }

    analises.push({
      arquivoOriginal: file,
      novoNome: novoNome,
      area: area,
      tipo: tipo,
      versao: versao,
      tamanho: stat.size,
      isGenerico: isGenerico,
      filepath: filepath,
      content: content
    });
  }

  return { analises, regrasGenericas };
}

/**
 * Consolidar duplicados (manter versão mais recente)
 */
function consolidarDuplicados(analises) {
  const grupos = new Map();

  for (const analise of analises) {
    const chave = analise.novoNome;

    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }

    grupos.get(chave).push(analise);
  }

  const consolidados = [];
  const duplicadosRemovidos = [];

  for (const [novoNome, grupo] of grupos.entries()) {
    if (grupo.length === 1) {
      consolidados.push(grupo[0]);
    } else {
      // Múltiplas versões - escolher a mais recente
      grupo.sort((a, b) => b.versao - a.versao);

      consolidados.push(grupo[0]); // Mais recente

      for (let i = 1; i < grupo.length; i++) {
        duplicadosRemovidos.push({
          arquivo: grupo[i].arquivoOriginal,
          versaoRemovida: grupo[i].versao,
          versaoMantida: grupo[0].versao,
          novoNome: novoNome
        });
      }
    }
  }

  return { consolidados, duplicadosRemovidos };
}

/**
 * Gerar relatório em formato tabela ANSI
 */
function gerarRelatorio(consolidados, duplicadosRemovidos) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RELATÓRIO DE RENOMEAÇÃO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('┌─────────────────────────────────────────────────────┬──────────────────────────────┬─────────────┐');
  console.log('│ Arquivo Original                                    │ Novo Nome Padronizado        │ Área        │');
  console.log('├─────────────────────────────────────────────────────┼──────────────────────────────┼─────────────┤');

  for (const item of consolidados) {
    const original = item.arquivoOriginal.padEnd(51).substring(0, 51);
    const novo = item.novoNome.padEnd(28).substring(0, 28);
    const area = item.area.padEnd(11).substring(0, 11);

    console.log(`│ ${original} │ ${novo} │ ${area} │`);
  }

  console.log('└─────────────────────────────────────────────────────┴──────────────────────────────┴─────────────┘');

  if (duplicadosRemovidos.length > 0) {
    console.log('\n⚠️  DUPLICADOS REMOVIDOS (versões antigas):');
    console.log('┌─────────────────────────────────────────────────────┬─────────┬─────────┐');
    console.log('│ Arquivo Removido                                    │ V.Rem   │ V.Mant  │');
    console.log('├─────────────────────────────────────────────────────┼─────────┼─────────┤');

    for (const dup of duplicadosRemovidos) {
      const arquivo = dup.arquivo.padEnd(51).substring(0, 51);
      const vRem = String(dup.versaoRemovida).padEnd(7).substring(0, 7);
      const vMant = String(dup.versaoMantida).padEnd(7).substring(0, 7);

      console.log(`│ ${arquivo} │ ${vRem} │ ${vMant} │`);
    }

    console.log('└─────────────────────────────────────────────────────┴─────────┴─────────┘');
  }

  console.log(`\n✅ Total de arquivos consolidados: ${consolidados.length}`);
  console.log(`🗑️  Total de duplicados removidos: ${duplicadosRemovidos.length}\n`);
}

/**
 * Executar triagem completa
 */
async function main() {
  try {
    // Análise
    const { analises, regrasGenericas } = await analisarArquivos();

    // Consolidação
    const { consolidados, duplicadosRemovidos } = consolidarDuplicados(analises);

    // Relatório
    gerarRelatorio(consolidados, duplicadosRemovidos);

    // Salvar mapeamento para próxima etapa
    const mapeamento = {
      consolidados: consolidados.map(c => ({
        original: c.arquivoOriginal,
        novo: c.novoNome,
        area: c.area,
        tipo: c.tipo,
        versao: c.versao,
        isGenerico: c.isGenerico
      })),
      duplicadosRemovidos: duplicadosRemovidos,
      regrasGenericas: regrasGenericas.map(r => ({
        arquivo: r.arquivo,
        tipo: r.tipo
      })),
      timestamp: new Date().toISOString()
    };

    const mapeamentoPath = path.join(ROOT_DIR, 'mapeamento-prompts.json');
    await fs.writeFile(mapeamentoPath, JSON.stringify(mapeamento, null, 2));

    console.log(`💾 Mapeamento salvo em: mapeamento-prompts.json\n`);

    return mapeamento;

  } catch (error) {
    console.error('❌ Erro na triagem:', error);
    throw error;
  }
}

// Executar
main().catch(console.error);
