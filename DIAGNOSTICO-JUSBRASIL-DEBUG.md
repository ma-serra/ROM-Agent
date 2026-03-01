# 🔍 Diagnóstico: JusBrasil Não Executando

**Data:** 2026-02-13 00:35 UTC
**Status:** 🔬 INVESTIGANDO

---

## 🧪 Situação Atual

### ✅ Confirmações:

1. **Código integrado:** Commit `9dedad7` ✅
2. **Deploy concluído:** Servidor respondendo ✅
3. **ENV configurada:** `JUSBRASIL_ENABLED=true` ✅ (confirmado pelo usuário)
4. **DataJud funcionando:** 4-5 resultados por query ✅

### ❌ Problema:

**JusBrasil não está executando** mesmo com `JUSBRASIL_ENABLED=true`:
- Nenhum log `[JUSBRASIL]` aparece
- Terceiro corredor não é mencionado
- Resultados vêm apenas do DataJud

---

## 🔬 Hipóteses Investigadas

### Hipótese 1: ENV não aplicada ❌
**Status:** Descartada (usuário confirmou `JUSBRASIL_ENABLED=true`)

### Hipótese 2: Deploy antigo rodando ❌
**Status:** Descartada (servidor mostra timestamp recente: 2026-02-13T03:35:32)

### Hipótese 3: Código tem bug na lógica ⚠️
**Status:** Investigando

**Código atual:**
```javascript
// Linha 225
const canUseJusbrasil = this.config.jusbrasil.enabled;

// Linha 227
if (canUseJusbrasil) {
  console.log('🔍 [JUSBRASIL] Buscando no terceiro corredor...');
  // ...
}
```

**Problemas possíveis:**
1. `this.config.jusbrasil.enabled` retorna `undefined` ou `false`
2. Config não está sendo inicializada corretamente
3. Variável de ambiente não está sendo lida

---

## 🔧 Ação Tomada: Logs de Debug

**Commit:** `7969ae6` - "debug: Adiciona logs para diagnosticar JusBrasil"

**Adicionado:**
```javascript
console.log(`🔍 [DEBUG] JusBrasil config:`, {
  enabled: this.config.jusbrasil.enabled,
  canUse: canUseJusbrasil,
  env: process.env.JUSBRASIL_ENABLED
});
```

**Objetivo:** Ver exatamente o que está na configuração antes do `if`.

---

## 📊 Teste Após Deploy

**Aguardando:** Render fazer redeploy (~5 minutos)

**Comando de teste:**
```bash
curl -X POST https://iarom.com.br/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"procure jurisprudencia sobre dano moral","sessionId":"test-debug","userId":"test"}'
```

**Logs esperados no Render:**

**Cenário A: ENV correta**
```
[DEBUG] JusBrasil config: {
  enabled: true,
  canUse: true,
  env: 'true'
}
[JUSBRASIL] Buscando no terceiro corredor...
```

**Cenário B: ENV não aplicada**
```
[DEBUG] JusBrasil config: {
  enabled: false,
  canUse: false,
  env: undefined
}
```

**Cenário C: ENV existe mas não é lida**
```
[DEBUG] JusBrasil config: {
  enabled: false,
  canUse: false,
  env: 'true'
}
```

---

## 🎯 Próximos Passos

### 1. Aguardar Redeploy (5 min)

Deploy iniciado em: 2026-02-13 00:36 UTC
Estimativa de conclusão: 2026-02-13 00:41 UTC

### 2. Testar e Verificar Logs

Verificar logs no Render Dashboard:
- https://dashboard.render.com/web/srv-ct4vg72h7nbs73dmcb00/logs

Procurar por: `[DEBUG] JusBrasil config:`

### 3. Diagnosticar Baseado nos Logs

**Se `enabled: false`:**
- Problema: Config não está lendo a ENV corretamente
- Solução: Verificar linha 42-43 da inicialização

**Se `env: undefined`:**
- Problema: ENV não existe ou nome errado
- Solução: Verificar exatamente o nome da variável no Render

**Se `enabled: true` mas não executa:**
- Problema: Bug no código após o `if`
- Solução: Verificar método `searchJusBrasil()`

---

## 📝 Linha do Tempo

**00:05 UTC** - Integração do JusBrasil commitada (`9dedad7`)
**00:06 UTC** - Deploy concluído
**00:17 UTC** - Teste em produção: JusBrasil não executou
**00:20 UTC** - Documentação do problema
**00:30 UTC** - Usuário confirma `JUSBRASIL_ENABLED=true` no Render
**00:36 UTC** - Logs de debug adicionados (`7969ae6`)
**00:41 UTC** - ⏳ Aguardando redeploy...

---

## 🔍 Verificação da Config

### Código de Inicialização:

```javascript
// src/services/jurisprudence-search-service.js:42-46
jusbrasil: {
  enabled: process.env.JUSBRASIL_ENABLED === 'true' || false,
  apiUrl: 'https://www.jusbrasil.com.br/busca',
  timeout: 30000
},
```

**Problema identificado:** ⚠️

A expressão:
```javascript
process.env.JUSBRASIL_ENABLED === 'true' || false
```

Sempre retorna `false` se a ENV não for exatamente a string `'true'`.

**Valores que resultam em `false`:**
- `undefined` (ENV não existe)
- `'false'` (string)
- `'True'` (maiúscula)
- `'TRUE'` (todas maiúsculas)
- `'1'` (número como string)
- `true` (booleano - Render sempre envia string)

**Valor que resulta em `true`:**
- `'true'` (exatamente essa string)

---

## 💡 Possível Causa Raiz

Se no Render a variável está configurada como:
- `JUSBRASIL_ENABLED: True` (com T maiúsculo)
- `JUSBRASIL_ENABLED: TRUE` (tudo maiúsculo)
- `JUSBRASIL_ENABLED: 1`

Então `this.config.jusbrasil.enabled` será `false` porque a comparação `=== 'true'` falha.

---

## 🔧 Solução Temporária

Se os logs confirmarem que `env` tem valor mas `enabled` é `false`, podemos tornar a comparação mais flexível:

```javascript
// Aceitar 'true', 'True', 'TRUE', '1', true
enabled: ['true', 'True', 'TRUE', '1', true].includes(process.env.JUSBRASIL_ENABLED)
```

Ou simplesmente:
```javascript
enabled: process.env.JUSBRASIL_ENABLED?.toLowerCase() === 'true'
```

---

**Próxima atualização:** Após análise dos logs de debug (em ~5 min)

**Status:** 🔬 AGUARDANDO LOGS DE DEBUG
