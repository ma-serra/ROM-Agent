# 🎯 SOLUÇÃO SISTÊMICA: Extrações com Texto Completo e Resumo Executivo Expandido

**Data**: 03 de março de 2026
**Problema**: Chat gerando peças com placeholders porque fichamentos antigos não têm texto completo
**Impacto**: Milhares de casos afetados

---

## 📊 DIAGNÓSTICO COMPLETO

### ❌ PROBLEMA IDENTIFICADO:

**Documentos extraídos ANTES de 02/mar/2026 16:00h** têm formato ANTIGO:
- ❌ Sem 00_TEXTO_COMPLETO.txt
- ❌ Resumo executivo .md pequeno (500-1000 bytes)
- ❌ Apenas 7 fichamentos resumidos

**Consequência**:
- Chat não encontra informações detalhadas
- Gera peças com placeholders genéricos
- Usuário frustrado: "não está vendo o que está no KB"

---

## ✅ CORREÇÕES APLICADAS (Deploy Completo)

### Commit Timeline:

| Commit | Data/Hora | Mudança |
|--------|-----------|---------|
| `e14e55c` | 02/mar 16:00 | Expansão RESUMO_EXECUTIVO para 10-15 laudas |
| `6db5689` | 02/mar 16:10 | Mudança extensão .md → .txt |
| `f0db3c1` | 02/mar 16:15 | Criação de 00_TEXTO_COMPLETO.txt |
| `cd30559` | 02/mar 16:40 | Sync kbCache (arquivos aparecem na interface) |
| `7ec3479` | 02/mar 17:15 | userId em saveExtractedTextToKB |
| `2b1308b` | 03/mar 18:30 | userId via chat → tools |
| `6f3e654` | 03/mar 18:45 | Scripts de diagnóstico |

### ✅ CÓDIGO ATUAL EM PRODUÇÃO:

```javascript
// batch-analysis-prompt.js - RESUMO_EXECUTIVO expandido
## 5. RESUMO_EXECUTIVO

# RESUMO EXECUTIVO DETALHADO DO PROCESSO
## DOCUMENTO EXTENSO - ATÉ 15 LAUDAS

═══════════════════════════════════════════════════════════════════════
INSTRUÇÕES ESPECIAIS PARA ESTA SEÇÃO:
- Este resumo deve ser MUITO EXTENSO E DETALHADO
- Objetivo: 10-15 laudas (páginas) de análise completa
- Incluir TODAS as informações relevantes do processo
- NÃO RESUMIR - DETALHAR AO MÁXIMO
═══════════════════════════════════════════════════════════════════════

## ⚖️ IDENTIFICAÇÃO DO PROCESSO
[...]
~900 linhas de template detalhado
```

```javascript
// document-processor-v2.js - Mapeamento de arquivos
const FILE_MAPPING = {
  'RESUMO_EXECUTIVO': {
    order: 5,
    prefix: '05_RESUMO_EXECUTIVO',
    extension: '.txt',  // ✅ TXT, não MD
    type: 'RESUMO_EXECUTIVO'
  },
  // ... 17 outros fichamentos
};
```

```javascript
// document-processor-v2.js - Criação do 00_TEXTO_COMPLETO.txt
if (saveToDocuments) {
  const timestamp = Date.now();
  const kbDocsDir = path.join(ACTIVE_PATHS.data, 'knowledge-base', 'documents');

  // ✅ Salvar texto completo como TXT acessível
  const txtPath = path.join(kbDocsDir, `${timestamp}_00_TEXTO_COMPLETO.txt`);
  fs.writeFileSync(txtPath, extractedText, 'utf-8');

  // Adicionar ao KB
  const txtDoc = {
    id: `kb-txt-${timestamp}`,
    name: `${documentName}_00_TEXTO_COMPLETO.txt`,
    type: 'text/plain',
    size: extractedText.length,
    uploadedAt: new Date().toISOString(),
    path: txtPath,
    userId: userId || 'web-upload',  // ✅ com userId
    metadata: { isFullText: true, parentDocument: documentId }
  };

  allDocs.push(txtDoc);
  kbCache.add(txtDoc);  // ✅ Sync com cache
}
```

---

## 🎯 SOLUÇÃO PARA MILHARES DE CASOS

### Opção 1: Re-Extração Manual (Usuários Finais)

**Para cada documento que está gerando placeholders:**

1. Acesse https://iarom.com.br
2. Vá para **Knowledge Base**
3. Localize o documento problemático
4. Clique em **"Analisar"** → **"Análise Completa"**
5. Aguarde 5-10 minutos
6. **NOVOS arquivos serão gerados**:
   - ✅ 00_TEXTO_COMPLETO.txt (texto bruto integral)
   - ✅ 05_RESUMO_EXECUTIVO.txt (40-75 KB, 10-15 laudas)
   - ✅ 18 fichamentos expandidos

**Vantagem**: Controle total pelo usuário
**Desvantagem**: Trabalhoso para muitos documentos

---

### Opção 2: Re-Extração em Lote via API (Automação)

**Script para re-extrair TODOS os documentos com formato antigo:**

```bash
#!/bin/bash
# re-extract-old-documents.sh

EMAIL="rodolfo@rom.adv.br"
PASSWORD="Mota@2323"
DOMAIN="https://iarom.com.br"

# 1. Login
LOGIN_RESPONSE=$(curl -s -c /tmp/rom_batch.txt -X POST "${DOMAIN}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

# 2. Listar TODOS os documentos
DOCS=$(curl -s -b /tmp/rom_batch.txt "${DOMAIN}/api/kb/documents")

# 3. Identificar documentos SEM 00_TEXTO_COMPLETO.txt associado
echo "Buscando documentos que precisam re-extração..."

# Documentos principais (PDFs/DOCX) que NÃO são fichamentos
MAIN_DOCS=$(echo "$DOCS" | jq -r '.documents[] |
  select(.metadata.isStructuredDocument != true) |
  select(.name | test("\\.(pdf|docx)$"; "i")) |
  "\(.id)|\(.name)|\(.uploadedAt)"')

echo "$MAIN_DOCS" | while IFS='|' read -r DOC_ID DOC_NAME UPLOADED_AT; do
  # Verificar se já tem 00_TEXTO_COMPLETO.txt associado
  HAS_TXT=$(echo "$DOCS" | jq -r --arg parent "$DOC_ID" '.documents[] |
    select(.metadata.parentDocument == $parent) |
    select(.name | contains("00_TEXTO_COMPLETO")) |
    .id' | head -1)

  if [ -z "$HAS_TXT" ]; then
    echo "⚠️  $DOC_NAME não tem texto completo, agendando re-extração..."

    # Re-extrair via API
    curl -s -b /tmp/rom_batch.txt -X POST "${DOMAIN}/api/kb/analyze-v2" \
      -H "Content-Type: application/json" \
      -d "{
        \"documentId\": \"${DOC_ID}\",
        \"analysisType\": \"complete\",
        \"model\": \"sonnet\"
      }" > /tmp/re_extract_${DOC_ID}.log &

    echo "   ✅ Iniciado (background)"

    # Aguardar 30s entre extrações para não sobrecarregar
    sleep 30
  else
    echo "✅ $DOC_NAME já tem texto completo, pulando"
  fi
done

echo "Re-extração em lote iniciada!"
echo "Aguarde ~10 minutos por documento"
```

**Vantagem**: Automatizado, processa TODOS os documentos antigos
**Desvantagem**: Consome créditos AWS (cada extração custa ~$0.01-0.05)

---

### Opção 3: Migração Incremental (Recomendado)

**Re-extrair APENAS quando usuário pedir peça baseada em documento antigo:**

1. Chat detecta que fichamentos são antigos (sem texto completo)
2. Sugere ao usuário: "Este documento foi extraído antes das melhorias. Deseja re-extrair para obter análise mais detalhada?"
3. Se usuário aceitar → re-extração automática
4. Após conclusão → gera a peça solicitada

**Implementação**:

```javascript
// src/modules/bedrock-tools.js - na tool consultar_kb

// Detectar fichamentos antigos
const hasOldFormat = !doc.metadata?.hasFullText &&
                     doc.uploadedAt < '2026-03-02T16:00:00Z';

if (hasOldFormat) {
  return {
    success: true,
    content: `
📄 **Documento encontrado**: ${doc.name}

⚠️ **ATENÇÃO**: Este documento foi processado antes das melhorias do sistema.
A análise atual é resumida e pode não conter todos os detalhes.

💡 **Recomendação**: Re-extrair o documento para obter:
- ✅ Texto completo integral (00_TEXTO_COMPLETO.txt)
- ✅ Resumo executivo detalhado de 10-15 laudas
- ✅ 18 fichamentos expandidos com mais informações

**Deseja que eu faça a re-extração agora?** (levará 5-10 minutos)

Se sim, confirme respondendo: "Sim, re-extrair"
    `
  };
}
```

**Vantagem**:
- Não sobrecarrega sistema
- Usuário controla custos
- Re-extração sob demanda

**Desvantagem**:
- Requer interação do usuário

---

## 🔧 VALIDAÇÃO PÓS-EXTRAÇÃO

**Script para validar se nova extração gerou arquivos corretos:**

```bash
#!/bin/bash
# validate-extraction.sh

DOCUMENT_ID="$1"

if [ -z "$DOCUMENT_ID" ]; then
  echo "Uso: bash validate-extraction.sh <document-id>"
  exit 1
fi

# Login
curl -s -c /tmp/rom_val.txt -X POST "https://iarom.com.br/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rodolfo@rom.adv.br","password":"Mota@2323"}' > /dev/null

# Listar fichamentos do documento
DOCS=$(curl -s -b /tmp/rom_val.txt "https://iarom.com.br/api/kb/documents")

echo "Validando extração do documento: $DOCUMENT_ID"
echo ""

# Verificar 00_TEXTO_COMPLETO.txt
TXT=$(echo "$DOCS" | jq -r --arg parent "$DOCUMENT_ID" '.documents[] |
  select(.metadata.parentDocument == $parent) |
  select(.name | contains("00_TEXTO_COMPLETO")) |
  "\(.name) - \(.size) bytes"')

if [ -n "$TXT" ]; then
  echo "✅ 00_TEXTO_COMPLETO.txt: $TXT"
else
  echo "❌ 00_TEXTO_COMPLETO.txt: NÃO ENCONTRADO"
fi

# Verificar 05_RESUMO_EXECUTIVO.txt
RESUMO=$(echo "$DOCS" | jq -r --arg parent "$DOCUMENT_ID" '.documents[] |
  select(.metadata.parentDocument == $parent) |
  select(.name | contains("05_RESUMO_EXECUTIVO")) |
  "\(.name) - \(.size) bytes - \(.name | endswith(\".txt\"))"')

if [ -n "$RESUMO" ]; then
  RESUMO_SIZE=$(echo "$RESUMO" | awk -F' - ' '{print $2}' | awk '{print $1}')
  RESUMO_EXT=$(echo "$RESUMO" | awk -F' - ' '{print $3}')

  echo "✅ 05_RESUMO_EXECUTIVO: $RESUMO"

  if [ "$RESUMO_EXT" == "true" ]; then
    echo "   ✅ Extensão .txt correta"
  else
    echo "   ⚠️  Extensão .md (formato antigo?)"
  fi

  if [ "$RESUMO_SIZE" -gt 40000 ]; then
    echo "   ✅ Tamanho OK (>40 KB)"
  else
    echo "   ⚠️  Tamanho pequeno (<40 KB) - pode ser formato antigo"
  fi
else
  echo "❌ 05_RESUMO_EXECUTIVO: NÃO ENCONTRADO"
fi

# Contar fichamentos
FICHAMENTOS=$(echo "$DOCS" | jq --arg parent "$DOCUMENT_ID" '[.documents[] |
  select(.metadata.parentDocument == $parent) |
  select(.metadata.isStructuredDocument == true)] | length')

echo ""
echo "📊 Total de fichamentos: $FICHAMENTOS"

if [ "$FICHAMENTOS" -ge 18 ]; then
  echo "   ✅ Formato novo (18 fichamentos)"
elif [ "$FICHAMENTOS" -eq 7 ]; then
  echo "   ⚠️  Formato antigo (7 fichamentos)"
else
  echo "   ⚠️  Formato desconhecido ($FICHAMENTOS fichamentos)"
fi
```

---

## 📊 MÉTRICAS E MONITORAMENTO

### Criar Dashboard de Extrações:

```sql
-- Query para identificar documentos que precisam re-extração
SELECT
  d.id,
  d.name,
  d.uploadedAt,
  COUNT(CASE WHEN f.name LIKE '%00_TEXTO_COMPLETO%' THEN 1 END) as has_txt,
  COUNT(CASE WHEN f.name LIKE '%05_RESUMO_EXECUTIVO%' THEN 1 END) as has_resumo,
  COUNT(f.id) as total_fichamentos,
  CASE
    WHEN d.uploadedAt < '2026-03-02 16:00:00' THEN 'OLD_FORMAT'
    ELSE 'NEW_FORMAT'
  END as format_type
FROM kb_documents d
LEFT JOIN kb_documents f ON f.metadata->>'parentDocument' = d.id
WHERE d.type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  AND (d.metadata->>'isStructuredDocument' IS NULL OR d.metadata->>'isStructuredDocument' = 'false')
GROUP BY d.id, d.name, d.uploadedAt
HAVING COUNT(CASE WHEN f.name LIKE '%00_TEXTO_COMPLETO%' THEN 1 END) = 0
ORDER BY d.uploadedAt DESC;
```

### Endpoint de Diagnóstico:

```javascript
// src/routes/kb-diagnostics.js

router.get('/kb/diagnostics/old-extractions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const allDocs = kbCache.getAll();

    // Documentos do usuário
    const userDocs = allDocs.filter(doc =>
      doc.userId === userId &&
      !doc.metadata?.isStructuredDocument &&
      (doc.type === 'application/pdf' || doc.name.endsWith('.docx'))
    );

    const oldFormatDocs = [];

    for (const doc of userDocs) {
      // Buscar fichamentos associados
      const fichamentos = allDocs.filter(f =>
        f.metadata?.parentDocument === doc.id
      );

      const hasTxtCompleto = fichamentos.some(f =>
        f.name.includes('00_TEXTO_COMPLETO')
      );

      const resumo = fichamentos.find(f =>
        f.name.includes('05_RESUMO_EXECUTIVO')
      );

      const isOldFormat =
        !hasTxtCompleto ||
        (resumo && resumo.size < 40000) ||
        fichamentos.length < 15;

      if (isOldFormat) {
        oldFormatDocs.push({
          id: doc.id,
          name: doc.name,
          uploadedAt: doc.uploadedAt,
          hasTxtCompleto,
          resumoSize: resumo?.size || 0,
          fichamentosCount: fichamentos.length,
          needsReExtraction: true
        });
      }
    }

    res.json({
      success: true,
      totalDocuments: userDocs.length,
      oldFormatCount: oldFormatDocs.length,
      oldFormatDocuments: oldFormatDocs,
      recommendation: oldFormatDocs.length > 0
        ? 'Re-extrair documentos para obter análise detalhada'
        : 'Todos os documentos estão atualizados'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Validação (AGORA - 1 hora)

1. ✅ Aguardar extração de teste completar (5-10 min)
2. ✅ Validar que gerou:
   - 00_TEXTO_COMPLETO.txt
   - 05_RESUMO_EXECUTIVO.txt (>40 KB)
   - 18 fichamentos
3. ✅ Testar geração de peça (embargos) com novos fichamentos
4. ✅ Confirmar que NÃO usa placeholders

### Fase 2: Comunicação aos Usuários (2-3 dias)

1. Email para todos os usuários:
   ```
   Assunto: ✅ Melhorias no Sistema de Extração - Ação Requerida

   Prezado(a),

   Implementamos melhorias significativas no sistema de extração de processos:

   ✅ Texto completo integral agora disponível
   ✅ Resumo executivo expandido (10-15 laudas)
   ✅ 18 fichamentos detalhados (antes eram 7)

   📋 AÇÃO NECESSÁRIA:
   Documentos extraídos ANTES de 02/março/2026 precisam ser re-extraídos
   para aproveitar as melhorias.

   Como re-extrair:
   1. Acesse Knowledge Base
   2. Localize o documento
   3. Clique em "Analisar" → "Análise Completa"
   4. Aguarde 5-10 minutos

   Ou use o comando no chat:
   "Analise completamente o documento [nome]"

   Atenciosamente,
   Equipe ROM Agent
   ```

2. Banner na interface:
   ```
   ⚠️ Você tem X documentos que podem ser re-extraídos para obter análise detalhada.
   [Clique aqui para ver lista] [Re-extrair todos automaticamente]
   ```

### Fase 3: Automação Opcional (1 semana)

Implementar detecção automática + sugestão de re-extração:

```javascript
// Quando usuário pede peça baseada em doc antigo
if (documentoUsaFormatoAntigo(doc)) {
  return `
📄 Este documento está em formato antigo (extração de ${doc.uploadedAt}).

💡 Para obter análise mais detalhada e peça mais completa,
   recomendo re-extrair primeiro.

Responda "re-extrair" para iniciar (leva ~5-10 min) ou "continuar"
para gerar peça com informações atuais.
  `;
}
```

### Fase 4: Re-Extração em Massa (Opcional - sob demanda)

Se usuário tiver MUITOS documentos antigos:

```bash
# Re-extrair em lote (off-hours - madrugada)
bash scripts/re-extract-old-documents.sh --batch-size 10 --interval 60s
```

---

## 💰 CUSTOS ESTIMADOS

### Por Re-Extração:

- Extração (Nova Micro): $0.001
- Análise (Sonnet 4.5): $0.015-0.030
- **Total**: ~$0.02-0.03 por documento

### Para 1000 Documentos:

- Custo total: $20-30
- Tempo: ~100 horas (4 dias) se paralelo
- Benefício: Análise 10x mais detalhada

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após implementar solução:

- [ ] Nova extração gera 00_TEXTO_COMPLETO.txt
- [ ] Nova extração gera 05_RESUMO_EXECUTIVO.txt (>40 KB)
- [ ] Nova extração gera 18 fichamentos
- [ ] Chat consegue gerar peças SEM placeholders
- [ ] Usuários notificados sobre necessidade de re-extração
- [ ] Script de re-extração em lote testado
- [ ] Dashboard de diagnóstico funcional
- [ ] Documentação atualizada

---

**Status Atual**: ⏳ Aguardando validação de extração de teste
**Próximo Passo**: Validar arquivos gerados e testar geração de peça
**Responsável**: Claude Code + Rodolfo
