# 🔍 Solicitação: Logs do Render

**Data:** 2026-02-13 00:48 UTC
**Situação:** JusBrasil habilitado mas não executando

---

## 📊 Status Atual

### ✅ Confirmado:

1. **Deploy concluído:** Servidor UP desde 03:41 UTC
2. **JusBrasil habilitado no início:**
   ```
   2026-02-13T03:41:16.979453732Z    - JusBrasil: Habilitado
   ```
3. **Código com logs de debug:** Commit `7969ae6` deployed
4. **Testes realizados:** 2 requisições de jurisprudência enviadas
5. **Respostas recebidas:** HTTP 200, ~17s cada

### ❌ Problema:

**JusBrasil não está executando** durante as buscas:
- Nenhuma menção ao JusBrasil nas respostas
- Log `[DEBUG] JusBrasil config:` não apareceu
- Sistema recomenda "buscar em JusBrasil" mas não executa

---

## 🎯 Objetivo

Preciso ver os **logs do Render** das requisições mais recentes para identificar por que o terceiro corredor não está executando.

**Log esperado (se funcionasse):**
```
🔍 [DEBUG] JusBrasil config: {
  enabled: true,
  canUse: true,
  env: 'true'
}
🔍 [JUSBRASIL] Buscando no terceiro corredor (HTTP scraping)...
```

**Se não aparecer esse log**, significa que `canUseJusbrasil = false` por algum motivo.

---

## 📝 Como Obter os Logs

### Opção 1: Dashboard do Render (Mais Fácil)

1. Acesse: https://dashboard.render.com/web/srv-ct4vg72h7nbs73dmcb00/logs

2. **Procure por logs com timestamp:** `03:42:XX` ou `03:43:XX` ou `03:4X:XX`

3. **Filtre por palavras-chave:**
   - `DEBUG`
   - `JUSBRASIL`
   - `DATAJUD`
   - `pesquisar_jurisprudencia`
   - `procure jurisprudencia`

4. **Copie TODOS os logs** de uma requisição completa (desde o início até o fim)

**Exemplo de como os logs devem aparecer:**
```
2026-02-13T03:42:XX [INFO] Incoming request
...
🔍 [DATAJUD] Buscando na fonte oficial do CNJ...
...
🔍 [DEBUG] JusBrasil config: { ... }  ← ESTE LOG É CRUCIAL
...
[INFO] Request completed
```

---

### Opção 2: CLI do Render (Se Instalado)

```bash
# Últimos 200 logs
render logs --tail 200

# Filtrar por palavras-chave
render logs --tail 200 | grep -iE "(debug|jusbrasil|datajud)"
```

---

### Opção 3: Screenshot

Se preferir, tire um **screenshot** da tela de logs do Render mostrando:
- Timestamp da requisição
- Logs de `[DATAJUD]`
- Logs de `[DEBUG]` ou `[JUSBRASIL]` (se existirem)

---

## 🔍 O Que Procurar nos Logs

### Cenário A: Log de DEBUG aparece

```
🔍 [DEBUG] JusBrasil config: {
  enabled: true,    ← Se TRUE, deveria executar
  canUse: true,     ← Se TRUE, deveria executar
  env: 'true'       ← Confirma que ENV está correta
}
```

**Se aparecer e `canUse: true`:**
- Problema está DEPOIS do `if`, dentro do método `searchJusBrasil()`
- Preciso ver logs de erro dentro do try/catch

**Se `canUse: false` mas `env: 'true':`**
- Problema na lógica: `this.config.jusbrasil.enabled` não está lendo corretamente

---

### Cenário B: Log de DEBUG NÃO aparece

Significa que o código **não chegou até a linha 226** onde está o log de debug.

**Possíveis causas:**
1. Requisição não está sendo detectada como busca de jurisprudência
2. Método `search()` está retornando antes
3. Erro aconteceu antes e foi silenciado

---

### Cenário C: Erro explícito aparece

```
❌ [JUSBRASIL] ERRO: Cannot read property 'enabled' of undefined
```

Indica problema na inicialização do `this.config.jusbrasil`.

---

## 🧪 Logs de Teste Enviados

### Teste 1 (03:42:XX):
```
Query: "procure jurisprudencia sobre dano moral"
SessionId: test-debug-XXXXXXXXX
Resultado: HTTP 200, 16.9s
DataJud: 5 resultados
JusBrasil: ❌ Não executou
```

### Teste 2 (03:43:XX):
```
Query: "procure jurisprudencia sobre prisao preventiva no STJ"
SessionId: test-XXXXXXXXX
Resultado: HTTP 200, 19s
DataJud: 1 resultado (STJ)
JusBrasil: ❌ Não executou
```

---

## ⏰ Timestamps das Requisições

Buscar logs entre:
- `2026-02-13T03:42:00Z` e `2026-02-13T03:42:30Z` (Teste 1)
- `2026-02-13T03:43:00Z` e `2026-02-13T03:43:30Z` (Teste 2)

---

## 📋 O Que Colar Aqui

**Cole TODOS os logs de UMA requisição completa**, incluindo:

1. Linha de `[INFO] Incoming request` com timestamp
2. TODOS os logs seguintes até `[INFO] Request completed`
3. Especialmente linhas contendo:
   - `[DATAJUD]`
   - `[DEBUG]`
   - `[JUSBRASIL]`
   - `[Tool Use]`
   - Qualquer erro ou warning

**Formato preferido:**
```
2026-02-13T03:42:XX.XXXXZ [INFO] Incoming request
2026-02-13T03:42:XX.XXXXZ ...
2026-02-13T03:42:XX.XXXXZ ...
[todos os logs até o fim]
2026-02-13T03:42:XX.XXXXZ [INFO] Request completed
```

---

## 💡 Dica de Busca no Render

No campo de busca do Render, use:

```
"Incoming request" AND "jurisprudencia"
```

Ou:

```
"DEBUG" OR "JUSBRASIL"
```

Isso vai filtrar apenas os logs relevantes.

---

**Status:** ⏳ Aguardando logs do Render para diagnóstico completo
