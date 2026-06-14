#!/usr/bin/env node
/**
 * Script de Aplicação de Renomeação e Consolidação
 *
 * Lê o mapeamento gerado e:
 * 1. Renomeia arquivos conforme padrão
 * 2. Extrai regras genéricas
 * 3. Organiza em diretório estruturado
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const IMPORT_DIR = path.join(ROOT_DIR, 'importar-prompts');
const OUTPUT_DIR = path.join(ROOT_DIR, 'data/prompts/reorganizados');

/**
 * Aplicar renomeação
 */
async function aplicarRenomeacao() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  APLICANDO RENOMEAÇÃO DE PROMPTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ler mapeamento
  const mapeamentoPath = path.join(ROOT_DIR, 'mapeamento-prompts.json');
  const mapeamentoContent = await fs.readFile(mapeamentoPath, 'utf-8');
  const mapeamento = JSON.parse(mapeamentoContent);

  // Criar diretório de saída
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Criar subdiretórios por área
  const areas = ['civel', 'criminal', 'trabalhista', 'tributario', 'processual', 'recursos', 'metodos', 'geral'];
  for (const area of areas) {
    await fs.mkdir(path.join(OUTPUT_DIR, area), { recursive: true });
  }

  // Aplicar renomeação
  let renomeados = 0;
  const regrasGenericas = [];

  for (const item of mapeamento.consolidados) {
    const origem = path.join(IMPORT_DIR, item.original);

    // Determinar destino baseado na área
    const destino = path.join(OUTPUT_DIR, item.area, item.novo);

    try {
      // Ler conteúdo
      const conteudo = await fs.readFile(origem, 'utf-8');

      // Se é arquivo genérico, adicionar às regras
      if (item.isGenerico) {
        regrasGenericas.push({
          arquivo: item.original,
          area: item.area,
          tipo: item.tipo,
          conteudo: conteudo
        });
      }

      // Copiar arquivo renomeado
      await fs.writeFile(destino, conteudo, 'utf-8');

      console.log(`✓ ${item.original.padEnd(50)} → ${item.area}/${item.novo}`);
      renomeados++;

    } catch (error) {
      console.error(`✗ Erro ao processar ${item.original}:`, error.message);
    }
  }

  console.log(`\n✅ Total renomeados: ${renomeados}\n`);

  return regrasGenericas;
}

/**
 * Extrair e consolidar regras genéricas
 */
async function consolidarRegrasGenericas(regrasGenericas) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CONSOLIDANDO REGRAS GENÉRICAS DO ESCRITÓRIO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const consolidado = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalFontes: regrasGenericas.length,
      versao: '3.3'
    },
    diretrizes: {
      redacionais: [],
      metodologicas: [],
      formatacao: [],
      tonalidade: []
    },
    regrasEspecificas: {}
  };

  // Processar cada regra genérica
  for (const regra of regrasGenericas) {
    console.log(`📄 Processando: ${regra.arquivo}`);

    const conteudo = regra.conteudo.toLowerCase();

    // Identificar tipo de diretriz
    if (conteudo.includes('diretrizes redacionais') || conteudo.includes('tom de voz')) {
      consolidado.diretrizes.redacionais.push({
        fonte: regra.arquivo,
        conteudo: regra.conteudo
      });
    }

    if (conteudo.includes('metodologia') || conteudo.includes('métodos') || conteudo.includes('técnica')) {
      consolidado.diretrizes.metodologicas.push({
        fonte: regra.arquivo,
        conteudo: regra.conteudo
      });
    }

    if (conteudo.includes('abnt') || conteudo.includes('formatação') || conteudo.includes('numeração')) {
      consolidado.diretrizes.formatacao.push({
        fonte: regra.arquivo,
        conteudo: regra.conteudo
      });
    }

    if (conteudo.includes('linguagem') || conteudo.includes('estilo') || conteudo.includes('vocabulário')) {
      consolidado.diretrizes.tonalidade.push({
        fonte: regra.arquivo,
        conteudo: regra.conteudo
      });
    }
  }

  // Salvar consolidado
  const consolidadoPath = path.join(OUTPUT_DIR, 'regras-genericas-consolidadas.json');
  await fs.writeFile(consolidadoPath, JSON.stringify(consolidado, null, 2));

  console.log('\n✅ Regras genéricas consolidadas!');
  console.log(`   📊 Diretrizes redacionais: ${consolidado.diretrizes.redacionais.length}`);
  console.log(`   📊 Diretrizes metodológicas: ${consolidado.diretrizes.metodologicas.length}`);
  console.log(`   📊 Diretrizes formatação: ${consolidado.diretrizes.formatacao.length}`);
  console.log(`   📊 Diretrizes tonalidade: ${consolidado.diretrizes.tonalidade.length}`);
  console.log(`\n💾 Salvo em: ${consolidadoPath}\n`);

  return consolidado;
}

/**
 * Gerar instruções transversais para todos os subagentes
 */
async function gerarInstrucoesTransversais(consolidado) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  GERANDO INSTRUÇÕES TRANSVERSAIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Extrair principais diretrizes de cada arquivo
  const instrucoesTransversais = [];

  // Diretrizes redacionais
  if (consolidado.diretrizes.redacionais.length > 0) {
    const textoCompleto = consolidado.diretrizes.redacionais
      .map(d => d.conteudo)
      .join('\n\n');

    instrucoesTransversais.push({
      categoria: 'DIRETRIZES REDACIONAIS',
      instrucoes: extrairInstrucoes(textoCompleto, [
        'tom de voz',
        'linguagem técnica',
        'vocabulário jurídico',
        'citação de leis',
        'argumentação',
        'estrutura de peças'
      ])
    });
  }

  // Diretrizes metodológicas
  if (consolidado.diretrizes.metodologicas.length > 0) {
    const textoCompleto = consolidado.diretrizes.metodologicas
      .map(d => d.conteudo)
      .join('\n\n');

    instrucoesTransversais.push({
      categoria: 'METODOLOGIA ROM',
      instrucoes: extrairInstrucoes(textoCompleto, [
        'leitura integral',
        'nunca inventar',
        'citar fontes',
        'fundamentação',
        'tese principal',
        'análise crítica'
      ])
    });
  }

  // Formatação ABNT
  if (consolidado.diretrizes.formatacao.length > 0) {
    const textoCompleto = consolidado.diretrizes.formatacao
      .map(d => d.conteudo)
      .join('\n\n');

    instrucoesTransversais.push({
      categoria: 'FORMATAÇÃO E ESTRUTURA',
      instrucoes: extrairInstrucoes(textoCompleto, [
        'abnt',
        'numeração',
        'citações',
        'recuo',
        'espaçamento',
        'fonte'
      ])
    });
  }

  // Salvar instruções transversais
  const transversalPath = path.join(OUTPUT_DIR, 'instrucoes-transversais.json');
  await fs.writeFile(transversalPath, JSON.stringify(instrucoesTransversais, null, 2));

  console.log(`✅ Instruções transversais geradas: ${instrucoesTransversais.length} categorias`);
  console.log(`💾 Salvo em: ${transversalPath}\n`);

  return instrucoesTransversais;
}

/**
 * Extrair instruções específicas de um texto
 */
function extrairInstrucoes(texto, palavrasChave) {
  const linhas = texto.split('\n');
  const instrucoes = [];

  for (const linha of linhas) {
    const linhaNormalizada = linha.toLowerCase().trim();

    // Verificar se linha contém alguma palavra-chave
    for (const chave of palavrasChave) {
      if (linhaNormalizada.includes(chave)) {
        // Limpar linha
        const instrucao = linha
          .replace(/^[\s\-\*\•]+/, '') // Remover bullets
          .replace(/^\d+[\.\)]\s*/, '') // Remover numeração
          .trim();

        if (instrucao.length > 20 && instrucao.length < 500) {
          instrucoes.push(instrucao);
        }
        break;
      }
    }
  }

  return [...new Set(instrucoes)]; // Remover duplicatas
}

/**
 * Main
 */
async function main() {
  try {
    // 1. Aplicar renomeação
    const regrasGenericas = await aplicarRenomeacao();

    // 2. Consolidar regras genéricas
    const consolidado = await consolidarRegrasGenericas(regrasGenericas);

    // 3. Gerar instruções transversais
    const instrucoesTransversais = await gerarInstrucoesTransversais(consolidado);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ RENOMEAÇÃO E CONSOLIDAÇÃO CONCLUÍDAS!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📂 Arquivos organizados em: data/prompts/reorganizados/');
    console.log('   ├── civel/');
    console.log('   ├── criminal/');
    console.log('   ├── trabalhista/');
    console.log('   ├── tributario/');
    console.log('   ├── processual/');
    console.log('   ├── recursos/');
    console.log('   ├── metodos/');
    console.log('   └── geral/\n');

    console.log('📄 Arquivos de consolidação gerados:');
    console.log('   • regras-genericas-consolidadas.json');
    console.log('   • instrucoes-transversais.json\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

main().catch(console.error);
