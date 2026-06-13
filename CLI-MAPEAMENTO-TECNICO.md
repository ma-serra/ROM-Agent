# Mapeamento Técnico Completo da CLI ROM Agent

**Data:** 2026-06-12
**Versão CLI:** 2.0.0
**Arquivo Principal:** `src/cli-advanced.js` (533 linhas)

---

## 🎯 Ponto de Entrada

### Arquivo Principal
- **Arquivo:** `src/cli-advanced.js`
- **Registro no package.json:**
```json
{
  "bin": {
    "rom": "./src/cli-advanced.js"
  }
}
```

### Comando de execução
```bash
rom [comando] [opções] [argumentos]
npm run rom -- [argumentos]
```

---

## 🏗️ Estrutura Interna

### Framework
**❌ Parsing Manual (Sem bibliotecas externas)**

- **Não usa:** Commander.js, Yargs, ou Oclif
- **Usa:** Função customizada `parseArgs()` (linhas 57-104)

**Vantagens:**
- ✅ Zero dependências extras
- ✅ Controle total do parsing

**Desvantagens:**
- ❌ Parsing limitado
- ❌ Sem validação automática de argumentos
- ❌ Sem geração automática de ajuda

### Arquitetura
```javascript
class ROMCLI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.agent = new ROMAgent(apiKey);           // Agente principal
    this.subagentManager = new SubagentManager(apiKey); // Gerenciador de subagentes
    this.currentAgent = null;
    this.verbose = false;
  }
}
```

---

## 📜 Comandos Implementados

| Comando | Status | Função | Linha |
|---------|--------|--------|-------|
| `chat` | ✅ **IMPLEMENTADO** | Chat interativo com readline | 503 |
| `agents` | ✅ **IMPLEMENTADO** | Lista subagentes disponíveis | 506 |
| `workflows` | ✅ **IMPLEMENTADO** | Lista workflows disponíveis | 510 |
| `pecas` | ✅ **IMPLEMENTADO** | Lista peças jurídicas | 514 |
| `workflow <id>` | ✅ **IMPLEMENTADO** | Executa workflow específico | 518 |
| `analisar` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 136 |
| `resumo` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 137 |
| `redigir` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 138 |
| `pesquisar` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 139 |
| `extrair` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 140 |
| `revisar` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 141 |
| `contrato` | ⚠️ **PLANEJADO** | Não implementado (cai em chat) | 142 |
| `config` | ⚠️ **PLANEJADO** | Não implementado | 146 |

**Taxa de Implementação:** 5/13 (38%)

---

## 🚩 Flags Globais Suportadas

### Ajuda e Versão
```bash
-h, --help              # Exibe ajuda completa ✅
-v, --version           # Exibe versão (2.0.0) ✅
```

### Verbosidade
```bash
-V, --verbose           # Modo verboso ✅ FUNCIONAL
-q, --quiet             # Modo silencioso ❌ NÃO IMPLEMENTADO
```

### Configuração de Modelo
```bash
-m, --model <modelo>    # Modelo: sonnet|opus|haiku ⚠️ NÃO VALIDADO
-t, --max-tokens <n>    # Máximo de tokens ❌ NÃO USADO
```

### Output
```bash
-o, --output <arquivo>  # Arquivo de saída ❌ NÃO IMPLEMENTADO
-f, --format <formato>  # Formato: md|pdf|docx|html ❌ NÃO IMPLEMENTADO
```

### Agentes e Workflows
```bash
-a, --agent <nome>      # Subagente específico ❌ NÃO IMPLEMENTADO
-w, --workflow <nome>   # Workflow a executar ❌ NÃO IMPLEMENTADO
-l, --camada <1|2|3>    # Camada do resumo ❌ NÃO IMPLEMENTADO
```

### Documentos
```bash
-p, --tipo-peca <tipo>  # Tipo de peça jurídica ❌ NÃO IMPLEMENTADO
--timbrado              # Incluir papel timbrado ❌ NÃO IMPLEMENTADO
--tribunal <sigla>      # Tribunal para pesquisa ❌ NÃO IMPLEMENTADO
```

**Taxa de Implementação:** 2/15 (13%)

---

## 🤖 Subagentes Disponíveis (14 total)

Gerenciados por `SubagentManager` em `src/modules/subagents.js`

| ID | Nome | Tipo | Status |
|----|------|------|--------|
| `analise-processual` | Análise de Processos | analise | ✅ |
| `resumo-executivo` | Resumo Executivo (3 camadas) | resumo | ✅ |
| `jurisprudencia` | Pesquisa de Jurisprudência | pesquisa | ✅ |
| `leading-case` | Análise de Precedentes | pesquisa | ✅ |
| `prequestionamento` | Elaboração de Prequestionamento | redacao | ✅ |
| `prazos` | Análise de Prescrição/Decadência | analise | ✅ |
| `redator-civel` | Redação Cível | redacao | ✅ |
| `redator-criminal` | Redação Criminal | redacao | ✅ |
| `redator-trabalhista` | Redação Trabalhista | redacao | ✅ |
| `contratos` | Elaboração de Contratos | redacao | ✅ |
| `revisor-portugues` | Revisão de Português | revisao | ✅ |
| `extrator` | Extração de PDFs | extracao | ✅ |
| `calculista` | Cálculos Judiciais | calculo | ✅ |

**Taxa de Implementação:** 14/14 (100%)

---

## 🔄 Workflows Disponíveis (3 total)

| ID | Nome | Etapas | Pipeline |
|----|------|--------|----------|
| `analise-completa` | Análise Completa | 6 | extração → análise → resumo → jurisprudência → leading cases → prazos |
| `redacao-civel` | Redação Cível | 4 | análise → pesquisa → redação → revisão |
| `redacao-criminal` | Redação Criminal | 4 | análise → pesquisa → redação → revisão |

**Taxa de Implementação:** 3/3 (100%)

---

## 💬 Comandos Interativos

Quando em modo `rom chat`:

| Comando | Função |
|---------|--------|
| `/ajuda` ou `/help` | Exibe ajuda |
| `/limpar` | Limpa histórico |
| `/agents` | Lista subagentes |
| `/agent <n>` | Usa subagente específico |
| `/workflow` | Executa workflow |
| `/pecas` | Lista peças jurídicas |
| `/prompts` | Lista prompts disponíveis |
| `/sair` ou `/exit` | Encerra CLI |

---

## 🔧 Parsing de Argumentos

**Função:** `parseArgs(args)` (linhas 57-104)

### Formato suportado
```bash
rom comando subcomando --flag valor -f outroflag arg1 arg2
```

### Resultado parseado
```javascript
{
  command: 'comando',         // Primeiro argumento posicional
  subcommand: 'subcomando',   // Segundo argumento posicional
  flags: {                    // Flags com -- ou -
    flag: 'valor',
    f: 'outroflag'
  },
  positional: ['arg1', 'arg2'] // Argumentos restantes
}
```

### Limitações Identificadas
- ❌ Não valida flags desconhecidas
- ❌ Não suporta flags booleanas combinadas (ex: `-abc`)
- ❌ Não suporta arrays de valores (ex: `--model sonnet,opus`)
- ❌ Não suporta valores com espaços sem aspas
- ❌ Não gera erro para flags inválidas
- ❌ Não tem autocomplete

---

## 📦 Dependências CLI

```javascript
import readline from 'readline';           // Chat interativo
import { ROMAgent, CONFIG, TOOLS } from './index.js';  // Agente principal
import { SubagentManager, SUBAGENTES } from './modules/subagents.js'; // Subagentes
import dotenv from 'dotenv';               // Variáveis de ambiente
import fs from 'fs/promises';              // Sistema de arquivos
import path from 'path';                   // Caminhos
```

**Total de dependências externas:** 1 (dotenv)
**Dependências internas:** 3 (readline, fs, path - nativos Node.js)

---

## 🎨 Sistema de Cores

Usa ANSI escape codes diretamente (linhas 23-47):

```javascript
const CORES = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  // ... 20+ cores e estilos
}
```

---

## 🚨 Gaps Identificados

### ❌ Comandos NÃO Implementados
1. `analisar` - Análise de processo (planejado, não implementado)
2. `resumo` - Resumo executivo (planejado, não implementado)
3. `extrair` - Extração de PDF (planejado, não implementado)
4. `pesquisar` - Pesquisa jurisprudência (planejado, não implementado)
5. `redigir` - Redação de peças (planejado, não implementado)
6. `revisar` - Revisão de texto (planejado, não implementado)
7. `contrato` - Elaboração de contratos (planejado, não implementado)
8. `config` - Gerenciar configurações (planejado, não implementado)

### ❌ Funcionalidades Faltantes
- **Monitoramento de API** - Não existe
- **Raspagem de processos** - Não existe
- **Integração com scrapers Python** - Não exposto via CLI
- **Status de health check** - Não existe
- **Logs estruturados** - Apenas console.log
- **Progress bars** - Não implementado
- **Spinners** - Não implementado
- **Saída em arquivo** - Flag existe mas não funciona
- **Formato de saída** - Flag existe mas não funciona
- **Validação de argumentos** - Não existe
- **Sugestões de comandos** - Não existe

### 🎯 Oportunidades para Novas Funcionalidades

1. `rom monitor` - Monitorar API em tempo real
2. `rom monitor --url <url>` - Monitorar URL customizada
3. `rom scraper` - Interface para scrapers Python
4. `rom scraper esaj <numero>` - Raspar processo do ESAJ
5. `rom scraper pje <numero>` - Raspar processo do PJe
6. `rom scraper projudi <numero>` - Raspar processo do PROJUDI
7. `rom health` - Verificar saúde do sistema
8. `rom status` - Status de serviços
9. `rom logs` - Ver logs do sistema
10. `rom config get/set` - Gerenciar configurações

---

## 📊 Resumo Técnico

| Aspecto | Estado Atual | Observação |
|---------|-------------|------------|
| **Framework** | ❌ Parsing manual | Sem biblioteca externa |
| **Comandos implementados** | ⚠️ 5/13 (38%) | Maioria planejada, não feita |
| **Flags funcionais** | ⚠️ 2/15 (13%) | Apenas help e verbose funcionam |
| **Subagentes** | ✅ 14/14 (100%) | Todos implementados |
| **Workflows** | ✅ 3/3 (100%) | Todos implementados |
| **Chat interativo** | ✅ Funcional | Usa readline, funciona bem |
| **Monitoramento** | ❌ Não existe | Precisa ser implementado |
| **Raspagem CLI** | ❌ Não existe | Precisa ser implementado |
| **Progress feedback** | ❌ Não existe | Apenas console.log simples |
| **Validação de args** | ❌ Não existe | Aceita qualquer entrada |
| **Tratamento de erros** | ⚠️ Básico | Try/catch simples |
| **Documentação inline** | ✅ Boa | Comentários adequados |
| **Testes** | ❌ Não existem | CLI não tem testes |

---

## 💡 Análise de Código

### ✅ Pontos Fortes
- Estrutura limpa e organizada
- Banner e ajuda bem formatados
- Sistema de cores completo
- Arquitetura orientada a objetos
- Separação de responsabilidades clara
- Chat interativo funcional
- Integração com subagentes bem implementada

### ❌ Pontos Fracos
- Parsing manual limitado (deveria usar Commander.js)
- Falta validação de argumentos
- Flags declaradas mas não implementadas
- Comandos declarados mas não implementados
- Sem feedback visual (spinners, progress bars)
- Sem persistência de configurações
- Sem histórico de comandos entre sessões
- Sem autocomplete
- Logs apenas para console (não em arquivo)

### 📉 Dívida Técnica
- 8 comandos planejados mas não implementados (62% de gap)
- 13 flags planejadas mas não implementadas (87% de gap)
- Sistema de output (`-o`, `-f`) não funciona
- Sistema de agentes (`-a`) não funciona
- Configurações (`config`) não implementadas

---

## 🎯 Recomendações

### Prioridade Alta
1. ✅ **Implementar comando `rom monitor`** para monitoramento de API
   - Conectar com `scripts/monitor-api.js` existente
   - Adicionar flags: `--url`, `--interval`, `--timeout`
   - Progress visual em tempo real
   - Salvar logs em arquivo

2. ✅ **Implementar comando `rom scraper`** para raspagem de processos
   - Integrar com `python-scrapers/` existentes
   - Suportar: ESAJ, PJe, PROJUDI
   - Feedback de progresso
   - Salvar resultados em JSON/PDF

3. ✅ **Implementar comando `rom health`** para health check
   - Verificar API, banco, redis
   - Exibir status colorido
   - Conectar com `/api/health` endpoint

### Prioridade Média
4. Implementar flags de output (`-o`, `-f`)
5. Adicionar progress bars e spinners
6. Implementar comando `rom config`
7. Migrar para Commander.js (melhor UX)
8. Adicionar testes para CLI

### Prioridade Baixa
9. Implementar histórico persistente
10. Adicionar autocomplete
11. Suporte para aliases de comandos
12. Temas de cores customizáveis

---

## 📝 Exemplos de Uso Atual

### ✅ Comandos que FUNCIONAM
```bash
# Chat interativo
rom chat
rom

# Listar subagentes
rom agents

# Listar workflows
rom workflows

# Listar peças
rom pecas

# Executar workflow
rom workflow analise-completa processo.pdf
```

### ❌ Comandos planejados mas NÃO FUNCIONAM
```bash
rom analisar processo.pdf           # Cai em chat
rom resumo processo.pdf --camada 3  # Cai em chat
rom pesquisar "dano moral"          # Cai em chat
rom extrair documento.pdf           # Cai em chat
```

---

## 🚀 Próximos Passos Sugeridos

### Fase 1 - Monitoramento (1-2 dias)
- [ ] Implementar comando `rom monitor`
- [ ] Conectar com `monitor-api.js` existente
- [ ] Adicionar flags: `--url`, `--interval`, `--once`
- [ ] Progress visual com cores
- [ ] Salvar logs estruturados

### Fase 2 - Raspagem (2-3 dias)
- [ ] Implementar comando `rom scraper`
- [ ] Integrar com scrapers Python (ESAJ, PJe, PROJUDI)
- [ ] Adicionar subcomandos: `rom scraper esaj/pje/projudi`
- [ ] Progress bars para download
- [ ] Salvar resultados em múltiplos formatos

### Fase 3 - Health Check (1 dia)
- [ ] Implementar comando `rom health`
- [ ] Verificar API, PostgreSQL, Redis
- [ ] Status colorido (verde/amarelo/vermelho)
- [ ] Conectar com `/api/health`

### Fase 4 - Melhorias UX (3-4 dias)
- [ ] Migrar para Commander.js
- [ ] Implementar flags de output funcionais
- [ ] Progress bars e spinners
- [ ] Validação de argumentos
- [ ] Sugestões de comandos

---

## 🎯 Conclusão

A CLI ROM Agent está **parcialmente implementada** com:
- ✅ Estrutura sólida e bem organizada
- ✅ Chat interativo funcional
- ✅ Subagentes e workflows completos
- ⚠️ 38% dos comandos implementados
- ⚠️ 13% das flags funcionais
- ❌ Monitoramento e raspagem ausentes

### Oportunidade
Implementar comandos de **monitoramento** e **raspagem de processos** que conectem com infraestrutura já existente (`monitor-api.js`, `python-scrapers/`).

### Impacto Esperado
- Exposição de funcionalidades existentes via CLI
- Melhor UX para usuários técnicos
- Automação de tarefas de monitoramento
- Integração fácil com scripts e pipelines

---

**Gerado em:** 2026-06-12
**Autor:** Claude Sonnet 4.5
**Ferramenta:** ROM Agent CLI Analysis
