# Modelos LLM Disponíveis - ROM Agent

**Data**: 2026-03-23
**Status**: ✅ TODOS OS MODELOS FUNCIONANDO

---

## 🎯 Como Usar os Modelos

Todos os modelos podem ser usados com **nomes amigáveis** em qualquer função:

```javascript
// Opção 1: Nome amigável (RECOMENDADO)
await conversar(prompt, { modelo: 'nova-pro' });
await conversar(prompt, { modelo: 'llama-3.3-70b' });
await conversar(prompt, { modelo: 'claude-haiku-4.5' });

// Opção 2: ID completo (também funciona)
await conversar(prompt, { modelo: 'us.amazon.nova-pro-v1:0' });
```

O sistema **automaticamente resolve** o nome amigável para o ID completo do Bedrock.

---

## 📊 Modelos Disponíveis por Provedor

### 🟠 Amazon (Nova)

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `nova-premier` | Amazon Nova Premier | Tarefas mais complexas | Alto |
| `nova-pro` ⭐ | Amazon Nova Pro | Análise jurídica, chat | Médio |
| `nova-lite` | Amazon Nova Lite | Tarefas rápidas | Baixo |
| `nova-micro` | Amazon Nova Micro | Extração de texto | Muito Baixo |
| `titan-text` | Amazon Titan Text | Embedding/busca | Baixo |

**Recomendação**: `nova-pro` para análise jurídica, `nova-micro` para extração.

---

### 🔵 Anthropic (Claude)

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `claude-opus-4.5` | Claude Opus 4.5 | Análise profunda, peças complexas | Muito Alto |
| `claude-opus-4` | Claude Opus 4 | Análise avançada | Alto |
| `claude-sonnet-4.5` | Claude Sonnet 4.5 | Chat premium | Alto |
| `claude-sonnet-4` | Claude Sonnet 4 | Chat avançado | Médio-Alto |
| `claude-haiku-4.5` ⭐ | Claude Haiku 4.5 | Chat rápido, análise | Médio |
| `claude-3.7-sonnet` | Claude 3.7 Sonnet | Fichamentos (atual) | Médio |
| `claude-3.5-sonnet` | Claude 3.7 Sonnet (redirect) | Compatibilidade | Médio |
| `claude-3.5-haiku` | Claude 3.5 Haiku | Chat econômico | Baixo |
| `claude-3-opus` | Claude 3 Opus (legacy) | Análise legacy | Alto |
| `claude-3-sonnet` | Claude 3 Sonnet (legacy) | Chat legacy | Médio |
| `claude-3-haiku` | Claude 3 Haiku (legacy) | Chat econômico legacy | Baixo |

**Recomendação**:
- `claude-haiku-4.5` para chat geral e fichamentos
- `claude-opus-4.5` para análise de peças complexas

**Nota**: `claude-3.5-sonnet` redireciona automaticamente para `claude-3.7-sonnet` (3.5 foi marcado como legacy).

---

### 🟢 Meta (Llama)

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `llama-4-scout` | Llama 4 Scout 17B | Análise rápida | Baixo |
| `llama-4-maverick` | Llama 4 Maverick 17B | Chat geral | Baixo |
| `llama-3.3-70b` ⭐ | Llama 3.3 70B | Análise completa | Médio |
| `llama-3.2-90b` | Llama 3.2 90B | Tarefas grandes | Médio-Alto |
| `llama-3.2-11b` | Llama 3.2 11B | Chat rápido | Baixo |
| `llama-3.1-70b` | Llama 3.1 70B | Análise | Médio |
| `llama-3.1-8b` | Llama 3.1 8B | Tarefas simples | Muito Baixo |

**Recomendação**: `llama-3.3-70b` para análise jurídica com bom custo-benefício.

---

### 🟣 Mistral

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `mistral-large-3` | Mistral Large 3 675B | Análise complexa | Alto |
| `pixtral-large` | Pixtral Large (multimodal) | Análise de imagens | Alto |
| `ministral-14b` | Ministral 3 14B | Chat rápido | Médio |
| `ministral-8b` | Ministral 3 8B | Tarefas simples | Baixo |

**Recomendação**: `mistral-large-3` para análise de documentos longos.

---

### 🔴 DeepSeek

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `r1` | DeepSeek R1 | Raciocínio complexo | Médio |
| `deepseek-r1` | DeepSeek R1 (alias) | Raciocínio complexo | Médio |

**Recomendação**: `r1` para análise que requer raciocínio step-by-step.

---

### 🟡 Cohere

| Nome Amigável | Modelo | Uso Recomendado | Custo |
|---------------|--------|-----------------|-------|
| `command-r-plus` | Command R Plus | Chat avançado | Alto |
| `command-r` | Command R | Chat geral | Médio |

**Recomendação**: `command-r-plus` para conversação avançada.

---

## 🚀 Exemplos de Uso

### Chat com diferentes modelos

```javascript
// Amazon Nova Pro (padrão)
await conversarStream(prompt, onChunk, {
  modelo: 'nova-pro'
});

// Claude Haiku 4.5 (rápido e barato)
await conversarStream(prompt, onChunk, {
  modelo: 'claude-haiku-4.5'
});

// Llama 3.3 70B (ótimo custo-benefício)
await conversarStream(prompt, onChunk, {
  modelo: 'llama-3.3-70b'
});

// DeepSeek R1 (raciocínio complexo)
await conversarStream(prompt, onChunk, {
  modelo: 'r1'
});
```

### Geração de fichamentos

```javascript
// Usar Claude 3.7 Sonnet (configurado em document-processor-v2.js)
const resultado = await documentProcessor.processComplete(
  rawText,
  documentId,
  documentName,
  {
    generateFiles: true,
    analysisModel: 'sonnet'  // Resolve para claude-3.7-sonnet
  }
);

// Ou especificar outro modelo
const resultado = await documentProcessor.processComplete(
  rawText,
  documentId,
  documentName,
  {
    generateFiles: true,
    analysisModel: 'claude-haiku-4.5'  // Mais rápido e barato
  }
);
```

### Listar modelos disponíveis

```javascript
import bedrock from './modules/bedrock.js';

// Listar todos os modelos organizados por provedor
const modelos = bedrock.getAvailableModels();
console.log(modelos);
// {
//   amazon: ['nova-premier', 'nova-pro', 'nova-lite', 'nova-micro', 'titan-text'],
//   anthropic: ['claude-opus-4.5', 'claude-opus-4', ...],
//   meta: ['llama-4-scout', 'llama-4-maverick', ...],
//   mistral: [...],
//   deepseek: [...],
//   cohere: [...]
// }
```

---

## 💡 Recomendações por Caso de Uso

### Chat Geral
- **Rápido**: `nova-lite`, `claude-haiku-4.5`, `llama-3.2-11b`
- **Balanceado**: `nova-pro` ⭐, `claude-haiku-4.5` ⭐
- **Premium**: `claude-sonnet-4.5`, `claude-opus-4.5`

### Análise Jurídica
- **Econômico**: `llama-3.3-70b` ⭐, `nova-pro`
- **Balanceado**: `claude-3.7-sonnet`, `mistral-large-3`
- **Premium**: `claude-opus-4`, `claude-opus-4.5`

### Geração de Fichamentos
- **Atual**: `claude-3.7-sonnet` (configurado no sistema)
- **Alternativa rápida**: `claude-haiku-4.5` ⭐
- **Alternativa econômica**: `llama-3.3-70b`

### Extração de Texto
- **Padrão**: `nova-micro` ⭐ (muito barato)
- **Melhor qualidade**: `nova-lite`, `claude-haiku-4.5`

### Raciocínio Complexo
- **Especializado**: `r1` (DeepSeek) ⭐
- **Alternativa**: `claude-opus-4.5`

### Análise Multimodal (Imagens)
- **Único**: `pixtral-large` (Mistral)

---

## 🔧 Configuração Atual do Sistema

### Modelos Padrão por Contexto

| Contexto | Modelo Padrão | Configurado em |
|----------|---------------|----------------|
| Chat geral | `nova-pro` | `bedrock.js` |
| Fichamentos | `claude-3.7-sonnet` | `document-processor-v2.js` |
| Extração texto | `nova-micro` | `document-processor-v2.js` |

### Como Alterar Modelo Padrão

**Para fichamentos**:
```javascript
// Em lib/document-processor-v2.js linha 71-78
const MODELS = {
  sonnet: {
    id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    // Trocar para outro modelo:
    // id: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    // ou usar resolveModelId('claude-haiku-4.5')
  }
};
```

---

## ✅ Status dos Modelos

| Provedor | Modelos Ativos | Modelos Legacy | Status |
|----------|----------------|----------------|--------|
| Amazon | 5 | 0 | ✅ Todos funcionando |
| Anthropic | 8 ativos | 3 legacy* | ✅ Com redirects |
| Meta | 7 | 0 | ✅ Todos funcionando |
| Mistral | 4 | 0 | ✅ Todos funcionando |
| DeepSeek | 1 | 0 | ✅ Funcionando |
| Cohere | 2 | 0 | ✅ Todos funcionando |

*Legacy models com redirect automático:
- `claude-3.5-sonnet` → `claude-3.7-sonnet`
- `claude-3-opus` → mantido por compatibilidade
- `claude-3-sonnet` → mantido por compatibilidade
- `claude-3-haiku` → mantido por compatibilidade

---

## 🆕 Novidades (2026-03-23)

1. ✅ **Função `resolveModelId()`** - Resolve automaticamente nomes amigáveis
2. ✅ **Upgrade Claude 3.5 → 3.7** - Modelo 3.5 legacy redirecionado
3. ✅ **Suporte completo a todos os provedores** - Amazon, Anthropic, Meta, Mistral, DeepSeek, Cohere
4. ✅ **Documentação completa** - Este arquivo lista TODOS os modelos disponíveis

---

## 📞 Troubleshooting

### Modelo não encontrado

```javascript
// Se receber erro "modelo não encontrado":

// 1. Verificar nome amigável disponível
const modelos = bedrock.getAvailableModels();
console.log(modelos);

// 2. Usar resolveModelId para debug
const modeloId = bedrock.resolveModelId('seu-modelo');
console.log(modeloId);

// 3. Verificar se ID está correto
// IDs completos devem incluir região: us.amazon.nova-pro-v1:0
```

### Modelo legacy bloqueado

Se aparecer erro `ResourceNotFoundException` ou `Access denied. This Model is marked by provider as Legacy`:

1. Verificar se é Claude 3.5 Sonnet → System redireciona automaticamente para 3.7
2. Se for outro modelo legacy → Usar versão mais nova equivalente
3. Consultar tabela de status acima

---

**Última atualização**: 2026-03-23
**Commit**: 16bef8e
**Modelos totais**: 27 ativos + 3 legacy (com redirect)
