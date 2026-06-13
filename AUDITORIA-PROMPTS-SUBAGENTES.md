# AUDITORIA: Sistema de Prompts Autoatualizáveis - SubagentManager
**Data:** 2026-06-12
**Arquivo analisado:** `src/modules/subagents.js`
**Versão:** 2.0.0

---

## 1. RESUMO EXECUTIVO

⚠️ **DIAGNÓSTICO GERAL**: O sistema de prompts NÃO é autoatualizável no momento.

**Status Atual:**
- ✅ Histórico de conversas IMPLEMENTADO
- ⚠️ Histórico NÃO está sendo usado automaticamente
- ❌ Autoatualização de prompts NÃO implementada
- ❌ Autorregeneração de prompts NÃO implementada
- ❌ Detecção de erros recorrentes NÃO implementada

---

## 2. ANÁLISE DETALHADA

### 2.1 Armazenamento de Histórico

**Status:** ✅ IMPLEMENTADO

```javascript
// Linha 479: SubagentManager tem conversationHistory
this.conversationHistory = new Map();

// Linhas 532-539: Histórico é salvo após cada interação
if (!this.conversationHistory.has(subagentId)) {
  this.conversationHistory.set(subagentId, []);
}
this.conversationHistory.get(subagentId).push(
  { role: 'user', content: prompt },
  { role: 'assistant', content: resposta }
);
```

**Análise:**
- O histórico É armazenado corretamente em um Map
- Cada subagente tem seu próprio histórico separado
- Formato correto para API Anthropic (role + content)

### 2.2 Uso do Histórico nas Chamadas

**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO

```javascript
// Linhas 506-511: Histórico pode ser passado via context
const messages = [];

if (context.previousMessages) {
  messages.push(...context.previousMessages);
}

messages.push({
  role: 'user',
  content: prompt
});
```

**Problema Identificado:**
- O histórico existe (`this.conversationHistory`)
- Mas NÃO é usado automaticamente
- Requer que o chamador passe `context.previousMessages` manualmente
- A CLI NÃO está passando o histórico

**Impacto:**
- Cada chamada é tratada como NOVA conversa
- Subagente perde contexto de interações anteriores
- Não há "memória" entre chamadas consecutivas

### 2.3 Adaptação de Prompts em Tempo Real

**Status:** ❌ NÃO IMPLEMENTADO

**Análise:**
- Prompts são estáticos (definidos em `SUBAGENTES` constante)
- Não há mecanismo para modificar `systemPrompt` dinamicamente
- Não há análise de qualidade das respostas
- Não há feedback loop

**O que está faltando:**
1. Mecanismo de análise de qualidade da resposta
2. Detector de padrões de erro (alucinação, recusa, etc.)
3. Sistema de ajuste de prompt baseado em feedback
4. Versionamento de prompts

### 2.4 Autorregeneração de Prompts

**Status:** ❌ NÃO IMPLEMENTADO

**O que deveria existir:**

```javascript
// EXEMPLO (NÃO EXISTE ATUALMENTE)
async detectarErrosRecorrentes(subagentId) {
  const history = this.conversationHistory.get(subagentId);

  // Analisar últimas N interações
  const ultimasInteracoes = history.slice(-10);

  // Detectar padrões:
  // - Alucinação (dados inventados)
  // - Recusa de executar tarefa
  // - Respostas genéricas/vazias
  // - Formatação incorreta

  if (errosRecorrentes > threshold) {
    // Autorregeneração do prompt
    await this.regenerarPrompt(subagentId, tipoErro);
  }
}

async regenerarPrompt(subagentId, tipoErro) {
  const promptAtual = SUBAGENTES[subagentId].systemPrompt;

  // Usar meta-agente para reescrever prompt
  const novoPrompt = await this.client.messages.create({
    model: 'claude-opus-4-5-20251101',
    messages: [{
      role: 'user',
      content: `Você é um especialista em prompt engineering.
      O seguinte prompt está causando erros de tipo: ${tipoErro}

      PROMPT ATUAL:
      ${promptAtual}

      HISTÓRICO DE ERROS:
      ${this.obterHistoricoErros(subagentId)}

      Reescreva o prompt para eliminar esses erros mantendo a funcionalidade.`
    }]
  });

  // Atualizar prompt (com versionamento)
  this.atualizarPrompt(subagentId, novoPrompt);
}
```

**Impacto da ausência:**
- Sistema não aprende com erros
- Prompts podem degradar ao longo do tempo
- Problemas recorrentes não são corrigidos automaticamente

---

## 3. SISTEMA DE FALLBACK

**Status:** ✅ IMPLEMENTADO (Recentemente Adicionado)

```javascript
// Linhas 528-594: Sistema de fallback regenerativo
try {
  // Tentativa com Claude 3.7 Sonnet
  const response = await this.client.messages.create(apiParams);
  // ...
} catch (error) {
  // Fallback para modelo estável
  console.log('⚠️  Claude 3.7 Sonnet falhou. Ativando fallback...');
  const fallbackResponse = await this.client.messages.create({
    model: SUBAGENT_CONFIG.fallbackModel,
    // ...
  });
}
```

**Análise:**
- ✅ Fallback entre modelos implementado
- ✅ Avisos visuais funcionais
- ✅ Tratamento de erros adequado

**Limitações:**
- ⚠️ Fallback é reativo (só após falha)
- ⚠️ Não há aprendizado: mesmo erro pode acontecer de novo
- ⚠️ Não há circuit breaker (pode falhar repetidamente)

---

## 4. PENSAMENTO ESTENDIDO (EXTENDED THINKING)

**Status:** ✅ IMPLEMENTADO (Recentemente Adicionado)

```javascript
// Linhas 521-528: Extended Thinking
if (useExtendedThinking) {
  apiParams.thinking = {
    type: 'enabled',
    budget_tokens: SUBAGENT_CONFIG.thinkingBudget
  };
  console.log('⚡ Claude 3.7 Sonnet com Raciocínio Avançado ATIVO');
}
```

**Análise:**
- ✅ Ativação condicional baseada em `context.enableThinking`
- ✅ Budget de tokens configurável (4000)
- ✅ Ativado automaticamente para comandos complexos (parecer, prognostico)

---

## 5. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 5.1 Histórico Não Utilizado ⚠️

**Problema:**
```javascript
// CLI chama assim:
const resultado = await this.subagentManager.invocarSubagente(
  'analise-processual',
  prompt
  // ❌ Não passa o histórico!
);
```

**Deveria ser:**
```javascript
// Obter histórico do subagente
const historico = this.subagentManager.conversationHistory.get('analise-processual') || [];

const resultado = await this.subagentManager.invocarSubagente(
  'analise-processual',
  prompt,
  { previousMessages: historico }
);
```

**Impacto:**
- Subagente "esquece" interações anteriores
- Usuário precisa repetir contexto a cada comando
- Experiência de chat inconsistente

### 5.2 Prompts Estáticos ❌

**Problema:**
- Prompts definidos em constante `SUBAGENTES`
- Não há versioning
- Não há A/B testing
- Não há otimização baseada em performance

**Solução recomendada:**
1. Mover prompts para banco de dados
2. Implementar versionamento (v1, v2, v3...)
3. Criar sistema de métricas (taxa de sucesso, qualidade, etc.)
4. Implementar autorregeneração baseada em métricas

### 5.3 Sem Detecção de Alucinação ❌

**Problema:**
- Sistema anti-alucinação existe APENAS no prompt (texto)
- Não há validação programática
- Não há verificação de fontes citadas
- Não há bloqueio automático de respostas suspeitas

**Solução recomendada:**
```javascript
async validarResposta(resposta, tipo) {
  // Verificar padrões de alucinação
  const patterns = {
    'jurisprudencia': [
      /Processo n[°º]\s*[\d.-]+/, // Validar formato de processo
      /\d{4}\s*-\s*\d{7}/, // Validar ano-número
      // etc.
    ]
  };

  // Se tipo é jurisprudência, validar citações
  if (tipo === 'jurisprudencia') {
    const citacoes = extrairCitacoes(resposta);
    for (const citacao of citacoes) {
      const existe = await verificarCitacaoReal(citacao);
      if (!existe) {
        return { valido: false, motivo: 'Citação não encontrada' };
      }
    }
  }

  return { valido: true };
}
```

---

## 6. RECOMENDAÇÕES

### 6.1 Curto Prazo (Implementar Imediatamente)

1. **Ativar uso automático do histórico:**
   ```javascript
   // Em invocarSubagente()
   const messages = [];

   // Usar histórico automaticamente
   const historico = this.conversationHistory.get(subagentId) || [];
   if (historico.length > 0) {
     // Limitar últimas N mensagens para não explodir contexto
     messages.push(...historico.slice(-10));
   }

   messages.push({ role: 'user', content: prompt });
   ```

2. **Implementar método de limpeza de histórico seletiva:**
   ```javascript
   limparHistoricoSeNecessario(subagentId) {
     const historico = this.conversationHistory.get(subagentId) || [];
     if (historico.length > 20) {
       // Manter apenas últimas 10 interações
       this.conversationHistory.set(subagentId, historico.slice(-10));
     }
   }
   ```

### 6.2 Médio Prazo (1-2 Semanas)

1. **Implementar detector de qualidade:**
   ```javascript
   async avaliarQualidadeResposta(resposta, tipo) {
     // Métricas:
     // - Tamanho da resposta
     // - Estrutura (seções esperadas presentes?)
     // - Citações válidas
     // - Tom apropriado
     // - Formato correto

     return {
       score: 0.85, // 0-1
       problemas: [],
       sugestoes: []
     };
   }
   ```

2. **Adicionar versionamento de prompts:**
   ```javascript
   const PROMPT_VERSIONS = {
     'analise-processual': {
       'v1.0': '...',
       'v1.1': '...',
       'v2.0': '...',
       current: 'v2.0'
     }
   };
   ```

### 6.3 Longo Prazo (1+ Mês)

1. **Implementar autorregeneração completa**
2. **Sistema de métricas e telemetria**
3. **A/B testing de prompts**
4. **Validação programática de citações jurídicas**
5. **Circuit breaker para evitar falhas repetidas**

---

## 7. CONCLUSÃO

**Diagnóstico Final:**

O sistema atual de SubagentManager é **FUNCIONAL mas NÃO é AUTOATUALIZÁVEL**.

**Pontos Fortes:**
- ✅ Histórico de conversas implementado
- ✅ Sistema de fallback regenerativo robusto
- ✅ Pensamento estendido para comandos complexos
- ✅ Arquitetura modular e extensível

**Pontos Fracos Críticos:**
- ❌ Histórico não é usado automaticamente
- ❌ Prompts são estáticos (não se adaptam)
- ❌ Sem detecção de erros recorrentes
- ❌ Sem autorregeneração de prompts
- ❌ Sem validação programática de qualidade

**Impacto no Usuário:**
- Médio: Sistema funciona, mas poderia aprender e melhorar
- Sem memória efetiva entre comandos
- Erros podem se repetir indefinidamente

**Urgência de Correção:**
- 🔴 ALTA: Ativar uso automático do histórico
- 🟡 MÉDIA: Implementar detector de qualidade
- 🟢 BAIXA: Autorregeneração de prompts (nice-to-have)

---

**Responsável pela auditoria:** ROM Agent CLI
**Data:** 2026-06-12
**Status:** Auditoria concluída - aguardando decisão de implementação
