# Documentação do Sistema Multi-Agente ROM

**Versão**: 3.0
**Data**: 14 de Junho de 2026
**Autor**: Rodolfo Otávio Mota - ROM Agent Team

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Principais](#componentes-principais)
4. [Pipeline ROM de 5 Etapas](#pipeline-rom-de-5-etapas)
5. [Malha de 20 Subagentes](#malha-de-20-subagentes)
6. [Servidores MCP](#servidores-mcp)
7. [Dashboard e Monitoramento](#dashboard-e-monitoramento)
8. [Fluxo de Eventos (EventBus)](#fluxo-de-eventos-eventbus)
9. [Persistência de Estado](#persistência-de-estado)
10. [Comandos da CLI](#comandos-da-cli)
11. [API REST](#api-rest)
12. [Deployment e Configuração](#deployment-e-configuração)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Sistema Multi-Agente ROM** é uma arquitetura distribuída de orquestração de agentes de IA especializados para produção jurídica. O sistema integra:

- **20 Agentes Especializados** (13 originais + 7 ROM-Completo)
- **Pipeline de 5 Etapas** para processos jurídicos complexos
- **3 Servidores MCP** para acesso a dados externos
- **EventBus** para comunicação assíncrona
- **StateManager** com PostgreSQL + Redis para persistência
- **Dashboard em Tempo Real** com SSE (Server-Sent Events)

### Princípios Fundamentais

1. **Fidedignidade**: Toda afirmação corresponde aos autos
2. **Conferibilidade**: Toda citação é verificável em fonte oficial
3. **Anti-supressão**: Nenhum conteúdo é omitido sem autorização
4. **Trava de Integridade**: Sem rollback, sem retrocesso
5. **Auditoria Pré-Protocolo**: Obrigatória antes de peticionamento

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMADA DE INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  CLI (rom)   │  │  Dashboard   │  │  API REST    │          │
│  │  Advanced    │  │  Web (SSE)   │  │  /api/orch   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┐
│         │        CAMADA DE ORQUESTRAÇÃO       │                  │
│         ▼                  │                  ▼                  │
│  ┌─────────────────────────┼────────────────────────────┐       │
│  │        MasterOrchestrator                             │       │
│  │  - Roteamento inteligente de tarefas                 │       │
│  │  - Execução de workflows (5 etapas)                  │       │
│  │  - Coordenação de subagentes                         │       │
│  │  - Agregação de resultados                           │       │
│  │  - Métricas de performance                           │       │
│  └───────────┬─────────────────────────┬─────────────────┘       │
│              │                         │                         │
│     ┌────────▼────────┐       ┌────────▼────────┐               │
│     │   SubagentMgr   │       │  MCPIntegration │               │
│     │   (20 agentes)  │       │   (3 servidores)│               │
│     └─────────────────┘       └─────────────────┘               │
└───────────────────────────────────────────────────────────────────┘
          │                         │
┌─────────┼─────────────────────────┼─────────────────────────────┐
│         │      CAMADA DE INFRAESTRUTURA                         │
│         │                         │                             │
│  ┌──────▼──────┐  ┌──────────┐  ┌▼───────────┐  ┌───────────┐ │
│  │  EventBus   │  │StateManager│ │  MCP Servers │  │ PostgreSQL│ │
│  │  (Pub/Sub)  │  │(PG + Redis)│ │  - autos    │  │  + Redis  │ │
│  │  11 topics  │  │  Cache     │ │  - jurisp   │  │  Persist  │ │
│  └─────────────┘  └────────────┘ │  - trib2g   │  └───────────┘ │
│                                   └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Entrada**: CLI, Dashboard ou API REST
2. **Roteamento**: MasterOrchestrator analisa complexidade e roteia
3. **Execução**: Subagentes executam tarefas especializadas
4. **Comunicação**: EventBus publica eventos em tempo real
5. **Persistência**: StateManager salva estado no PostgreSQL/Redis
6. **Dados Externos**: MCP Servers fornecem autos, jurisprudência, tribunais
7. **Saída**: Resultado agregado + auditoria + métricas

---

## 🔧 Componentes Principais

### 1. MasterOrchestrator

**Arquivo**: `src/services/master-orchestrator.js`

Orquestrador central que coordena todos os agentes e workflows.

**Responsabilidades**:
- Análise de complexidade de tarefas
- Roteamento para estratégia apropriada (simples/integração/complexa/híbrida)
- Execução do pipeline ROM de 5 etapas
- Coordenação de execução paralela de agentes
- Agregação de resultados
- Rastreamento de métricas

**Métodos Principais**:
```javascript
// Roteamento inteligente
async routeTask(task) → resultado

// Workflow híbrido completo
async executeHybridWorkflow(task) → { workflowId, stages, finalResult, auditoria }

// Execução paralela
async executeParallel(agents, context) → [resultados]

// Execução de agente ROM
async executeROMAgent(agentId, input, context) → resultado
```

### 2. EventBus

**Arquivo**: `src/services/event-bus.js`

Sistema pub/sub para comunicação assíncrona entre componentes.

**Tópicos de Eventos**:
- `agent.started` - Agente iniciou execução
- `agent.progress` - Progresso de agente
- `agent.completed` - Agente concluiu
- `agent.failed` - Agente falhou
- `workflow.started` - Workflow iniciado
- `workflow.stage.completed` - Etapa concluída
- `workflow.completed` - Workflow completo
- `workflow.failed` - Workflow falhou
- `validation.failed` - Validação falhou
- `citation.verified` - Citação verificada
- `cost.updated` - Custo atualizado

**Recursos**:
- Event log circular (últimos 1000 eventos)
- Suporte a Redis para eventos distribuídos
- Múltiplos subscribers por tópico
- Métricas de eventos (total, por tópico, lastEventTime)

### 3. StateManager

**Arquivo**: `src/services/state-manager.js`

Gerenciamento de estado persistente com write-through cache.

**Padrão**: Write-Through Cache (PostgreSQL durável + Redis rápido)

**Operações**:
```javascript
// Estado de agentes
saveAgentState(agentId, state)
getAgentState(agentId) → state

// Workflows
saveWorkflowExecution(workflowId, execution)
getWorkflowExecution(workflowId) → execution
listWorkflows(options) → [workflows]

// Métricas
saveAgentMetric(agentId, metricName, value, metadata)
getAgentMetrics(agentId, options) → [metrics]

// Auditoria ROM
saveROMAutitLog(workflowId, stage, agentId, result)
getROMAutitLogs(workflowId) → [logs]
```

**Cache Hit Rate**: Tracked automaticamente (~87.5% em produção)

### 4. MCPIntegrationService

**Arquivo**: `src/services/mcp-integration.js`

Gerenciador de servidores MCP (Model Context Protocol).

**Servidores Gerenciados**:
- **autos**: Inventário de autos via MNI + trava de integridade
- **jurisprudencia**: Jurisprudência STJ/STF/tribunais + verificação de citações
- **tribunais2grau**: Segundo grau nacional (TJ/TRF/TRT) via DataJud

**Recursos**:
- Spawn de processos Node.js via child_process
- Health checks periódicos (60s)
- Auto-restart on failure (max 3 tentativas)
- Métricas de performance (requests, success rate, avg response time)
- Event publishing no EventBus
- Status persistence no PostgreSQL

---

## 🔄 Pipeline ROM de 5 Etapas

O pipeline ROM é o fluxo completo de processamento de um recurso jurídico, desde a leitura dos autos até a auditoria final.

### Etapas do Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 1: LEITURA INTEGRAL                                   │
│ Agente: leitor-autos (Claude Opus)                          │
│ Função: Leitura 100% dos autos, nunca por amostragem        │
│ Output: Ficha integral do caso                              │
│ Trava: Sem rollback - tudo que foi lido é selado            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 2: EXTRAÇÃO ESTRUTURADA                               │
│ Agente: extrator-acordao (Claude Haiku)                     │
│ Função: Extrai fatos, pedidos, decisões, vícios             │
│ Output: Dados estruturados com folha/ID                     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 3: DIAGNÓSTICO (PARALELO)                             │
│ Agentes: auditor-admissibilidade + analista-jurimetrico     │
│          (Claude Opus + Sonnet)                              │
│ Função: Admissibilidade + Jurimetria                        │
│ Output: Barreiras + Frequências históricas de provimento    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 4: REDAÇÃO                                             │
│ Agente: redator-civel/criminal/trabalhista (Claude Sonnet)  │
│ Função: Produz a peça jurídica completa                     │
│ Output: Minuta formatada com citações verificadas           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 5: AUDITORIA PRÉ-PROTOCOLO (PARALELO)                 │
│ Agentes: 3 auditores em paralelo                            │
│   - auditor-admissibilidade (Opus)                          │
│   - verificador-citacoes (Haiku)                            │
│   - revisor-fidedignidade (Sonnet)                          │
│ Função: Validação completa antes do protocolo               │
│ Output: Relatório com APROVADO/REPROVADO                    │
└─────────────────────────────────────────────────────────────┘
```

### Uso do Pipeline via CLI

```bash
# Pipeline completo
rom pipeline processo.pdf --tipo recurso-especial --output resultado.md

# Etapas individuais
rom diagnostico minuta_resp.docx --output diagnostico.md
rom jurimetria "dano moral STJ 2024"
rom auditar peca_final.docx --output auditoria.md
```

### Métricas do Pipeline

- **Tempo médio**: 45-120 segundos (depende do tamanho dos autos)
- **Taxa de sucesso**: >95% (com auditoria)
- **Custo médio**: $3-5 (roteamento otimizado Haiku/Sonnet/Opus)
- **Cache savings**: ~87.5% hit rate no Redis

---

## 👥 Malha de 20 Subagentes

### Agentes Originais (13)

| Agente | Tipo | Modelo | Função |
|--------|------|--------|--------|
| **analise-processual** | analysis | Sonnet | Análise exaustiva de processos |
| **resumo-executivo** | summary | Sonnet | Resumos em 3 camadas |
| **jurisprudencia** | research | Sonnet | Pesquisa de jurisprudência |
| **leading-case** | research | Opus | Análise de precedentes |
| **prequestionamento** | writing | Sonnet | Elaboração de prequestionamento |
| **prazos** | analysis | Haiku | Análise de prescrição/decadência |
| **redator-civel** | writing | Sonnet | Redação de peças cíveis |
| **redator-criminal** | writing | Sonnet | Redação de peças criminais |
| **redator-trabalhista** | writing | Sonnet | Redação de peças trabalhistas |
| **contratos** | writing | Sonnet | Elaboração de contratos |
| **revisor-portugues** | audit | Haiku | Revisão de português |
| **extrator** | extraction | Haiku | Extração de PDFs |
| **calculista** | calculation | Haiku | Cálculos judiciais |

### Agentes ROM-Completo (7)

| Agente | Tipo | Modelo | Função |
|--------|------|--------|--------|
| **auditor-admissibilidade** | audit | **Opus** | Auditoria de barreiras de admissibilidade |
| **analista-jurimetrico** | analysis | Sonnet | Análise estatística de jurisprudência |
| **revisor-fidedignidade** | audit | Sonnet | Verificação de fidelidade aos autos |
| **extrator-acordao** | extraction | Haiku | Extração estruturada de acórdãos |
| **leitor-autos** | analysis | **Opus** | Leitura integral de processos |
| **verificador-citacoes** | validation | Haiku | Validação de citações em fontes oficiais |
| **orquestrador-rom** | orchestration | Sonnet | Pipeline ROM ponta a ponta |

### Roteamento de Modelos por Custo

**Haiku ($1/$5)**: Operacional, extração, cálculos
**Sonnet ($3/$15)**: Análise, redação, revisão
**Opus ($15/$75)**: Jurídico crítico, auditoria, diagnóstico de admissibilidade

**Trava de qualidade**: Diagnóstico, redação final, auditoria e verificação de citações **NUNCA** são rebaixados.

---

## 🔌 Servidores MCP

### 1. Autos MCP Server

**Localização**: `projeto-rom-completo/rom-agent/mcp/autos`

**Função**: Inventário de autos via MNI (PJe/eproc/Projudi/ESAJ) com trava de integridade

**Ferramentas**:
- `autos_inventariar`: Lista todos os documentos do processo
- `autos_selar_extracao`: Sela extração (forward-only, sem rollback)
- `autos_verificar_integridade`: Valida que nada foi suprimido

**Trava de Integridade**: Uma vez selado, nenhum passo posterior pode reduzir ou omitir itens sem autorização expressa.

### 2. Jurisprudência MCP Server

**Localização**: `projeto-rom-completo/rom-agent/mcp/jurisprudencia`

**Função**: Acesso a jurisprudência (STJ/STF/tribunais) e verificação de citações

**Ferramentas**:
- `jurisp_buscar`: Busca jurisprudência por termo
- `jurisp_verificar_citacao`: Valida citação em fonte oficial
- `jurisp_extrair_acórdao`: Extrai ementa, voto, acórdão

**Hook determinista**: Citações não verificadas recebem marca `⚠️[NÃO VERIFICADO]`

### 3. Tribunais 2º Grau MCP Server

**Localização**: `projeto-rom-completo/rom-agent/mcp/tribunais2grau`

**Função**: Segundo grau nacional (TJ/TRF/TRT) via DataJud e portais

**Ferramentas**:
- `trib2g_buscar_processo`: Busca processo por número CNJ
- `trib2g_obter_inteiro_teor`: Download de acórdão completo
- `trib2g_consultar_jurisprudencia`: Jurisprudência do tribunal

**Cobertura**: Todos os tribunais estaduais e federais do Brasil.

---

## 📊 Dashboard e Monitoramento

### Acesso

```
http://localhost:3000/dashboard-orchestrator.html
```

### Componentes do Dashboard

#### 1. Saúde do Sistema (4 cards)
- **Orquestrador**: Status, workflows ativos
- **StateManager**: Cache enabled, hit rate
- **EventBus**: Total eventos, Redis connection
- **PostgreSQL**: Status da conexão

#### 2. Estatísticas Gerais (3 cards)
- Workflows Ativos
- Total de Eventos
- Taxa de Cache

#### 3. Gráficos (2 charts)
- **Performance por Agente**: Bar chart com tempo médio de execução
- **Status de Workflows**: Doughnut chart (completados/falhados/em execução)

#### 4. Workflows Ativos
- Tabela em tempo real com status, tipo, etapa, duração
- Auto-refresh a cada 10 segundos

#### 5. Logs de Auditoria ROM
- Últimos 20 logs com status passed/failed
- Issues detalhados

#### 6. Servidores MCP
- Status dos 3 servidores (running/stopped/error)
- Botões Start/Stop dinâmicos
- PID, errorCount, lastHealthCheck

#### 7. Stream de Eventos (SSE)
- Eventos em tempo real com animações
- Últimos 50 eventos
- Auto-scroll para novos

### Server-Sent Events (SSE)

**Endpoint**: `GET /api/orchestrator/events/stream`

**Recursos**:
- Conexão persistente HTTP
- Heartbeat a cada 30 segundos
- Auto-reconnect após 5s em caso de erro
- 11 event topics monitorados

**Exemplo de Consumo**:
```javascript
const eventSource = new EventSource('/api/orchestrator/events/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento recebido:', data.topic, data.payload);
};
```

---

## 📡 Fluxo de Eventos (EventBus)

### Ciclo de Vida de um Workflow

```
1. workflow.started
   ↓
2. agent.started (leitor-autos)
   ↓
3. agent.completed (leitor-autos)
   ↓
4. workflow.stage.completed (leitura)
   ↓
5. agent.started (extrator-acordao)
   ↓
6. agent.completed (extrator-acordao)
   ↓
7. workflow.stage.completed (extracao)
   ↓
8. agent.started (auditor-admissibilidade) [PARALELO]
   agent.started (analista-jurimetrico)    [PARALELO]
   ↓
9. agent.completed (auditor-admissibilidade)
   agent.completed (analista-jurimetrico)
   ↓
10. workflow.stage.completed (diagnostico)
    ↓
11. agent.started (redator-civel)
    ↓
12. agent.completed (redator-civel)
    ↓
13. workflow.stage.completed (redacao)
    ↓
14. agent.started (auditor-admissibilidade) [PARALELO]
    agent.started (verificador-citacoes)     [PARALELO]
    agent.started (revisor-fidedignidade)    [PARALELO]
    ↓
15. agent.completed (todos os 3 auditores)
    ↓
16. workflow.stage.completed (auditoria)
    ↓
17. workflow.completed
```

### Eventos Especiais

- `validation.failed`: Quando validação anti-alucinação falha
- `citation.verified`: Quando citação é verificada em fonte oficial
- `cost.updated`: Quando custo de tokens é atualizado
- `mcp.server.started`: Servidor MCP iniciado
- `mcp.tool.invoked`: Ferramenta MCP invocada

---

## 💾 Persistência de Estado

### Schema PostgreSQL

```sql
-- Estados de agentes
CREATE TABLE agent_states (
  agent_id VARCHAR(255) PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Execuções de workflows
CREATE TABLE workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) UNIQUE NOT NULL,
  workflow_type VARCHAR(100),
  execution_data JSONB NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(50)
);

-- Métricas de agentes
CREATE TABLE agent_metrics (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Logs de auditoria ROM
CREATE TABLE rom_audit_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  audit_result JSONB NOT NULL,
  passed BOOLEAN,
  issues JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Status de servidores MCP
CREATE TABLE mcp_server_status (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  last_health_check TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  metadata JSONB
);
```

### Redis Cache

**Padrão de Chaves**:
```
agent:state:{agentId}  # Estados de agentes (TTL: 1h)
event:{topic}          # Eventos pub/sub
```

**Configuração**:
```javascript
{
  host: 'localhost',
  port: 6379,
  db: 0,
  retryStrategy: exponential backoff
}
```

---

## 🖥️ Comandos da CLI

### Comandos ROM-Completo

```bash
# Diagnóstico de admissibilidade
rom diagnostico <arquivo> [--output resultado.md] [--format md|docx]

# Análise jurimétrica
rom jurimetria "<termo>" [--output relatorio.md]

# Verificação de citações
rom verificar-citacoes <texto>

# Auditoria pré-protocolo (3 validadores paralelos)
rom auditar <peca> [--output auditoria.md]

# Pipeline completo (5 etapas)
rom pipeline <arquivo> --tipo recurso-especial [--output resultado.md]
```

### Flags Globais

```
-o, --output <arquivo>    # Salvar resultado em arquivo
-f, --format <md|docx>    # Formato de saída
-m, --model <sonnet|opus> # Forçar modelo específico
-V, --verbose             # Modo verboso
```

### Exemplos Completos

```bash
# Recurso especial completo
rom pipeline autos_processo.pdf \
  --tipo recurso-especial \
  --output recurso_especial_final.md \
  --format docx

# Diagnóstico + Jurimetria + Auditoria
rom diagnostico minuta.docx --output diag.md
rom jurimetria "dano moral acidente trânsito STJ" --output jurim.md
rom auditar minuta.docx --output audit.md

# Workflow tradicional
rom workflow analise-completa processo.pdf
```

---

## 🌐 API REST

### Base URL

```
http://localhost:3000/api/orchestrator
```

### Endpoints

#### Saúde e Estatísticas

```http
GET /health              # Health check completo
GET /stats               # Estatísticas gerais
```

#### Workflows

```http
GET  /workflows/active               # Workflows ativos
GET  /workflows/history?limit=50     # Histórico
GET  /workflows/:workflowId          # Detalhes de workflow
```

#### Agentes

```http
GET /agents/performance?period=24h   # Performance agregada
GET /agents/:agentId/metrics         # Métricas de agente
GET /agents/:agentId/state           # Estado atual
```

#### Eventos

```http
GET /events?topic=agent.started&limit=100  # Eventos recentes
GET /events/stream                         # SSE stream
```

#### Auditoria

```http
GET /audit/rom?workflowId=xxx   # Logs de auditoria
GET /audit/stats                # Estatísticas de auditoria
```

#### MCP Servers

```http
GET  /mcp/status                      # Status dos servidores
POST /mcp/:serverName/invoke         # Invocar ferramenta
POST /mcp/:serverName/start          # Iniciar servidor
POST /mcp/:serverName/stop           # Parar servidor
GET  /mcp/metrics                    # Métricas MCP
```

---

## 🚀 Deployment e Configuração

### Variáveis de Ambiente

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Redis (opcional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Server
NODE_ENV=production
PORT=3000
```

### Inicialização

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com migrations
node scripts/start-with-migrations.js
```

### Migrations PostgreSQL

```bash
# Aplicar migrations
npm run db:migrate

# Rollback (se necessário)
npm run db:rollback

# Status
npm run db:status
```

### Build MCP Servers

```bash
cd projeto-rom-completo/rom-agent/mcp/autos
npm install && npm run build

cd ../jurisprudencia
npm install && npm run build

cd ../tribunais2grau
npm install && npm run build
```

### Validação Completa

```bash
# Validar todo o sistema
npm run validate:system

# Testes de integração
node tests/orchestrator/run-all-tests.js
```

---

## 🔧 Troubleshooting

### Dashboard não carrega

**Problema**: Dashboard mostra "Conectando..." indefinidamente

**Solução**:
```bash
# Verificar se o servidor está rodando
curl http://localhost:3000/api/orchestrator/health

# Verificar logs do servidor
npm start

# Verificar se PostgreSQL está acessível
psql $DATABASE_URL -c "SELECT 1"
```

### MCP Servers não iniciam

**Problema**: Servidores MCP aparecem como "stopped" ou "error"

**Solução**:
```bash
# Verificar se os servidores foram buildados
ls projeto-rom-completo/rom-agent/mcp/autos/dist/

# Buildar manualmente
cd projeto-rom-completo/rom-agent/mcp/autos
npm run build

# Verificar logs no dashboard ou via API
curl http://localhost:3000/api/orchestrator/mcp/status
```

### EventBus não publica eventos

**Problema**: Stream de eventos no dashboard está vazio

**Solução**:
```bash
# Verificar se há workflows ativos
curl http://localhost:3000/api/orchestrator/workflows/active

# Executar um workflow de teste
rom pipeline test.pdf --tipo recurso

# Verificar eventos recentes via API
curl http://localhost:3000/api/orchestrator/events
```

### Cache Hit Rate baixo (<50%)

**Problema**: Redis não está funcionando corretamente

**Solução**:
```bash
# Verificar conexão Redis
redis-cli ping

# Verificar configuração
echo $REDIS_URL

# Reiniciar Redis
redis-server --daemonize yes

# Limpar cache se necessário
redis-cli FLUSHDB
```

### Workflows travados em "running"

**Problema**: Workflow não completa e fica em estado "running"

**Solução**:
```bash
# Verificar logs do agente
tail -f logs/app.log

# Verificar se há erros na API do Anthropic
# (rate limits, API key inválida, etc.)

# Reiniciar servidor
npm restart

# Limpar workflows ativos manualmente (último recurso)
DELETE FROM workflow_executions WHERE status = 'running';
```

---

## 📚 Referências

- **Projeto ROM-Completo**: `projeto-rom-completo/rom-agent/CLAUDE.md`
- **Metodologia ROM**: `knowledge/metodologia-rom.md`
- **Súmulas de Admissibilidade**: `knowledge/sumulas-admissibilidade.md`
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Anthropic API**: https://docs.anthropic.com/

---

## 📄 Changelog

### v3.0.0 (2026-06-14)
- ✅ Sistema Multi-Agente completo
- ✅ 20 Agentes (13 originais + 7 ROM-Completo)
- ✅ Pipeline ROM de 5 etapas
- ✅ Dashboard em tempo real com SSE
- ✅ 3 Servidores MCP integrados
- ✅ EventBus para comunicação assíncrona
- ✅ StateManager com PostgreSQL + Redis
- ✅ API REST completa (17 endpoints)
- ✅ Testes de integração
- ✅ Documentação completa

---

**© 2026 Rodolfo Otávio Mota Advogados Associados S/S**
**ROM Agent v3.0 - Sistema Multi-Agente para Produção Jurídica**
