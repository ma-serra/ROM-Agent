#!/usr/bin/env node

/**
 * ROM CLI Advanced - Interface de Linha de Comando Completa
 * Com suporte a todos os sinalizadores, subagentes e workflows
 */

import readline from 'readline';
import https from 'https';
import { spawn } from 'child_process';
import { ROMAgent, CONFIG, TOOLS, processarFerramenta } from './index.js';
import { SubagentManager, SUBAGENTES } from './modules/subagents.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportarResultado, validarFormato, normalizarFormato } from './utils/output-exporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ============================================================================
// CONSTANTES E CONFIGURAÇÃO
// ============================================================================

const VERSION = '2.0.0';

const CORES = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

function log(cor, texto) {
  console.log(`${cor}${texto}${CORES.reset}`);
}

function parseArgs(args) {
  const parsed = {
    command: null,
    subcommand: null,
    flags: {},
    positional: []
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        parsed.flags[key] = nextArg;
        i += 2;
      } else {
        parsed.flags[key] = true;
        i++;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        parsed.flags[key] = nextArg;
        i += 2;
      } else {
        parsed.flags[key] = true;
        i++;
      }
    } else {
      if (!parsed.command) {
        parsed.command = arg;
      } else if (!parsed.subcommand) {
        parsed.subcommand = arg;
      } else {
        parsed.positional.push(arg);
      }
      i++;
    }
  }

  return parsed;
}

// ============================================================================
// BANNER E AJUDA
// ============================================================================

function exibirBanner() {
  console.log(`
${CORES.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ${CORES.bright}${CORES.yellow}██████╗  ██████╗ ███╗   ███╗${CORES.reset}${CORES.cyan}                              ║
║   ${CORES.bright}${CORES.yellow}██╔══██╗██╔═══██╗████╗ ████║${CORES.reset}${CORES.cyan}                              ║
║   ${CORES.bright}${CORES.yellow}██████╔╝██║   ██║██╔████╔██║${CORES.reset}${CORES.cyan}                              ║
║   ${CORES.bright}${CORES.yellow}██╔══██╗██║   ██║██║╚██╔╝██║${CORES.reset}${CORES.cyan}                              ║
║   ${CORES.bright}${CORES.yellow}██║  ██║╚██████╔╝██║ ╚═╝ ██║${CORES.reset}${CORES.cyan}                              ║
║   ${CORES.bright}${CORES.yellow}╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝${CORES.reset}${CORES.cyan}                              ║
║                                                              ║
║   ${CORES.white}Redator de Obras Magistrais v${VERSION}${CORES.cyan}                       ║
║   ${CORES.dim}Agente de IA para Redação de Peças Jurídicas${CORES.reset}${CORES.cyan}              ║
║   ${CORES.dim}Clone do Claude AI Reference Implementation${CORES.reset}${CORES.cyan}               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${CORES.reset}
`);
}

function exibirAjuda() {
  console.log(`
${CORES.cyan}${CORES.bright}USO:${CORES.reset}
  rom [comando] [opções] [argumentos]

${CORES.cyan}${CORES.bright}COMANDOS:${CORES.reset}
  ${CORES.green}chat${CORES.reset}         Iniciar chat interativo com o ROM
  ${CORES.green}status${CORES.reset}       Verificar saúde do sistema (API, PostgreSQL, Redis)
  ${CORES.green}extrair${CORES.reset}      Extrair processo de tribunais (esaj|pje|projudi)
  ${CORES.green}analisar${CORES.reset}     Analisar processo jurídico
  ${CORES.green}resumo${CORES.reset}       Gerar resumo executivo (Camada 1, 2 ou 3)
  ${CORES.green}redigir${CORES.reset}      Redigir peça jurídica
  ${CORES.green}pesquisar${CORES.reset}    Pesquisar jurisprudência
  ${CORES.green}revisar${CORES.reset}      Revisar português jurídico
  ${CORES.green}contrato${CORES.reset}     Elaborar contrato
  ${CORES.green}agents${CORES.reset}       Gerenciar subagentes
  ${CORES.green}workflow${CORES.reset}     Executar workflow completo
  ${CORES.green}config${CORES.reset}       Gerenciar configurações

${CORES.cyan}${CORES.bright}COMANDOS ROM-COMPLETO (PROJETO INTEGRADO):${CORES.reset}
  ${CORES.green}diagnostico${CORES.reset}  Diagnóstico de admissibilidade de recursos
  ${CORES.green}jurimetria${CORES.reset}   Análise estatística de jurisprudência
  ${CORES.green}auditar${CORES.reset}      Auditoria pré-protocolo (3 validadores)
  ${CORES.green}pipeline${CORES.reset}     Pipeline ROM completo (5 etapas)

${CORES.cyan}${CORES.bright}FLAGS GLOBAIS:${CORES.reset}
  ${CORES.yellow}-h, --help${CORES.reset}              Exibe ajuda
  ${CORES.yellow}-v, --version${CORES.reset}           Exibe versão
  ${CORES.yellow}-V, --verbose${CORES.reset}           Modo verboso
  ${CORES.yellow}-q, --quiet${CORES.reset}             Modo silencioso
  ${CORES.yellow}-m, --model${CORES.reset} <modelo>    Modelo (sonnet|opus|haiku)
  ${CORES.yellow}-t, --max-tokens${CORES.reset} <n>    Máximo de tokens
  ${CORES.yellow}-o, --output${CORES.reset} <arquivo>  Arquivo de saída
  ${CORES.yellow}-f, --format${CORES.reset} <formato>  Formato (md|pdf|docx|html)

${CORES.cyan}${CORES.bright}FLAGS DE AGENTE:${CORES.reset}
  ${CORES.yellow}-a, --agent${CORES.reset} <nome>      Subagente específico
  ${CORES.yellow}-w, --workflow${CORES.reset} <nome>   Workflow a executar
  ${CORES.yellow}-l, --camada${CORES.reset} <1|2|3>    Camada do resumo

${CORES.cyan}${CORES.bright}FLAGS DE DOCUMENTO:${CORES.reset}
  ${CORES.yellow}-p, --tipo-peca${CORES.reset} <tipo>  Tipo de peça jurídica
  ${CORES.yellow}--timbrado${CORES.reset}              Incluir papel timbrado
  ${CORES.yellow}--tribunal${CORES.reset} <sigla>      Tribunal para pesquisa

${CORES.cyan}${CORES.bright}SUBAGENTES DISPONÍVEIS:${CORES.reset}
  ${CORES.dim}ORIGINAIS:${CORES.reset}
  analise-processual    Análise exaustiva de processos
  resumo-executivo      Resumos em 3 camadas
  jurisprudencia        Pesquisa de jurisprudência
  leading-case          Análise de precedentes
  prequestionamento     Elaboração de prequestionamento
  prazos                Análise de prescrição/decadência
  redator-civel         Redação de peças cíveis
  redator-criminal      Redação de peças criminais
  redator-trabalhista   Redação de peças trabalhistas
  contratos             Elaboração de contratos
  revisor-portugues     Revisão de português
  extrator              Extração de PDFs
  calculista            Cálculos judiciais

  ${CORES.dim}ROM-COMPLETO (INTEGRADOS):${CORES.reset}
  auditor-admissibilidade  Auditoria de barreiras de admissibilidade
  analista-jurimetrico     Análise estatística de jurisprudência
  revisor-fidedignidade    Verificação de fidelidade aos autos
  extrator-acordao         Extração estruturada de acórdãos
  leitor-autos             Leitura integral de processos
  verificador-citacoes     Validação de citações em fontes oficiais
  orquestrador-rom         Pipeline ROM ponta a ponta

${CORES.cyan}${CORES.bright}WORKFLOWS DISPONÍVEIS:${CORES.reset}
  analise-completa      Pipeline completo de análise
  redacao-civel         Pipeline de redação cível
  redacao-criminal      Pipeline de redação criminal

${CORES.cyan}${CORES.bright}EXEMPLOS:${CORES.reset}
  ${CORES.dim}# Chat interativo${CORES.reset}
  rom chat

  ${CORES.dim}# Verificar saúde do sistema${CORES.reset}
  rom status

  ${CORES.dim}# Extrair processo do PJe${CORES.reset}
  rom extrair pje 0001234-56.2023.4.01.3400

  ${CORES.dim}# Extrair processo do ESAJ${CORES.reset}
  rom extrair esaj 1234567-89.2023.8.26.0100

  ${CORES.dim}# Analisar processo com resumo Camada 3${CORES.reset}
  rom analisar processo.pdf --camada 3

  ${CORES.dim}# Redigir apelação e salvar como DOCX${CORES.reset}
  rom redigir --tipo-peca apelacao -o apelacao.docx

  ${CORES.dim}# Pesquisar jurisprudência no STJ${CORES.reset}
  rom pesquisar "dano moral" --tribunal STJ

  ${CORES.dim}# Usar subagente específico${CORES.reset}
  rom --agent resumo-executivo --camada 3

  ${CORES.dim}# Executar workflow completo${CORES.reset}
  rom workflow analise-completa processo.pdf

  ${CORES.dim}# Diagnóstico de admissibilidade${CORES.reset}
  rom diagnostico minuta_resp.docx

  ${CORES.dim}# Análise jurimétrica${CORES.reset}
  rom jurimetria "dano moral STJ 2024"

  ${CORES.dim}# Auditoria pré-protocolo${CORES.reset}
  rom auditar peca_final.docx --output auditoria.md

  ${CORES.dim}# Pipeline ROM completo${CORES.reset}
  rom pipeline processo.pdf --tipo recurso-especial --output resultado.md

${CORES.cyan}${CORES.bright}COMANDOS INTERATIVOS:${CORES.reset}
  /ajuda       Exibe ajuda
  /limpar      Limpa histórico
  /agents      Lista subagentes
  /agent <n>   Usa subagente
  /workflow    Executa workflow
  /pecas       Lista peças jurídicas
  /prompts     Lista prompts
  /sair        Encerra
`);
}

function exibirVersao() {
  console.log(`ROM - Redator de Obras Magistrais v${VERSION}`);
  console.log('Clone do Claude AI Reference Implementation');
  console.log('Ferramentas SDK: 41 | Subagentes: 20 (13 originais + 7 ROM-Completo) | Workflows: 3');
}

// ============================================================================
// CLASSE CLI
// ============================================================================

class ROMCLI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.agent = new ROMAgent(apiKey);
    this.subagentManager = new SubagentManager(apiKey);
    this.currentAgent = null;
    this.verbose = false;
  }

  // Processa salvamento de resultado (--output e --format)
  async processarSalvamentoResultado(resultado, flags, comando) {
    if (!flags.output && !flags.o) {
      // Sem flag de output, não salvar
      return;
    }

    const outputPath = flags.output || flags.o;
    const format = normalizarFormato(flags.format || flags.f || 'md');

    // Validar formato
    if (!validarFormato(format)) {
      console.log(`${CORES.yellow}⚠ Formato inválido: ${format}. Usando MD como padrão.${CORES.reset}`);
    }

    // Extrair conteúdo textual do resultado
    let conteudo = '';
    if (typeof resultado === 'string') {
      conteudo = resultado;
    } else if (resultado?.response) {
      conteudo = resultado.response;
    } else if (resultado?.content?.[0]?.text) {
      conteudo = resultado.content[0].text;
    } else {
      console.log(`${CORES.red}✗ Não foi possível extrair conteúdo do resultado${CORES.reset}\n`);
      return;
    }

    // Exportar resultado
    try {
      await exportarResultado({
        conteudo,
        outputPath,
        format,
        titulo: `Resultado: ${comando}`,
        comando: `rom ${comando}`,
        metadata: {
          palavrasChave: [comando]
        }
      });
    } catch (error) {
      console.log(`${CORES.red}✗ Erro ao salvar arquivo: ${error.message}${CORES.reset}\n`);
    }
  }

  // Lista subagentes
  listarAgents() {
    console.log(`\n${CORES.cyan}${CORES.bright}SUBAGENTES DISPONÍVEIS:${CORES.reset}\n`);

    const subagents = this.subagentManager.listarSubagentes();

    subagents.forEach((agent, index) => {
      console.log(`  ${CORES.green}${index + 1}. ${agent.name}${CORES.reset}`);
      console.log(`     ${CORES.dim}ID: ${agent.id}${CORES.reset}`);
      console.log(`     ${CORES.dim}${agent.description}${CORES.reset}`);
      console.log(`     ${CORES.yellow}Tipo: ${agent.type}${CORES.reset}\n`);
    });
  }

  // Lista workflows
  listarWorkflows() {
    console.log(`\n${CORES.cyan}${CORES.bright}WORKFLOWS DISPONÍVEIS:${CORES.reset}\n`);

    const workflows = [
      {
        id: 'analise-completa',
        name: 'Análise Completa',
        description: 'Pipeline completo: extração → análise → resumo → jurisprudência → leading cases → prazos',
        steps: 6
      },
      {
        id: 'redacao-civel',
        name: 'Redação Cível',
        description: 'Pipeline de redação: análise → pesquisa → redação → revisão',
        steps: 4
      },
      {
        id: 'redacao-criminal',
        name: 'Redação Criminal',
        description: 'Pipeline de redação criminal: análise → pesquisa → redação → revisão',
        steps: 4
      }
    ];

    workflows.forEach((wf, index) => {
      console.log(`  ${CORES.green}${index + 1}. ${wf.name}${CORES.reset}`);
      console.log(`     ${CORES.dim}ID: ${wf.id}${CORES.reset}`);
      console.log(`     ${CORES.dim}${wf.description}${CORES.reset}`);
      console.log(`     ${CORES.yellow}Etapas: ${wf.steps}${CORES.reset}\n`);
    });
  }

  // Lista peças jurídicas
  listarPecas() {
    console.log(`\n${CORES.cyan}${CORES.bright}PEÇAS JURÍDICAS DISPONÍVEIS:${CORES.reset}\n`);

    const categorias = {
      'CÍVEIS': [
        'peticao_inicial', 'contestacao', 'replica', 'impugnacao',
        'embargos_declaracao', 'apelacao', 'agravo_instrumento',
        'recurso_especial', 'recurso_extraordinario', 'mandado_seguranca'
      ],
      'CRIMINAIS': [
        'habeas_corpus', 'resposta_acusacao', 'alegacoes_finais',
        'memoriais', 'apelacao_criminal', 'revisao_criminal',
        'rese', 'embargos_infringentes'
      ],
      'TRABALHISTAS': [
        'reclamacao_trabalhista', 'contestacao_trabalhista',
        'recurso_ordinario', 'agravo_peticao', 'recurso_revista'
      ],
      'EXTRAPROCESSUAIS': [
        'contrato_social', 'contrato_honorarios', 'procuracao',
        'substabelecimento', 'notificacao', 'parecer'
      ]
    };

    Object.entries(categorias).forEach(([cat, pecas]) => {
      console.log(`  ${CORES.green}${cat}:${CORES.reset}`);
      pecas.forEach(p => console.log(`    ${CORES.dim}- ${p}${CORES.reset}`));
      console.log();
    });
  }

  // Executa workflow
  async executarWorkflow(workflowId, input) {
    console.log(`\n${CORES.cyan}Executando workflow: ${workflowId}${CORES.reset}\n`);

    try {
      const result = await this.subagentManager.executarWorkflow(
        workflowId,
        input,
        (progress) => {
          console.log(`${CORES.yellow}[${progress.step}/${progress.total}] ${progress.action}...${CORES.reset}`);
        }
      );

      console.log(`\n${CORES.green}✓ Workflow concluído!${CORES.reset}\n`);
      console.log(result.finalResult);

      return result;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro no workflow: ${error.message}${CORES.reset}`);
    }
  }

  // Verifica status do sistema
  async verificarStatus() {
    console.log(`\n${CORES.cyan}${CORES.bright}Verificando saúde do sistema...${CORES.reset}\n`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const req = https.get('https://iarom.com.br/api/health', {
        timeout: 10000,
        headers: { 'User-Agent': 'ROM-CLI/2.0' }
      }, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;

          try {
            const healthData = JSON.parse(body);

            // Exibir tabela de status
            console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
            console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}STATUS DO SISTEMA ROM AGENT${CORES.reset}                          ${CORES.cyan}║${CORES.reset}`);
            console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

            // Status Geral
            const statusIcon = healthData.status === 'healthy' ? '✓' : '✗';
            const statusColor = healthData.status === 'healthy' ? CORES.green : CORES.red;
            console.log(`  ${statusColor}${statusIcon} Status Geral:${CORES.reset} ${statusColor}${healthData.status.toUpperCase()}${CORES.reset}`);
            console.log(`  ${CORES.dim}Tempo de resposta: ${responseTime}ms${CORES.reset}\n`);

            // PostgreSQL
            const pgIcon = healthData.postgres?.available ? '✓' : '✗';
            const pgColor = healthData.postgres?.available ? CORES.green : CORES.red;
            const pgStatus = healthData.postgres?.available ? 'Disponível' : 'INDISPONÍVEL';
            console.log(`  ${pgColor}${pgIcon} PostgreSQL:${CORES.reset} ${pgStatus}`);
            if (healthData.postgres?.latency !== undefined) {
              console.log(`    ${CORES.dim}Latência: ${healthData.postgres.latency}ms${CORES.reset}`);
            }

            // Redis
            const redisIcon = healthData.redis?.available ? '✓' : '✗';
            const redisColor = healthData.redis?.available ? CORES.green : CORES.red;
            const redisStatus = healthData.redis?.available ? 'Disponível' : 'INDISPONÍVEL';
            console.log(`\n  ${redisColor}${redisIcon} Redis:${CORES.reset} ${redisStatus}`);
            if (healthData.redis?.latency !== undefined) {
              console.log(`    ${CORES.dim}Latência: ${healthData.redis.latency}ms${CORES.reset}`);
            }

            // Memória
            if (healthData.memory) {
              console.log(`\n  ${CORES.blue}⚡ Memória:${CORES.reset}`);
              console.log(`    ${CORES.dim}Heap usado: ${healthData.memory.heapUsed}MB${CORES.reset}`);
              console.log(`    ${CORES.dim}Heap total: ${healthData.memory.heapTotal}MB${CORES.reset}`);
              const memPercent = ((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100).toFixed(1);
              console.log(`    ${CORES.dim}Uso: ${memPercent}%${CORES.reset}`);
            }

            // Uptime
            if (healthData.uptime !== undefined) {
              const hours = Math.floor(healthData.uptime / 3600);
              const minutes = Math.floor((healthData.uptime % 3600) / 60);
              console.log(`\n  ${CORES.magenta}⏱  Uptime:${CORES.reset} ${hours}h ${minutes}m`);
            }

            console.log();
            resolve(healthData);
          } catch (error) {
            console.log(`${CORES.red}✗ Erro ao parsear resposta JSON${CORES.reset}`);
            console.log(`${CORES.dim}Resposta recebida:${CORES.reset}\n${body}\n`);
            reject(error);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.log(`${CORES.red}✗ Timeout: Servidor não respondeu em 10 segundos${CORES.reset}\n`);
        reject(new Error('Timeout'));
      });

      req.on('error', (error) => {
        console.log(`${CORES.red}✗ Erro de conexão: ${error.message}${CORES.reset}\n`);
        reject(error);
      });

      req.end();
    });
  }

  // Extrai processo de tribunal
  async extrairProcesso(tribunal, numeroProcesso) {
    if (!tribunal || !numeroProcesso) {
      console.log(`${CORES.red}✗ Uso: rom extrair <tribunal> <numero-processo>${CORES.reset}`);
      console.log(`\n${CORES.yellow}Tribunais suportados:${CORES.reset}`);
      console.log(`  ${CORES.dim}- esaj     (e-SAJ - Tribunais de Justiça)${CORES.reset}`);
      console.log(`  ${CORES.dim}- pje      (PJe - Justiça Federal/Trabalhista)${CORES.reset}`);
      console.log(`  ${CORES.dim}- projudi  (PROJUDI - Tribunais estaduais)${CORES.reset}\n`);
      return;
    }

    const tribunalLower = tribunal.toLowerCase();
    const scraperMap = {
      'esaj': 'esaj_scraper.py',
      'pje': 'pje_scraper.py',
      'projudi': 'projudi_scraper.py'
    };

    const scraperFile = scraperMap[tribunalLower];

    if (!scraperFile) {
      console.log(`${CORES.red}✗ Tribunal não suportado: ${tribunal}${CORES.reset}`);
      console.log(`\n${CORES.yellow}Tribunais disponíveis: esaj, pje, projudi${CORES.reset}\n`);
      return;
    }

    console.log(`\n${CORES.cyan}${CORES.bright}Extraindo processo do ${tribunal.toUpperCase()}...${CORES.reset}`);
    console.log(`${CORES.dim}Número: ${numeroProcesso}${CORES.reset}\n`);

    const scraperPath = path.join(__dirname, '..', 'python-scrapers', scraperFile);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [scraperPath, numeroProcesso], {
        cwd: path.join(__dirname, '..', 'python-scrapers')
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Exibir output em tempo real
        process.stdout.write(output);
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // Exibir erros em vermelho
        process.stderr.write(`${CORES.red}${output}${CORES.reset}`);
      });

      pythonProcess.on('close', (code) => {
        console.log();

        if (code === 0) {
          console.log(`${CORES.green}✓ Extração concluída com sucesso!${CORES.reset}\n`);
          resolve({ success: true, output: stdout });
        } else {
          console.log(`${CORES.red}✗ Erro na extração (código: ${code})${CORES.reset}\n`);
          if (stderr) {
            console.log(`${CORES.yellow}Detalhes do erro:${CORES.reset}\n${stderr}\n`);
          }
          reject(new Error(`Python script exited with code ${code}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.log(`${CORES.red}✗ Erro ao executar scraper: ${error.message}${CORES.reset}`);
        console.log(`\n${CORES.yellow}Verifique se:${CORES.reset}`);
        console.log(`  ${CORES.dim}1. Python 3 está instalado (python3 --version)${CORES.reset}`);
        console.log(`  ${CORES.dim}2. Dependências instaladas (pip install -r requirements.txt)${CORES.reset}`);
        console.log(`  ${CORES.dim}3. Scraper existe em: ${scraperPath}${CORES.reset}\n`);
        reject(error);
      });
    });
  }

  // Analisa processo jurídico (e parecer como alias)
  async analisarProcesso(input, flags = {}) {
    const isParecer = flags.parecer || false;
    const titulo = isParecer ? 'PARECER JURÍDICO' : 'ANÁLISE PROCESSUAL';

    console.log(`\n${CORES.cyan}${CORES.bright}${titulo}${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom analisar <arquivo_ou_texto>${CORES.reset}`);
      console.log(`${CORES.dim}       rom parecer <arquivo_ou_texto>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom analisar processo.pdf${CORES.reset}`);
      console.log(`  ${CORES.dim}rom analisar "processo 123-45.2023.8.26.0100"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom parecer caso.txt  # Com foco em conclusões de risco${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      // Construir prompt específico
      const promptBase = isParecer
        ? `Analise o seguinte caso e emita um PARECER JURÍDICO conclusivo, com foco em RISCOS, CHANCES DE ÊXITO e RECOMENDAÇÕES ESTRATÉGICAS:\n\n${conteudo}`
        : `Analise exaustivamente o seguinte processo jurídico:\n\n${conteudo}`;

      console.log(`${CORES.yellow}⚙️  Processando com subagente: analise-processual...${CORES.reset}\n`);

      // Ativar pensamento estendido para parecer (comando complexo)
      const context = isParecer ? { enableThinking: true } : {};

      const resultado = await this.subagentManager.invocarSubagente(
        'analise-processual',
        promptBase,
        context
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}${titulo}${CORES.reset}                                    ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado se --output foi especificado
      await this.processarSalvamentoResultado(resultado.response, flags, isParecer ? 'parecer' : 'analisar');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na análise: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Gera resumo executivo em 3 camadas
  async gerarResumo(input, flags = {}) {
    const camada = parseInt(flags.camada || flags.l || '2');

    if (camada < 1 || camada > 3) {
      console.log(`${CORES.red}✗ Camada inválida. Use 1, 2 ou 3${CORES.reset}\n`);
      return;
    }

    console.log(`\n${CORES.cyan}${CORES.bright}RESUMO EXECUTIVO - CAMADA ${camada}${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom resumo <arquivo_ou_texto> --camada <1|2|3>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Camadas:${CORES.reset}`);
      console.log(`  ${CORES.dim}1 - BÁSICO:     Síntese fática + pedidos${CORES.reset}`);
      console.log(`  ${CORES.dim}2 - DENSO:      Camada 1 + jurisprudência + estratégia${CORES.reset}`);
      console.log(`  ${CORES.dim}3 - APRIMORADO: Camada 2 + prequestionamento + leading cases + riscos${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplo:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom resumo processo.pdf --camada 3${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      const prompt = `Gere um RESUMO EXECUTIVO em CAMADA ${camada} do seguinte processo:\n\n${conteudo}`;

      console.log(`${CORES.yellow}⚙️  Processando com subagente: resumo-executivo (Camada ${camada})...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'resumo-executivo',
        prompt
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}RESUMO EXECUTIVO - CAMADA ${camada}${CORES.reset}                           ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.content[0].text);
      console.log();

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro ao gerar resumo: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Redigir peça jurídica
  async redigirPeca(flags = {}, contexto = '') {
    const tipoPeca = flags['tipo-peca'] || flags.p;

    if (!tipoPeca) {
      console.log(`${CORES.red}✗ Uso: rom redigir --tipo-peca <tipo> [contexto]${CORES.reset}\n`);
      console.log(`${CORES.yellow}Tipos disponíveis:${CORES.reset}`);
      console.log(`  ${CORES.dim}CÍVEIS:       peticao_inicial, contestacao, apelacao, agravo, etc${CORES.reset}`);
      console.log(`  ${CORES.dim}CRIMINAIS:    habeas_corpus, resposta_acusacao, alegacoes_finais${CORES.reset}`);
      console.log(`  ${CORES.dim}TRABALHISTAS: reclamacao_trabalhista, recurso_ordinario${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplo:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom redigir --tipo-peca apelacao "cliente perdeu em 1ª instância"${CORES.reset}\n`);
      return;
    }

    // Determinar o redator apropriado baseado no tipo de peça
    let subagentId = 'redator-civel';
    const tipoLower = tipoPeca.toLowerCase();

    if (tipoLower.includes('criminal') || tipoLower.includes('habeas') ||
        tipoLower.includes('penal') || tipoLower.includes('rese')) {
      subagentId = 'redator-criminal';
    } else if (tipoLower.includes('trabalhista') || tipoLower.includes('reclamacao') ||
               tipoLower.includes('recurso_ordinario') || tipoLower.includes('tst')) {
      subagentId = 'redator-trabalhista';
    }

    console.log(`\n${CORES.cyan}${CORES.bright}REDAÇÃO DE PEÇA: ${tipoPeca.toUpperCase()}${CORES.reset}\n`);
    console.log(`${CORES.dim}Usando: ${subagentId}${CORES.reset}\n`);

    const prompt = `Redija uma ${tipoPeca} com base no seguinte contexto:\n\n${contexto || 'Peça padrão sem contexto específico'}`;

    try {
      console.log(`${CORES.yellow}⚙️  Redigindo com subagente: ${subagentId}...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(subagentId, prompt);

      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}PEÇA REDIGIDA: ${tipoPeca.toUpperCase()}${CORES.reset}                      ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.content[0].text);
      console.log();

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro ao redigir peça: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Pesquisa jurisprudência com anti-alucinação
  async pesquisarJurisprudencia(termo, flags = {}) {
    if (!termo) {
      console.log(`${CORES.red}✗ Uso: rom pesquisar <termo_jurisprudencial> [--tribunal <sigla>]${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom pesquisar "dano moral" --tribunal STJ${CORES.reset}`);
      console.log(`  ${CORES.dim}rom pesquisar "prescrição tributária"${CORES.reset}\n`);
      return;
    }

    const tribunal = flags.tribunal || 'TODOS';

    console.log(`\n${CORES.cyan}${CORES.bright}PESQUISA DE JURISPRUDÊNCIA${CORES.reset}\n`);
    console.log(`${CORES.dim}Termo: ${termo}${CORES.reset}`);
    console.log(`${CORES.dim}Tribunal: ${tribunal}${CORES.reset}\n`);

    // Prompt com regra ANTI-ALUCINAÇÃO IMPOSTA
    const promptComAntiAlucinacao = `REGRA CRÍTICA DE SEGURANÇA - ANTI-ALUCINAÇÃO:
Você está PROIBIDO de parafrasear, resumir ou criar ementas.
Você DEVE transcrever LITERALMENTE os blocos de texto encontrados nas buscas.
Se não encontrar resultado concreto, retorne: "❌ NENHUM RESULTADO LOCALIZADO - BUSCA VAZIA"
Se detectar discrepância de dados ou incerteza, BLOQUEIE a resposta com: "⚠️ BLOQUEIO DE SEGURANÇA: Dados inconsistentes detectados"

Pesquise jurisprudência sobre: ${termo}
${tribunal !== 'TODOS' ? `Tribunal: ${tribunal}` : 'Em todos os tribunais'}

RETORNE APENAS:
1. Tribunal/Órgão/Número do acórdão (literal)
2. Relator e Data (literal)
3. Ementa COMPLETA (transcrição literal)
4. Tese fixada (se houver - literal)

NÃO PARAFRASEIE. NÃO RESUMA. TRANSCREVA LITERALMENTE OU BLOQUEIE.`;

    try {
      console.log(`${CORES.yellow}⚙️  Pesquisando com subagente: jurisprudencia (modo anti-alucinação)...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'jurisprudencia',
        promptComAntiAlucinacao
      );

      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}JURISPRUDÊNCIA: ${termo.toUpperCase()}${CORES.reset}                    ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado se --output foi especificado
      await this.processarSalvamentoResultado(resultado.response, flags, 'pesquisar');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na pesquisa: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Gera prognóstico combinando análise + prazos
  async gerarPrognostico(caso, flags = {}) {
    if (!caso) {
      console.log(`${CORES.red}✗ Uso: rom prognostico <caso> [--output <arquivo>] [--format <md|docx>]${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplo:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom prognostico processo.pdf${CORES.reset}`);
      console.log(`  ${CORES.dim}rom prognostico "ação trabalhista de horas extras"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom prognostico processo.pdf --output prognostico.docx --format docx${CORES.reset}\n`);
      return;
    }

    console.log(`\n${CORES.cyan}${CORES.bright}PROGNÓSTICO JURÍDICO${CORES.reset}\n`);

    try {
      // Verificar se é arquivo
      let conteudo = caso;
      try {
        const stat = await fs.stat(caso);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${caso}${CORES.reset}\n`);
          conteudo = await fs.readFile(caso, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      // ETAPA 1: Análise processual (com pensamento estendido)
      console.log(`${CORES.yellow}⚙️  [1/2] Analisando caso...${CORES.reset}`);
      const analise = await this.subagentManager.invocarSubagente(
        'analise-processual',
        `Analise este caso para prognóstico de êxito:\n\n${conteudo}`,
        { enableThinking: true }
      );

      const textoAnalise = analise.response;

      // ETAPA 2: Análise de prazos e riscos (com pensamento estendido)
      console.log(`${CORES.yellow}⚙️  [2/2] Avaliando prazos e riscos...${CORES.reset}\n`);
      const prazos = await this.subagentManager.invocarSubagente(
        'prazos',
        `Com base na seguinte análise, avalie PRESCRIÇÃO, DECADÊNCIA, PRECLUSÃO e RISCOS TEMPORAIS:\n\n${textoAnalise}`,
        { enableThinking: true }
      );

      // Combinar resultados
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}PROGNÓSTICO JURÍDICO${CORES.reset}                                   ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(`${CORES.green}${CORES.bright}═══ ANÁLISE DO CASO ═══${CORES.reset}\n`);
      console.log(textoAnalise);
      console.log(`\n${CORES.yellow}${CORES.bright}═══ PRAZOS E RISCOS ═══${CORES.reset}\n`);
      console.log(prazos.response);
      console.log();

      // Combinar resultados para salvar
      const resultadoCombinado = `═══ ANÁLISE DO CASO ═══\n\n${textoAnalise}\n\n═══ PRAZOS E RISCOS ═══\n\n${prazos.response}`;

      // Salvar resultado se --output foi especificado
      await this.processarSalvamentoResultado(resultadoCombinado, flags, 'prognostico');

      return { analise, prazos };
    } catch (error) {
      console.log(`${CORES.red}✗ Erro ao gerar prognóstico: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Revisa português jurídico
  async revisarTexto(input, flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}REVISÃO DE PORTUGUÊS JURÍDICO${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom revisar <texto_ou_arquivo> [--output <arquivo>] [--format <md|docx>]${CORES.reset}\n`);
      console.log(`${CORES.yellow}Aspectos revisados:${CORES.reset}`);
      console.log(`  ${CORES.dim}- Ortografia e acentuação${CORES.reset}`);
      console.log(`  ${CORES.dim}- Concordância verbal e nominal${CORES.reset}`);
      console.log(`  ${CORES.dim}- Regência e crase${CORES.reset}`);
      console.log(`  ${CORES.dim}- Pontuação e coesão textual${CORES.reset}`);
      console.log(`  ${CORES.dim}- Estilo jurídico e latinismos${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom revisar peca.txt${CORES.reset}`);
      console.log(`  ${CORES.dim}rom revisar "A empresa não cumpriu o contrato"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom revisar peca.txt --output revisao.docx --format docx${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      const prompt = `Revise o seguinte texto jurídico aplicando as normas do português culto e do estilo jurídico formal:

${conteudo}

IMPORTANTE:
1. Identifique TODOS os erros ortográficos, gramaticais e de estilo
2. Para cada erro, explique:
   - O que está errado
   - Por que está errado (regra gramatical)
   - A correção adequada
3. Avalie a coesão, coerência e clareza do texto
4. Sugira melhorias de estilo jurídico
5. Apresente o texto corrigido ao final

Seja RIGOROSO e TÉCNICO na análise.`;

      console.log(`${CORES.yellow}⚙️  Processando com subagente: revisor-portugues...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'revisor-portugues',
        prompt
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}REVISÃO DE PORTUGUÊS JURÍDICO${CORES.reset}                          ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado se --output foi especificado
      await this.processarSalvamentoResultado(resultado.response, flags, 'revisar');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na revisão: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Elabora contratos
  async elaborarContrato(tipo, contexto = '', flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}ELABORAÇÃO DE CONTRATO${CORES.reset}\n`);

    if (!tipo) {
      console.log(`${CORES.red}✗ Uso: rom contrato <tipo_do_contrato> [contexto] [--output <arquivo>] [--format <md|docx>]${CORES.reset}\n`);
      console.log(`${CORES.yellow}Tipos de contratos disponíveis:${CORES.reset}`);
      console.log(`  ${CORES.dim}NEGÓCIOS:${CORES.reset}`);
      console.log(`    ${CORES.dim}- compra_venda, locacao, prestacao_servicos${CORES.reset}`);
      console.log(`  ${CORES.dim}SOCIETÁRIOS:${CORES.reset}`);
      console.log(`    ${CORES.dim}- sociedade, acordo_socios, franquia, distribuicao${CORES.reset}`);
      console.log(`  ${CORES.dim}PROFISSIONAIS:${CORES.reset}`);
      console.log(`    ${CORES.dim}- honorarios, nda, confidencialidade${CORES.reset}`);
      console.log(`  ${CORES.dim}IMOBILIÁRIOS:${CORES.reset}`);
      console.log(`    ${CORES.dim}- locacao_residencial, locacao_comercial${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom contrato compra_venda "Venda de veículo usado"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom contrato honorarios "Defesa cível com 20% de êxito"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom contrato nda "Confidencialidade de projeto tecnológico"${CORES.reset}\n`);
      return;
    }

    const tipoFormatado = tipo.replace(/_/g, ' ').toUpperCase();
    console.log(`${CORES.dim}Tipo de contrato: ${tipoFormatado}${CORES.reset}\n`);

    const prompt = `Elabore uma MINUTA DE CONTRATO de ${tipo.replace(/_/g, ' ')} COMPLETA e ROBUSTA.

${contexto ? `CONTEXTO ESPECÍFICO:\n${contexto}\n\n` : ''}

ESTRUTURA OBRIGATÓRIA:
1. TÍTULO E IDENTIFICAÇÃO
2. QUALIFICAÇÃO COMPLETA DAS PARTES (com campos [COMPLETAR])
3. OBJETO DO CONTRATO (claro e determinado)
4. CLÁUSULAS ESSENCIAIS:
   - Preço e forma de pagamento
   - Prazo e vigência
   - Obrigações de cada parte
   - Garantias (se aplicável)
   - Multas e penalidades
   - Hipóteses de rescisão
   - Confidencialidade (se aplicável)
   - Foro de eleição
5. CLÁUSULAS COMPLEMENTARES (conforme o tipo)
6. DISPOSIÇÕES FINAIS
7. DATA E ASSINATURAS

REQUISITOS TÉCNICOS:
- Linguagem jurídica formal e precisa
- Cláusulas numeradas sequencialmente
- Redação clara e inequívoca
- Proteção equilibrada de ambas as partes
- Conformidade com CC/2002 e legislação específica
- Campos [COMPLETAR] onde necessário personalização

Elabore o contrato COMPLETO e PRONTO PARA USO.`;

    try {
      console.log(`${CORES.yellow}⚙️  Processando com subagente: contratos...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'contratos',
        prompt
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}MINUTA DE CONTRATO: ${tipoFormatado}${CORES.reset}                ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado se --output foi especificado
      await this.processarSalvamentoResultado(resultado.response, flags, 'contrato');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na elaboração do contrato: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // === COMANDOS ROM-COMPLETO ===

  // Diagnostico de admissibilidade
  async diagnosticoAdmissibilidade(input, flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}DIAGNÓSTICO DE ADMISSIBILIDADE${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom diagnostico <arquivo_ou_minuta>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom diagnostico minuta_resp.docx${CORES.reset}`);
      console.log(`  ${CORES.dim}rom diagnostico "Minuta de recurso especial..."${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      console.log(`${CORES.yellow}⚙️  Executando auditoria de admissibilidade (Extended Thinking)...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'auditor-admissibilidade',
        conteudo,
        { enableThinking: true }
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}DIAGNÓSTICO DE ADMISSIBILIDADE${CORES.reset}                        ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado
      await this.processarSalvamentoResultado(resultado.response, flags, 'diagnostico');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro no diagnóstico: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Análise jurimétrica
  async executarJurimetria(input, flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}ANÁLISE JURIMÉTRICA${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom jurimetria <termo_ou_tribunal>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom jurimetria "dano moral STJ"${CORES.reset}`);
      console.log(`  ${CORES.dim}rom jurimetria "taxa de sucesso TJ-SP 2024" --output relatorio.md${CORES.reset}\n`);
      return;
    }

    try {
      console.log(`${CORES.yellow}⚙️  Executando análise jurimétrica (Extended Thinking)...${CORES.reset}\n`);

      const resultado = await this.subagentManager.invocarSubagente(
        'analista-jurimetrico',
        input,
        { enableThinking: true }
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}ANÁLISE JURIMÉTRICA${CORES.reset}                                   ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.response);
      console.log();

      // Salvar resultado
      await this.processarSalvamentoResultado(resultado.response, flags, 'jurimetria');

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na análise jurimétrica: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Auditoria pré-protocolo (3 agentes em paralelo)
  async auditarPeca(input, flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}AUDITORIA PRÉ-PROTOCOLO${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom auditar <arquivo_ou_peca>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom auditar minuta_final.docx${CORES.reset}`);
      console.log(`  ${CORES.dim}rom auditar "Peça jurídica completa..." --output auditoria.md${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      console.log(`${CORES.yellow}⚙️  Executando auditoria em paralelo (3 agentes)...${CORES.reset}\n`);

      // Executar 3 auditores em paralelo
      const auditorias = await Promise.allSettled([
        this.subagentManager.invocarSubagente('auditor-admissibilidade', conteudo),
        this.subagentManager.invocarSubagente('verificador-citacoes', conteudo),
        this.subagentManager.invocarSubagente('revisor-fidedignidade', conteudo)
      ]);

      const relatorioAuditoria = {
        admissibilidade: auditorias[0].status === 'fulfilled' ? auditorias[0].value.response : `❌ FALHOU: ${auditorias[0].reason?.message || 'Erro desconhecido'}`,
        citacoes: auditorias[1].status === 'fulfilled' ? auditorias[1].value.response : `❌ FALHOU: ${auditorias[1].reason?.message || 'Erro desconhecido'}`,
        fidedignidade: auditorias[2].status === 'fulfilled' ? auditorias[2].value.response : `❌ FALHOU: ${auditorias[2].reason?.message || 'Erro desconhecido'}`,
        aprovado: auditorias.every(a => a.status === 'fulfilled' &&
                  !a.value.response.toLowerCase().includes('reprovado') &&
                  !a.value.response.toLowerCase().includes('não verificado'))
      };

      // Exibir resultados
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}RELATÓRIO DE AUDITORIA PRÉ-PROTOCOLO${CORES.reset}                  ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(`${CORES.yellow}📋 ADMISSIBILIDADE:${CORES.reset}\n${relatorioAuditoria.admissibilidade}\n`);
      console.log(`${CORES.yellow}🔗 CITAÇÕES:${CORES.reset}\n${relatorioAuditoria.citacoes}\n`);
      console.log(`${CORES.yellow}📄 FIDEDIGNIDADE:${CORES.reset}\n${relatorioAuditoria.fidedignidade}\n`);

      // Veredicto final
      if (relatorioAuditoria.aprovado) {
        console.log(`${CORES.green}${CORES.bright}✅ APROVADO PARA PROTOCOLO${CORES.reset}\n`);
      } else {
        console.log(`${CORES.red}${CORES.bright}❌ REPROVADO - CORRIGIR ANTES DE PROTOCOLAR${CORES.reset}\n`);
      }

      // Salvar resultado
      const relatorioTexto = `# RELATÓRIO DE AUDITORIA PRÉ-PROTOCOLO\n\n## 📋 Admissibilidade\n\n${relatorioAuditoria.admissibilidade}\n\n## 🔗 Citações\n\n${relatorioAuditoria.citacoes}\n\n## 📄 Fidedignidade\n\n${relatorioAuditoria.fidedignidade}\n\n## Veredicto\n\n${relatorioAuditoria.aprovado ? '✅ **APROVADO PARA PROTOCOLO**' : '❌ **REPROVADO - CORRIGIR ANTES DE PROTOCOLAR**'}`;

      await this.processarSalvamentoResultado(relatorioTexto, flags, 'auditoria');

      return relatorioAuditoria;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na auditoria: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Pipeline ROM completo (5 etapas)
  async executarPipelineROM(input, flags = {}) {
    console.log(`\n${CORES.cyan}${CORES.bright}PIPELINE ROM COMPLETO (5 ETAPAS)${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom pipeline <arquivo_ou_caso>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Opções:${CORES.reset}`);
      console.log(`  ${CORES.yellow}--tipo${CORES.reset} <tipo>         Tipo de peça (recurso-especial, apelacao, etc.)${CORES.reset}`);
      console.log(`  ${CORES.yellow}--documentos${CORES.reset} <lista>  Lista de documentos separados por vírgula${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom pipeline processo.pdf --tipo recurso-especial${CORES.reset}`);
      console.log(`  ${CORES.dim}rom pipeline caso.txt --tipo apelacao --output resultado.md${CORES.reset}\n`);
      return;
    }

    try {
      // Verificar se é arquivo
      let conteudo = input;
      try {
        const stat = await fs.stat(input);
        if (stat.isFile()) {
          console.log(`${CORES.dim}📄 Lendo arquivo: ${input}${CORES.reset}\n`);
          conteudo = await fs.readFile(input, 'utf-8');
        }
      } catch {
        // Não é arquivo, usar como texto direto
      }

      console.log(`${CORES.yellow}⚙️  Executando pipeline ROM completo...${CORES.reset}`);
      console.log(`${CORES.dim}    Etapas: Leitura → Extração → Diagnóstico → Redação → Auditoria${CORES.reset}\n`);

      // Importar MasterOrchestrator dinamicamente
      const { MasterOrchestrator } = await import('./services/master-orchestrator.js');

      // Inicializar MasterOrchestrator (sem DB/Redis por enquanto - modo standalone)
      const orchestrator = new MasterOrchestrator(this.apiKey, null, null);

      const pipelineResult = await orchestrator.executeHybridWorkflow({
        type: flags.tipo || flags.type || 'recurso',
        input: conteudo,
        context: {
          enableThinking: true,
          documents: flags.documentos ? flags.documentos.split(',') : []
        }
      });

      // Exibir resultado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}RESULTADO DO PIPELINE ROM${CORES.reset}                              ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(`${CORES.green}✓ Workflow ID:${CORES.reset} ${pipelineResult.workflowId}`);
      console.log(`${CORES.green}✓ Etapas executadas:${CORES.reset} ${pipelineResult.stages.length}\n`);

      // Exibir resultado de cada etapa
      pipelineResult.stages.forEach((stage, index) => {
        console.log(`${CORES.yellow}${index + 1}. ${stage.stage.toUpperCase()}${CORES.reset}`);
        console.log(`${CORES.dim}${stage.result?.response?.substring(0, 200) || 'Sem resposta'}...${CORES.reset}\n`);
      });

      console.log(`${CORES.cyan}${CORES.bright}RESULTADO FINAL:${CORES.reset}\n`);
      console.log(pipelineResult.finalResult?.response || 'Sem resultado final');
      console.log();

      console.log(`${CORES.cyan}${CORES.bright}AUDITORIA:${CORES.reset}`);
      pipelineResult.auditoria?.forEach((aud, i) => {
        const status = aud.status === 'fulfilled' ? '✅' : '❌';
        console.log(`  ${status} ${aud.agent}: ${aud.status}`);
      });
      console.log();

      // Salvar resultado
      const resultadoTexto = `# PIPELINE ROM - Workflow ${pipelineResult.workflowId}\n\n## Etapas Executadas (${pipelineResult.stages.length})\n\n${pipelineResult.stages.map((s, i) => `### ${i + 1}. ${s.stage.toUpperCase()}\n\n${s.result?.response || 'Sem resposta'}\n`).join('\n')}\n\n## Resultado Final\n\n${pipelineResult.finalResult?.response || 'Sem resultado'}\n\n## Auditoria\n\n${pipelineResult.auditoria?.map(a => `- ${a.status === 'fulfilled' ? '✅' : '❌'} **${a.agent}**: ${a.status}`).join('\n')}`;

      await this.processarSalvamentoResultado(resultadoTexto, flags, 'pipeline');

      return pipelineResult;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro no pipeline ROM: ${error.message}${CORES.reset}\n`);
      if (this.verbose) {
        console.log(`${CORES.dim}${error.stack}${CORES.reset}\n`);
      }
      throw error;
    }
  }

  // Processa comando interativo
  async processarComando(input) {
    const cmd = input.toLowerCase().split(' ')[0];
    const args = input.slice(cmd.length).trim();

    switch (cmd) {
      case '/ajuda':
      case '/help':
        exibirAjuda();
        break;

      case '/limpar':
      case '/clear':
        this.agent.limparHistorico();
        console.log(`${CORES.green}✓ Histórico limpo${CORES.reset}`);
        break;

      case '/agents':
      case '/agentes':
        this.listarAgents();
        break;

      case '/agent':
        if (args) {
          const subagent = this.subagentManager.obterSubagente(args);
          if (subagent) {
            this.currentAgent = args;
            console.log(`${CORES.green}✓ Usando subagente: ${subagent.name}${CORES.reset}`);
          } else {
            console.log(`${CORES.red}✗ Subagente não encontrado: ${args}${CORES.reset}`);
          }
        } else {
          console.log(`${CORES.yellow}Uso: /agent <nome-do-agente>${CORES.reset}`);
        }
        break;

      case '/workflow':
        if (args) {
          const [wfId, ...wfArgs] = args.split(' ');
          await this.executarWorkflow(wfId, wfArgs.join(' '));
        } else {
          this.listarWorkflows();
        }
        break;

      case '/pecas':
        this.listarPecas();
        break;

      case '/prompts':
        const prompts = this.agent.listarPrompts();
        console.log(`\n${CORES.cyan}Prompts disponíveis:${CORES.reset}`);
        prompts.forEach(p => console.log(`  ${CORES.dim}- ${p}${CORES.reset}`));
        break;

      case '/resumo':
        const camada = parseInt(args) || 3;
        console.log(`${CORES.cyan}Gerando resumo executivo Camada ${camada}...${CORES.reset}`);
        return await this.subagentManager.invocarSubagente('resumo-executivo', `Gere um resumo executivo Camada ${camada} do processo em análise.`);

      case '/sair':
      case '/exit':
      case '/quit':
        console.log(`\n${CORES.cyan}Até logo! ROM - Redator de Obras Magistrais${CORES.reset}\n`);
        process.exit(0);

      default:
        return null; // Não é um comando, processar como mensagem
    }

    return { handled: true };
  }

  // Chat interativo
  async chat() {
    exibirBanner();
    log(CORES.green, '✓ ROM Agent inicializado com 41 ferramentas e 14 subagentes!\n');
    log(CORES.dim, 'Digite /ajuda para ver os comandos disponíveis.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = () => {
      const agentIndicator = this.currentAgent ? `[${this.currentAgent}]` : '';
      rl.question(`${CORES.cyan}ROM${agentIndicator}>${CORES.reset} `, async (input) => {
        const inputTrimmed = input.trim();

        if (!inputTrimmed) {
          prompt();
          return;
        }

        // Verificar se é comando
        if (inputTrimmed.startsWith('/')) {
          const result = await this.processarComando(inputTrimmed);
          if (result?.handled) {
            prompt();
            return;
          }
        }

        // Processar como mensagem
        try {
          console.log(`\n${CORES.dim}Processando...${CORES.reset}\n`);

          let resposta;
          if (this.currentAgent) {
            const result = await this.subagentManager.invocarSubagente(this.currentAgent, inputTrimmed);
            resposta = result.response;
          } else {
            resposta = await this.agent.processar(inputTrimmed);
          }

          console.log(`${CORES.green}ROM:${CORES.reset}\n${resposta}\n`);
        } catch (error) {
          console.log(`${CORES.red}Erro: ${error.message}${CORES.reset}\n`);
        }

        prompt();
      });
    };

    prompt();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Verificar API key
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Flags globais
  if (parsed.flags.help || parsed.flags.h) {
    exibirAjuda();
    return;
  }

  if (parsed.flags.version || parsed.flags.v) {
    exibirVersao();
    return;
  }

  if (!apiKey) {
    log(CORES.red, '\n⚠ ERRO: ANTHROPIC_API_KEY não configurada!');
    log(CORES.yellow, 'Configure a variável de ambiente ou crie um arquivo .env');
    console.log('\nExemplo:\nexport ANTHROPIC_API_KEY=sua_chave_aqui\n');
    process.exit(1);
  }

  const cli = new ROMCLI(apiKey);
  cli.verbose = parsed.flags.verbose || parsed.flags.V;

  // Processar comando
  const command = parsed.command || 'chat';

  switch (command) {
    case 'chat':
      await cli.chat();
      break;

    case 'status':
      await cli.verificarStatus();
      break;

    case 'extrair':
      if (parsed.subcommand && parsed.positional.length > 0) {
        await cli.extrairProcesso(parsed.subcommand, parsed.positional[0]);
      } else {
        await cli.extrairProcesso(null, null);
      }
      break;

    case 'agents':
      cli.listarAgents();
      break;

    case 'workflows':
      cli.listarWorkflows();
      break;

    case 'pecas':
      cli.listarPecas();
      break;

    case 'workflow':
      if (parsed.subcommand) {
        await cli.executarWorkflow(parsed.subcommand, parsed.positional.join(' '));
      } else {
        cli.listarWorkflows();
      }
      break;

    case 'analisar':
      await cli.analisarProcesso(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'parecer':
      await cli.analisarProcesso(parsed.subcommand || parsed.positional.join(' '), { ...parsed.flags, parecer: true });
      break;

    case 'resumo':
      await cli.gerarResumo(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'redigir':
      await cli.redigirPeca(parsed.flags, parsed.positional.join(' '));
      break;

    case 'pesquisar':
      await cli.pesquisarJurisprudencia(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'prognostico':
      await cli.gerarPrognostico(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'revisar':
      await cli.revisarTexto(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'contrato':
      await cli.elaborarContrato(parsed.subcommand, parsed.positional.join(' '), parsed.flags);
      break;

    // === COMANDOS ROM-COMPLETO ===

    case 'diagnostico':
    case 'diagnostico-admissibilidade':
      await cli.diagnosticoAdmissibilidade(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'jurimetria':
      await cli.executarJurimetria(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'verificar-citacoes':
      // Atalho direto para verificador de citações
      console.log(`\n${CORES.cyan}${CORES.bright}VERIFICAÇÃO DE CITAÇÕES${CORES.reset}\n`);
      const inputCitacoes = parsed.subcommand || parsed.positional.join(' ');
      if (!inputCitacoes) {
        console.log(`${CORES.red}✗ Uso: rom verificar-citacoes <arquivo_ou_texto>${CORES.reset}\n`);
      } else {
        const resultadoCitacoes = await cli.subagentManager.invocarSubagente('verificador-citacoes', inputCitacoes);
        console.log(resultadoCitacoes.response);
        await cli.processarSalvamentoResultado(resultadoCitacoes.response, parsed.flags, 'verificacao-citacoes');
      }
      break;

    case 'auditar':
    case 'pre-protocolo':
      await cli.auditarPeca(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    case 'rom':
    case 'pipeline':
    case 'workflow-rom':
      await cli.executarPipelineROM(parsed.subcommand || parsed.positional.join(' '), parsed.flags);
      break;

    default:
      // Comando não reconhecido, iniciar chat
      await cli.chat();
  }
}

main().catch(console.error);
