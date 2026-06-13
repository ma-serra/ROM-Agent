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
  console.log('Ferramentas SDK: 41 | Subagentes: 14 | Workflows: 3');
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

      const resultado = await this.subagentManager.invocarSubagente(
        'analise-processual',
        promptBase
      );

      // Exibir resultado formatado
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}${titulo}${CORES.reset}                                    ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(resultado.content[0].text);
      console.log();

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

      console.log(resultado.content[0].text);
      console.log();

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na pesquisa: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Gera prognóstico combinando análise + prazos
  async gerarPrognostico(caso) {
    if (!caso) {
      console.log(`${CORES.red}✗ Uso: rom prognostico <caso>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplo:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom prognostico processo.pdf${CORES.reset}`);
      console.log(`  ${CORES.dim}rom prognostico "ação trabalhista de horas extras"${CORES.reset}\n`);
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

      // ETAPA 1: Análise processual
      console.log(`${CORES.yellow}⚙️  [1/2] Analisando caso...${CORES.reset}`);
      const analise = await this.subagentManager.invocarSubagente(
        'analise-processual',
        `Analise este caso para prognóstico de êxito:\n\n${conteudo}`
      );

      const textoAnalise = analise.content[0].text;

      // ETAPA 2: Análise de prazos e riscos
      console.log(`${CORES.yellow}⚙️  [2/2] Avaliando prazos e riscos...${CORES.reset}\n`);
      const prazos = await this.subagentManager.invocarSubagente(
        'prazos',
        `Com base na seguinte análise, avalie PRESCRIÇÃO, DECADÊNCIA, PRECLUSÃO e RISCOS TEMPORAIS:\n\n${textoAnalise}`
      );

      // Combinar resultados
      console.log(`${CORES.cyan}╔════════════════════════════════════════════════════════════╗${CORES.reset}`);
      console.log(`${CORES.cyan}║${CORES.reset}  ${CORES.bright}PROGNÓSTICO JURÍDICO${CORES.reset}                                   ${CORES.cyan}║${CORES.reset}`);
      console.log(`${CORES.cyan}╚════════════════════════════════════════════════════════════╝${CORES.reset}\n`);

      console.log(`${CORES.green}${CORES.bright}═══ ANÁLISE DO CASO ═══${CORES.reset}\n`);
      console.log(textoAnalise);
      console.log(`\n${CORES.yellow}${CORES.bright}═══ PRAZOS E RISCOS ═══${CORES.reset}\n`);
      console.log(prazos.content[0].text);
      console.log();

      return { analise, prazos };
    } catch (error) {
      console.log(`${CORES.red}✗ Erro ao gerar prognóstico: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Revisa português jurídico
  async revisarTexto(input) {
    console.log(`\n${CORES.cyan}${CORES.bright}REVISÃO DE PORTUGUÊS JURÍDICO${CORES.reset}\n`);

    if (!input) {
      console.log(`${CORES.red}✗ Uso: rom revisar <texto_ou_arquivo>${CORES.reset}\n`);
      console.log(`${CORES.yellow}Aspectos revisados:${CORES.reset}`);
      console.log(`  ${CORES.dim}- Ortografia e acentuação${CORES.reset}`);
      console.log(`  ${CORES.dim}- Concordância verbal e nominal${CORES.reset}`);
      console.log(`  ${CORES.dim}- Regência e crase${CORES.reset}`);
      console.log(`  ${CORES.dim}- Pontuação e coesão textual${CORES.reset}`);
      console.log(`  ${CORES.dim}- Estilo jurídico e latinismos${CORES.reset}\n`);
      console.log(`${CORES.yellow}Exemplos:${CORES.reset}`);
      console.log(`  ${CORES.dim}rom revisar peca.txt${CORES.reset}`);
      console.log(`  ${CORES.dim}rom revisar "A empresa não cumpriu o contrato"${CORES.reset}\n`);
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

      console.log(resultado.content[0].text);
      console.log();

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na revisão: ${error.message}${CORES.reset}\n`);
      throw error;
    }
  }

  // Elabora contratos
  async elaborarContrato(tipo, contexto = '') {
    console.log(`\n${CORES.cyan}${CORES.bright}ELABORAÇÃO DE CONTRATO${CORES.reset}\n`);

    if (!tipo) {
      console.log(`${CORES.red}✗ Uso: rom contrato <tipo_do_contrato> [contexto]${CORES.reset}\n`);
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

      console.log(resultado.content[0].text);
      console.log();

      return resultado;
    } catch (error) {
      console.log(`${CORES.red}✗ Erro na elaboração do contrato: ${error.message}${CORES.reset}\n`);
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
      await cli.gerarPrognostico(parsed.subcommand || parsed.positional.join(' '));
      break;

    case 'revisar':
      await cli.revisarTexto(parsed.subcommand || parsed.positional.join(' '));
      break;

    case 'contrato':
      await cli.elaborarContrato(parsed.subcommand, parsed.positional.join(' '));
      break;

    default:
      // Comando não reconhecido, iniciar chat
      await cli.chat();
  }
}

main().catch(console.error);
