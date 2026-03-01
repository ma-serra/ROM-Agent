/**
 * ROM Agent - Gerador de 18 Ficheiros Completos
 *
 * Orquestra a geração completa dos 18 arquivos de extração:
 * - Texto original e normalizado
 * - Resumos executivos (3 tipos)
 * - Análises analíticas (3 tipos)
 * - Entidades extraídas (4 tipos)
 * - Análise jurídica (3 tipos)
 * - Metadados e estatísticas (3 tipos)
 *
 * ESTRATÉGIA DE MODELOS:
 * - Haiku (barato): Extração inicial, OCR, normalização, entidades
 * - Sonnet (premium): Análises jurídicas, resumos executivos, riscos
 *
 * @version 2.0
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../../lib/logger.js';

import { aplicarFerramentas, aplicarProcessadores } from '../modules/extracao.js';
import entidadesExtractor from './entidades-extractor.js';
import analiseJuridica from './analise-juridica-profunda.js';

/**
 * Configuração de modelos por tipo de tarefa
 */
const CONFIG_MODELOS = {
  // Tarefas baratas (Haiku)
  extracao_inicial: 'haiku',
  normalizacao_texto: 'haiku',
  extracao_entidades: 'haiku',
  classificacao_basica: 'haiku',

  // Tarefas premium (Sonnet)
  resumo_executivo: 'sonnet',
  analise_completa: 'sonnet',
  analise_risco: 'sonnet',
  pontos_criticos: 'sonnet',

  // Tarefas médias (Haiku com atenção)
  resumo_ultra_curto: 'haiku',
  analise_temporal: 'sonnet'  // Changed to Sonnet - Haiku was giving conversational responses
};

/**
 * Estrutura de pastas para os 18 ficheiros
 */
function criarEstruturaPastas(pastaBase) {
  return {
    base: pastaBase,
    nucleo: path.join(pastaBase, '01_NUCLEO'),
    resumos: path.join(pastaBase, '02_RESUMOS'),
    analises: path.join(pastaBase, '03_ANALISES'),
    entidades: path.join(pastaBase, '04_ENTIDADES'),
    juridico: path.join(pastaBase, '05_JURIDICO'),
    metadados: path.join(pastaBase, '06_METADADOS'),
    anexos: path.join(pastaBase, '07_ANEXOS')
  };
}

/**
 * Criar todas as pastas necessárias
 */
async function criarPastas(estrutura) {
  for (const pasta of Object.values(estrutura)) {
    await fs.mkdir(pasta, { recursive: true });
  }

  // Subpastas de anexos
  await fs.mkdir(path.join(estrutura.anexos, 'images'), { recursive: true });
  await fs.mkdir(path.join(estrutura.anexos, 'audio'), { recursive: true });
  await fs.mkdir(path.join(estrutura.anexos, 'attachments'), { recursive: true });
}

/**
 * NÚCLEO - Ficheiros 01 e 02
 */
async function gerarNucleo(textoOriginal, estrutura, log) {
  logger.info('📄 Gerando núcleo (texto original e normalizado)...');

  // 01_texto_completo_original.txt
  const arquivo01 = path.join(estrutura.nucleo, '01_texto_completo_original.txt');
  await fs.writeFile(arquivo01, textoOriginal, 'utf-8');
  log.arquivos.push({ nome: '01_texto_completo_original.txt', tamanho: textoOriginal.length });

  // 02_texto_normalizado.txt (aplicar 91 ferramentas)
  logger.info('🔧 Aplicando 91 ferramentas de normalização...');
  const resultadoFerramentas = await aplicarFerramentas(textoOriginal);

  const arquivo02 = path.join(estrutura.nucleo, '02_texto_normalizado.txt');
  await fs.writeFile(arquivo02, resultadoFerramentas.textoProcessado, 'utf-8');
  log.arquivos.push({
    nome: '02_texto_normalizado.txt',
    tamanho: resultadoFerramentas.textoProcessado.length,
    reducao: resultadoFerramentas.reducao
  });

  return {
    textoNormalizado: resultadoFerramentas.textoProcessado,
    estatisticasNormalizacao: resultadoFerramentas
  };
}

/**
 * ENTIDADES - Ficheiros 09-12
 */
async function gerarEntidades(textoNormalizado, estrutura, log) {
  logger.info('🏷️ Extraindo entidades jurídicas...');

  // Extrair todas as entidades
  const entidades = entidadesExtractor.extrairTodasEntidades(textoNormalizado);
  entidades.estatisticas = entidadesExtractor.calcularEstatisticas(entidades);

  // 09_entidades.json (todas as entidades)
  const arquivo09 = path.join(estrutura.entidades, '09_entidades.json');
  await fs.writeFile(arquivo09, JSON.stringify(entidades, null, 2), 'utf-8');
  log.arquivos.push({ nome: '09_entidades.json', totalEntidades: entidades.estatisticas.totalEntidades });

  // 10_partes_envolvidas.json
  const partesEnvolvidas = {
    cpfs: entidades.cpfs,
    cnpjs: entidades.cnpjs,
    oabs: entidades.oabs,
    partesProcessuais: entidades.partesProcessuais,
    estatisticas: {
      totalPessoasFisicas: entidades.cpfs.length,
      totalPessoasJuridicas: entidades.cnpjs.length,
      totalAdvogados: entidades.oabs.length
    }
  };
  const arquivo10 = path.join(estrutura.entidades, '10_partes_envolvidas.json');
  await fs.writeFile(arquivo10, JSON.stringify(partesEnvolvidas, null, 2), 'utf-8');
  log.arquivos.push({ nome: '10_partes_envolvidas.json' });

  // 11_valores_monetarios.json
  const valoresMonetarios = {
    valores: entidades.valoresMonetarios,
    estatisticas: {
      total: entidades.valoresMonetarios.length,
      maiorValor: entidades.estatisticas.maiorValor,
      menorValor: entidades.estatisticas.menorValor,
      somaTotal: entidades.valoresMonetarios.reduce((acc, v) => acc + v.valorNumerico, 0)
    }
  };
  const arquivo11 = path.join(estrutura.entidades, '11_valores_monetarios.json');
  await fs.writeFile(arquivo11, JSON.stringify(valoresMonetarios, null, 2), 'utf-8');
  log.arquivos.push({ nome: '11_valores_monetarios.json' });

  // 12_datas_importantes.json
  const datasImportantes = {
    datas: entidades.datas,
    estatisticas: {
      total: entidades.datas.length,
      dataMinima: entidades.estatisticas.dataMinima,
      dataMaxima: entidades.estatisticas.dataMaxima
    }
  };
  const arquivo12 = path.join(estrutura.entidades, '12_datas_importantes.json');
  await fs.writeFile(arquivo12, JSON.stringify(datasImportantes, null, 2), 'utf-8');
  log.arquivos.push({ nome: '12_datas_importantes.json' });

  return entidades;
}

/**
 * ANÁLISE JURÍDICA - Ficheiros 13-15
 */
async function gerarAnaliseJuridica(textoNormalizado, entidades, estrutura, log) {
  logger.info('⚖️ Gerando análise jurídica (usando Sonnet)...');

  // 13_citacoes_legais.json (já extraído)
  const arquivo13 = path.join(estrutura.juridico, '13_citacoes_legais.json');
  await fs.writeFile(arquivo13, JSON.stringify(entidades.citacoesLegais, null, 2), 'utf-8');
  log.arquivos.push({ nome: '13_citacoes_legais.json' });

  // 14_classificacao_documental.json (usar modelo barato primeiro)
  logger.info('📋 Classificando documento...');
  const classificacao = await analiseJuridica.classificarDocumento(
    textoNormalizado,
    entidades,
    { modelo: CONFIG_MODELOS.classificacao_basica }
  );

  const arquivo14 = path.join(estrutura.juridico, '14_classificacao_documental.json');
  await fs.writeFile(arquivo14, JSON.stringify(classificacao, null, 2), 'utf-8');
  log.arquivos.push({ nome: '14_classificacao_documental.json' });

  // 15_analise_risco.md (usar modelo premium)
  logger.info('⚠️ Gerando análise de risco (Sonnet)...');
  const analiseRisco = await analiseJuridica.gerarAnaliseRisco(
    textoNormalizado,
    entidades,
    classificacao,
    { modelo: CONFIG_MODELOS.analise_risco }
  );

  const arquivo15 = path.join(estrutura.juridico, '15_analise_risco.md');
  await fs.writeFile(arquivo15, analiseRisco, 'utf-8');
  log.arquivos.push({ nome: '15_analise_risco.md' });

  return { classificacao, analiseRisco };
}

/**
 * RESUMOS - Ficheiros 03-05 (usar modelos premium)
 */
async function gerarResumos(textoNormalizado, entidades, estrutura, log) {
  logger.info('📝 Gerando resumos executivos...');

  // Gerar em paralelo para otimizar
  const [resumoExecutivo, resumoUltraCurto, pontosCriticos] = await Promise.all([
    analiseJuridica.gerarResumoExecutivo(textoNormalizado, entidades, {
      modelo: CONFIG_MODELOS.resumo_executivo
    }),
    analiseJuridica.gerarResumoUltraCurto(textoNormalizado, entidades, {
      modelo: CONFIG_MODELOS.resumo_ultra_curto
    }),
    analiseJuridica.gerarPontosCriticos(textoNormalizado, entidades, {
      modelo: CONFIG_MODELOS.pontos_criticos
    })
  ]);

  // 03_resumo_executivo.md
  const arquivo03 = path.join(estrutura.resumos, '03_resumo_executivo.md');
  await fs.writeFile(arquivo03, resumoExecutivo, 'utf-8');
  log.arquivos.push({ nome: '03_resumo_executivo.md' });

  // 04_resumo_ultra_curto.md
  const arquivo04 = path.join(estrutura.resumos, '04_resumo_ultra_curto.md');
  await fs.writeFile(arquivo04, resumoUltraCurto, 'utf-8');
  log.arquivos.push({ nome: '04_resumo_ultra_curto.md' });

  // 05_pontos_criticos.md
  const arquivo05 = path.join(estrutura.resumos, '05_pontos_criticos.md');
  await fs.writeFile(arquivo05, pontosCriticos, 'utf-8');
  log.arquivos.push({ nome: '05_pontos_criticos.md' });

  return { resumoExecutivo, resumoUltraCurto, pontosCriticos };
}

/**
 * ANÁLISES ANALÍTICAS - Ficheiros 06-08
 * OTIMIZADO: LLM calls em paralelo (analiseCompleta + analiseTemporal)
 */
async function gerarAnalises(textoNormalizado, entidades, estrutura, log) {
  logger.info('🔬 Gerando análises analíticas...');

  // ✅ OTIMIZAÇÃO: Gerar análises em paralelo (não dependem uma da outra)
  logger.info('📊 Gerando análises completa e temporal em paralelo...');
  const [analiseCompleta, analiseTemporal] = await Promise.all([
    // 06_analise_completa.md (Sonnet - premium)
    analiseJuridica.gerarAnaliseCompleta(
      textoNormalizado,
      entidades,
      { modelo: CONFIG_MODELOS.analise_completa }
    ),
    // 08_analise_temporal.md (Haiku - mais barato)
    analiseJuridica.gerarAnaliseTemporal(
      textoNormalizado,
      entidades,
      { modelo: CONFIG_MODELOS.analise_temporal }
    )
  ]);

  // Salvar arquivos
  const arquivo06 = path.join(estrutura.analises, '06_analise_completa.md');
  await fs.writeFile(arquivo06, analiseCompleta, 'utf-8');
  log.arquivos.push({ nome: '06_analise_completa.md' });

  // 07_analise_juridica.json (baseado na classificação já feita)
  const analiseJuridicaJSON = {
    tipo_documento: 'Baseado na classificação do arquivo 14',
    referencia: '14_classificacao_documental.json',
    observacao: 'Este arquivo será preenchido com análise estruturada baseada na classificação'
  };

  const arquivo07 = path.join(estrutura.analises, '07_analise_juridica.json');
  await fs.writeFile(arquivo07, JSON.stringify(analiseJuridicaJSON, null, 2), 'utf-8');
  log.arquivos.push({ nome: '07_analise_juridica.json' });

  const arquivo08 = path.join(estrutura.analises, '08_analise_temporal.md');
  await fs.writeFile(arquivo08, analiseTemporal, 'utf-8');
  log.arquivos.push({ nome: '08_analise_temporal.md' });

  return { analiseCompleta, analiseTemporal };
}

/**
 * METADADOS - Ficheiros 16-18
 */
async function gerarMetadados(
  dadosCompletos,
  estrutura,
  log,
  custoTotal
) {
  logger.info('📈 Gerando metadados e estatísticas...');

  // 16_metadata_completo.json
  const metadata = {
    documentId: dadosCompletos.documentId,
    dataExtracao: dadosCompletos.dataExtracao,
    versao: '2.0',
    pipeline: '18_ficheiros_completos',

    // Estatísticas de texto
    texto: {
      tamanhoOriginal: dadosCompletos.tamanhoOriginal,
      tamanhoNormalizado: dadosCompletos.tamanhoNormalizado,
      reducaoPercentual: dadosCompletos.reducaoPercentual
    },

    // Estatísticas de entidades
    entidades: dadosCompletos.entidades.estatisticas,

    // Classificação
    classificacao: dadosCompletos.classificacao,

    // Custos
    custos: {
      extracao: custoTotal.extracao || 0,
      analise: custoTotal.analise || 0,
      total: custoTotal.total || 0,
      moeda: 'USD'
    },

    // Tempo de processamento
    tempo: {
      inicioProcessamento: dadosCompletos.inicioProcessamento,
      fimProcessamento: new Date().toISOString(),
      duracaoSegundos: Math.round((Date.now() - new Date(dadosCompletos.inicioProcessamento)) / 1000)
    },

    // Modelos utilizados
    modelosUtilizados: CONFIG_MODELOS
  };

  const arquivo16 = path.join(estrutura.metadados, '16_metadata_completo.json');
  await fs.writeFile(arquivo16, JSON.stringify(metadata, null, 2), 'utf-8');
  log.arquivos.push({ nome: '16_metadata_completo.json' });

  // 17_estatisticas_processamento.json
  const estatisticas = {
    arquivosGerados: log.arquivos.length,
    etapasExecutadas: log.etapas.length,
    sucessos: log.etapas.filter(e => e.status === 'sucesso').length,
    falhas: log.etapas.filter(e => e.status === 'erro').length,
    avisos: log.avisos.length,
    erros: log.erros,

    // Detalhamento por etapa
    etapas: log.etapas,

    // Arquivos gerados
    arquivos: log.arquivos
  };

  const arquivo17 = path.join(estrutura.metadados, '17_estatisticas_processamento.json');
  await fs.writeFile(arquivo17, JSON.stringify(estatisticas, null, 2), 'utf-8');
  log.arquivos.push({ nome: '17_estatisticas_processamento.json' });

  // 18_indice_navegacao.md
  const indice = gerarIndiceNavegacao(estrutura, log.arquivos, metadata);

  const arquivo18 = path.join(estrutura.metadados, '18_indice_navegacao.md');
  await fs.writeFile(arquivo18, indice, 'utf-8');
  log.arquivos.push({ nome: '18_indice_navegacao.md' });

  return { metadata, estatisticas };
}

/**
 * Gerar índice de navegação (Ficheiro 18)
 */
function gerarIndiceNavegacao(estrutura, arquivos, metadata) {
  return `# ÍNDICE DE NAVEGAÇÃO - Extração Completa

**Documento ID**: ${metadata.documentId}
**Data de Extração**: ${new Date(metadata.dataExtracao).toLocaleString('pt-BR')}
**Versão do Pipeline**: ${metadata.versao}

---

## 📁 ESTRUTURA DE ARQUIVOS (${arquivos.length} ficheiros)

### 01. NÚCLEO - Texto Base
- [\`01_texto_completo_original.txt\`](01_NUCLEO/01_texto_completo_original.txt)
  → Texto extraído bruto, sem modificações
- [\`02_texto_normalizado.txt\`](01_NUCLEO/02_texto_normalizado.txt)
  → Texto após 91 ferramentas de normalização

### 02. RESUMOS EXECUTIVOS
- [\`03_resumo_executivo.md\`](02_RESUMOS/03_resumo_executivo.md)
  → Resumo completo (1-2 páginas) com análise estruturada
- [\`04_resumo_ultra_curto.md\`](02_RESUMOS/04_resumo_ultra_curto.md)
  → Resumo de 1 parágrafo + palavras-chave
- [\`05_pontos_criticos.md\`](02_RESUMOS/05_pontos_criticos.md)
  → Alertas, riscos e pontos de atenção

### 03. ANÁLISES ANALÍTICAS
- [\`06_analise_completa.md\`](03_ANALISES/06_analise_completa.md)
  → Análise jurídica profunda e detalhada
- [\`07_analise_juridica.json\`](03_ANALISES/07_analise_juridica.json)
  → Análise estruturada em formato JSON
- [\`08_analise_temporal.md\`](03_ANALISES/08_analise_temporal.md)
  → Cronologia de eventos e linha do tempo

### 04. ENTIDADES EXTRAÍDAS
- [\`09_entidades.json\`](04_ENTIDADES/09_entidades.json)
  → Todas as entidades identificadas
- [\`10_partes_envolvidas.json\`](04_ENTIDADES/10_partes_envolvidas.json)
  → CPF, CNPJ, OAB, partes processuais
- [\`11_valores_monetarios.json\`](04_ENTIDADES/11_valores_monetarios.json)
  → Todos os valores financeiros com contexto
- [\`12_datas_importantes.json\`](04_ENTIDADES/12_datas_importantes.json)
  → Datas e prazos relevantes

### 05. ANÁLISE JURÍDICA
- [\`13_citacoes_legais.json\`](05_JURIDICO/13_citacoes_legais.json)
  → Leis, artigos, parágrafos citados
- [\`14_classificacao_documental.json\`](05_JURIDICO/14_classificacao_documental.json)
  → Tipo, área do direito, complexidade
- [\`15_analise_risco.md\`](05_JURIDICO/15_analise_risco.md)
  → Análise de riscos e recomendações estratégicas

### 06. METADADOS E ESTATÍSTICAS
- [\`16_metadata_completo.json\`](06_METADADOS/16_metadata_completo.json)
  → Metadados enriquecidos do documento
- [\`17_estatisticas_processamento.json\`](06_METADADOS/17_estatisticas_processamento.json)
  → Logs e estatísticas do processamento
- [\`18_indice_navegacao.md\`](06_METADADOS/18_indice_navegacao.md)
  → Este arquivo (índice navegável)

### 07. ANEXOS
- \`07_ANEXOS/images/\` - Imagens extraídas (${metadata.imagesCount || 0})
- \`07_ANEXOS/audio/\` - Transcrições de áudio (${metadata.audioCount || 0})
- \`07_ANEXOS/attachments/\` - Anexos diversos (${metadata.attachmentsCount || 0})

---

## 📊 ESTATÍSTICAS RÁPIDAS

| Métrica | Valor |
|---------|-------|
| **Texto original** | ${formatBytes(metadata.texto.tamanhoOriginal)} |
| **Texto normalizado** | ${formatBytes(metadata.texto.tamanhoNormalizado)} |
| **Redução** | ${metadata.texto.reducaoPercentual || 'N/A'} |
| **Total de entidades** | ${metadata.entidades.totalEntidades} |
| **Valores monetários** | ${metadata.entidades.totalValores} |
| **Datas identificadas** | ${metadata.entidades.totalDatas} |
| **Leis citadas** | ${metadata.entidades.totalLeis} |
| **Tempo de processamento** | ${metadata.tempo.duracaoSegundos}s |
| **Custo total** | $${metadata.custos.total.toFixed(4)} |

---

## 🎯 NAVEGAÇÃO RÁPIDA

### Para advogados:
1. Comece pelo [\`03_resumo_executivo.md\`](02_RESUMOS/03_resumo_executivo.md)
2. Verifique [\`05_pontos_criticos.md\`](02_RESUMOS/05_pontos_criticos.md)
3. Revise [\`15_analise_risco.md\`](05_JURIDICO/15_analise_risco.md)

### Para análise técnica:
1. Consulte [\`06_analise_completa.md\`](03_ANALISES/06_analise_completa.md)
2. Examine [\`09_entidades.json\`](04_ENTIDADES/09_entidades.json)
3. Verifique [\`13_citacoes_legais.json\`](05_JURIDICO/13_citacoes_legais.json)

### Para busca de informações:
1. Use [\`09_entidades.json\`](04_ENTIDADES/09_entidades.json) para valores e datas
2. Consulte [\`08_analise_temporal.md\`](03_ANALISES/08_analise_temporal.md) para cronologia
3. Veja [\`10_partes_envolvidas.json\`](04_ENTIDADES/10_partes_envolvidas.json) para CPF/CNPJ/OAB

---

## ℹ️ INFORMAÇÕES ADICIONAIS

- **Pipeline**: Extração completa com 18 ficheiros estruturados
- **Modelos de IA**: Haiku (extração) + Sonnet (análise)
- **Gerado por**: ROM Agent v2.0
- **Tecnologia**: AWS Bedrock + Claude 3

---

*Índice gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
}

/**
 * Função auxiliar para formatar bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * FUNÇÃO PRINCIPAL - Gerar todos os 18 ficheiros
 */
export async function gerar18FicheirosCompletos(textoOriginal, opcoes = {}) {
  const {
    pastaBase,
    documentId,
    nomeDocumento = 'documento',
    modeloOverride = null
  } = opcoes;

  const inicioProcessamento = new Date().toISOString();

  // Log de processamento
  const log = {
    etapas: [],
    arquivos: [],
    avisos: [],
    erros: []
  };

  // Custos acumulados
  const custoTotal = {
    extracao: 0,
    analise: 0,
    total: 0
  };

  try {
    logger.info('🚀 Iniciando geração de 18 ficheiros completos', {
      documentId,
      tamanhoTexto: textoOriginal.length,
      pastaBase
    });

    // Criar estrutura de pastas
    const estrutura = criarEstruturaPastas(pastaBase);
    await criarPastas(estrutura);
    log.etapas.push({ etapa: 'criar_pastas', status: 'sucesso', timestamp: new Date().toISOString() });

    // ETAPA 1: Núcleo (01-02)
    const { textoNormalizado, estatisticasNormalizacao } = await gerarNucleo(textoOriginal, estrutura, log);
    log.etapas.push({ etapa: 'gerar_nucleo', status: 'sucesso', timestamp: new Date().toISOString() });

    // ETAPA 2: Entidades (09-12)
    const entidades = await gerarEntidades(textoNormalizado, estrutura, log);
    log.etapas.push({ etapa: 'extrair_entidades', status: 'sucesso', timestamp: new Date().toISOString() });

    // ✅ OTIMIZAÇÃO: ETAPAS 3, 4, 5 EM PARALELO
    // Todas dependem de (textoNormalizado, entidades) mas não dependem umas das outras
    logger.info('⚡ Executando análise jurídica, resumos e análises em paralelo...');
    const [
      { classificacao, analiseRisco },
      resumos,
      analises
    ] = await Promise.all([
      // ETAPA 3: Análise Jurídica (13-15)
      gerarAnaliseJuridica(textoNormalizado, entidades, estrutura, log),
      // ETAPA 4: Resumos (03-05)
      gerarResumos(textoNormalizado, entidades, estrutura, log),
      // ETAPA 5: Análises (06-08)
      gerarAnalises(textoNormalizado, entidades, estrutura, log)
    ]);

    log.etapas.push({ etapa: 'gerar_analise_juridica', status: 'sucesso', timestamp: new Date().toISOString() });
    log.etapas.push({ etapa: 'gerar_resumos', status: 'sucesso', timestamp: new Date().toISOString() });
    log.etapas.push({ etapa: 'gerar_analises', status: 'sucesso', timestamp: new Date().toISOString() });

    // ETAPA 6: Metadados (16-18)
    const dadosCompletos = {
      documentId,
      dataExtracao: inicioProcessamento,
      tamanhoOriginal: textoOriginal.length,
      tamanhoNormalizado: textoNormalizado.length,
      reducaoPercentual: estatisticasNormalizacao.reducao,
      entidades,
      classificacao,
      inicioProcessamento
    };

    const { metadata, estatisticas } = await gerarMetadados(dadosCompletos, estrutura, log, custoTotal);
    log.etapas.push({ etapa: 'gerar_metadados', status: 'sucesso', timestamp: new Date().toISOString() });

    logger.info('✅ 18 ficheiros gerados com sucesso!', {
      totalArquivos: log.arquivos.length,
      duracaoSegundos: metadata.tempo.duracaoSegundos
    });

    return {
      sucesso: true,
      pastaBase: estrutura.base,
      estrutura,
      totalArquivos: log.arquivos.length,
      metadata,
      estatisticas,
      log
    };

  } catch (error) {
    logger.error('❌ Erro ao gerar 18 ficheiros', {
      error: error.message,
      stack: error.stack
    });

    log.erros.push({
      timestamp: new Date().toISOString(),
      erro: error.message,
      stack: error.stack
    });

    throw error;
  }
}

export default {
  gerar18FicheirosCompletos,
  CONFIG_MODELOS
};
