#!/bin/bash

# Script para re-extrair TODOS os documentos com formato antigo (sem 00_TEXTO_COMPLETO.txt)

EMAIL="$1"
PASSWORD="$2"
BATCH_SIZE="${3:-5}"  # Padrão: 5 extrações por vez
INTERVAL="${4:-60}"   # Padrão: 60 segundos entre batches

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Uso: bash scripts/re-extract-old-documents.sh <email> <password> [batch_size] [interval_seconds]"
    echo ""
    echo "Exemplo: bash scripts/re-extract-old-documents.sh email@exemplo.com senha 10 30"
    echo "         (re-extrai 10 documentos por vez, aguarda 30s entre batches)"
    exit 1
fi

DOMAIN="https://iarom.com.br"
COOKIE_FILE="/tmp/rom_batch_reextract.txt"
LOG_FILE="/tmp/re_extract_$(date +%Y%m%d_%H%M%S).log"

echo "═══════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  RE-EXTRAÇÃO EM LOTE - DOCUMENTOS ANTIGOS" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Configuração:" | tee -a "$LOG_FILE"
echo "  - Batch size: $BATCH_SIZE documentos por vez" | tee -a "$LOG_FILE"
echo "  - Intervalo: $INTERVAL segundos entre batches" | tee -a "$LOG_FILE"
echo "  - Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 1. Login
echo "1. Fazendo login..." | tee -a "$LOG_FILE"
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "${DOMAIN}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" != "true" ]; then
    echo "❌ Falha no login" | tee -a "$LOG_FILE"
    echo "$LOGIN_RESPONSE" | jq . | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ Login realizado" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 2. Listar TODOS os documentos
echo "2. Listando documentos..." | tee -a "$LOG_FILE"
DOCS_JSON=$(curl -s -b "$COOKIE_FILE" "${DOMAIN}/api/kb/documents")

# Salvar em arquivo temp para análise
echo "$DOCS_JSON" > /tmp/all_docs.json

# 3. Identificar documentos principais (PDFs/DOCX) que NÃO são fichamentos
echo "3. Identificando documentos que precisam re-extração..." | tee -a "$LOG_FILE"

# Extrair IDs de documentos principais
MAIN_DOCS=$(cat /tmp/all_docs.json | jq -r '.documents[] |
  select(.metadata.isStructuredDocument != true) |
  select(.type == "application/pdf" or (.name | endswith(".docx"))) |
  "\(.id)|\(.name)|\(.uploadedAt)"')

TOTAL_MAIN=$(echo "$MAIN_DOCS" | wc -l | tr -d ' ')
echo "   Total de documentos principais: $TOTAL_MAIN" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 4. Para cada documento, verificar se tem 00_TEXTO_COMPLETO.txt
DOCS_TO_REEXTRACT=""
COUNT_NEED_REEXTRACT=0

while IFS='|' read -r DOC_ID DOC_NAME UPLOADED_AT; do
    if [ -z "$DOC_ID" ]; then
        continue
    fi

    # Verificar se já tem 00_TEXTO_COMPLETO.txt associado
    HAS_TXT=$(cat /tmp/all_docs.json | jq -r --arg parent "$DOC_ID" '.documents[] |
        select(.metadata.parentDocument == $parent) |
        select(.name | contains("00_TEXTO_COMPLETO")) |
        .id' | head -1)

    if [ -z "$HAS_TXT" ]; then
        echo "   ⚠️  $DOC_NAME (uploaded: $UPLOADED_AT)" | tee -a "$LOG_FILE"
        echo "      → Sem texto completo, agendando re-extração" | tee -a "$LOG_FILE"
        DOCS_TO_REEXTRACT="${DOCS_TO_REEXTRACT}${DOC_ID}|${DOC_NAME}\n"
        COUNT_NEED_REEXTRACT=$((COUNT_NEED_REEXTRACT + 1))
    else
        echo "   ✅ $DOC_NAME já tem texto completo, pulando" >> "$LOG_FILE"
    fi
done <<< "$MAIN_DOCS"

echo "" | tee -a "$LOG_FILE"
echo "════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "RESUMO:" | tee -a "$LOG_FILE"
echo "  - Total de documentos: $TOTAL_MAIN" | tee -a "$LOG_FILE"
echo "  - Precisam re-extração: $COUNT_NEED_REEXTRACT" | tee -a "$LOG_FILE"
echo "  - Já atualizados: $((TOTAL_MAIN - COUNT_NEED_REEXTRACT))" | tee -a "$LOG_FILE"
echo "════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ "$COUNT_NEED_REEXTRACT" -eq 0 ]; then
    echo "✅ Todos os documentos já estão atualizados!" | tee -a "$LOG_FILE"
    rm -f "$COOKIE_FILE" /tmp/all_docs.json
    exit 0
fi

# 5. Confirmar com usuário
echo "⚠️  ATENÇÃO: Isso irá re-extrair $COUNT_NEED_REEXTRACT documentos" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Custo estimado: \$$(echo "$COUNT_NEED_REEXTRACT * 0.025" | bc) USD" | tee -a "$LOG_FILE"
echo "Tempo estimado: $(echo "$COUNT_NEED_REEXTRACT * 7 / 60" | bc) horas" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Deseja continuar? (y/N)"
read CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Operação cancelada pelo usuário" | tee -a "$LOG_FILE"
    rm -f "$COOKIE_FILE" /tmp/all_docs.json
    exit 0
fi

# 6. Re-extrair em batches
echo "" | tee -a "$LOG_FILE"
echo "4. Iniciando re-extração em batches..." | tee -a "$LOG_FILE"
echo "════════════════════════════════════════════════" | tee -a "$LOG_FILE"

CURRENT_BATCH=0
TOTAL_PROCESSED=0
TOTAL_SUCCESS=0
TOTAL_FAILED=0

echo -e "$DOCS_TO_REEXTRACT" | while IFS='|' read -r DOC_ID DOC_NAME; do
    if [ -z "$DOC_ID" ]; then
        continue
    fi

    TOTAL_PROCESSED=$((TOTAL_PROCESSED + 1))
    CURRENT_BATCH=$((CURRENT_BATCH + 1))

    echo "" | tee -a "$LOG_FILE"
    echo "[$TOTAL_PROCESSED/$COUNT_NEED_REEXTRACT] Re-extraindo: $DOC_NAME" | tee -a "$LOG_FILE"
    echo "   Document ID: $DOC_ID" | tee -a "$LOG_FILE"

    # Chamar API de análise
    ANALYSIS_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "${DOMAIN}/api/kb/analyze-v2" \
        -H "Content-Type: application/json" \
        -d "{
            \"documentId\": \"${DOC_ID}\",
            \"analysisType\": \"complete\",
            \"model\": \"sonnet\"
        }")

    # Verificar sucesso
    JOB_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.jobId // empty')

    if [ -n "$JOB_ID" ]; then
        echo "   ✅ Extração iniciada (Job ID: $JOB_ID)" | tee -a "$LOG_FILE"
        TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
    else
        echo "   ❌ Erro ao iniciar extração" | tee -a "$LOG_FILE"
        echo "   Response: $ANALYSIS_RESPONSE" | tee -a "$LOG_FILE"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # Se completou um batch, aguardar intervalo
    if [ "$CURRENT_BATCH" -ge "$BATCH_SIZE" ]; then
        echo "" | tee -a "$LOG_FILE"
        echo "⏸️  Batch de $BATCH_SIZE completado. Aguardando ${INTERVAL}s antes do próximo..." | tee -a "$LOG_FILE"
        sleep "$INTERVAL"
        CURRENT_BATCH=0
    fi
done

echo "" | tee -a "$LOG_FILE"
echo "════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  RE-EXTRAÇÃO CONCLUÍDA" | tee -a "$LOG_FILE"
echo "════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "RESULTADOS:" | tee -a "$LOG_FILE"
echo "  - Total processados: $TOTAL_PROCESSED" | tee -a "$LOG_FILE"
echo "  - Sucessos: $TOTAL_SUCCESS" | tee -a "$LOG_FILE"
echo "  - Falhas: $TOTAL_FAILED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "⏰ As extrações estão rodando em background." | tee -a "$LOG_FILE"
echo "   Aguarde ~7 minutos por documento para conclusão." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log completo salvo em: $LOG_FILE" | tee -a "$LOG_FILE"

# Cleanup
rm -f "$COOKIE_FILE" /tmp/all_docs.json
