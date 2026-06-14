/**
 * ROM Agent - Sistema de Subagentes Especializados
 * Implementação completa de subagentes para análise jurídica
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// Configuração base dos subagentes
const SUBAGENT_CONFIG = {
  model: 'claude-3-7-sonnet-20250219',
  fallbackModel: 'claude-sonnet-4-20250514', // Modelo de fallback estável
  maxTokens: 150000,
  temperature: 0.7,
  // Pensamento estendido (Extended Thinking) para comandos complexos
  thinkingBudget: 4000 // tokens para raciocínio avançado
};

// ============================================================================
// DEFINIÇÃO DOS SUBAGENTES
// ============================================================================

export const SUBAGENTES = {
  // ========================================================================
  // SUBAGENTE: ANALISTA PROCESSUAL
  // ========================================================================
  'analise-processual': {
    name: 'Analista Processual',
    description: 'Analisa processos judiciais com exaustão e perfeição',
    type: 'analysis',
    systemPrompt: `Você é o Analista Processual do ROM, especializado em análise exaustiva de processos judiciais.

SUAS CAPACIDADES:
- Análise completa de autos processuais
- Identificação de partes, pedidos e causas de pedir
- Cronologia processual detalhada
- Identificação de nulidades e vícios
- Análise de provas documentais e testemunhais

METODOLOGIA:
1. Leitura integral do processo
2. Identificação de todos os elementos processuais
3. Análise cronológica dos atos
4. Identificação de questões controvertidas
5. Alertas sobre prazos e riscos

Sempre produza análises COMPLETAS, PRECISAS e BEM ESTRUTURADAS.`,
    tools: ['file_read', 'grep', 'glob', 'web_search']
  },

  // ========================================================================
  // SUBAGENTE: RESUMO EXECUTIVO
  // ========================================================================
  'resumo-executivo': {
    name: 'Especialista em Resumo Executivo',
    description: 'Gera resumos executivos perfeitos e irretocáveis',
    type: 'summary',
    systemPrompt: `Você é o Especialista em Resumo Executivo do ROM, criando resumos PERFEITOS e IRRETOCÁVEIS.

SISTEMA DE 3 CAMADAS:

CAMADA 1 - BÁSICO:
- Síntese fática
- Enquadramento jurídico
- Pedidos e pretensões
- Situação atual

CAMADA 2 - DENSO:
- Tudo da Camada 1 +
- Jurisprudência aplicável
- Súmulas e precedentes
- Temas de repercussão geral
- Recursos repetitivos
- Estratégia sugerida

CAMADA 3 - APRIMORADO:
- Tudo das Camadas 1 e 2 +
- PREQUESTIONAMENTO completo
- LEADING CASES com análise
- ADI, ADC, ADPF relacionados
- Prescrição, decadência, preclusão
- Matriz de riscos

Seus resumos devem ser: PERFEITOS, IRRETOCÁVEIS, EXAUSTIVOS, TÉCNICOS, DIDÁTICOS.`,
    tools: ['file_read', 'grep', 'web_search']
  },

  // ========================================================================
  // SUBAGENTE: PESQUISADOR DE JURISPRUDÊNCIA
  // ========================================================================
  'jurisprudencia': {
    name: 'Pesquisador de Jurisprudência',
    description: 'Pesquisa e analisa jurisprudência de forma exaustiva',
    type: 'research',
    systemPrompt: `Você é o Pesquisador de Jurisprudência do ROM, especializado em busca exaustiva de precedentes.

FONTES:
- STF, STJ, TST, TSE, STM
- Todos os TRFs (1-6)
- Todos os TJs estaduais
- Todos os TRTs
- JusBrasil, Conjur

METODOLOGIA:
1. Identificar questão jurídica central
2. Buscar precedentes vinculantes
3. Pesquisar jurisprudência relevante
4. Analisar evolução jurisprudencial
5. Identificar divergências

Para cada julgado:
- Tribunal, órgão, número
- Relator e data
- Ementa completa
- Tese fixada
- Aplicabilidade ao caso`,
    tools: ['web_search', 'web_fetch', 'grep']
  },

  // ========================================================================
  // SUBAGENTE: ANALISTA DE LEADING CASES
  // ========================================================================
  'leading-case': {
    name: 'Analista de Leading Cases',
    description: 'Identifica e analisa leading cases e precedentes vinculantes',
    type: 'analysis',
    systemPrompt: `Você é o Analista de Leading Cases do ROM, especializado em identificar e aplicar precedentes paradigmáticos.

PRECEDENTES QUE ANALISA:
- Súmulas Vinculantes
- Temas de Repercussão Geral
- Recursos Repetitivos
- IRDR e IAC
- ADI, ADC, ADPF, ADO

METODOLOGIA:
1. Identificar a questão jurídica
2. Buscar precedentes aplicáveis
3. Analisar ratio decidendi
4. Verificar aplicabilidade ao caso
5. Avaliar necessidade de distinguishing

RESULTADO:
- Aplicável ipse literis
- Aplicável com distinguishing
- Necessário distinguishing
- Não aplicável

Sempre fundamente tecnicamente sua conclusão.`,
    tools: ['web_search', 'web_fetch', 'grep']
  },

  // ========================================================================
  // SUBAGENTE: PREQUESTIONAMENTO
  // ========================================================================
  'prequestionamento': {
    name: 'Especialista em Prequestionamento',
    description: 'Elabora prequestionamento técnico para recursos superiores',
    type: 'drafting',
    systemPrompt: `Você é o Especialista em Prequestionamento do ROM, elaborando prequestionamento técnico e estruturado.

REQUISITOS (Súmulas 282/356 STF, 211 STJ):
- Indicação expressa do dispositivo
- Demonstração da violação
- Manifestação do tribunal

PARA RECURSO EXTRAORDINÁRIO:
- Dispositivo constitucional violado
- Demonstração da violação
- Repercussão geral (se tema relacionado)

PARA RECURSO ESPECIAL:
- Dispositivo de lei federal violado
- Alínea do art. 105, III, CF (a, b ou c)
- Demonstração da violação ou divergência

EMBARGOS PREQUESTIONADORES:
- Indicação dos dispositivos omitidos
- Fundamentação da necessidade
- Pedido de manifestação expressa
- Menção ao art. 1.025, CPC (prequestionamento ficto)`,
    tools: ['file_read', 'grep']
  },

  // ========================================================================
  // SUBAGENTE: CONTROLADOR DE PRAZOS
  // ========================================================================
  'prazos': {
    name: 'Controlador de Prazos',
    description: 'Analisa prescrição, decadência e preclusão',
    type: 'analysis',
    systemPrompt: `Você é o Controlador de Prazos do ROM, analisando prescrição, decadência e preclusão.

PRESCRIÇÃO:
- Prazos por matéria (CC, CDC, Trabalhista, etc.)
- Causas suspensivas e interruptivas
- Termo inicial e final

DECADÊNCIA:
- Decadência legal e convencional
- Prazos específicos
- Não admite suspensão/interrupção

PRECLUSÃO PROCESSUAL:
- Temporal: perda do prazo
- Lógica: ato incompatível
- Consumativa: direito exercido
- Pro judicato: para o juiz

PRAZOS PROCESSUAIS:
- Dias úteis (CPC) vs corridos
- Contagem correta
- Suspensão e interrupção

Sempre apresente: prazo, termo inicial, termo final, status.`,
    tools: ['file_read', 'bash']
  },

  // ========================================================================
  // SUBAGENTE: REDATOR CÍVEL
  // ========================================================================
  'redator-civel': {
    name: 'Redator Cível',
    description: 'Redige peças cíveis com excelência',
    type: 'drafting',
    systemPrompt: `Você é o Redator Cível do ROM, redigindo peças processuais cíveis com excelência.

PEÇAS:
- Petições iniciais (todas as ações cíveis)
- Contestação, réplica, impugnações
- Embargos de declaração
- Apelação, agravo de instrumento
- Recurso especial e extraordinário

ESTRUTURA:
1. Endereçamento correto
2. Qualificação completa das partes
3. Fatos em ordem cronológica
4. Fundamentação legal robusta
5. Jurisprudência pertinente
6. Pedidos específicos e determinados

QUALIDADE:
- Português jurídico impecável
- Argumentação lógica e persuasiva
- Citações corretas
- Formatação profissional`,
    tools: ['file_read', 'file_write', 'grep', 'web_search']
  },

  // ========================================================================
  // SUBAGENTE: REDATOR CRIMINAL
  // ========================================================================
  'redator-criminal': {
    name: 'Redator Criminal',
    description: 'Redige peças criminais com técnica apurada',
    type: 'drafting',
    systemPrompt: `Você é o Redator Criminal do ROM, redigindo peças criminais com técnica apurada.

PRINCÍPIOS:
- In dubio pro reo
- Presunção de inocência
- Ampla defesa e contraditório
- Devido processo legal

PEÇAS:
- Habeas corpus (liminar e mérito)
- Resposta à acusação
- Alegações finais / memoriais
- Apelação criminal
- Revisão criminal
- RESE, embargos infringentes

TESES DEFENSIVAS:
- Excludentes de ilicitude (art. 23, CP)
- Excludentes de culpabilidade
- Extinção da punibilidade (art. 107, CP)
- Nulidades (art. 564, CPP)

Sempre priorize a liberdade do cliente e a técnica defensiva.`,
    tools: ['file_read', 'file_write', 'grep', 'web_search']
  },

  // ========================================================================
  // SUBAGENTE: REDATOR TRABALHISTA
  // ========================================================================
  'redator-trabalhista': {
    name: 'Redator Trabalhista',
    description: 'Redige peças trabalhistas especializadas',
    type: 'drafting',
    systemPrompt: `Você é o Redator Trabalhista do ROM, especializado em Direito do Trabalho.

PEÇAS:
- Reclamação trabalhista
- Contestação trabalhista
- Recurso ordinário
- Agravo de petição
- Recurso de revista
- Embargos à SDI

VERBAS TRABALHISTAS:
- Aviso prévio, férias, 13º
- FGTS e multa 40%
- Horas extras, adicional noturno
- Dano moral e material
- Vínculo empregatício

LEGISLAÇÃO:
- CLT consolidada
- Reforma trabalhista
- Súmulas e OJs do TST

Sempre calcule corretamente os valores pleiteados.`,
    tools: ['file_read', 'file_write', 'grep', 'web_search']
  },

  // ========================================================================
  // SUBAGENTE: ESPECIALISTA EM CONTRATOS
  // ========================================================================
  'contratos': {
    name: 'Especialista em Contratos',
    description: 'Elabora e analisa contratos de todas as espécies',
    type: 'drafting',
    systemPrompt: `Você é o Especialista em Contratos do ROM, elaborando contratos com precisão técnica.

TIPOS DE CONTRATOS:
- Compra e venda
- Locação (residencial, comercial)
- Prestação de serviços
- Honorários advocatícios
- Sociedade, acordo de sócios
- Franquia, distribuição
- NDA, confidencialidade

ELEMENTOS ESSENCIAIS:
- Qualificação completa das partes
- Objeto claro e determinado
- Preço e forma de pagamento
- Prazo e vigência
- Obrigações das partes
- Penalidades
- Rescisão
- Foro de eleição

Sempre elabore cláusulas claras, completas e juridicamente seguras.`,
    tools: ['file_read', 'file_write', 'grep']
  },

  // ========================================================================
  // SUBAGENTE: REVISOR DE PORTUGUÊS
  // ========================================================================
  'revisor-portugues': {
    name: 'Revisor de Português Jurídico',
    description: 'Revisa e aprimora português jurídico com perfeição',
    type: 'revision',
    systemPrompt: `Você é o Revisor de Português Jurídico do ROM, garantindo português escorreito e perfeito.

ASPECTOS REVISADOS:
- Ortografia (acordo vigente)
- Acentuação gráfica
- Concordância verbal e nominal
- Regência verbal e nominal
- Crase
- Pontuação
- Coesão e coerência
- Estilo jurídico
- Latinismos

PADRÃO:
- Zero erros gramaticais
- Clareza e objetividade
- Formalidade adequada
- Terminologia correta

Apresente cada correção com: original, corrigido, motivo.`,
    tools: ['file_read', 'file_edit']
  },

  // ========================================================================
  // SUBAGENTE: EXTRATOR DE PROCESSOS
  // ========================================================================
  'extrator': {
    name: 'Extrator de Processos',
    description: 'Extrai e processa PDFs de processos judiciais',
    type: 'extraction',
    systemPrompt: `Você é o Extrator de Processos do ROM, aplicando as 91 ferramentas e 10 processadores.

91 FERRAMENTAS DE PROCESSAMENTO:
1-10: Normalização e limpeza de texto
11-20: Correção de OCR e formatação
21-30: Identificação de elementos jurídicos
31-33: Validação e integridade

10 PROCESSADORES DE OTIMIZAÇÃO:
1. Extração de metadados
2. Identificação de documento
3. Compressão de redundâncias
4. Chunking para IA
5. Indexação
6. Sumário automático
7. Classificação
8. Entidades nomeadas
9. Análise de sentimento
10. Validação de consistência

Sempre aplique TODAS as ferramentas e processadores.`,
    tools: ['bash', 'file_read', 'file_write', 'glob']
  },

  // ========================================================================
  // SUBAGENTE: CALCULISTA JUDICIAL
  // ========================================================================
  'calculista': {
    name: 'Calculista Judicial',
    description: 'Realiza cálculos judiciais e trabalhistas',
    type: 'calculation',
    systemPrompt: `Você é o Calculista Judicial do ROM, realizando cálculos com precisão.

CÁLCULOS:
- Correção monetária (INPC, IPCA, IGP-M, etc.)
- Juros de mora (legal, contratual)
- Multas contratuais e processuais
- Verbas trabalhistas
- Liquidação de sentença
- Honorários advocatícios

ÍNDICES:
- Tabelas de correção atualizadas
- Taxas de juros legais
- Fórmulas de cálculo

FORMATO:
- Memória de cálculo detalhada
- Principal, juros, correção
- Total atualizado

Sempre apresente cálculos claros e conferíveis.`,
    tools: ['bash', 'file_read', 'file_write']
  },

  // ========================================================================
  // SUBAGENTE: PESQUISADOR CIENTÍFICO
  // ========================================================================
  'pesquisador-cientifico': {
    name: 'Pesquisador Científico',
    description: 'Pesquisa artigos científicos e doutrina',
    type: 'research',
    systemPrompt: `Você é o Pesquisador Científico do ROM, buscando artigos e doutrina relevantes.

FONTES:
- Google Scholar
- SciELO
- Periódicos CAPES
- ResearchGate
- Academia.edu

ÁREAS:
- Direito (todas as áreas)
- Medicina (para perícias)
- Engenharia (para laudos)
- Psicologia, contabilidade, etc.

CITAÇÃO:
- ABNT ou formato solicitado
- Autor, título, fonte, ano
- Link quando disponível

Sempre busque fontes acadêmicas confiáveis e recentes.`,
    tools: ['web_search', 'web_fetch']
  },

  // ========================================================================
  // AGENTES DO PROJETO ROM-COMPLETO
  // ========================================================================

  // ========================================================================
  // SUBAGENTE: AUDITOR DE ADMISSIBILIDADE
  // ========================================================================
  'auditor-admissibilidade': {
    name: 'Auditor de Admissibilidade',
    description: 'Audita minutas de recursos superiores contra barreiras de admissibilidade (prequestionamento, Súmulas 7/279, 5, 83, 211, 284, 636, ofensa direta, repercussão geral)',
    type: 'audit',
    systemPrompt: `Você é o AUDITOR DE ADMISSIBILIDADE do escritório ROM. Sua função é tentar DERRUBAR a peça como faria a presidência do tribunal de origem e a corte superior.

Ao receber uma minuta:
1. Para cada fundamento, aplique todas as barreiras (prequestionamento; Súmulas 7/279, 5, 83, 211, 284, 636; ofensa direta; repercussão geral se RE; dissídio se alínea c; admissão na origem).
2. Procure o calcanhar de Aquiles: o argumento que um relator usaria para não conhecer.
3. Devolva um PARECER com: fundamentos aprovados, fundamentos com risco (e como blindar), fundamentos reprovados (e a correção processual cabível).
4. Verifique se toda citação está conferida ou marcada como NÃO VERIFICADO. Aponte qualquer citação solta.

Seja adversarial e cético. É melhor reprovar aqui do que no tribunal. Você NÃO edita arquivos — apenas emite o parecer para o agente principal corrigir.`,
    tools: ['file_read', 'grep', 'glob'],
    capabilities: [
      'Auditoria de REsp/RE/AREsp/HC',
      'Validação de barreiras de admissibilidade',
      'Parecer adversarial pré-protocolo',
      'Verificação de citações'
    ],
    model: 'opus' // Modelo fixo para qualidade crítica
  },

  // ========================================================================
  // SUBAGENTE: ANALISTA JURIMÉTRICO
  // ========================================================================
  'analista-jurimetrico': {
    name: 'Analista Jurimétrico',
    description: 'Análise estatística de jurisprudência e frequências históricas de provimento por órgão/relator',
    type: 'analysis',
    systemPrompt: `Você é o ANALISTA JURIMÉTRICO do escritório ROM, responsável pela camada empírica de jurimetria.

METODOLOGIA:
1. Coleta de dados públicos (DataJud, DJEN, portais oficiais)
2. Análise de frequências históricas de provimento
3. Correlações órgão/matéria/relator
4. Cálculo de taxas de sucesso por fundamento

IMPORTANTE:
- Declare SEMPRE o tamanho da amostra
- Explicite viés de seleção
- Correlação não é causa
- Passado não é futuro
- Respeite LGPD (dados públicos apenas)
- Imparcialidade do magistrado é premissa (não use para pressão)

FONTES:
- DataJud (CNJ): metadados/movimentos
- DJEN/Comunica (CNJ): ementa, dispositivo, intimações
- STJ SCON / STF: inteiro teor

RESULTADO:
- Frequência de conhecimento/provimento
- Tempo médio de tramitação
- Perfil decisório do órgão
- Base estatística para estratégia

Seus relatórios devem ser: TÉCNICOS, HONESTOS, FUNDAMENTADOS EM DADOS.`,
    tools: ['file_read', 'grep', 'web_search'],
    capabilities: [
      'Jurimetria estatística',
      'Análise de frequências de provimento',
      'Correlações órgão/matéria',
      'Base empírica para estratégia'
    ],
    model: 'sonnet'
  },

  // ========================================================================
  // SUBAGENTE: REVISOR DE FIDEDIGNIDADE
  // ========================================================================
  'revisor-fidedignidade': {
    name: 'Revisor de Fidedignidade',
    description: 'Verifica fidelidade da peça aos autos e conformidade com metodologia ROM (anti-supressão, conferibilidade)',
    type: 'audit',
    systemPrompt: `Você é o REVISOR DE FIDEDIGNIDADE do escritório ROM, guardião dos três princípios inegociáveis.

OS TRÊS PRINCÍPIOS:
1. FIDEDIGNIDADE: Toda afirmação de fato deve corresponder aos autos
2. CONFERIBILIDADE: Toda citação deve ser verificável na fonte oficial
3. ANTI-SUPRESSÃO: Nunca omitir conteúdo sem autorização expressa

SUA FUNÇÃO:
1. Verificar se cada fato mencionado está nos autos fornecidos
2. Identificar afirmações presumidas ou "completadas"
3. Confirmar que citações são verificáveis
4. Alertar sobre supressões não autorizadas

RESULTADO:
- ✅ APROVADO: Peça fiel aos autos e metodologia ROM
- ⚠️ ATENÇÃO: Riscos identificados (com sugestões)
- ❌ REPROVADO: Violações graves (corrigir antes de protocolo)

Você NÃO edita arquivos — apenas emite o parecer.`,
    tools: ['file_read', 'grep'],
    capabilities: [
      'Verificação de fidelidade aos autos',
      'Conformidade com metodologia ROM',
      'Anti-supressão de conteúdo',
      'Conferibilidade de afirmações'
    ],
    model: 'sonnet'
  },

  // ========================================================================
  // SUBAGENTE: EXTRATOR DE ACÓRDÃO
  // ========================================================================
  'extrator-acordao': {
    name: 'Extrator de Acórdão',
    description: 'Extrai dados estruturados de acórdãos (ementa, voto, ratio decidendi, tese)',
    type: 'extraction',
    systemPrompt: `Você é o EXTRATOR DE ACÓRDÃO do escritório ROM, especializado em parsing estruturado de decisões judiciais.

ELEMENTOS A EXTRAIR:
1. EMENTA: Resumo oficial da decisão
2. VOTO: Fundamentação do relator
3. ACÓRDÃO: Decisão colegiada completa
4. RATIO DECIDENDI: Razão essencial da decisão
5. TESE JURÍDICA: Princípio firmado
6. METADADOS: Tribunal, órgão, número, relator, data

FORMATO DE SAÍDA (JSON):
{
  "numero_processo": "...",
  "tribunal": "...",
  "orgao": "...",
  "relator": "...",
  "data_julgamento": "...",
  "ementa": "...",
  "ratio_decidendi": "...",
  "tese": "...",
  "dispositivo": "...",
  "tags": ["..."]
}

FINALIDADE:
- Alimentar corpus de jurimetria
- Verificação de citações
- Base de paradigmas para dissídio

Seja PRECISO e COMPLETO na extração.`,
    tools: ['file_read', 'file_write'],
    capabilities: [
      'Extração de ementa/voto/acórdão',
      'Identificação de ratio decidendi',
      'Parsing de teses jurídicas',
      'Alimentação corpus jurimetria'
    ],
    model: 'haiku' // Modelo rápido para extração
  },

  // ========================================================================
  // SUBAGENTE: LEITOR DE AUTOS
  // ========================================================================
  'leitor-autos': {
    name: 'Leitor de Autos',
    description: 'Leitura integral de processos e documentos (nunca por amostragem, OCR para escaneados)',
    type: 'analysis',
    systemPrompt: `Você é o LEITOR DE AUTOS do escritório ROM. Sua missão é ler INTEGRALMENTE o processo, NUNCA por amostragem.

REGRAS ABSOLUTAS:
1. LEITURA INTEGRAL: Ler TODO o processo, do início ao fim
2. OCR PARA ESCANEADOS: Se PDF escaneado, aplicar OCR
3. TRAVA DE INTEGRIDADE: Não omitir nenhum item após selagem
4. SEM ROLLBACK: Uma vez selado, não reduzir conteúdo sem autorização

METODOLOGIA:
1. Listar todos os documentos do processo
2. Ler cada documento na íntegra
3. Extrair ficha completa do caso:
   - Fatos (com folha/ID de origem)
   - Pedidos
   - Decisões
   - Prazos
   - Vícios aparentes
4. Selar extração (trava de integridade)

RESULTADO:
Ficha integral do caso com TODOS os elementos, referenciando origem (folha/documento).

IMPORTANTE: Análise integral é OBRIGATÓRIA. O que não foi lido não pode ser invocado.`,
    tools: ['file_read', 'grep', 'glob'],
    capabilities: [
      'Leitura integral de processos',
      'OCR de documentos escaneados',
      'Extração de ficha do caso',
      'Trava de integridade (sem rollback)'
    ],
    model: 'opus' // Modelo de alta qualidade para leitura crítica
  },

  // ========================================================================
  // SUBAGENTE: VERIFICADOR DE CITAÇÕES
  // ========================================================================
  'verificador-citacoes': {
    name: 'Verificador de Citações',
    description: 'Valida citações jurídicas em fontes oficiais (leis, súmulas, acórdãos, teses)',
    type: 'validation',
    systemPrompt: `Você é o VERIFICADOR DE CITAÇÕES do escritório ROM. Toda citação deve ser VERIFICÁVEL na fonte oficial.

TIPOS DE CITAÇÕES:
1. LEGISLAÇÃO: Leis, decretos, portarias
2. SÚMULAS: Vinculantes e ordinárias
3. ACÓRDÃOS: STF, STJ, tribunais inferiores
4. TESES: Repercussão geral, recursos repetitivos
5. PRECEDENTES: IRDR, IAC

PROCESSO:
1. Identificar todas as citações no texto
2. Buscar na fonte oficial (planalto.gov.br, portais dos tribunais)
3. Confirmar existência e correspondência
4. Marcar citações NÃO VERIFICADAS com ⚠️[NÃO VERIFICADO: ...]

RESULTADO:
- ✅ CITAÇÕES VERIFICADAS: Lista com links
- ⚠️ CITAÇÕES NÃO VERIFICADAS: Lista para revisar
- ❌ CITAÇÕES FALSAS: Bloquear arquivo (hook determinista)

IMPORTANTE: O hook 'verificar-citacoes' roda automaticamente a cada gravação e BLOQUEIA o arquivo se houver citação não verificada. Isso é proposital.

Nunca permita citações falsas ou não verificáveis.`,
    tools: ['web_search', 'file_read'],
    capabilities: [
      'Verificação de citações em fontes oficiais',
      'Hook determinista de citações',
      'Marcação de NÃO VERIFICADO',
      'Bloqueio de citações falsas'
    ],
    model: 'haiku' // Modelo rápido para verificação
  },

  // ========================================================================
  // SUBAGENTE: ORQUESTRADOR ROM
  // ========================================================================
  'orquestrador-rom': {
    name: 'Orquestrador ROM',
    description: 'Conduz pipeline ponta a ponta do projeto ROM com roteamento de modelos e pré-protocolo',
    type: 'orchestration',
    systemPrompt: `Você é o ORQUESTRADOR ROM, coordenador do pipeline completo de produção jurídica.

PIPELINE (sempre nesta ordem):
0. LEITURA INTEGRAL: skill analise-integral-documentos
1. EXTRAÇÃO: Ficha do caso
2. DIAGNÓSTICO: skill diagnostico-admissibilidade + jurimetria
3. REDAÇÃO: Peça apropriada
4. AUDITORIA: auditor + verificador + revisor

ROTEAMENTO DE MODELOS POR CUSTO:
- Operacional → Haiku ($1/$5)
- Intermediário → Sonnet ($3/$15)
- Jurídico crítico → Opus ($5/$25)

TRAVA DE QUALIDADE:
Diagnóstico, redação final, auditoria e verificação NUNCA são rebaixados.

PRÉ-PROTOCOLO OBRIGATÓRIO:
Nenhum protocolo sem skill 'protocolo-auditoria':
- Integridade ✓
- Admissibilidade ✓ (se recurso)
- Citações ✓
- Fidedignidade ✓
- Anexos ✓
- Tempestividade ✓
- AUTORIZAÇÃO HUMANA EXPRESSA ✓

MULTI-TENANT:
Estado mutável isolado por escritório/usuário em data/<escritorio>/[<usuario>/]

Você NUNCA executa peticionamento sozinho. Prepara pacote auditado e aguarda comando do advogado.`,
    tools: ['file_read', 'file_write', 'bash'],
    capabilities: [
      'Pipeline completo ROM',
      'Roteamento de modelos por custo',
      'Trava de qualidade',
      'Pré-protocolo obrigatório',
      'Multi-tenant'
    ],
    model: 'sonnet'
  }
};

// ============================================================================
// CLASSE DO GERENCIADOR DE SUBAGENTES
// ============================================================================

export class SubagentManager {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
    this.activeSubagents = new Map();
    this.conversationHistory = new Map();
    // Sistema de autoregeneração de prompts
    this.promptAdaptations = new Map(); // Adaptações dinâmicas por subagente
    this.errorPatterns = new Map(); // Padrões de erro detectados
    this.regenerationCount = new Map(); // Contador de regenerações
  }

  // Listar subagentes disponíveis
  listarSubagentes() {
    return Object.entries(SUBAGENTES).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      type: config.type
    }));
  }

  // Obter configuração de subagente
  obterSubagente(id) {
    return SUBAGENTES[id] || null;
  }

  // ============================================================================
  // SISTEMA DE AUTOREGENERAÇÃO E AUTOATUALIZAÇÃO DE PROMPTS
  // ============================================================================

  /**
   * Busca histórico recente de conversas do subagente
   * @param {string} subagentId - ID do subagente
   * @param {number} limit - Número de mensagens recentes
   * @returns {Array} Histórico recente
   */
  buscarHistoricoRecente(subagentId, limit = 10) {
    const historico = this.conversationHistory.get(subagentId) || [];
    // Retornar últimas N mensagens (pares user/assistant)
    return historico.slice(-limit);
  }

  /**
   * Analisa histórico para detectar feedback negativo do usuário
   * @param {Array} historico - Histórico de mensagens
   * @returns {Object} Feedback detectado
   */
  analisarFeedbackUsuario(historico) {
    const feedback = {
      temCorrecao: false,
      correcoes: [],
      errosApontados: [],
      palavrasChave: []
    };

    // Palavras-chave que indicam correção ou erro
    const indicadoresCorrecao = [
      'está errado', 'incorreto', 'erro', 'falha', 'não é assim',
      'na verdade', 'correto é', 'deveria ser', 'faltou', 'esqueceu',
      'não mencione', 'não faça', 'evite', 'nunca', 'sempre',
      'alucinação', 'inventou', 'não existe', 'fictício'
    ];

    // Analisar mensagens do usuário
    for (let i = 0; i < historico.length; i++) {
      const msg = historico[i];

      if (msg.role === 'user') {
        const conteudoLower = msg.content.toLowerCase();

        // Detectar indicadores de correção
        for (const indicador of indicadoresCorrecao) {
          if (conteudoLower.includes(indicador)) {
            feedback.temCorrecao = true;
            feedback.correcoes.push({
              mensagem: msg.content,
              indicador: indicador,
              contexto: i > 0 ? historico[i-1].content.substring(0, 200) : ''
            });
            break;
          }
        }

        // Detectar padrões específicos de erro
        if (conteudoLower.includes('não') && (conteudoLower.includes('faça') || conteudoLower.includes('mencione'))) {
          feedback.errosApontados.push(`Proibição: ${msg.content.substring(0, 150)}`);
        }
      }
    }

    return feedback;
  }

  /**
   * Extrai regras de correção do feedback do usuário
   * @param {Object} feedback - Feedback analisado
   * @returns {Array} Regras extraídas
   */
  extrairRegrasDeCorrecao(feedback) {
    const regras = [];

    if (!feedback.temCorrecao) {
      return regras;
    }

    // Processar cada correção
    for (const correcao of feedback.correcoes) {
      const msg = correcao.mensagem;

      // Regra: Se usuário disse "não faça X"
      if (msg.toLowerCase().includes('não') && msg.toLowerCase().includes('faça')) {
        regras.push({
          tipo: 'PROIBIÇÃO',
          descricao: `NUNCA: ${msg.substring(0, 200)}`,
          prioridade: 'ALTA'
        });
      }

      // Regra: Se usuário corrigiu informação
      if (msg.toLowerCase().includes('correto é') || msg.toLowerCase().includes('na verdade')) {
        regras.push({
          tipo: 'CORREÇÃO',
          descricao: `SEMPRE: ${msg.substring(0, 200)}`,
          prioridade: 'ALTA'
        });
      }

      // Regra: Se usuário apontou alucinação
      if (msg.toLowerCase().includes('alucinação') || msg.toLowerCase().includes('inventou') || msg.toLowerCase().includes('não existe')) {
        regras.push({
          tipo: 'ANTI-ALUCINAÇÃO',
          descricao: `BLOQUEIO CRÍTICO: ${msg.substring(0, 200)}`,
          prioridade: 'CRÍTICA'
        });
      }

      // Regra: Se usuário disse "sempre" ou "nunca"
      if (msg.toLowerCase().includes('sempre')) {
        regras.push({
          tipo: 'OBRIGAÇÃO',
          descricao: `OBRIGATÓRIO: ${msg.substring(0, 200)}`,
          prioridade: 'ALTA'
        });
      }
    }

    // Adicionar erros apontados como regras
    for (const erro of feedback.errosApontados) {
      regras.push({
        tipo: 'PROIBIÇÃO',
        descricao: erro,
        prioridade: 'ALTA'
      });
    }

    return regras;
  }

  /**
   * Adapta o system prompt dinamicamente com base em regras de correção
   * @param {string} subagentId - ID do subagente
   * @param {string} systemPromptOriginal - Prompt original
   * @param {Array} regras - Regras de adaptação
   * @returns {string} Prompt adaptado
   */
  adaptarSystemPrompt(subagentId, systemPromptOriginal, regras) {
    if (!regras || regras.length === 0) {
      return systemPromptOriginal;
    }

    console.log(`\x1b[35m🔄 Autoatualização de Prompt ATIVA: ${regras.length} regras dinâmicas detectadas\x1b[0m`);

    // Construir seção de regras dinâmicas
    let secaoRegras = '\n\n' + '='.repeat(80) + '\n';
    secaoRegras += '⚠️  REGRAS DINÂMICAS APRENDIDAS (AUTOATUALIZAÇÃO ATIVA)\n';
    secaoRegras += '='.repeat(80) + '\n\n';

    // Agrupar regras por prioridade
    const regrasCriticas = regras.filter(r => r.prioridade === 'CRÍTICA');
    const regrasAltas = regras.filter(r => r.prioridade === 'ALTA');

    // Regras CRÍTICAS primeiro
    if (regrasCriticas.length > 0) {
      secaoRegras += '🚨 REGRAS CRÍTICAS (PRIORIDADE MÁXIMA):\n\n';
      for (const regra of regrasCriticas) {
        secaoRegras += `[${regra.tipo}] ${regra.descricao}\n\n`;
      }
    }

    // Regras ALTAS
    if (regrasAltas.length > 0) {
      secaoRegras += '⚠️  REGRAS DE ALTA PRIORIDADE:\n\n';
      for (const regra of regrasAltas) {
        secaoRegras += `[${regra.tipo}] ${regra.descricao}\n\n`;
      }
    }

    secaoRegras += '='.repeat(80) + '\n';
    secaoRegras += 'ESTAS REGRAS SOBRESCREVEM QUALQUER INSTRUÇÃO ANTERIOR\n';
    secaoRegras += '='.repeat(80) + '\n\n';

    // Injetar regras no início do prompt (prioridade máxima)
    const promptAdaptado = secaoRegras + systemPromptOriginal;

    // Salvar adaptações para tracking
    if (!this.promptAdaptations.has(subagentId)) {
      this.promptAdaptations.set(subagentId, []);
    }
    this.promptAdaptations.get(subagentId).push({
      timestamp: new Date().toISOString(),
      regras: regras,
      promptLength: promptAdaptado.length
    });

    return promptAdaptado;
  }

  /**
   * Valida resposta para detectar alucinação
   * @param {string} resposta - Resposta do subagente
   * @param {string} subagentId - ID do subagente
   * @returns {Object} Resultado da validação
   */
  validarResposta(resposta, subagentId) {
    const validacao = {
      valida: true,
      problemas: [],
      score: 1.0
    };

    // Validação específica para jurisprudência (anti-alucinação crítico)
    if (subagentId === 'jurisprudencia') {
      // Verificar se há números de processo sem formato correto
      const numerosProcesso = resposta.match(/processo\s+n[°º]?\s*[\d.-]+/gi) || [];

      for (const num of numerosProcesso) {
        // Formato esperado: NNNNNNN-DD.AAAA.J.TR.OOOO
        const temFormatoCorreto = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(num);

        if (!temFormatoCorreto) {
          validacao.valida = false;
          validacao.problemas.push({
            tipo: 'FORMATO_PROCESSO_INVALIDO',
            descricao: `Número de processo com formato suspeito: ${num}`,
            gravidade: 'ALTA'
          });
          validacao.score -= 0.3;
        }
      }

      // Verificar se há citações sem fonte
      const temCitacoes = resposta.includes('STF') || resposta.includes('STJ') ||
                          resposta.includes('Tribunal') || resposta.includes('Acórdão');
      const temNumeroProcesso = numerosProcesso.length > 0;

      if (temCitacoes && !temNumeroProcesso) {
        validacao.valida = false;
        validacao.problemas.push({
          tipo: 'CITACAO_SEM_FONTE',
          descricao: 'Citação de jurisprudência sem número de processo/acórdão',
          gravidade: 'CRÍTICA'
        });
        validacao.score -= 0.5;
      }

      // Detectar frases genéricas suspeitas
      const frasesGenericas = [
        'segundo jurisprudência pacífica',
        'conforme entendimento consolidado',
        'diversos precedentes',
        'inúmeros julgados'
      ];

      for (const frase of frasesGenericas) {
        if (resposta.toLowerCase().includes(frase.toLowerCase()) && !temNumeroProcesso) {
          validacao.problemas.push({
            tipo: 'FRASE_GENERICA_SUSPEITA',
            descricao: `Frase genérica sem citação concreta: "${frase}"`,
            gravidade: 'MÉDIA'
          });
          validacao.score -= 0.2;
        }
      }
    }

    // Validação geral: resposta muito curta
    if (resposta.length < 100) {
      validacao.problemas.push({
        tipo: 'RESPOSTA_MUITO_CURTA',
        descricao: `Resposta tem apenas ${resposta.length} caracteres`,
        gravidade: 'BAIXA'
      });
      validacao.score -= 0.1;
    }

    // Validação geral: resposta suspeitamente repetitiva
    const palavras = resposta.toLowerCase().split(/\s+/);
    const palavrasUnicas = new Set(palavras);
    const taxaRepet = palavrasUnicas.size / palavras.length;

    if (taxaRepet < 0.3) {
      validacao.problemas.push({
        tipo: 'RESPOSTA_REPETITIVA',
        descricao: `Taxa de repetição suspeita: ${(taxaRepet * 100).toFixed(1)}%`,
        gravidade: 'MÉDIA'
      });
      validacao.score -= 0.15;
    }

    // Ajustar score final
    validacao.score = Math.max(0, Math.min(1, validacao.score));

    return validacao;
  }

  /**
   * Regenera prompt após detecção de problema
   * @param {string} subagentId - ID do subagente
   * @param {Object} validacao - Resultado da validação
   * @returns {Promise<Array>} Novas regras geradas
   */
  async regenerarPromptComBloqueio(subagentId, validacao) {
    console.log(`\x1b[31m🔴 BLOQUEIO ANTI-ALUCINAÇÃO ATIVADO para ${subagentId}\x1b[0m`);
    console.log(`\x1b[33m   Problemas detectados: ${validacao.problemas.length}\x1b[0m`);

    const novasRegras = [];

    // Incrementar contador de regeneração
    const contagem = (this.regenerationCount.get(subagentId) || 0) + 1;
    this.regenerationCount.set(subagentId, contagem);

    // Gerar regras baseadas nos problemas detectados
    for (const problema of validacao.problemas) {
      let regra = null;

      switch (problema.tipo) {
        case 'FORMATO_PROCESSO_INVALIDO':
          regra = {
            tipo: 'ANTI-ALUCINAÇÃO',
            descricao: `BLOQUEIO CRÍTICO: NUNCA invente números de processo. Se não tiver número correto no formato NNNNNNN-DD.AAAA.J.TR.OOOO, retorne "❌ NENHUM RESULTADO LOCALIZADO".`,
            prioridade: 'CRÍTICA'
          };
          break;

        case 'CITACAO_SEM_FONTE':
          regra = {
            tipo: 'ANTI-ALUCINAÇÃO',
            descricao: `BLOQUEIO CRÍTICO: NUNCA cite jurisprudência sem número de processo ou acórdão. Transcrição literal obrigatória.`,
            prioridade: 'CRÍTICA'
          };
          break;

        case 'FRASE_GENERICA_SUSPEITA':
          regra = {
            tipo: 'ANTI-ALUCINAÇÃO',
            descricao: `PROIBIDO usar frases genéricas como "jurisprudência pacífica" sem citação concreta com número de processo.`,
            prioridade: 'ALTA'
          };
          break;

        case 'RESPOSTA_MUITO_CURTA':
          regra = {
            tipo: 'QUALIDADE',
            descricao: `Respostas devem ter no mínimo 200 caracteres com conteúdo substancial.`,
            prioridade: 'ALTA'
          };
          break;

        case 'RESPOSTA_REPETITIVA':
          regra = {
            tipo: 'QUALIDADE',
            descricao: `Evite repetições excessivas. Cada parágrafo deve trazer informação nova.`,
            prioridade: 'ALTA'
          };
          break;
      }

      if (regra) {
        novasRegras.push(regra);
      }
    }

    // Salvar padrões de erro
    if (!this.errorPatterns.has(subagentId)) {
      this.errorPatterns.set(subagentId, []);
    }
    this.errorPatterns.get(subagentId).push({
      timestamp: new Date().toISOString(),
      validacao: validacao,
      regrasGeradas: novasRegras.length
    });

    console.log(`\x1b[35m🔄 ${novasRegras.length} novas regras geradas automaticamente (Regeneração #${contagem})\x1b[0m\n`);

    return novasRegras;
  }

  // Invocar subagente com autoregeneração e autoatualização
  async invocarSubagente(subagentId, prompt, context = {}) {
    const subagent = SUBAGENTES[subagentId];

    if (!subagent) {
      throw new Error(`Subagente não encontrado: ${subagentId}`);
    }

    // ========================================================================
    // FASE 1: BUSCAR HISTÓRICO RECENTE E ANALISAR FEEDBACK
    // ========================================================================

    console.log(`\x1b[36m🔍 Analisando histórico recente de ${subagentId}...\x1b[0m`);

    // Buscar histórico recente automaticamente
    const historicoRecente = this.buscarHistoricoRecente(subagentId, 10);

    // Analisar feedback do usuário
    const feedback = this.analisarFeedbackUsuario(historicoRecente);

    // Extrair regras de correção se houver feedback
    let regrasCorrecao = [];
    if (feedback.temCorrecao) {
      console.log(`\x1b[33m⚠️  Feedback negativo detectado no histórico! Adaptando comportamento...\x1b[0m`);
      regrasCorrecao = this.extrairRegrasDeCorrecao(feedback);
    }

    // Adicionar regras de erros anteriores se houver
    const padroesErro = this.errorPatterns.get(subagentId) || [];
    if (padroesErro.length > 0) {
      console.log(`\x1b[35m🔄 ${padroesErro.length} padrões de erro anteriores detectados. Aplicando correções...\x1b[0m`);

      // Adicionar regras das regenerações anteriores
      for (const adaptacao of (this.promptAdaptations.get(subagentId) || [])) {
        if (adaptacao.regras) {
          regrasCorrecao.push(...adaptacao.regras);
        }
      }
    }

    // ========================================================================
    // FASE 2: ADAPTAR SYSTEM PROMPT DINAMICAMENTE
    // ========================================================================

    let systemPromptFinal = subagent.systemPrompt;

    if (regrasCorrecao.length > 0) {
      systemPromptFinal = this.adaptarSystemPrompt(subagentId, subagent.systemPrompt, regrasCorrecao);
    } else {
      console.log(`\x1b[32m✓ Nenhuma adaptação necessária. Usando prompt padrão.\x1b[0m`);
    }

    // ========================================================================
    // FASE 3: CONSTRUIR MENSAGENS COM HISTÓRICO AUTOMÁTICO
    // ========================================================================

    const messages = [];

    // IMPORTANTE: Usar histórico automaticamente (corrige problema da auditoria)
    if (historicoRecente.length > 0 && !context.noHistory) {
      console.log(`\x1b[36m📚 Injetando ${historicoRecente.length} mensagens de contexto histórico\x1b[0m`);
      messages.push(...historicoRecente);
    }

    // Adicionar contexto adicional se fornecido
    if (context.previousMessages) {
      messages.push(...context.previousMessages);
    }

    // Adicionar prompt atual
    messages.push({
      role: 'user',
      content: prompt
    });

    // Determinar se deve usar pensamento estendido (Extended Thinking)
    const useExtendedThinking = context.enableThinking ||
      subagentId === 'analise-processual' ||
      subagentId === 'prazos';

    // ========================================================================
    // FASE 4: CONFIGURAR E EXECUTAR CHAMADA À API
    // ========================================================================

    const apiParams = {
      model: SUBAGENT_CONFIG.model,
      max_tokens: SUBAGENT_CONFIG.maxTokens,
      system: systemPromptFinal, // ← Prompt adaptado dinamicamente
      messages
    };

    // Adicionar Extended Thinking se habilitado
    if (useExtendedThinking) {
      apiParams.thinking = {
        type: 'enabled',
        budget_tokens: SUBAGENT_CONFIG.thinkingBudget
      };
      console.log(`\x1b[36m⚡ Claude 3.7 Sonnet com Raciocínio Avançado ATIVO (${SUBAGENT_CONFIG.thinkingBudget} tokens)\x1b[0m`);
    }

    try {
      // Chamar API com modelo Claude 3.7 Sonnet
      const response = await this.client.messages.create(apiParams);

      // Extrair resposta
      const resposta = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // ========================================================================
      // FASE 5: VALIDAR RESPOSTA (ANTI-ALUCINAÇÃO)
      // ========================================================================

      console.log(`\x1b[36m🔍 Validando resposta com detector anti-alucinação...\x1b[0m`);
      const validacao = this.validarResposta(resposta, subagentId);

      if (!validacao.valida && validacao.score < 0.5) {
        console.log(`\x1b[31m⚠️  VALIDAÇÃO FALHOU! Score: ${validacao.score.toFixed(2)}\x1b[0m`);

        // Regenerar prompt automaticamente
        const novasRegras = await this.regenerarPromptComBloqueio(subagentId, validacao);

        // Tentar novamente com prompt regenerado
        if (novasRegras.length > 0) {
          console.log(`\x1b[35m🔄 Tentando novamente com prompt autorregenerado...\x1b[0m\n`);

          const systemPromptRegenerado = this.adaptarSystemPrompt(
            subagentId,
            subagent.systemPrompt,
            [...regrasCorrecao, ...novasRegras]
          );

          const responseRegenerada = await this.client.messages.create({
            ...apiParams,
            system: systemPromptRegenerado
          });

          const respostaRegenerada = responseRegenerada.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');

          // Validar novamente
          const validacaoRegenerada = this.validarResposta(respostaRegenerada, subagentId);

          console.log(`\x1b[32m✓ Resposta regenerada. Novo score: ${validacaoRegenerada.score.toFixed(2)}\x1b[0m\n`);

          // Usar resposta regenerada
          const respostaFinal = respostaRegenerada;

          // Salvar no histórico
          if (!this.conversationHistory.has(subagentId)) {
            this.conversationHistory.set(subagentId, []);
          }
          this.conversationHistory.get(subagentId).push(
            { role: 'user', content: prompt },
            { role: 'assistant', content: respostaFinal }
          );

          return {
            subagent: subagent.name,
            type: subagent.type,
            response: respostaFinal,
            tokens: responseRegenerada.usage,
            model: SUBAGENT_CONFIG.model,
            regenerated: true,
            validationScore: validacaoRegenerada.score
          };
        }
      } else {
        console.log(`\x1b[32m✓ Validação passou. Score: ${validacao.score.toFixed(2)}\x1b[0m\n`);
      }

      // ========================================================================
      // FASE 6: SALVAR NO HISTÓRICO
      // ========================================================================

      if (!this.conversationHistory.has(subagentId)) {
        this.conversationHistory.set(subagentId, []);
      }
      this.conversationHistory.get(subagentId).push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: resposta }
      );

      return {
        subagent: subagent.name,
        type: subagent.type,
        response: resposta,
        tokens: response.usage,
        model: SUBAGENT_CONFIG.model,
        validationScore: validacao.score,
        adaptedPrompt: regrasCorrecao.length > 0
      };

    } catch (error) {
      // SISTEMA DE FALLBACK REGENERATIVO
      console.log(`\x1b[33m⚠️  Claude 3.7 Sonnet falhou ou timeout. Ativando fallback regenerativo...\x1b[0m`);
      console.log(`\x1b[2m   Erro: ${error.message}\x1b[0m`);
      console.log(`\x1b[36m🔄 Tentando com modelo estável: ${SUBAGENT_CONFIG.fallbackModel}\x1b[0m`);

      try {
        // Tentar com modelo de fallback (sem Extended Thinking)
        const fallbackResponse = await this.client.messages.create({
          model: SUBAGENT_CONFIG.fallbackModel,
          max_tokens: SUBAGENT_CONFIG.maxTokens,
          system: subagent.systemPrompt,
          messages
        });

        const resposta = fallbackResponse.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        // Salvar no histórico
        if (!this.conversationHistory.has(subagentId)) {
          this.conversationHistory.set(subagentId, []);
        }
        this.conversationHistory.get(subagentId).push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: resposta }
        );

        console.log(`\x1b[32m✓ Fallback bem-sucedido com ${SUBAGENT_CONFIG.fallbackModel}\x1b[0m`);
        console.log(`\x1b[33m💡 Dica: Para modelos ainda mais robustos, verifique o painel Anthropic\x1b[0m\n`);

        return {
          subagent: subagent.name,
          type: subagent.type,
          response: resposta,
          tokens: fallbackResponse.usage,
          model: SUBAGENT_CONFIG.fallbackModel,
          fallback: true
        };

      } catch (fallbackError) {
        // Se fallback também falhar, lançar erro
        console.log(`\x1b[31m✗ Fallback também falhou: ${fallbackError.message}\x1b[0m`);
        console.log(`\x1b[33m⚠️  Recomendação: Verifique modelos disponíveis no painel Anthropic\x1b[0m`);
        throw new Error(`Falha na invocação do subagente após fallback: ${fallbackError.message}`);
      }
    }
  }

  // Executar workflow de subagentes
  async executarWorkflow(workflowId, input, onProgress = null) {
    const workflows = {
      'analise-completa': [
        { agent: 'extrator', action: 'Extraindo processo' },
        { agent: 'analise-processual', action: 'Analisando processo' },
        { agent: 'resumo-executivo', action: 'Gerando resumo executivo' },
        { agent: 'jurisprudencia', action: 'Pesquisando jurisprudência' },
        { agent: 'leading-case', action: 'Identificando leading cases' },
        { agent: 'prazos', action: 'Verificando prazos' }
      ],
      'redacao-civel': [
        { agent: 'analise-processual', action: 'Analisando caso' },
        { agent: 'jurisprudencia', action: 'Pesquisando fundamentação' },
        { agent: 'redator-civel', action: 'Redigindo peça' },
        { agent: 'revisor-portugues', action: 'Revisando português' }
      ],
      'redacao-criminal': [
        { agent: 'analise-processual', action: 'Analisando caso' },
        { agent: 'jurisprudencia', action: 'Pesquisando fundamentação' },
        { agent: 'redator-criminal', action: 'Redigindo peça' },
        { agent: 'revisor-portugues', action: 'Revisando português' }
      ]
    };

    const workflow = workflows[workflowId];
    if (!workflow) {
      throw new Error(`Workflow não encontrado: ${workflowId}`);
    }

    const results = [];
    let currentContext = input;

    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];

      if (onProgress) {
        onProgress({
          step: i + 1,
          total: workflow.length,
          agent: step.agent,
          action: step.action
        });
      }

      const result = await this.invocarSubagente(
        step.agent,
        `${step.action}:\n\n${currentContext}`,
        { previousResults: results }
      );

      results.push({
        step: i + 1,
        agent: step.agent,
        action: step.action,
        result: result.response
      });

      // Usar resultado como contexto para próximo passo
      currentContext = result.response;
    }

    return {
      workflow: workflowId,
      steps: results,
      finalResult: currentContext
    };
  }

  // Limpar histórico de subagente
  limparHistorico(subagentId = null) {
    if (subagentId) {
      this.conversationHistory.delete(subagentId);
    } else {
      this.conversationHistory.clear();
    }
  }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  SUBAGENTES,
  SubagentManager
};
