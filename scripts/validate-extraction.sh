#!/bin/bash

# Script para validar se uma extração gerou todos os arquivos esperados (formato novo)

EMAIL="$1"
PASSWORD="$2"
DOCUMENT_NAME="$3"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$DOCUMENT_NAME" ]; then
    echo "Uso: bash scripts/validate-extraction.sh <email> <password> <document_name>"
    echo ""
    echo "Exemplo: bash scripts/validate-extraction.sh email@exemplo.com senha 'PETICAO_INTERDICAO_FRANCISCA_V5.docx'"
    exit 1
fi

DOMAIN="https://iarom.com.br"
COOKIE_FILE="/tmp/rom_validate.txt"

echo "═══════════════════════════════════════════════"
echo "  VALIDAÇÃO DE EXTRAÇÃO - FORMATO NOVO"
echo "═══════════════════════════════════════════════"
echo ""
echo "Documento: $DOCUMENT_NAME"
echo ""

# Login
echo "1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "${DOMAIN}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" != "true" ]; then
    echo "❌ Falha no login"
    exit 1
fi

echo "✅ Login realizado"
echo ""

# Listar documentos
echo "2. Buscando documento e fichamentos..."
DOCS_JSON=$(curl -s -b "$COOKIE_FILE" "${DOMAIN}/api/kb/documents")

# Encontrar documento principal
DOC_ID=$(echo "$DOCS_JSON" | jq -r --arg name "$DOCUMENT_NAME" '.documents[] |
    select(.name == $name) |
    select(.metadata.isStructuredDocument != true) |
    .id' | head -1)

if [ -z "$DOC_ID" ]; then
    echo "❌ Documento '$DOCUMENT_NAME' não encontrado"
    echo ""
    echo "Documentos disponíveis:"
    echo "$DOCS_JSON" | jq -r '.documents[] |
        select(.metadata.isStructuredDocument != true) |
        .name' | head -20
    exit 1
fi

echo "✅ Documento encontrado: $DOC_ID"
echo ""

# Buscar fichamentos associados
FICHAMENTOS=$(echo "$DOCS_JSON" | jq --arg parent "$DOC_ID" '[.documents[] |
    select(.metadata.parentDocument == $parent)]')

TOTAL_FICHAMENTOS=$(echo "$FICHAMENTOS" | jq 'length')

echo "════════════════════════════════════════════════"
echo "  VALIDAÇÃO DOS ARQUIVOS GERADOS"
echo "════════════════════════════════════════════════"
echo ""

# Verificar 00_TEXTO_COMPLETO.txt
echo "📄 1. TEXTO COMPLETO (00_TEXTO_COMPLETO.txt)"
echo "────────────────────────────────────────────────"

TXT_INFO=$(echo "$FICHAMENTOS" | jq -r '.[] |
    select(.name | contains("00_TEXTO_COMPLETO")) |
    "\(.name)|\(.size)|\(.uploadedAt)"')

if [ -n "$TXT_INFO" ]; then
    TXT_NAME=$(echo "$TXT_INFO" | cut -d'|' -f1)
    TXT_SIZE=$(echo "$TXT_INFO" | cut -d'|' -f2)
    TXT_DATE=$(echo "$TXT_INFO" | cut -d'|' -f3)

    echo "✅ ENCONTRADO"
    echo "   Nome: $TXT_NAME"
    echo "   Tamanho: $(echo "scale=2; $TXT_SIZE / 1024" | bc) KB"
    echo "   Data: $TXT_DATE"
else
    echo "❌ NÃO ENCONTRADO"
    echo "   Este é um requisito OBRIGATÓRIO do formato novo"
fi

echo ""

# Verificar 05_RESUMO_EXECUTIVO.txt
echo "📋 2. RESUMO EXECUTIVO (05_RESUMO_EXECUTIVO.txt)"
echo "────────────────────────────────────────────────"

RESUMO_INFO=$(echo "$FICHAMENTOS" | jq -r '.[] |
    select(.name | contains("05_RESUMO_EXECUTIVO")) |
    "\(.name)|\(.size)|\(.uploadedAt)"')

if [ -n "$RESUMO_INFO" ]; then
    RESUMO_NAME=$(echo "$RESUMO_INFO" | cut -d'|' -f1)
    RESUMO_SIZE=$(echo "$RESUMO_INFO" | cut -d'|' -f2)
    RESUMO_DATE=$(echo "$RESUMO_INFO" | cut -d'|' -f3)
    RESUMO_KB=$(echo "scale=2; $RESUMO_SIZE / 1024" | bc)

    echo "✅ ENCONTRADO"
    echo "   Nome: $RESUMO_NAME"
    echo "   Tamanho: ${RESUMO_KB} KB"
    echo "   Data: $RESUMO_DATE"
    echo ""

    # Validar extensão
    if echo "$RESUMO_NAME" | grep -q "\.txt$"; then
        echo "   ✅ Extensão .txt (correto)"
    else
        echo "   ⚠️  Extensão .md (formato antigo?)"
    fi

    # Validar tamanho
    RESUMO_SIZE_INT=$(echo "$RESUMO_SIZE" | awk '{print int($1)}')
    if [ "$RESUMO_SIZE_INT" -gt 40000 ]; then
        echo "   ✅ Tamanho > 40 KB (formato novo expandido)"
    elif [ "$RESUMO_SIZE_INT" -gt 10000 ]; then
        echo "   ⚠️  Tamanho entre 10-40 KB (pode ser formato intermediário)"
    else
        echo "   ❌ Tamanho < 10 KB (formato antigo!)"
    fi
else
    echo "❌ NÃO ENCONTRADO"
fi

echo ""

# Verificar fichamentos (18 esperados)
echo "📑 3. FICHAMENTOS ESTRUTURADOS"
echo "────────────────────────────────────────────────"
echo "Total de fichamentos: $TOTAL_FICHAMENTOS"
echo ""

if [ "$TOTAL_FICHAMENTOS" -ge 18 ]; then
    echo "✅ Formato novo (18+ fichamentos)"
elif [ "$TOTAL_FICHAMENTOS" -ge 15 ]; then
    echo "⚠️  Formato intermediário (15-17 fichamentos)"
elif [ "$TOTAL_FICHAMENTOS" -eq 7 ]; then
    echo "❌ Formato antigo (7 fichamentos)"
else
    echo "⚠️  Formato desconhecido ($TOTAL_FICHAMENTOS fichamentos)"
fi

echo ""
echo "Fichamentos encontrados:"
echo "$FICHAMENTOS" | jq -r '.[] |
    select(.metadata.isStructuredDocument == true) |
    "   - \(.name | split(" - ")[-1]) - \(.size) bytes"' | sort

echo ""

# Resumo final
echo "════════════════════════════════════════════════"
echo "  RESULTADO DA VALIDAÇÃO"
echo "════════════════════════════════════════════════"
echo ""

HAS_TXT=$(echo "$TXT_INFO" | wc -l | tr -d ' ')
HAS_RESUMO=$(echo "$RESUMO_INFO" | wc -l | tr -d ' ')
RESUMO_SIZE_INT=$(echo "$RESUMO_SIZE" | awk '{print int($1)}')

if [ "$HAS_TXT" -gt 0 ] && [ "$HAS_RESUMO" -gt 0 ] && [ "$RESUMO_SIZE_INT" -gt 40000 ] && [ "$TOTAL_FICHAMENTOS" -ge 18 ]; then
    echo "✅ FORMATO NOVO COMPLETO"
    echo ""
    echo "Este documento foi extraído com TODAS as melhorias:"
    echo "  ✅ Texto completo integral (00_TEXTO_COMPLETO.txt)"
    echo "  ✅ Resumo executivo expandido (>40 KB, 10-15 laudas)"
    echo "  ✅ 18 fichamentos detalhados"
    echo ""
    echo "🎯 O chat conseguirá gerar peças COMPLETAS e SEM PLACEHOLDERS"
elif [ "$HAS_TXT" -gt 0 ] && [ "$HAS_RESUMO" -gt 0 ]; then
    echo "⚠️  FORMATO PARCIALMENTE ATUALIZADO"
    echo ""
    echo "  ✅ Tem texto completo"
    echo "  ✅ Tem resumo executivo"

    if [ "$RESUMO_SIZE_INT" -lt 40000 ]; then
        echo "  ⚠️  Resumo executivo pequeno (pode ser versão antiga)"
    fi

    if [ "$TOTAL_FICHAMENTOS" -lt 18 ]; then
        echo "  ⚠️  Poucos fichamentos ($TOTAL_FICHAMENTOS)"
    fi

    echo ""
    echo "💡 Recomendação: Re-extrair para obter formato completo"
else
    echo "❌ FORMATO ANTIGO"
    echo ""
    if [ "$HAS_TXT" -eq 0 ]; then
        echo "  ❌ Sem texto completo"
    fi
    if [ "$HAS_RESUMO" -eq 0 ]; then
        echo "  ❌ Sem resumo executivo"
    fi
    echo ""
    echo "⚠️  AÇÃO NECESSÁRIA: Re-extrair este documento"
    echo ""
    echo "Como re-extrair:"
    echo "  1. Via interface: KB → Analisar → Análise Completa"
    echo "  2. Via chat: 'Analise completamente o documento $DOCUMENT_NAME'"
fi

echo ""

# Cleanup
rm -f "$COOKIE_FILE"
