# 🗺️ ROADMAP COMPLETO - ROM Agent v2.8.0 até Conclusão

**Data Início**: 2026-02-26
**Previsão Conclusão**: 2026-03-19 (3 semanas)
**Status Atual**: 🟡 Fase 1 implementada, aguardando deploy

---

## 📅 TIMELINE VISUAL

```
SEMANA 1 (26/02 - 04/03): FASE 1 - DEPLOY E ESTABILIZAÇÃO
├─ Dia 1-2: Deploy staging + validação
├─ Dia 3-4: Deploy produção + monitoring 24h
├─ Dia 5-7: Resolver login + Auditoria UI/UX completa
└─ Entregável: Sistema estável, timeouts eliminados, UI auditada

SEMANA 2 (05/03 - 11/03): CORREÇÕES UI + FASE 2 INÍCIO
├─ Dia 1-3: Fixes UI/UX ("preto chapado" + todos bugs encontrados)
├─ Dia 4-5: Implementar Fase 2 (cache + performance)
├─ Dia 6-7: Testes Fase 2 + deploy staging
└─ Entregável: UI corrigida, performance otimizada

SEMANA 3 (12/03 - 19/03): FASE 3 + CONCLUSÃO
├─ Dia 1-3: Implementar Fase 3 (observability)
├─ Dia 4-5: Deploy produção Fase 3
├─ Dia 6-7: Documentação final + handoff
└─ Entregável: Sistema completo, monitorado, documentado

```

---

## 🎯 FASE 1: ESTABILIZAÇÃO E TIMEOUT ELIMINATION

**Status**: ✅ Implementada (código pronto, aguardando deploy)
**Duração**: 3-4 dias
**Data**: 26/02 - 01/03

### Objetivos
- Eliminar timeouts no cold start (33-55s → <10s)
- Ativar cluster mode com memory config correta
- Estabilizar workers (eliminar OOM kills)
- Implementar tool timeouts (30-45s)

### Tarefas

#### Dia 1 (26/02) - ✅ COMPLETO
- [x] Implementar Fix 1.1: Async DB initialization
- [x] Implementar Fix 1.2: Memory config (2 workers × 1.5GB)
- [x] Implementar Fix 1.3: Pre-warm Bedrock client
- [x] Implementar Fix 1.4: Tool execution timeouts
- [x] Implementar Fix 1.5: Timeout layer consistency
- [x] Validar sintaxe de todos os arquivos
- [x] Criar documentação completa

#### Dia 2 (27/02) - 🔄 EM ANDAMENTO
- [ ] **DECISÃO**: Aprovar deploy staging
- [ ] Testar localmente (opcional)
  ```bash
  npm run web:cluster
  # Verificar startup <5s
  # Verificar primeira request <10s
  # Verificar 2 workers ativos
  ```
- [ ] Commit das mudanças
  ```bash
  git add .
  git commit -m "Phase 1: Strategic timeout fixes + cluster mode activation

  - Fix 1.1: Async DB initialization (non-blocking startup)
  - Fix 1.2: Memory config (2 workers × 1.5GB = 3GB safe)
  - Fix 1.3: Pre-warm Bedrock client (eager init)
  - Fix 1.4: Tool execution timeouts (30-45s per tool)
  - Fix 1.5: Timeout layer consistency (SSE bypass)

  Expected results:
  - Cold start: 18-20s → <5s (75% reduction)
  - First request: 33-55s → <10s (70% reduction)
  - Memory stable: <3.8GB (no OOM kills)
  - Tools never hang >45s"
  ```
- [ ] Deploy staging
  ```bash
  git checkout -b staging
  git push origin staging
  # Render staging auto-deploys
  ```
- [ ] Monitorar logs staging
  ```bash
  render logs -s rom-agent-staging --tail
  # Verificar startup time
  # Verificar cluster mode ativo
  # Verificar sem erros
  ```

#### Dia 3 (28/02) - Validação Staging
- [ ] Forçar restart staging para testar cold start
  ```bash
  render services restart rom-agent-staging
  # Medir tempo até health check OK
  # Esperado: <5 segundos
  ```
- [ ] Testes funcionais em staging
  - [ ] Chat: Primeira request <10s
  - [ ] Chat: Requests subsequentes <5s
  - [ ] Pesquisa jurisprudência com timeout 45s
  - [ ] Upload KB e extração <60s
  - [ ] Geração de documento
- [ ] Validar métricas Render
  - [ ] Memory usage <3.8GB (95% de 4GB)
  - [ ] 2 workers ativos (não 1, não 4)
  - [ ] Nenhum worker restart espontâneo
  - [ ] CPU usage normal (<80%)
- [ ] Se tudo OK: **GO para produção**

#### Dia 4 (01/03) - Deploy Produção
- [ ] Review final do código
- [ ] Merge staging → main
  ```bash
  git checkout main
  git merge staging --no-ff
  git push origin main
  # Render produção auto-deploys
  ```
- [ ] **ATENÇÃO**: 6 usuários ativos em produção
  - [ ] Comunicar usuários sobre deploy (30s downtime)
  - [ ] Horário recomendado: Fora do horário comercial
- [ ] Monitorar deploy em tempo real
  - [ ] Render dashboard: https://dashboard.render.com
  - [ ] Logs: `render logs -s rom-agent --tail`
  - [ ] Health checks: `watch curl https://iarom.com.br/api/info`
- [ ] Validação produção (primeiras 2h)
  - [ ] Server startup OK (logs sem erro)
  - [ ] Health check responde /api/info
  - [ ] Cluster mode ativo: `"pid": 51, "workers": 2`
  - [ ] Memory normal: RSS <1500 MB por worker
  - [ ] Chat funciona sem timeout
- [ ] Smoke tests
  ```bash
  # Test 1: Chat simples
  curl -X POST https://iarom.com.br/api/chat/stream \
    -d '{"message":"Olá, como você está?"}' --no-buffer

  # Test 2: Pesquisa jurisprudência
  curl -X POST https://iarom.com.br/api/chat/stream \
    -d '{"message":"Pesquise jurisprudência sobre prisão preventiva no STJ"}' \
    --no-buffer --max-time 60

  # Test 3: Info endpoint
  curl https://iarom.com.br/api/info | jq
  ```

#### Dia 4-7 (01-04/03) - Monitoramento 24-48h
- [ ] Verificar métricas a cada 4h (primeiras 24h)
  - [ ] Memory trends (deve manter <3.8GB)
  - [ ] Response time trends (deve manter <10s)
  - [ ] Error rate (deve ser <1%)
  - [ ] Worker restarts (deve ser <1/dia)
- [ ] Testar cold start forçando restart
  ```bash
  # Horário: Fora do comercial
  render services restart rom-agent
  # Medir tempo até primeira resposta OK
  ```
- [ ] Coletar feedback dos 6 usuários
  - [ ] Chat está mais rápido?
  - [ ] Algum erro ou comportamento estranho?
  - [ ] Upload de documentos OK?
- [ ] Se houver problemas: Rollback imediato
  ```bash
  git revert HEAD
  git push origin main
  # Render auto-deploys versão anterior
  ```

### Critérios de Sucesso Fase 1
- ✅ Cold start <5s (99% das vezes)
- ✅ Primeira request <10s
- ✅ Memory usage <3.8GB estável
- ✅ 2 workers ativos sempre
- ✅ Zero OOM kills em 48h
- ✅ Tool timeouts funcionando (nunca >45s)
- ✅ Zero erros críticos nos logs
- ✅ Usuários reportam melhoria de performance

---

## 🔍 FASE 1.5: AUDITORIA UI/UX COMPLETA

**Status**: 🔴 Bloqueado (login não funciona)
**Duração**: 2-3 dias (após resolver login)
**Data**: 02-04/03 (paralelo com monitoramento Fase 1)

### Objetivos
- Resolver login em produção
- Auditar TODAS as páginas do dashboard
- Identificar e documentar TODOS os bugs visuais
- **Prioridade #1**: Resolver "preto chapado" (reportado 200x)

### Pré-requisito: Resolver Login

#### Opção A: Verificar Credenciais (15 min)
- [ ] Confirmar com usuário:
  - Email: `rodolfo@rom.adv.br` (correto?)
  - Senha: `Mota2323` (foi alterada?)
  - Usar outro email/senha?

#### Opção B: Criar Novo Usuário Admin (30 min)
- [ ] Verificar se existe script create-admin
  ```bash
  ls scripts/create-admin*.js
  ```
- [ ] Executar script (se existe)
  ```bash
  node scripts/create-admin-user.js \
    --email admin@rom.adv.br \
    --password AdminTest123 \
    --name "Admin Teste" \
    --role admin
  ```
- [ ] OU criar manualmente via database
  ```sql
  -- Conectar ao PostgreSQL
  psql $DATABASE_URL

  -- Criar usuário admin
  INSERT INTO users (email, password_hash, name, role, created_at)
  VALUES (
    'admin@rom.adv.br',
    crypt('AdminTest123', gen_salt('bf')),
    'Admin Teste',
    'admin',
    NOW()
  );
  ```

#### Opção C: Verificar Database (15 min)
- [ ] Conectar ao PostgreSQL
  ```bash
  psql postgresql://rom_agent_user:faPSk0YSNlhyPfBYpri2RcK9XdRbaE8L@dpg-d5819bhr0fns73dmfsv0-a/rom_agent
  ```
- [ ] Listar usuários existentes
  ```sql
  SELECT id, email, name, role, created_at
  FROM users
  ORDER BY created_at DESC
  LIMIT 10;
  ```
- [ ] Verificar se rodolfo@rom.adv.br existe
  ```sql
  SELECT * FROM users WHERE email = 'rodolfo@rom.adv.br';
  ```
- [ ] Reset senha se necessário
  ```sql
  UPDATE users
  SET password_hash = crypt('NovaSenha123', gen_salt('bf'))
  WHERE email = 'rodolfo@rom.adv.br';
  ```

#### Opção D: Analisar Logs de Auth (10 min)
- [ ] Buscar erros de autenticação
  ```bash
  render logs -s rom-agent --tail 1000 | grep -i "login\|auth\|password"
  ```
- [ ] Procurar por:
  - "User not found"
  - "Invalid password"
  - "Auth error"
  - Stack traces relacionados

### Auditoria Visual (após login OK)

#### Dashboard Principal (30 min)
- [ ] Fazer login em https://iarom.com.br
- [ ] Screenshot da tela inicial
- [ ] Verificar:
  - [ ] Layout está organizado?
  - [ ] Menu de navegação funciona?
  - [ ] Cards/widgets carregam?
  - [ ] Tema (dark/light) funciona?
  - [ ] Responsive em mobile?
- [ ] Documentar issues encontradas com screenshots

#### "Preto Chapado" - PRIORIDADE #1 (1h)
```
Descrição do usuário:
"janela de abertura de redação, que inclusive ainda que está
com um preto chapado que já pedi duzentas vezes pra trocar pq
está um preto chapado nada organico, usual e estetico"
```

- [ ] Localizar "janela de abertura de redação"
  - Onde está? (botão "Nova Redação"? Modal? Sidebar?)
- [ ] Screenshot do problema
  - Capturar elemento com "preto chapado"
  - Capturar contexto ao redor
- [ ] Identificar CSS responsável
  - Inspecionar elemento no DevTools
  - Identificar classe CSS ou inline style
  - Copiar CSS atual
- [ ] Propor soluções
  - Opção A: Cor sólida mais suave (ex: #2a2a2a em vez de #000000)
  - Opção B: Gradiente sutil (ex: linear-gradient(to bottom, #1a1a1a, #2a2a2a))
  - Opção C: Transparência com backdrop blur (ex: rgba(0,0,0,0.8) + blur(10px))
  - Opção D: Seguir design system (Material, Tailwind, etc)
- [ ] Criar mockup da solução
- [ ] Validar com usuário antes de implementar

#### Todas as Páginas (2-3h)
- [ ] Chat Page
  - [ ] Interface de chat funciona?
  - [ ] Messages aparecem corretamente?
  - [ ] Streaming funciona?
  - [ ] Syntax highlighting de código?
  - [ ] Markdown renderiza?
- [ ] KB (Knowledge Base) Page
  - [ ] Lista de documentos aparece?
  - [ ] Upload funciona?
  - [ ] Extração funciona?
  - [ ] Tempo de extração aceitável (<60s)?
  - [ ] Ficheiros gerados aparecem?
- [ ] Case Processor
  - [ ] Upload de processo funciona?
  - [ ] Análise completa funciona?
  - [ ] Resultados aparecem formatados?
- [ ] Certidões DJE
  - [ ] Formulário funciona?
  - [ ] Pesquisa retorna resultados?
  - [ ] Export funciona?
- [ ] Custom Instructions
  - [ ] Lista de instructions aparece?
  - [ ] Criar nova instruction funciona?
  - [ ] Editar funciona?
  - [ ] Delete funciona?
  - [ ] Aplicar em chat funciona?
- [ ] Projetos
  - [ ] Lista de projetos aparece?
  - [ ] Criar projeto funciona?
  - [ ] Associar documentos funciona?
- [ ] Settings
  - [ ] Configurações aparecem?
  - [ ] Salvar funciona?
  - [ ] API keys (se houver) estão seguras?
- [ ] Histórico de Conversas
  - [ ] Lista aparece?
  - [ ] Buscar funciona?
  - [ ] Reabrir conversa funciona?
  - [ ] Delete funciona?

#### Testes Funcionais End-to-End (2h)

**Workflow 1: KB Upload e Consulta**
- [ ] Step 1: Upload PDF de processo (10-50 páginas)
- [ ] Step 2: Aguardar extração completa
  - Tempo esperado: <60s
  - Ficheiros gerados: 18
- [ ] Step 3: Ir para Chat
- [ ] Step 4: Perguntar sobre o processo
  - Ex: "Qual o autor e réu deste processo?"
  - Ex: "Resuma os pedidos principais"
- [ ] Step 5: Verificar que respostas usam KB
  - Deve citar trechos do documento
  - Deve referenciar ficheiros técnicos

**Workflow 2: Geração de Documentos**
- [ ] Step 1: Novo chat
- [ ] Step 2: Prompt específico
  - Ex: "Redija uma petição inicial de ação de cobrança contra João Silva, CPF 123.456.789-00, no valor de R$ 10.000,00 referente a contrato de prestação de serviços"
- [ ] Step 3: Aguardar resposta completa
- [ ] Step 4: Verificar formatação
  - Cabeçalho correto?
  - Parágrafos numerados?
  - Pedidos ao final?
  - Qualidade jurídica adequada?
- [ ] Step 5: Export para Word
  - Baixar .docx
  - Abrir no Word/LibreOffice
  - Verificar formatação mantida

**Workflow 3: Pesquisa de Jurisprudência**
- [ ] Step 1: Novo chat
- [ ] Step 2: Prompt de pesquisa
  - Ex: "Pesquise jurisprudência do STJ sobre prisão preventiva nos últimos 5 anos"
- [ ] Step 3: Verificar timeout funcionando
  - Deve responder em <45s (timeout da tool)
  - Se >45s, deve retornar fallback message
- [ ] Step 4: Verificar qualidade dos resultados
  - Ementas completas?
  - Metadados (processo, relator, data)?
  - Links para tribunais?
  - Deduplicação funcionando?

### Documentação (1h)
- [ ] Criar `AUDITORIA_UI_UX_COMPLETA.md`
- [ ] Para cada bug encontrado:
  - [ ] Screenshot + descrição
  - [ ] Prioridade (P0 crítico, P1 alto, P2 médio, P3 baixo)
  - [ ] Proposta de solução
  - [ ] Estimativa de tempo de fix
- [ ] Criar lista priorizada de fixes
- [ ] Validar priorização com usuário

### Critérios de Sucesso Fase 1.5
- ✅ Login funciona com credenciais corretas
- ✅ Todas as 10+ páginas auditadas
- ✅ "Preto chapado" identificado e solução proposta
- ✅ Todos bugs documentados com screenshots
- ✅ Workflows end-to-end funcionam
- ✅ Lista priorizada de fixes criada

---

## 🎨 FASE 1.6: CORREÇÕES UI/UX

**Status**: ⏸️ Aguardando conclusão Fase 1.5
**Duração**: 2-3 dias
**Data**: 05-07/03

### Objetivos
- Implementar TODOS os fixes UI identificados na Fase 1.5
- Prioridade #1: Resolver "preto chapado"
- Validar visualmente cada fix com usuário

### Tarefas

#### Dia 1 (05/03) - Fixes Críticos (P0)
- [ ] Fix "Preto Chapado"
  - [ ] Identificar arquivo CSS/componente
  - [ ] Implementar solução aprovada pelo usuário
  - [ ] Testar em diferentes resoluções
  - [ ] Validar com usuário
- [ ] Outros bugs P0 (se houver)
  - [ ] Implementar fixes
  - [ ] Testar end-to-end
  - [ ] Deploy staging para validação

#### Dia 2 (06/03) - Fixes Altos (P1)
- [ ] Implementar todos bugs P1
- [ ] Testes de regressão (garantir que não quebrou nada)
- [ ] Deploy staging
- [ ] Validação visual com usuário

#### Dia 3 (07/03) - Fixes Médios/Baixos (P2/P3) + Deploy
- [ ] Implementar bugs P2 e P3 (se tempo permitir)
- [ ] Review final do código
- [ ] Merge staging → main
- [ ] Deploy produção
- [ ] Monitorar por 24h

### Critérios de Sucesso Fase 1.6
- ✅ "Preto chapado" resolvido e aprovado pelo usuário
- ✅ Todos bugs P0 e P1 corrigidos
- ✅ Bugs P2 corrigidos (ou documentados como backlog)
- ✅ Zero regressões introduzidas
- ✅ Usuário satisfeito com UI/UX

---

## ⚡ FASE 2: PERFORMANCE OPTIMIZATION

**Status**: 🟢 Planejado (após Fase 1 estável por 1 semana)
**Duração**: 5-7 dias
**Data**: 08-14/03

### Objetivos
- Reduzir latência de primeira request de 10s para <5s
- Cache hit rate >80%
- Throughput 50 req/s (load test)
- P95 latency <5s

### Tarefas

#### Sprint 2.1: Cache Hierarchical Context (2 dias)
- [ ] Implementar cache Redis para context building
  ```javascript
  // src/services/conversation-memory-service.js
  async function buildHierarchicalContext(userId) {
    const cacheKey = `context:${userId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build context (expensive query)
    const context = await expensiveQuery();

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(context));

    return context;
  }
  ```
- [ ] TTL configurável (default: 5 min)
- [ ] Cache invalidation ao criar nova conversa
- [ ] Métricas de hit rate
- [ ] Testes: antes (15s query) vs depois (<500ms)

#### Sprint 2.2: Connection Pooling (1 dia)
- [ ] Analisar pool atual (max: 20, min: 2)
- [ ] Otimizar para 2 workers
  - Sugestão: max: 10-15 per worker
  - Total: 20-30 connections (safe)
- [ ] Connection warmup on startup
  ```javascript
  // Warm up connections immediately
  async function warmupConnections() {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(pgPool.query('SELECT 1'));
    }
    await Promise.all(promises);
  }
  ```
- [ ] Tune timeouts:
  - connectionTimeoutMillis: 2000 (reduzir de 5000)
  - idleTimeoutMillis: 20000 (reduzir de 30000)

#### Sprint 2.3: Bedrock Inference Profiles (2 dias)
- [ ] Mapear tipos de tarefa → modelo ideal
  ```javascript
  const TASK_TO_MODEL = {
    'simple_chat': 'claude-sonnet-3-5',      // Rápido, barato
    'jurisprudence': 'claude-opus-4',        // Complexo, preciso
    'document_gen': 'claude-opus-4',         // Alta qualidade
    'kb_extraction': 'amazon-nova-micro'     // Já usa
  };
  ```
- [ ] Implementar auto-selection baseado em prompt
- [ ] Benchmark latency por modelo:
  - Sonnet 3.5: ~2-3s (simple tasks)
  - Opus 4: ~5-8s (complex tasks)
- [ ] A/B testing em staging

#### Sprint 2.4: Database Query Optimization (1 dia)
- [ ] Identificar slow queries (>1s)
  ```sql
  -- Enable query logging
  ALTER DATABASE rom_agent SET log_min_duration_statement = 1000;

  -- Find slow queries
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  WHERE mean_time > 1000
  ORDER BY mean_time DESC
  LIMIT 10;
  ```
- [ ] Criar indexes necessários
  - Exemplo: `CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);`
- [ ] Otimizar N+1 queries (usar JOIN)
- [ ] Implementar query result caching

#### Sprint 2.5: Static Asset Caching (1 dia)
- [ ] Configurar cache headers em Express
  ```javascript
  // Static assets: 1 ano
  app.use('/assets', express.static('frontend/dist/assets', {
    maxAge: '1y',
    immutable: true
  }));

  // HTML: no cache
  app.use(express.static('frontend/dist', {
    maxAge: 0
  }));
  ```
- [ ] Implementar CDN (Cloudflare?)
  - Configurar no Render
  - Testar latency de assets (esperado: <100ms global)
- [ ] Service Worker para PWA offline
- [ ] Implementar cache busting (hash no filename)

#### Sprint 2.6: Load Testing (1 dia)
- [ ] Configurar k6 ou Artillery
  ```javascript
  // load-test.js
  import http from 'k6/http';
  import { check } from 'k6';

  export let options = {
    stages: [
      { duration: '1m', target: 10 },   // Warm up
      { duration: '3m', target: 50 },   // Load
      { duration: '1m', target: 0 },    // Cool down
    ],
  };

  export default function () {
    let res = http.post('https://iarom.com.br/api/chat/stream',
      JSON.stringify({ message: 'Olá' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(res, {
      'status 200': (r) => r.status === 200,
      'latency <5s': (r) => r.timings.duration < 5000,
    });
  }
  ```
- [ ] Executar em staging
- [ ] Analisar resultados:
  - P95 latency
  - Throughput (req/s)
  - Error rate
  - Memory/CPU usage
- [ ] Ajustar configurações se necessário

#### Deploy Fase 2
- [ ] Review código Fase 2
- [ ] Deploy staging
- [ ] Validar métricas em staging (3 dias)
- [ ] Deploy produção
- [ ] Monitorar por 1 semana

### Critérios de Sucesso Fase 2
- ✅ Context building: 15s → <500ms (cache hit)
- ✅ Cache hit rate >80%
- ✅ P95 latency <5s
- ✅ Throughput >50 req/s (load test)
- ✅ Database queries <1s (P95)
- ✅ Static assets <100ms (CDN)

---

## 📊 FASE 3: OBSERVABILITY & RESILIÊNCIA

**Status**: 🟢 Planejado (após Fase 2 estável por 1 semana)
**Duração**: 5-7 dias
**Data**: 15-21/03

### Objetivos
- Visibilidade completa do sistema
- Alerting proativo
- Circuit breakers para external APIs
- Auto-scaling configurado
- Uptime SLA 99.9%

### Tarefas

#### Sprint 3.1: OpenTelemetry Distributed Tracing (2 dias)
- [ ] Instalar dependências
  ```bash
  npm install @opentelemetry/api \
    @opentelemetry/sdk-node \
    @opentelemetry/auto-instrumentations-node
  ```
- [ ] Configurar tracer
  ```javascript
  // src/config/telemetry.js
  import { NodeSDK } from '@opentelemetry/sdk-node';
  import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

  const sdk = new NodeSDK({
    serviceName: 'rom-agent',
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  ```
- [ ] Adicionar custom spans para operações críticas
  - Chat request
  - Tool execution
  - KB extraction
  - Document generation
- [ ] Exportar para Jaeger ou Zipkin (self-hosted ou Grafana Cloud)
- [ ] Validar traces no Jaeger UI

#### Sprint 3.2: Circuit Breakers (1 dia)
- [ ] Implementar circuit breaker genérico
  ```javascript
  // src/utils/circuit-breaker.js
  class CircuitBreaker {
    constructor(failureThreshold = 3, timeout = 60000) {
      this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
      this.failureCount = 0;
      this.failureThreshold = failureThreshold;
      this.timeout = timeout;
      this.nextAttempt = Date.now();
    }

    async execute(fn) {
      if (this.state === 'OPEN') {
        if (Date.now() < this.nextAttempt) {
          throw new Error('Circuit breaker is OPEN');
        }
        this.state = 'HALF_OPEN';
      }

      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }

    onSuccess() {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }

    onFailure() {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.timeout;
      }
    }
  }
  ```
- [ ] Aplicar em external APIs:
  - JusBrasil (fallback: cache)
  - CNJ DataJud (fallback: Google Search)
  - Google Search (fallback: internal search)
  - Browserless (fallback: HTTP simple)

#### Sprint 3.3: Prometheus + Grafana (2 dias)
- [ ] Instalar prom-client
  ```bash
  npm install prom-client
  ```
- [ ] Configurar métricas
  ```javascript
  // src/config/metrics.js
  import client from 'prom-client';

  const register = new client.Registry();

  // Default metrics (CPU, memory, etc)
  client.collectDefaultMetrics({ register });

  // Custom metrics
  export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  });

  export const chatLatency = new client.Histogram({
    name: 'chat_latency_seconds',
    help: 'Chat request latency',
    labelNames: ['model'],
    buckets: [1, 2, 5, 10, 20, 30]
  });

  export const toolExecutionDuration = new client.Histogram({
    name: 'tool_execution_duration_seconds',
    help: 'Tool execution duration',
    labelNames: ['tool'],
    buckets: [0.5, 1, 2, 5, 10, 30, 45]
  });

  register.registerMetric(httpRequestDuration);
  register.registerMetric(chatLatency);
  register.registerMetric(toolExecutionDuration);

  export default register;
  ```
- [ ] Endpoint /metrics
  ```javascript
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  ```
- [ ] Configurar Grafana Cloud ou self-hosted
- [ ] Criar dashboards:
  - Overview (requests, errors, latency)
  - Chat performance
  - Tools performance
  - Infrastructure (CPU, memory, disk)
  - Database (connections, queries, latency)

#### Sprint 3.4: Alerting (1 dia)
- [ ] Configurar PagerDuty ou Slack webhooks
- [ ] Definir alertas críticos:
  ```yaml
  # prometheus-alerts.yml
  groups:
    - name: rom-agent-critical
      interval: 30s
      rules:
        - alert: HighLatency
          expr: histogram_quantile(0.95, http_request_duration_seconds) > 10
          for: 5m
          annotations:
            summary: "P95 latency exceeding 10s"

        - alert: HighErrorRate
          expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
          for: 5m
          annotations:
            summary: "Error rate exceeding 5%"

        - alert: HighMemoryUsage
          expr: container_memory_usage_bytes / container_memory_limit_bytes > 0.95
          for: 5m
          annotations:
            summary: "Memory usage exceeding 95%"

        - alert: WorkerRestarts
          expr: rate(worker_restarts_total[5m]) > 2
          for: 1m
          annotations:
            summary: "Worker restart rate exceeding 2/min"
  ```
- [ ] Testar alertas em staging
- [ ] Configurar on-call rotation (se aplicável)

#### Sprint 3.5: Auto-scaling (1 dia)
- [ ] Configurar no Render
  ```yaml
  # render.yaml (adicionar)
  scaling:
    minInstances: 2    # Mínimo: 2 workers
    maxInstances: 4    # Máximo: 4 workers
    targetCPUPercent: 80
    targetMemoryPercent: 85
  ```
- [ ] Definir regras:
  - Scale up: CPU >80% por 5 min
  - Scale down: CPU <30% por 10 min
  - Cool down period: 5 min (evitar flapping)
- [ ] Load testing para validar auto-scaling
  - Aumentar load gradualmente (10 → 50 → 100 req/s)
  - Verificar que scale up acontece
  - Reduzir load (100 → 50 → 10)
  - Verificar que scale down acontece
- [ ] Cost analysis:
  - 2 workers 24/7: $X/mês
  - 4 workers 24/7: $Y/mês
  - Auto-scaling (2-4): $Z/mês (médio)

#### Deploy Fase 3
- [ ] Review código Fase 3
- [ ] Deploy staging
- [ ] Validar observability (traces, metrics, alerts)
- [ ] Deploy produção
- [ ] Monitorar por 1 semana

### Critérios de Sucesso Fase 3
- ✅ Traces visíveis no Jaeger/Zipkin
- ✅ Circuit breakers funcionando (testar forçando falha)
- ✅ Dashboards Grafana completos e úteis
- ✅ Alertas disparam corretamente
- ✅ Auto-scaling funciona (teste de carga)
- ✅ MTTD <5 min (detection)
- ✅ MTTR <15 min (recovery)

---

## 📚 FASE 4: DOCUMENTAÇÃO E HANDOFF

**Status**: 🟢 Planejado
**Duração**: 1-2 dias
**Data**: 18-19/03

### Objetivos
- Documentação completa para manutenção
- Runbooks para incidentes comuns
- Handoff para time de ops (se aplicável)

### Tarefas

#### Documentação Técnica (1 dia)
- [ ] Criar `ARCHITECTURE.md`
  - Diagrama de arquitetura
  - Fluxo de requests
  - Integrações externas
  - Database schema
- [ ] Criar `DEPLOYMENT.md`
  - Como fazer deploy
  - Rollback procedure
  - Environment variables
  - Secrets management
- [ ] Criar `MONITORING.md`
  - Dashboards disponíveis
  - Alertas configurados
  - Como investigar incidentes
  - Logs e traces
- [ ] Criar `TROUBLESHOOTING.md`
  - Problemas comuns e soluções
  - Como debugar timeout
  - Como debugar OOM
  - Como debugar tool failures

#### Runbooks (1 dia)
- [ ] `RUNBOOK_HIGH_LATENCY.md`
  - Sintomas
  - Causa raiz possíveis
  - Passos de investigação
  - Soluções
- [ ] `RUNBOOK_HIGH_ERROR_RATE.md`
- [ ] `RUNBOOK_MEMORY_LEAK.md`
- [ ] `RUNBOOK_DATABASE_ISSUES.md`
- [ ] `RUNBOOK_EXTERNAL_API_DOWN.md`

#### Handoff (se aplicável)
- [ ] Sessão de treinamento (1-2h)
- [ ] Demo das ferramentas (Grafana, Jaeger, Render)
- [ ] Q&A
- [ ] Documentos compartilhados

### Critérios de Sucesso Fase 4
- ✅ Documentação completa e revisada
- ✅ Runbooks testados em staging
- ✅ Time de ops treinado (se aplicável)
- ✅ Zero dúvidas pendentes

---

## 🎯 CRITÉRIOS DE SUCESSO FINAL (PROJETO COMPLETO)

### Técnicos
- ✅ Cold start <5s (P99)
- ✅ Primeira request <10s (P95)
- ✅ Requests subsequentes <5s (P95)
- ✅ Memory usage <90% estável
- ✅ Uptime >99.5% (30 dias)
- ✅ Error rate <1%
- ✅ Tool timeouts funcionando 100%
- ✅ Cache hit rate >80%
- ✅ Throughput >50 req/s

### UX/UI
- ✅ "Preto chapado" resolvido e validado
- ✅ Todas páginas funcionais
- ✅ Zero bugs críticos (P0/P1)
- ✅ Responsive mobile OK
- ✅ KB workflow completo funciona
- ✅ Document generation funciona

### Observability
- ✅ Distributed tracing ativo
- ✅ Dashboards Grafana completos
- ✅ Alertas configurados e testados
- ✅ Circuit breakers funcionando
- ✅ Auto-scaling validado

### Documentação
- ✅ Arquitetura documentada
- ✅ Deployment procedures documentadas
- ✅ Troubleshooting guides criados
- ✅ Runbooks completos

### Negócio
- ✅ 6 usuários satisfeitos
- ✅ Zero downtime não planejado (30 dias)
- ✅ Performance percebida melhorou significativamente
- ✅ Sistema pronto para escalar (10x+ usuários)

---

## 📊 MILESTONES E CHECKPOINTS

### Milestone 1: Estabilização (01/03)
- ✅ Fase 1 deployed em produção
- ✅ Timeouts eliminados
- ✅ Cluster mode ativo
- ✅ 48h sem incidentes

### Milestone 2: UI/UX Completo (07/03)
- ✅ Login funcionando
- ✅ UI auditada completa
- ✅ "Preto chapado" resolvido
- ✅ Todos bugs P0/P1 corrigidos

### Milestone 3: Performance (14/03)
- ✅ Fase 2 deployed
- ✅ Cache implementado
- ✅ P95 latency <5s
- ✅ Load test aprovado (50 req/s)

### Milestone 4: Observability (21/03)
- ✅ Fase 3 deployed
- ✅ Tracing ativo
- ✅ Alertas funcionando
- ✅ Auto-scaling validado

### Milestone 5: Conclusão (19/03)
- ✅ Documentação completa
- ✅ Runbooks criados
- ✅ Handoff realizado
- ✅ Projeto encerrado

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Deploy Fase 1 causa downtime | Média | Alto | Deploy staging primeiro, horário off-peak |
| Login nunca resolve | Baixa | Alto | Criar novo usuário admin via database |
| Fase 1 não resolve timeout | Baixa | Crítico | Rollback imediato, investigar em staging |
| Usuários reportam bugs não encontrados | Média | Médio | Beta testing com 2 usuários antes de full deploy |
| External API down (Google, CNJ) | Média | Médio | Circuit breakers (Fase 3) |
| Memory leak não detectado | Baixa | Alto | Monitoramento 24/7, alertas configurados |
| Auto-scaling não funciona | Média | Baixo | Configuração conservadora (min: 2, max: 4) |
| Budget excedido | Baixa | Médio | Cost analysis antes de cada fase |

---

## 💰 ESTIMATIVA DE ESFORÇO

| Fase | Duração | Complexidade | Risco |
|------|---------|--------------|-------|
| **Fase 1: Estabilização** | 3-4 dias | Alta | Médio |
| **Fase 1.5: Auditoria UI** | 2-3 dias | Média | Baixo |
| **Fase 1.6: Correções UI** | 2-3 dias | Média | Baixo |
| **Fase 2: Performance** | 5-7 dias | Alta | Médio |
| **Fase 3: Observability** | 5-7 dias | Média | Baixo |
| **Fase 4: Documentação** | 1-2 dias | Baixa | Baixo |
| **Total** | **18-26 dias** | - | - |

**Estimativa conservadora**: 3 semanas (21 dias úteis)

---

**Status**: 🟡 Fase 1 implementada, aguardando decisões e deploy
**Próximo Passo**: Aprovar deploy staging + Resolver login
**ETA Conclusão**: 19/03/2026 (3 semanas)
