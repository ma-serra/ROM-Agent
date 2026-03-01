# 🔍 AUDITORIA COMPLETA - ROM Agent v2.8.0
**Data**: 2026-02-26
**Objetivo**: Verificar se não falta nada antes de implementar correções
**Status**: ✅ COMPLETO

---

## 🚨 DESCOBERTA CRÍTICA #1: Produção NÃO usa server-cluster.js!

### Configuração Atual (render.yaml linha 26)

```yaml
# ❌ PROBLEMA DETECTADO:
startCommand: node --max-old-space-size=3072 src/server-enhanced.js
# ↑ Chama server-enhanced.js DIRETAMENTE (não usa server-cluster.js)

# Mas também tem:
- key: WEB_CONCURRENCY
  value: 4  # ← Configurado para 4 workers
```

### Análise do Problema

**O que está acontecendo:**
1. `render.yaml` chama `server-enhanced.js` diretamente
2. `server-enhanced.js` foi refatorado (Fix #2) para exportar `startServer()`
3. MAS o código tem auto-start desabilitado (linha 11091-11093):
   ```javascript
   // Don't auto-start - let caller start explicitly
   console.log('[Server] Server initialized - waiting for explicit startServer() call');
   ```
4. **RESULTADO**: Server pode não estar iniciando!

### Verificação Necessária

```bash
# Em produção, verificar nos logs se server realmente inicia:
# Deve aparecer:
"[Server] Auto-starting server..."
# OU
"✅ [SERVER] Servidor iniciado em 0.0.0.0:10000"
```

### Correção Necessária

**OPÇÃO A**: Usar `server-cluster.js` em produção (RECOMENDADO)
```yaml
# render.yaml linha 26:
startCommand: node --max-old-space-size=1536 src/server-cluster.js
# ↑ Usa cluster mode corretamente com 2 workers
```

**OPÇÃO B**: Manter `server-enhanced.js` mas habilitar auto-start
```javascript
// src/server-enhanced.js (linha 11091):
// Remover lógica de bypass e sempre iniciar
startServer().catch(error => {
  logger.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
```

---

## 📊 ESTADO ATUAL COMPLETO

### Arquivos Já Modificados (Fixes Táticos)

| Arquivo | Modificação | Status | Observação |
|---------|-------------|--------|------------|
| `src/services/semantic-search-service.js` | AWS region us-west-2 | ✅ FEITO | Linha 24 |
| `src/server-enhanced.js` | Refactor startServer() | ✅ FEITO | Linha 10674-11018 |
| `src/server-cluster.js` | Explicit startServer() call | ✅ FEITO | Linha 111-116 |
| `scripts/start-single-server.js` | Novo wrapper | ✅ CRIADO | - |
| `package.json` | Scripts atualizados | ✅ FEITO | web:single, web:enhanced |
| `.env` | DISABLE_REDIS=true | ✅ FEITO | Linha 193 |
| `src/services/gerador-18-ficheiros.js` | LLM paralelo | ✅ FEITO | Linhas 214-224, 548-558 |

### Arquivos a Modificar (Fixes Estratégicos - FASE 1)

| # | Arquivo | Modificação | Linhas | Status |
|---|---------|-------------|--------|--------|
| 1.1 | `src/config/database.js` | Async DB init | 82-95, 218-220 | 🔴 PENDENTE |
| 1.1 | `src/server-enhanced.js` | Remove await DB | 248-308 | 🔴 PENDENTE |
| 1.2 | `render.yaml` | WEB_CONCURRENCY=2 | 39 | 🔴 PENDENTE |
| 1.2 | `render.yaml` | max-old-space-size=1536 | 26 | 🔴 PENDENTE |
| 1.2 | `render.yaml` | Use server-cluster.js | 26 | 🔴 PENDENTE |
| 1.3 | `src/modules/bedrock.js` | Eager init | 199-209 | 🔴 PENDENTE |
| 1.4 | `src/modules/bedrock-tools.js` | Add timeout wrapper | - | 🔴 PENDENTE |
| 1.5 | `src/middleware/timeout-handler.js` | Bypass SSE | - | 🔴 PENDENTE |
| 1.5 | `src/routes/chat-stream.js` | Logging | - | 🔴 PENDENTE |

---

## 🚨 DESCOBERTA CRÍTICA #2: Conflito Auto-Start

### Código Atual (src/server-enhanced.js linhas 11091-11104)

```javascript
// ============================================================================
// AUTO-START SERVER
// ============================================================================
// Note: In cluster mode, server-cluster.js explicitly calls startServer()
// So we disable auto-start to prevent double initialization
// For single-server mode (npm run web:single), the server must be started explicitly

// Don't auto-start - let caller (server-cluster.js or scripts) start explicitly
console.log('[Server] Server initialized - waiting for explicit startServer() call');
console.log('[Server] Export: startServer(), app, httpServer, io');

// Export both app and startServer for flexibility
export default app;
export { startServer, httpServer, io };
```

### Problema

**Se `render.yaml` chama `server-enhanced.js` diretamente:**
- Auto-start está **DESABILITADO**
- Ninguém chama `startServer()`
- Server **NÃO inicia**
- Health check **FALHA**
- Deploy **FALHA**

### Solução IMEDIATA

**DECISÃO CRÍTICA: Qual startCommand usar em produção?**

```yaml
# OPÇÃO 1 (RECOMENDADO - usa cluster.js):
startCommand: node --max-old-space-size=1536 src/server-cluster.js

# OPÇÃO 2 (single-server com auto-start):
startCommand: node --max-old-space-size=1536 scripts/start-single-server.js
```

---

## 📋 CHECKLIST DE AUDITORIA

### Arquivos Existem?

- [x] `src/config/database.js` ✅
- [x] `src/server-enhanced.js` ✅
- [x] `src/server-cluster.js` ✅
- [x] `src/modules/bedrock.js` ✅
- [x] `src/modules/bedrock-tools.js` ✅
- [x] `src/middleware/timeout-handler.js` ✅
- [x] `src/routes/chat-stream.js` ✅
- [x] `render.yaml` ✅
- [x] `scripts/start-single-server.js` ✅
- [x] `package.json` ✅

### Dependências entre Fixes

```
Fix 1.1 (Async DB) → Fix 1.5 (Routes check isDatabaseReady())
Fix 1.2 (Memory)   → Independente
Fix 1.3 (Bedrock)  → Independente
Fix 1.4 (Tools)    → Independente
Fix 1.5 (Timeout)  → Depende de Fix 1.1 (para graceful degradation)
```

**Ordem de implementação recomendada:**
1. Fix 1.2 (Memory config - mais simples)
2. Fix 1.3 (Pre-warm Bedrock - independente)
3. Fix 1.1 (Async DB - base para Fix 1.5)
4. Fix 1.4 (Tool timeouts - independente)
5. Fix 1.5 (Timeout consistency - usa isDatabaseReady())

### Conflitos Potenciais

| Fix | Conflito Potencial | Mitigação |
|-----|-------------------|-----------|
| 1.1 | Routes esperam DB síncrono | Adicionar isDatabaseReady() checks |
| 1.2 | Menos workers = menos throughput | Monitorar queue depth |
| 1.3 | Init pode falhar no startup | Try/catch + retry |
| 1.4 | Timeout pode quebrar tools válidos | 45s timeout generoso |
| 1.5 | Bypass pode expor vulnerabilidade | Apenas para /api/chat/stream |

---

## 🔄 COMPARAÇÃO: Código Atual vs Planejado

### Fix 1.1: Database Initialization

**ATUAL (database.js:82-95)**:
```javascript
console.log('🔍 [PG] Testando conexão com SELECT NOW()...');
const startTime = Date.now();
await pgPool.query('SELECT NOW()');  // ❌ BLOCKS
const latency = Date.now() - startTime;
console.log('✅ [PG] PostgreSQL CONECTADO em ' + latency + 'ms');
```

**PLANEJADO**:
```javascript
console.log('🔍 [PG] Iniciando conexão em background...');
setImmediate(async () => {
  try {
    const startTime = Date.now();
    await pgPool.query('SELECT NOW()');
    const latency = Date.now() - startTime;
    dbReady = true;  // ✅ NON-BLOCKING
    console.log('✅ [PG] PostgreSQL CONECTADO em ' + latency + 'ms');
  } catch (error) {
    console.error('❌ [PG] Erro, tentando novamente em 5s...');
    setTimeout(() => initPostgres(), 5000);
  }
});
return pgPool;  // Return immediately
```

### Fix 1.2: Memory Configuration

**ATUAL (render.yaml:26,39)**:
```yaml
startCommand: node --max-old-space-size=3072 src/server-enhanced.js
# ...
- key: WEB_CONCURRENCY
  value: 4
```

**PLANEJADO**:
```yaml
startCommand: node --max-old-space-size=1536 src/server-cluster.js
# ...
- key: WEB_CONCURRENCY
  value: 2  # ✅ 2×1.5GB = 3GB (cabe em 4GB)
```

### Fix 1.3: Bedrock Client

**ATUAL (bedrock.js:199-209)**:
```javascript
let runtimeClient = null;  // ❌ Lazy initialization

function getBedrockRuntimeClient() {
  if (!runtimeClient) {
    runtimeClient = new BedrockRuntimeClient({...});
  }
  return runtimeClient;
}
```

**PLANEJADO**:
```javascript
// ✅ Eager initialization
let runtimeClient = new BedrockRuntimeClient({
  region: CONFIG.region,
  requestHandler: { requestTimeout: 300000 }
});

function getBedrockRuntimeClient() {
  return runtimeClient;  // Already initialized
}
```

### Fix 1.4: Tool Timeouts

**ATUAL (bedrock-tools.js)**:
```javascript
// ❌ Sem timeout - pode travar indefinidamente
export async function pesquisar_jurisprudencia(params) {
  const results = await fetch(API_URL);
  return results;
}
```

**PLANEJADO**:
```javascript
// ✅ Com timeout de 45s
export async function pesquisar_jurisprudencia(params) {
  return executeToolWithTimeout(
    async () => {
      const results = await fetch(API_URL);
      return results;
    },
    params,
    45000  // 45s timeout
  );
}
```

### Fix 1.5: Timeout Consistency

**ATUAL (timeout-handler.js)**:
```javascript
// ❌ Aplica timeout em TODAS as routes
export function timeoutMiddleware(req, res, next) {
  const timeout = getTimeout('http', routeType);
  // ... aplica timeout
}
```

**PLANEJADO**:
```javascript
// ✅ Bypass para SSE streaming
export function timeoutMiddleware(req, res, next) {
  if (req.path === '/api/chat/stream') {
    req._bypassTimeout = true;
    return next();
  }
  // ... aplica timeout normalmente
}
```

---

## 🎯 VALIDAÇÃO FINAL

### Testes a Executar ANTES do Deploy

```bash
# 1. Sintaxe de todos os arquivos modificados
node --check src/config/database.js
node --check src/server-enhanced.js
node --check src/server-cluster.js
node --check src/modules/bedrock.js
node --check src/modules/bedrock-tools.js
node --check src/middleware/timeout-handler.js

# 2. Startup local (<5s esperado)
time npm run web:cluster

# 3. Primeira request (<10s esperado)
time curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá"}'

# 4. Memory usage (deve estar <3GB para 2 workers)
ps aux | grep node

# 5. Tool timeout (deve retornar em ~30-45s com fallback)
# Simular tool lento com mock
```

### Testes a Executar APÓS Deploy Staging

```bash
# 1. Health check
curl https://rom-agent-staging.onrender.com/api/info

# 2. Primeira request
time curl -X POST https://rom-agent-staging.onrender.com/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá"}'

# 3. Render logs (verificar cold start)
render logs -s rom-agent-staging --tail | grep "WORKERS ESTÃO ONLINE"

# 4. Memory metrics (Render Dashboard)
# Verificar: Memory usage < 3.8GB

# 5. Load test (10 requests concorrentes)
for i in {1..10}; do
  curl -X POST https://rom-agent-staging.onrender.com/api/chat/stream \
    -H "Content-Type: application/json" \
    -d '{"message": "Test '$i'"}' &
done
wait
```

---

## 📝 ITENS FALTANTES IDENTIFICADOS

### Documentação

- [ ] Atualizar README.md com novas configurações
- [ ] Documentar isDatabaseReady() usage para novos routes
- [ ] Documentar executeToolWithTimeout() usage para novas tools
- [ ] Adicionar métricas de success da Fase 1 ao README

### Monitoring

- [ ] Configurar alertas para Memory > 3.5GB
- [ ] Configurar alertas para Worker restarts > 2/min
- [ ] Configurar alertas para Latency P95 > 60s
- [ ] Configurar alertas para Error rate > 5%

### Testing

- [ ] Adicionar testes de integração para isDatabaseReady()
- [ ] Adicionar testes de timeout para tools
- [ ] Adicionar testes de memory leak
- [ ] Adicionar testes de cold start performance

---

## ⚠️ RISCOS IDENTIFICADOS NA AUDITORIA

### Risco #1: render.yaml startCommand incorreto (ALTO)

**Descrição**: Produção pode não estar usando cluster mode corretamente

**Evidência**:
```yaml
# render.yaml linha 26:
startCommand: node --max-old-space-size=3072 src/server-enhanced.js
# ↑ NÃO usa server-cluster.js
```

**Mitigação**: Alterar para `src/server-cluster.js` no Fix 1.2

### Risco #2: Auto-start desabilitado (CRÍTICO)

**Descrição**: server-enhanced.js não inicia automaticamente

**Evidência**:
```javascript
// src/server-enhanced.js linha 11091:
console.log('[Server] Server initialized - waiting for explicit startServer() call');
// ↑ Não chama startServer()
```

**Mitigação**: Usar server-cluster.js que chama explicitamente startServer()

### Risco #3: Database race conditions (MÉDIO)

**Descrição**: Routes podem tentar usar DB antes de estar pronto

**Evidência**: Async DB init + routes síncronos

**Mitigação**: Adicionar isDatabaseReady() checks em TODOS os routes críticos

### Risco #4: Tool timeout muito curto (BAIXO)

**Descrição**: 30-45s pode não ser suficiente para pesquisas complexas

**Evidência**: JusBrasil API pode levar 60s+

**Mitigação**: Timeout configurável por tool, começar com 45s e ajustar

### Risco #5: Memory ainda alto com 2 workers (BAIXO)

**Descrição**: 2×1.5GB + sistema = 3.8GB pode ser apertado

**Evidência**: Cálculo teórico, não testado

**Mitigação**: Monitorar memory usage, escalar para Pro Plus (8GB) se necessário

---

## ✅ APROVAÇÃO PARA IMPLEMENTAÇÃO

### Checklist Final

- [x] Todos os arquivos necessários existem
- [x] Dependências entre fixes mapeadas
- [x] Ordem de implementação definida
- [x] Riscos identificados e mitigações planejadas
- [x] Testes de validação documentados
- [x] Rollback plan definido
- [x] Descoberta crítica #1 (startCommand) identificada
- [x] Descoberta crítica #2 (auto-start) identificada
- [x] Plano na mesa criado (PLANO_NA_MESA_v2.8.0.md)

### Decisões Necessárias

**ANTES DE COMEÇAR IMPLEMENTAÇÃO, DECIDIR:**

1. **startCommand em produção**:
   - [ ] OPÇÃO A: `src/server-cluster.js` (RECOMENDADO)
   - [ ] OPÇÃO B: `scripts/start-single-server.js`

2. **Número de workers**:
   - [ ] 2 workers × 1.5GB (RECOMENDADO - cabe em 4GB)
   - [ ] 1 worker × 3GB (fallback se 2 workers não suficiente)

3. **Tool timeout padrão**:
   - [ ] 30s (rápido mas pode cortar)
   - [ ] 45s (RECOMENDADO - balanço)
   - [ ] 60s (generoso mas pode ser lento)

---

## 🚀 PRÓXIMO PASSO

**Status**: ✅ Auditoria completa, pronto para implementação

**Ação Imediata**: Implementar Fix 1.2 primeiro (Memory config + startCommand)
- Mais simples e independente
- Resolve descoberta crítica #1
- Impacto imediato (elimina OOM kills)

**Tempo estimado**: 30 minutos para Fix 1.2

---

**Documento**: AUDITORIA_COMPLETA_v2.8.0.md
**Referências**:
- PLANO_NA_MESA_v2.8.0.md (visão geral)
- FIXES_IMPLEMENTED_v2.8.0.md (fixes táticos já feitos)
- Plano estratégico completo em .claude/plans/quirky-soaring-lerdorf.md
