# 🎯 PLANO NA MESA - ROM Agent v2.8.0
**Objetivo**: Eliminar timeout no chat em produção (Render)
**Data**: 2026-02-26
**Status**: 🟡 EM ANDAMENTO

---

## 📊 VISÃO GERAL DO PROBLEMA

```
┌────────────────────────────────────────────────────────────┐
│ SITUAÇÃO ATUAL EM PRODUÇÃO (RENDER)                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ❌ Chat dá TIMEOUT já na primeira requisição              │
│ ❌ 6 usuários ativos NÃO conseguem usar o sistema         │
│ ❌ Cold start: 18-20 segundos (DB+Redis bloqueiam)        │
│ ❌ Primeira request: +15-35s (context + AWS SDK lazy)     │
│ ❌ Total: 33-55s até resposta → EXCEDE 60s proxy timeout  │
│ ❌ Memory: 4 workers × 3GB = 12GB > 4GB disponível        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ O QUE JÁ FOI FEITO (Fixes Táticos - Varejo)

### Status: ✅ IMPLEMENTADO MAS NÃO RESOLVEU O PROBLEMA PRINCIPAL

| # | Fix | Arquivo | Status | Impacto Real |
|---|-----|---------|--------|--------------|
| 1 | ENOTFOUND bedrock DNS | `semantic-search-service.js:24` | ✅ FEITO | Elimina 6.976 erros de DNS |
| 2 | EADDRINUSE cluster mode | `server-enhanced.js` + `server-cluster.js` | ✅ FEITO | Elimina 10.806 erros porta |
| 3 | .env development config | `.env` | ✅ FEITO | Redis/PG opcionais local |
| 4 | Paralelização LLM KB | `gerador-18-ficheiros.js` | ✅ FEITO | KB 2x mais rápido (130s→60s) |

**⚠️ PROBLEMA**: Estes fixes melhoram **sintomas** mas NÃO resolvem o **timeout em produção**.

**Por quê?**
- Fixes 1-3: Corrigem erros de configuração mas **DB ainda bloqueia startup**
- Fix 4: Acelera KB extraction mas **não afeta chat timeout**

**❌ Resultado**: Sistema continua dando timeout no chat em produção.

---

## 🚨 O QUE FALTA FAZER (Fixes Estratégicos - Causas Raiz)

### FASE 1: Correções Críticas de Infraestrutura

```
┌────────────────────────────────────────────────────────────┐
│ PRIORIDADE MÁXIMA - DEPLOY IMEDIATO                       │
│ Estimativa: 4-6 horas de implementação                    │
│ Objetivo: Sistema funcional sem timeouts em <10s          │
└────────────────────────────────────────────────────────────┘
```

| # | Fix | Arquivo(s) | Status | Impacto Esperado | Tempo |
|---|-----|------------|--------|------------------|-------|
| **1.1** | **Async DB Init** | `database.js` + `server-enhanced.js` | 🔴 **PENDENTE** | Cold start 18s → 2s | 1h |
| **1.2** | **Memory Config** | `render.yaml` | 🔴 **PENDENTE** | 4×3GB → 2×1.5GB (cabe em 4GB) | 30min |
| **1.3** | **Pre-warm Bedrock** | `bedrock.js` | 🔴 **PENDENTE** | Elimina 500ms lazy load | 30min |
| **1.4** | **Tool Timeouts** | `bedrock-tools.js` | 🔴 **PENDENTE** | Tools nunca travam >45s | 2h |
| **1.5** | **Timeout Consistency** | `timeout-handler.js` + `chat-stream.js` | 🔴 **PENDENTE** | Elimina conflitos | 1h |

**✅ Resultado Esperado**: Chat responde em <10s na primeira request, cold start <5s.

---

## 🔍 DETALHAMENTO DAS CAUSAS RAIZ

### Causa #1: Database Initialization Bloqueante (CRÍTICO) 🔴

**Status**: 🔴 NÃO RESOLVIDO

```javascript
// ❌ PROBLEMA ATUAL (database.js:84)
await pgPool.query('SELECT NOW()');  // BLOQUEIA 5s
await redisClient.connect();         // BLOQUEIA 10s
// TOTAL: 15 segundos de bloqueio no startup
```

**Impacto**:
- ✅ Fix #2 (EADDRINUSE) permite workers iniciarem
- ❌ MAS cada worker bloqueia 15s esperando DB
- ❌ Cold start total: 15-20s (inaceitável)
- ❌ Render health check pode falhar (timeout 60s)

**Solução (Fix 1.1)**:
```javascript
// ✅ SOLUÇÃO
initPostgres();  // Fire and forget (não bloqueia)
initRedis();     // Fire and forget
// Server inicia em 2s, DB conecta em background
```

**Arquivos a modificar**:
1. `src/config/database.js` (lines 82-95, 218-220)
2. `src/server-enhanced.js` (lines 248-308)

---

### Causa #2: Memory Overflow (CRÍTICO) 🔴

**Status**: 🔴 NÃO RESOLVIDO

```
❌ CONFIGURAÇÃO ATUAL:
Container: 4GB RAM (Render Pro)
├─ System/OS: 512 MB
├─ Primary process: 100 MB
└─ Workers: 4 × 3072 MB = 12,288 MB
─────────────────────────────────────
TOTAL: 12,900 MB > 4096 MB ❌ OVERFLOW

RESULTADO: OOM kills, workers morrem, reinícios constantes
```

**Solução (Fix 1.2)**:
```
✅ NOVA CONFIGURAÇÃO:
Container: 4GB RAM
├─ System/OS: 512 MB
├─ Primary process: 256 MB
└─ Workers: 2 × 1536 MB = 3,072 MB
─────────────────────────────────────
TOTAL: 3,840 MB < 4096 MB ✅ SAFE
```

**Arquivo a modificar**:
- `render.yaml` (line 15: WEB_CONCURRENCY=2, line 22: max-old-space-size=1536)

---

### Causa #3: Lazy AWS SDK Initialization (HIGH) 🟡

**Status**: 🔴 NÃO RESOLVIDO

```javascript
// ❌ PROBLEMA ATUAL (bedrock.js:201)
let runtimeClient = null;
function getBedrockRuntimeClient() {
  if (!runtimeClient) {
    runtimeClient = new BedrockRuntimeClient({...});  // Primeira request paga o custo
  }
  return runtimeClient;
}
```

**Impacto**:
- Primeira request de chat: +100-500ms para inicializar SDK
- AWS credentials chain lookup
- DNS resolution + TLS handshake
- **Adiciona latência desnecessária**

**Solução (Fix 1.3)**:
```javascript
// ✅ SOLUÇÃO
let runtimeClient = new BedrockRuntimeClient({...});  // Eager init no startup

function getBedrockRuntimeClient() {
  return runtimeClient;  // Já inicializado
}
```

**Arquivo a modificar**:
- `src/modules/bedrock.js` (lines 199-209)

---

### Causa #4: Tool Execution Sem Timeout (CRÍTICO) 🔴

**Status**: 🔴 NÃO RESOLVIDO

```javascript
// ❌ PROBLEMA ATUAL (bedrock-tools.js)
export async function pesquisar_jurisprudencia(params) {
  const results = await fetch(API_URL);  // Pode travar indefinidamente
  return results;
}
// Nenhum timeout configurado em NENHUMA das 6 tools
```

**Impacto**:
- Se JusBrasil API trava → request trava
- Se CNJ DataJud trava → request trava
- Bedrock espera tool result indefinidamente
- **Chat pode ficar travado por minutos/horas**

**Solução (Fix 1.4)**:
```javascript
// ✅ SOLUÇÃO: Wrapper com timeout
async function executeToolWithTimeout(toolFn, params, timeoutMs = 30000) {
  return Promise.race([
    toolFn(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tool timeout')), timeoutMs)
    )
  ]);
}
```

**Arquivo a modificar**:
- `src/modules/bedrock-tools.js` (adicionar wrapper, aplicar em 6 tools)

---

### Causa #5: Multiple Timeout Layers Conflitantes (MEDIUM) 🟡

**Status**: 🔴 NÃO RESOLVIDO

```javascript
// ❌ PROBLEMA: 3 layers de timeout diferentes
// Layer 1: SLO config (1.2M ms)
// Layer 2: Middleware timeout (30s para sync, pode matar SSE)
// Layer 3: Route-level override (1.2M ms)

// Qual prevalece? Middleware pode matar request de chat antes!
```

**Solução (Fix 1.5)**:
```javascript
// ✅ SOLUÇÃO: Bypass middleware para SSE
if (req.path === '/api/chat/stream') {
  req._bypassTimeout = true;
  return next();
}
```

**Arquivos a modificar**:
- `src/middleware/timeout-handler.js` (bypass SSE routes)
- `src/routes/chat-stream.js` (confirmar timeouts + logging)

---

## 📈 TIMELINE DE IMPLEMENTAÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│ DIA 1 (HOJE - 2026-02-26)                                   │
├─────────────────────────────────────────────────────────────┤
│ ⏰ Manhã (4h)                                                │
│   └─ Implementar Fix 1.1 + 1.2 + 1.3 (critical path)       │
│                                                              │
│ ⏰ Tarde (2h)                                                │
│   └─ Implementar Fix 1.4 + 1.5                              │
│                                                              │
│ ⏰ Noite (2h)                                                │
│   └─ Testes locais + validação                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DIA 2 (2026-02-27)                                          │
├─────────────────────────────────────────────────────────────┤
│ ⏰ Manhã (2h)                                                │
│   └─ Deploy staging + testes                                │
│                                                              │
│ ⏰ Tarde (2h)                                                │
│   └─ Deploy produção 50% + monitoramento                    │
│                                                              │
│ ⏰ Noite (2h)                                                │
│   └─ Deploy 100% se métricas OK                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DIA 3-7 (Semana 1)                                          │
├─────────────────────────────────────────────────────────────┤
│   └─ Monitoramento 24/7                                     │
│   └─ Coletar feedback dos 6 usuários                        │
│   └─ Documentar métricas antes/depois                       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Métricas Antes vs Depois

| Métrica | Antes (Atual) | Depois (Alvo) | Como Validar |
|---------|---------------|---------------|--------------|
| **Cold Start** | 18-20s | **<5s** | Logs de startup |
| **Primeira Request** | 33-55s (TIMEOUT) | **<10s** | cURL com timer |
| **Request Subsequente** | 5-10s | **<5s** | cURL repetido |
| **Tool Timeout** | Nunca (trava) | **30-45s** | Simular tool lento |
| **Memory Usage** | >4GB (OOM) | **<3.8GB** | Render metrics |
| **Worker Restarts** | Frequente | **Raro** | Logs por 1h |
| **Chat Funcional?** | ❌ NÃO | **✅ SIM** | Teste real usuário |

---

## 🎯 CHECKLIST DE EXECUÇÃO

### Pré-Deploy
- [ ] Revisar TODOS os 5 fixes do código
- [ ] Testar localmente (startup <5s, chat <10s)
- [ ] Validar sintaxe (node --check)
- [ ] Backup configurações atuais (render.yaml)
- [ ] Preparar rollback plan

### Deploy Staging
- [ ] Criar branch `fix/timeout-phase1`
- [ ] Push para GitHub
- [ ] Deploy em Render staging
- [ ] Health check passa (200 OK)
- [ ] Primeira request <10s
- [ ] 10 requests consecutivas OK
- [ ] Memory <3.8GB estável
- [ ] Sem worker restarts em 1h

### Deploy Produção
- [ ] Merge para main (50% traffic)
- [ ] Monitorar por 2h
- [ ] Validar com 2 usuários beta
- [ ] Deploy 100% se OK
- [ ] Notificar todos 6 usuários
- [ ] Monitorar 24h
- [ ] Documentar resultados

---

## 🚨 RISCOS E ROLLBACK

### Triggers para Rollback Imediato

| Situação | Threshold | Ação |
|----------|-----------|------|
| Error rate alto | >5% em 5 min | Rollback |
| Latency alto | P95 >60s | Rollback |
| Memory crítico | >95% | Rollback |
| Worker deaths | >2 por min | Rollback |
| Health check fail | 3x seguidas | Rollback |

### Rollback Command
```bash
git revert HEAD
git push origin main
# Render auto-deploys versão anterior
# Monitorar logs para confirmar estabilidade
```

---

## 📊 DASHBOARD DE PROGRESSO

```
FASE 1: Infraestrutura Crítica
╔════════════════════════════════════════════════╗
║ Fix 1.1: Async DB Init        [🔴 PENDENTE]  ║
║ Fix 1.2: Memory Config         [🔴 PENDENTE]  ║
║ Fix 1.3: Pre-warm Bedrock      [🔴 PENDENTE]  ║
║ Fix 1.4: Tool Timeouts         [🔴 PENDENTE]  ║
║ Fix 1.5: Timeout Consistency   [🔴 PENDENTE]  ║
╟────────────────────────────────────────────────╢
║ Progresso: 0/5 (0%)                            ║
║ Tempo estimado restante: 4-6 horas            ║
╚════════════════════════════════════════════════╝

FASE 2: Performance (Futuro)
╔════════════════════════════════════════════════╗
║ Cache hierarchical context    [⚪ FUTURO]     ║
║ Query optimization             [⚪ FUTURO]     ║
║ Inference profiles             [⚪ FUTURO]     ║
╚════════════════════════════════════════════════╝

FASE 3: Observability (Futuro)
╔════════════════════════════════════════════════╗
║ Distributed tracing            [⚪ FUTURO]     ║
║ Circuit breakers               [⚪ FUTURO]     ║
║ Auto-scaling                   [⚪ FUTURO]     ║
╚════════════════════════════════════════════════╝
```

---

## 📁 ARQUIVOS CRÍTICOS A MODIFICAR

### Fix 1.1: Async DB Init
- [ ] `src/config/database.js` (lines 82-95: remove await)
- [ ] `src/config/database.js` (lines 218-220: remove await)
- [ ] `src/config/database.js` (export isDatabaseReady() function)
- [ ] `src/server-enhanced.js` (lines 248-308: remove await calls)

### Fix 1.2: Memory Config
- [ ] `render.yaml` (line 15: WEB_CONCURRENCY=2)
- [ ] `render.yaml` (line 22: max-old-space-size=1536)

### Fix 1.3: Pre-warm Bedrock
- [ ] `src/modules/bedrock.js` (lines 199-209: eager init)

### Fix 1.4: Tool Timeouts
- [ ] `src/modules/bedrock-tools.js` (adicionar executeToolWithTimeout)
- [ ] `src/modules/bedrock-tools.js` (aplicar em 6 tools)

### Fix 1.5: Timeout Consistency
- [ ] `src/middleware/timeout-handler.js` (bypass SSE routes)
- [ ] `src/routes/chat-stream.js` (confirmar timeouts + logging)

---

## 🔄 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES (Estado Atual)
```
┌─────────────────────────────────────────────────┐
│ USER → Render Proxy (60s timeout)              │
│   ↓                                             │
│ Load Balancer → 4 workers (OOM kills)          │
│   ↓                                             │
│ T+0s:  DB init bloqueia 15s ❌                  │
│ T+15s: Worker finalmente pronto                │
│ T+15s: Request arrives                         │
│ T+20s: Context query (15s) ❌                   │
│ T+35s: AWS SDK lazy init (500ms) ❌             │
│ T+35s: Bedrock call                            │
│ T+40s: Tool execution (SEM TIMEOUT) ❌          │
│ T+???: TIMEOUT antes de resposta ❌             │
└─────────────────────────────────────────────────┘
```

### DEPOIS (Com Fixes Fase 1)
```
┌─────────────────────────────────────────────────┐
│ USER → Render Proxy (60s timeout)              │
│   ↓                                             │
│ Load Balancer → 2 workers (stable) ✅           │
│   ↓                                             │
│ T+0s:  Server inicia imediatamente ✅            │
│ T+2s:  DB conecta em background ✅               │
│ T+0s:  Request arrives                         │
│ T+1s:  Context cache hit ✅                      │
│ T+1s:  AWS SDK já inicializado ✅                │
│ T+2s:  Bedrock call                            │
│ T+3s:  Tool execution (30-45s timeout) ✅        │
│ T+5s:  First token arrives ✅                    │
│ T+10s: Complete response ✅                      │
└─────────────────────────────────────────────────┘
```

---

## 🎉 RESULTADO ESPERADO

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🎯 OBJETIVO ALCANÇADO                                    ║
║                                                           ║
║  ✅ Chat responde em <10 segundos                         ║
║  ✅ Cold start em <5 segundos                             ║
║  ✅ Memory estável (<3.8GB)                               ║
║  ✅ Sem timeouts em produção                              ║
║  ✅ 6 usuários podem usar o sistema normalmente           ║
║                                                           ║
║  📊 Métricas de Sucesso:                                  ║
║     - Uptime: >99%                                        ║
║     - P95 Latency: <10s                                   ║
║     - Error rate: <1%                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Status**: 🟡 Pronto para iniciar implementação
**Próximo passo**: Implementar Fix 1.1 (Async DB Init)
**Tempo estimado**: 4-6 horas até deploy staging
