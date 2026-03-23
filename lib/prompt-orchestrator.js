/**
 * ROM Agent - Sistema de Orquestração Automática de Prompts V5.0
 *
 * Detecta automaticamente qual prompt V5.0 usar baseado em keywords na mensagem do usuário.
 * Integra-se com o router.js existente sem afetar outras funcionalidades.
 */

import fs from 'fs';
import path from 'path';

// Mapa de keywords para prompts V5.0
const PROMPT_MAP = {
  // Recursos Cíveis
  "apelacao": "PROMPT_APELACAO_CIVEL_V5.0.txt",
  "apelação": "PROMPT_APELACAO_CIVEL_V5.0.txt",
  "agravo": "PROMPT_AGRAVO_INSTRUMENTO_V5.0.txt",
  "agravo instrumento": "PROMPT_AGRAVO_INSTRUMENTO_V5.0.txt",
  "agravo interno": "PROMPT_AGRAVO_INTERNO_V5.0.txt",
  "recurso especial": "PROMPT_RECURSO_ESPECIAL_V5.0.txt",
  "resp": "PROMPT_RECURSO_ESPECIAL_V5.0.txt",
  "recurso extraordinario": "PROMPT_RECURSO_EXTRAORDINARIO_V5.0.txt",
  "recurso extraordinário": "PROMPT_RECURSO_EXTRAORDINARIO_V5.0.txt",
  "re": "PROMPT_RECURSO_EXTRAORDINARIO_V5.0.txt",
  "embargos": "PROMPT_EMBARGOS_DECLARACAO_UNIVERSAL_V5.0.txt",
  "embargos de declaracao": "PROMPT_EMBARGOS_DECLARACAO_UNIVERSAL_V5.0.txt",
  "embargos de declaração": "PROMPT_EMBARGOS_DECLARACAO_UNIVERSAL_V5.0.txt",
  "embargos execucao": "PROMPT_EMBARGOS_EXECUCAO_V5_0.txt",
  "impugnacao": "PROMPT_IMPUGNACAO_CUMPRIMENTO_GERAL_V5_0.txt",
  "impugnação": "PROMPT_IMPUGNACAO_CUMPRIMENTO_GERAL_V5_0.txt",

  // Recursos Trabalhistas
  "recurso ordinario": "PROMPT_RECURSO_ORDINARIO_TRABALHISTA_V5.0.txt",
  "recurso ordinário": "PROMPT_RECURSO_ORDINARIO_TRABALHISTA_V5.0.txt",
  "recurso revista": "PROMPT_RECURSO_REVISTA_TST_V5.0.txt",

  // Petições Iniciais
  "peticao inicial": "PROMPT_PETICAO_INICIAL_CIVEL_V5.0.txt",
  "petição inicial": "PROMPT_PETICAO_INICIAL_CIVEL_V5.0.txt",
  "inicial": "PROMPT_PETICAO_INICIAL_CIVEL_V5.0.txt",
  "contestacao": "PROMPT_CONTESTACAO_UNIVERSAL_V5.0.txt",
  "contestação": "PROMPT_CONTESTACAO_UNIVERSAL_V5.0.txt",
  "replica": "PROMPT_REPLICA_V5.0.txt",
  "réplica": "PROMPT_REPLICA_V5.0.txt",
  "manifestacao": "PROMPT_MANIFESTACAO_UNIVERSAL_V5.0.txt",
  "manifestação": "PROMPT_MANIFESTACAO_UNIVERSAL_V5.0.txt",

  // Criminais
  "habeas corpus": "PROMPT_HABEAS_CORPUS_V5.0.txt",
  "hc": "PROMPT_HABEAS_CORPUS_V5.0.txt",
  "apelacao criminal": "PROMPT_APELACAO_CRIMINAL_COMPLETA_V5.0.txt",
  "apelação criminal": "PROMPT_APELACAO_CRIMINAL_COMPLETA_V5.0.txt",
  "resposta acusacao": "PROMPT_RESPOSTA_ACUSACAO_V5.0.txt",
  "resposta à acusação": "PROMPT_RESPOSTA_ACUSACAO_V5.0.txt",
  "alegacoes finais": "PROMPT_ALEGACOES_FINAIS_CRIMINAIS_V5.0.txt",
  "alegações finais": "PROMPT_ALEGACOES_FINAIS_CRIMINAIS_V5.0.txt",
  "liberdade provisoria": "PROMPT_LIBERDADE_PROVISORIA_V5.0.txt",
  "liberdade provisória": "PROMPT_LIBERDADE_PROVISORIA_V5.0.txt",
  "relaxamento": "PROMPT_RELAXAMENTO_PRISAO_V5.0.txt",
  "queixa crime": "PROMPT_QUEIXA_CRIME_V5.0.txt",
  "revisao criminal": "PROMPT_REVISAO_CRIMINAL_V5.0.txt",
  "revisão criminal": "PROMPT_REVISAO_CRIMINAL_V5.0.txt",

  // Trabalhistas
  "reclamacao trabalhista": "PROMPT_RECLAMACAO_TRABALHISTA_V5.0.txt",
  "reclamação trabalhista": "PROMPT_RECLAMACAO_TRABALHISTA_V5.0.txt",
  "contestacao trabalhista": "PROMPT_CONTESTACAO_TRABALHISTA_V5.0.txt",
  "contestação trabalhista": "PROMPT_CONTESTACAO_TRABALHISTA_V5.0.txt",
  "mandado seguranca trabalhista": "PROMPT_MANDADO_SEGURANCA_TRABALHISTA_V5.0.txt",
  "mandado segurança trabalhista": "PROMPT_MANDADO_SEGURANCA_TRABALHISTA_V5.0.txt",

  // Contratos
  "contrato": "PROMPT_CONTRATO_GERAL_V5.0.txt",
  "contrato social": "PROMPT_CONTRATO_SOCIAL_V5.0.txt",
  "distrato": "PROMPT_DISTRATO_SOCIAL_V5.0.txt",
  "estatuto": "PROMPT_ESTATUTO_ASSOCIACAO_V5.0.txt",
  "notificacao": "PROMPT_NOTIFICACAO_EXTRAJUDICIAL_V5.0.txt",
  "notificação": "PROMPT_NOTIFICACAO_EXTRAJUDICIAL_V5.0.txt",
  "parecer": "PROMPT_PARECER_JURIDICO_V5.0.txt",
  "acordo": "PROMPT_TERMO_ACORDO_V5.0.txt",
  "quitacao": "PROMPT_TERMO_QUITACAO_V5.0.txt",
  "quitação": "PROMPT_TERMO_QUITACAO_V5.0.txt",

  // Análise e Revisão
  "analise": "IAROM_PR001_ANALISE_PETICAO_V5.0.txt",
  "análise": "IAROM_PR001_ANALISE_PETICAO_V5.0.txt",
  "revisao": "IAROM_PR002_REVISAO_CLAUDE_V5.0.txt",
  "revisão": "IAROM_PR002_REVISAO_CLAUDE_V5.0.txt",
};

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts', 'global');

/**
 * Detecta qual prompt V5.0 usar baseado na mensagem do usuário
 * @param {string} userMessage - Mensagem ou instrução do usuário
 * @returns {string|null} - Nome do arquivo do prompt ou null
 */
export function detectPromptV5(userMessage) {
  if (!userMessage) return null;

  const messageLower = userMessage.toLowerCase();

  // Busca por palavras-chave (ordem de especificidade)
  // Primeiro tenta matches mais específicos
  const keywords = Object.keys(PROMPT_MAP).sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (messageLower.includes(keyword)) {
      return PROMPT_MAP[keyword];
    }
  }

  return null;
}

/**
 * Carrega o conteúdo de um prompt V5.0
 * @param {string} promptFilename - Nome do arquivo do prompt
 * @returns {string|null} - Conteúdo do prompt ou null se não encontrado
 */
export function loadPromptV5(promptFilename) {
  if (!promptFilename) return null;

  try {
    const promptPath = path.join(PROMPTS_DIR, promptFilename);
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
  } catch (error) {
    console.error(`Erro ao carregar prompt ${promptFilename}:`, error.message);
  }

  return null;
}

/**
 * Constrói system prompt completo com orquestração V5.0
 * @param {string} userMessage - Mensagem do usuário
 * @param {string} baseSystemPrompt - System prompt base (opcional)
 * @returns {object} - { systemPrompt, promptType, isV5 }
 */
export function buildSystemPromptV5(userMessage, baseSystemPrompt = null) {
  // Carregar módulo core
  const corePath = path.join(PROMPTS_DIR, 'MOD_MASTER_CORE.txt');
  const core = fs.existsSync(corePath) ? fs.readFileSync(corePath, 'utf-8') : '';

  // Carregar orquestrador
  const orchestratorPath = path.join(PROMPTS_DIR, 'orquestrador_prompt.txt');
  const orchestrator = fs.existsSync(orchestratorPath) ? fs.readFileSync(orchestratorPath, 'utf-8') : '';

  // Detectar prompt específico V5.0
  const promptFilename = detectPromptV5(userMessage);

  if (promptFilename) {
    const specificPrompt = loadPromptV5(promptFilename);

    if (specificPrompt) {
      // Combinar: Core + Orquestrador + Prompt Específico
      const combined = `
${core}

═══════════════════════════════════════════════════════════════════════════════

${orchestrator}

═══════════════════════════════════════════════════════════════════════════════

PROMPT ESPECÍFICO V5.0 ATIVADO:

${specificPrompt}

═══════════════════════════════════════════════════════════════════════════════

INSTRUÇÕES FINAIS:
- Siga RIGOROSAMENTE o prompt específico acima
- Use o sistema ROM V3.0 (Fidedignidade, Conferibilidade, Anti-supressão)
- NUNCA invente dados - use [PENDENTE: ...] se faltar informação
- Colete TODOS os inputs obrigatórios antes de redigir
`;

      return {
        systemPrompt: combined,
        promptType: promptFilename.replace('.txt', ''),
        isV5: true
      };
    }
  }

  // Se não detectou prompt específico, usa base + orquestrador
  const generic = baseSystemPrompt || `
${core}

═══════════════════════════════════════════════════════════════════════════════

${orchestrator}

═══════════════════════════════════════════════════════════════════════════════

INSTRUÇÕES:
- Identifique qual tipo de peça jurídica o usuário precisa
- Pergunte detalhes para ativar o prompt específico correto
- Use os princípios ROM V3.0
`;

  return {
    systemPrompt: generic,
    promptType: 'generic',
    isV5: false
  };
}

/**
 * Lista todos os prompts V5.0 disponíveis
 * @returns {object} - { total, prompts: { filename: [keywords] } }
 */
export function listPromptsV5() {
  const available = {};

  for (const [keyword, filename] of Object.entries(PROMPT_MAP)) {
    const promptPath = path.join(PROMPTS_DIR, filename);
    if (fs.existsSync(promptPath)) {
      if (!available[filename]) {
        available[filename] = [];
      }
      if (!available[filename].includes(keyword)) {
        available[filename].push(keyword);
      }
    }
  }

  return {
    total: Object.keys(available).length,
    keywords: Object.keys(PROMPT_MAP).length,
    prompts: available
  };
}

export default {
  detectPromptV5,
  loadPromptV5,
  buildSystemPromptV5,
  listPromptsV5
};
