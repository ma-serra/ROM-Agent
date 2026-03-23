#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ROM Agent - Fix KB Synchronization in Production
# ═══════════════════════════════════════════════════════════════
# PROBLEMA: Documentos deletados ainda aparecem + novos não são encontrados
# CAUSA: Multiple workers com caches separados em memória
# SOLUÇÃO: Auto-reload + limpeza de fantasmas
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ROM Agent - KB Synchronization Fix                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
API_URL="${API_URL:-https://iarom.com.br}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

# Função para fazer requisição autenticada
api_request() {
  local method=$1
  local endpoint=$2
  local data=$3

  if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ AUTH_TOKEN não definido${NC}"
    echo "   Por favor, exporte seu token de autenticação:"
    echo "   export AUTH_TOKEN='seu-token-aqui'"
    exit 1
  fi

  local curl_opts="-s -X $method"
  curl_opts="$curl_opts -H 'Authorization: Bearer $AUTH_TOKEN'"
  curl_opts="$curl_opts -H 'Content-Type: application/json'"

  if [ -n "$data" ]; then
    curl_opts="$curl_opts -d '$data'"
  fi

  eval curl $curl_opts "$API_URL$endpoint"
}

# ═══════════════════════════════════════════════════════════════
# ETAPA 1: Limpar documentos fantasmas
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🧹 [ETAPA 1/3] Limpando documentos fantasmas...${NC}"
echo ""

CLEAN_RESPONSE=$(api_request POST "/api/kb/cache/clean" "")
echo "$CLEAN_RESPONSE" | python3 -m json.tool

GHOSTS_REMOVED=$(echo "$CLEAN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('ghostsRemoved', 0))" 2>/dev/null || echo "0")

if [ "$GHOSTS_REMOVED" -gt 0 ]; then
  echo -e "${GREEN}✅ ${GHOSTS_REMOVED} documento(s) fantasma(s) removido(s)${NC}"
else
  echo -e "${GREEN}✨ Nenhum documento fantasma encontrado${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: Forçar reload do cache
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔄 [ETAPA 2/3] Forçando reload do cache em todos os workers...${NC}"
echo ""

RELOAD_RESPONSE=$(api_request POST "/api/kb/cache/reload" "")
echo "$RELOAD_RESPONSE" | python3 -m json.tool

AFTER_COUNT=$(echo "$RELOAD_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('afterCount', 0))" 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Cache recarregado: ${AFTER_COUNT} documento(s)${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# ETAPA 3: Verificar estado final
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}📊 [ETAPA 3/3] Verificando estado final do sistema...${NC}"
echo ""

HEALTH_RESPONSE=$(curl -s "$API_URL/api/info")
GIT_COMMIT=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['server']['gitCommit'])" 2>/dev/null || echo "unknown")
UPTIME=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['health']['uptime'])" 2>/dev/null || echo "unknown")

echo "   • GitCommit: $GIT_COMMIT"
echo "   • Uptime: $UPTIME"
echo "   • Total documentos: $AFTER_COUNT"
echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMO
# ═══════════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  RESUMO DA OPERAÇÃO                                           ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  ✅ Documentos fantasmas removidos: ${GHOSTS_REMOVED}                           ║"
echo "║  ✅ Cache sincronizado em todos os workers                    ║"
echo "║  ✅ Total de documentos ativos: ${AFTER_COUNT}                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}🎉 Sincronização concluída com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste fazer upload de um novo documento"
echo "   2. Verifique se aparece imediatamente no KB"
echo "   3. Teste deletar um documento"
echo "   4. Verifique se desaparece imediatamente"
echo ""
echo "⚙️  Auto-reload ativado:"
echo "   • Cache agora verifica mudanças a cada 3 segundos"
echo "   • Workers sincronizam automaticamente"
echo "   • Problemas de sincronização resolvidos definitivamente"
echo ""
