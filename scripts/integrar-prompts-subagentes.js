#!/usr/bin/env node
/**
 * Script de Integração de Prompts com Subagentes v3.3
 *
 * Funcionalidades:
 * 1. Gera system prompt base transversal com diretrizes do escritório
 * 2. Mapeia prompts reorganizados para subagentes
 * 3. Aplica autoadaptação (últimas 10 mensagens)
 * 4. Aplica anti-alucinação (5 eixos)
 * 5. Atualiza src/modules/subagents.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PROMPTS_DIR = path.join(ROOT_DIR, 'data/prompts/reorganizados');

/**
 * Gerar System Prompt Base Transversal
 */
async function gerarSystemPromptBase() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  GERANDO SYSTEM PROMPT BASE TRANSVERSAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ler regras genéricas consolidadas
  const regrasPath = path.join(PROMPTS_DIR, 'regras-genericas-consolidadas.json');
  const regrasContent = await fs.readFile(regrasPath, 'utf-8');
  const regras = JSON.parse(regrasContent);

  // Extrair diretrizes principais dos arquivos de métodos
  const metodosPrincipal = regras.diretrizes.metodologicas.find(d =>
    d.fonte.includes('METODOS_CONSOLIDADO')
  );

  const diretrizesRedacionais = regras.diretrizes.redacionais.find(d =>
    d.fonte.includes('DIRETRIZES_REDACIONAIS')
  );

  // Construir system prompt base
  const systemPromptBase = `
# DIRETRIZES UNIVERSAIS DO ESCRITÓRIO - ROM v3.3

## 1. METODOLOGIA FUNDAMENTAL

### Princípios Inegociáveis:
- **LEITURA INTEGRAL**: Nunca trabalhar por amostragem. Ler sempre na íntegra todos os documentos fornecidos.
- **FIDELIDADE AOS AUTOS**: Jamais inventar fatos, datas, nomes ou acontecimentos. Toda afirmação deve ter fonte verificável.
- **FUNDAMENTAÇÃO RIGOROSA**: Toda tese jurídica deve estar ancorada em legislação, jurisprudência ou doutrina citadas corretamente.
- **CITAÇÃO DE FONTES**: Sempre indicar número de artigo, lei, súmula ou acórdão ao fundamentar.
- **ANÁLISE CRÍTICA**: Não apenas reproduzir, mas analisar criticamente a aplicação ao caso concreto.

### Trava Anti-Alucinação (5 Eixos):
1. **Fatos**: Verificar se cada fato alegado consta expressamente nos autos
2. **Datas**: Conferir todas as datas contra cronologia processual
3. **Citações Jurídicas**: Validar existência real de leis, súmulas e acórdãos
4. **Nomes e Partes**: Confirmar grafia exata de nomes de partes e autoridades
5. **Valores e Números**: Checar todos os valores monetários e números processuais

## 2. DIRETRIZES REDACIONAIS

### Linguagem e Estilo:
- **Tom Técnico-Jurídico**: Linguagem formal, mas clara e direta
- **Evitar Prolixidade**: Ser conciso sem perder substância
- **Vocabulário Preciso**: Usar termos técnicos adequados (ex: "prescrição" vs "decadência")
- **Argumentação Estruturada**: Tese → Fundamento → Conclusão

### Formatação ABNT:
- **Fonte**: Times New Roman, 12pt (corpo do texto), 11pt (citações longas), 10pt (notas de rodapé)
- **Espaçamento**: 1,5 entre linhas (corpo), simples (citações longas)
- **Recuo de Parágrafo**: 1,25cm (4 tabulações)
- **Citações Longas** (>3 linhas): Recuo 4cm, fonte 11pt, espaçamento simples, sem aspas
- **Citações Curtas** (≤3 linhas): No corpo do texto, entre aspas
- **Numeração**: Inferior direita

### Estrutura de Peças:
1. **Identificação**: Tribunal, Processo, Partes
2. **Endereçamento**: Excelentíssimo(a) Senhor(a) [Cargo]
3. **Qualificação**: Identificação do requerente e advogado
4. **Exposição dos Fatos**: Cronologia clara e objetiva
5. **Fundamentos de Direito**: Teses jurídicas fundamentadas
6. **Pedidos**: Claros, objetivos e numerados
7. **Requerimentos Finais**: Citações, intimações, juntada de documentos
8. **Fecho**: Local, data, assinatura

## 3. AUTOADAPTAÇÃO CONTÍNUA (v3.3)

### Análise de Contexto Conversacional:
- **Histórico**: Analisar as últimas 10 mensagens da conversa
- **Padrões do Usuário**: Identificar preferências de estilo, detalhamento, estrutura
- **Feedback Implícito**: Ajustar com base em correções ou complementos anteriores
- **Evolução da Demanda**: Adaptar se o usuário mudar o escopo ou foco

### Varredura de Knowledge Base (KB):
- **Busca Ativa**: Se kbContext não fornecido, buscar automaticamente documentos do usuário
- **Leitura Paralela**: Processar múltiplos documentos simultaneamente
- **Consolidação**: Integrar informações de diferentes fontes de forma coerente
- **Truncamento Inteligente**: Priorizar trechos relevantes quando há limite de tokens

## 4. CONTROLE DE QUALIDADE

### Checklist Pré-Entrega:
- [ ] Todos os fatos têm fonte nos autos?
- [ ] Todas as citações jurídicas foram verificadas?
- [ ] Datas e prazos conferidos contra cronologia?
- [ ] Nomes de partes grafados corretamente?
- [ ] Formatação ABNT aplicada?
- [ ] Argumentação é coerente e bem fundamentada?
- [ ] Pedidos são claros e juridicamente viáveis?

### Validação de Citações:
- Sempre que possível, usar pesquisa web para confirmar existência de súmulas, leis e acórdãos
- Indicar claramente quando uma citação não pôde ser verificada
- Nunca inventar número de lei, súmula ou acórdão

## 5. FLUXO DE TRABALHO ROM

1. **Recepção**: Compreender a demanda e documentos fornecidos
2. **Leitura Integral**: Processar todos os documentos na íntegra
3. **Análise**: Identificar teses, fatos relevantes, questões jurídicas
4. **Pesquisa** (se necessário): Buscar jurisprudência e legislação aplicável
5. **Estruturação**: Organizar argumentação de forma lógica
6. **Redação**: Elaborar peça conforme diretrizes
7. **Revisão**: Aplicar checklist de qualidade
8. **Entrega**: Apresentar resultado com indicação de fontes

---

**IMPORTANTE**: Estas diretrizes são TRANSVERSAIS a todos os subagentes e devem ser respeitadas independentemente da área jurídica ou tipo de peça.
`;

  // Salvar
  const basePath = path.join(PROMPTS_DIR, 'system-prompt-base-transversal.md');
  await fs.writeFile(basePath, systemPromptBase);

  console.log('✅ System Prompt Base gerado!');
  console.log(`💾 Salvo em: ${basePath}\n`);

  return systemPromptBase;
}

/**
 * Mapear prompts para subagentes
 */
async function mapearPromptsParaSubagentes() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MAPEANDO PROMPTS PARA SUBAGENTES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const mapeamento = {
    // Subagentes Cíveis
    'redator-civel': {
      prompts: ['civel/civel-apelacao.txt', 'civel/civel-contestacao.txt'],
      area: 'civel'
    },

    // Subagentes Criminais
    'redator-criminal': {
      prompts: ['criminal/criminal-apelacao.txt', 'criminal/criminal-embargos-declaracao-criminal-v.txt'],
      area: 'criminal'
    },

    // Subagentes Trabalhistas
    'redator-trabalhista': {
      prompts: ['trabalhista/trabalhista-trab-embargos-declaracao-v.txt', 'trabalhista/trabalhista-generico.rtf'],
      area: 'trabalhista'
    },

    // Análise Processual
    'analise-processual': {
      prompts: ['processual/processual-generico.txt', 'tributario/tributario-analise-processo-v.txt'],
      area: 'processual'
    },

    // Recursos
    'leading-case': {
      prompts: ['recursos/recursos-generico.txt'],
      area: 'recursos'
    },

    // Planejamento Tributário (novo subagente potencial)
    'planejador-tributario': {
      prompts: ['tributario/tributario-planejamento.txt', 'tributario/tributario-planejamento.rtf'],
      area: 'tributario',
      novo: true
    }
  };

  console.log('📋 Mapeamento de Prompts:');
  console.log('┌────────────────────────┬──────────────────────────────────────┬────────┐');
  console.log('│ Subagente              │ Prompts Mapeados                     │ Status │');
  console.log('├────────────────────────┼──────────────────────────────────────┼────────┤');

  for (const [subagente, config] of Object.entries(mapeamento)) {
    const status = config.novo ? '🆕 NOVO' : '✓ Exist';
    const prompts = config.prompts.length;

    console.log(`│ ${subagente.padEnd(22)} │ ${prompts} arquivo(s)                          │ ${status}  │`);
  }

  console.log('└────────────────────────┴──────────────────────────────────────┴────────┘\n');

  // Salvar mapeamento
  const mapPath = path.join(ROOT_DIR, 'mapeamento-subagentes-prompts.json');
  await fs.writeFile(mapPath, JSON.stringify(mapeamento, null, 2));

  console.log(`💾 Mapeamento salvo em: ${mapPath}\n`);

  return mapeamento;
}

/**
 * Gerar código de atualização para subagents.js
 */
async function gerarCodigoAtualizacao(systemPromptBase, mapeamento) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  GERANDO CÓDIGO DE ATUALIZAÇÃO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const codigo = `
/**
 * ATUALIZAÇÃO AUTOMÁTICA - INTEGRAÇÃO PROMPTS v3.3
 * Gerado em: ${new Date().toISOString()}
 *
 * Aplicar estas modificações em src/modules/subagents.js
 */

// 1. ADICIONAR SYSTEM PROMPT BASE NO TOPO DO ARQUIVO
const SYSTEM_PROMPT_BASE_TRANSVERSAL = \`${systemPromptBase}\`;

// 2. FUNÇÃO DE COMPOSIÇÃO DE PROMPT
function comporPromptComBase(promptEspecifico) {
  return \`\${SYSTEM_PROMPT_BASE_TRANSVERSAL}

---

# PROMPT ESPECÍFICO DO SUBAGENTE

\${promptEspecifico}\`;
}

// 3. MODIFICAR systemPrompt DE CADA SUBAGENTE
// Exemplo para 'redator-civel':

'redator-civel': {
  name: 'Redator Cível',
  type: 'drafting',
  description: 'Redação de peças cíveis (apelação, contestação, etc.)',
  systemPrompt: async () => {
    // Carregar prompt específico de civel/civel-apelacao.txt
    const promptEspecifico = await fs.readFile(
      path.join(__dirname, '../data/prompts/reorganizados/civel/civel-apelacao.txt'),
      'utf-8'
    );

    return comporPromptComBase(promptEspecifico);
  },
  // ... resto da configuração
}

// 4. APLICAR AUTOADAPTAÇÃO (já existente na v3.3)
// Garantir que método 'adaptar_prompt_com_historico' está sendo chamado

// 5. APLICAR ANTI-ALUCINAÇÃO (já existente na v3.3)
// Garantir que validação de 5 eixos está ativa em todos os subagentes

// 6. NOVO SUBAGENTE: planejador-tributario
'planejador-tributario': {
  name: 'Planejador Tributário',
  type: 'planning',
  description: 'Análise e planejamento tributário estratégico',
  systemPrompt: async () => {
    const promptEspecifico = await fs.readFile(
      path.join(__dirname, '../data/prompts/reorganizados/tributario/tributario-planejamento.txt'),
      'utf-8'
    );

    return comporPromptComBase(promptEspecifico);
  },
  capabilities: [
    'Análise de carga tributária',
    'Planejamento estratégico fiscal',
    'Identificação de oportunidades de economia',
    'Conformidade tributária'
  ],
  tools: ['file_read', 'web_search', 'calculator']
}
`;

  const codigoPath = path.join(ROOT_DIR, 'codigo-atualizacao-subagentes.js');
  await fs.writeFile(codigoPath, codigo);

  console.log('✅ Código de atualização gerado!');
  console.log(`💾 Salvo em: ${codigoPath}\n`);

  console.log('📋 INSTRUÇÕES PARA APLICAR:');
  console.log('   1. Abrir src/modules/subagents.js');
  console.log('   2. Adicionar SYSTEM_PROMPT_BASE_TRANSVERSAL no topo');
  console.log('   3. Adicionar função comporPromptComBase()');
  console.log('   4. Atualizar systemPrompt de cada subagente para usar comporPromptComBase()');
  console.log('   5. Adicionar novo subagente planejador-tributario\n');

  return codigo;
}

/**
 * Main
 */
async function main() {
  try {
    // 1. Gerar System Prompt Base
    const systemPromptBase = await gerarSystemPromptBase();

    // 2. Mapear prompts para subagentes
    const mapeamento = await mapearPromptsParaSubagentes();

    // 3. Gerar código de atualização
    await gerarCodigoAtualizacao(systemPromptBase, mapeamento);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ INTEGRAÇÃO COMPLETA!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📂 Arquivos gerados:');
    console.log('   • system-prompt-base-transversal.md');
    console.log('   • mapeamento-subagentes-prompts.json');
    console.log('   • codigo-atualizacao-subagentes.js\n');

    console.log('🔧 Próximo passo: Aplicar código de atualização em src/modules/subagents.js\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

main().catch(console.error);
