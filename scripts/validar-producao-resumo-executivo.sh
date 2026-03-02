#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# VALIDAÇÃO DE RESUMO EXECUTIVO EM PRODUÇÃO
# ═══════════════════════════════════════════════════════════════════════
#
# Este script valida se as mudanças do RESUMO_EXECUTIVO foram aplicadas
# corretamente em produção (iarom.com.br)
#
# Execução: bash scripts/validar-producao-resumo-executivo.sh
# ═══════════════════════════════════════════════════════════════════════

DOMAIN="https://iarom.com.br"
COOKIE_FILE="/tmp/rom_session.txt"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VALIDAÇÃO: RESUMO EXECUTIVO 10-15 LAUDAS - PRODUÇÃO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}\n"

# 1. Verificar conectividade
echo -e "${YELLOW}[1/7] Verificando conectividade com produção...${NC}"
if curl -s --max-time 10 "${DOMAIN}/api/info" > /dev/null; then
    echo -e "${GREEN}✅ Servidor acessível${NC}"
else
    echo -e "${RED}❌ Servidor inacessível${NC}"
    exit 1
fi

# 2. Verificar versão e commit
echo -e "\n${YELLOW}[2/7] Verificando versão e último commit...${NC}"
VERSION=$(curl -s "${DOMAIN}/api/info" | jq -r '.version')
COMMIT=$(curl -s "${DOMAIN}/api/info" | jq -r '.server.gitCommit')

echo -e "   Versão: ${GREEN}${VERSION}${NC}"
echo -e "   Commit: ${GREEN}${COMMIT}${NC}"

if [ "$COMMIT" == "e14e55c" ]; then
    echo -e "${GREEN}✅ Commit correto (e14e55c - Expansão do RESUMO_EXECUTIVO)${NC}"
else
    echo -e "${RED}⚠️  Commit diferente do esperado (esperado: e14e55c, atual: ${COMMIT})${NC}"
fi

# 3. Verificar uptime
echo -e "\n${YELLOW}[3/7] Verificando uptime do servidor...${NC}"
UPTIME=$(curl -s "${DOMAIN}/api/info" | jq -r '.health.uptime')
echo -e "   Uptime: ${GREEN}${UPTIME}${NC}"

# 4. Verificar status de saúde
echo -e "\n${YELLOW}[4/7] Verificando status de saúde do servidor...${NC}"
HEALTH=$(curl -s "${DOMAIN}/api/info" | jq -r '.health.status')
BEDROCK=$(curl -s "${DOMAIN}/api/info" | jq -r '.bedrock.status')

if [ "$HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✅ Status: ${HEALTH}${NC}"
else
    echo -e "${RED}❌ Status: ${HEALTH}${NC}"
fi

if [ "$BEDROCK" == "connected" ]; then
    echo -e "${GREEN}✅ Bedrock: ${BEDROCK}${NC}"
else
    echo -e "${RED}❌ Bedrock: ${BEDROCK}${NC}"
fi

# 5. Login (requer credenciais)
echo -e "\n${YELLOW}[5/7] Login em produção...${NC}"
echo -e "${BLUE}Para validar completamente, você precisa fazer login.${NC}"
echo -e "${BLUE}Opções:${NC}"
echo -e "  1. Login via browser em ${DOMAIN}"
echo -e "  2. Fornecer credenciais para login via API"
echo ""

read -p "Deseja fazer login via API agora? (s/N): " DO_LOGIN

if [ "$DO_LOGIN" == "s" ] || [ "$DO_LOGIN" == "S" ]; then
    echo ""
    read -p "Email: " EMAIL
    read -s -p "Senha: " PASSWORD
    echo ""

    # Fazer login
    LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "${DOMAIN}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

    LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success // false')

    if [ "$LOGIN_SUCCESS" == "true" ]; then
        echo -e "${GREEN}✅ Login realizado com sucesso${NC}"

        # 6. Listar documentos na KB
        echo -e "\n${YELLOW}[6/7] Listando documentos na KB...${NC}"
        DOCS_RESPONSE=$(curl -s -b "$COOKIE_FILE" "${DOMAIN}/api/kb/documents")
        DOCS_COUNT=$(echo "$DOCS_RESPONSE" | jq '. | length')

        echo -e "   Total de documentos: ${GREEN}${DOCS_COUNT}${NC}"

        if [ "$DOCS_COUNT" -gt 0 ]; then
            echo -e "\n${BLUE}Documentos recentes (não estruturados):${NC}"
            echo "$DOCS_RESPONSE" | jq -r '.[] | select(.metadata.isStructuredDocument != true and .metadata.isExtractedText != true) | "\(.uploadedAt // "sem-data") - \(.name // .originalName)"' | sort -r | head -10

            # 7. Verificar se há extrações com novo formato
            echo -e "\n${YELLOW}[7/7] Verificando extrações com novo formato...${NC}"

            # Procurar por TEXTO_COMPLETO.txt
            TEXTO_COMPLETO=$(echo "$DOCS_RESPONSE" | jq -r '.[] | select(.name | contains("00_TEXTO_COMPLETO.txt")) | .name' | head -1)

            if [ -n "$TEXTO_COMPLETO" ]; then
                echo -e "${GREEN}✅ Encontrado arquivo TEXTO_COMPLETO.txt:${NC}"
                echo -e "   ${TEXTO_COMPLETO}"
            else
                echo -e "${RED}❌ Nenhum arquivo 00_TEXTO_COMPLETO.txt encontrado${NC}"
                echo -e "${YELLOW}   Isso indica que não houve extração com o novo formato ainda${NC}"
            fi

            # Procurar por RESUMO_EXECUTIVO.txt (novo formato)
            RESUMO_TXT=$(echo "$DOCS_RESPONSE" | jq -r '.[] | select(.name | contains("05_RESUMO_EXECUTIVO.txt")) | "\(.name)|\(.size)"' | head -1)

            if [ -n "$RESUMO_TXT" ]; then
                RESUMO_NAME=$(echo "$RESUMO_TXT" | cut -d'|' -f1)
                RESUMO_SIZE=$(echo "$RESUMO_TXT" | cut -d'|' -f2)
                RESUMO_KB=$((RESUMO_SIZE / 1024))

                echo -e "${GREEN}✅ Encontrado RESUMO_EXECUTIVO.txt (novo formato):${NC}"
                echo -e "   Nome: ${RESUMO_NAME}"
                echo -e "   Tamanho: ${GREEN}${RESUMO_KB} KB${NC}"

                if [ "$RESUMO_KB" -ge 40 ]; then
                    echo -e "${GREEN}✅ Tamanho adequado (≥40KB esperado para 10-15 laudas)${NC}"
                else
                    echo -e "${YELLOW}⚠️  Tamanho menor que esperado (<40KB)${NC}"
                fi
            else
                # Procurar por RESUMO_EXECUTIVO.md (formato antigo)
                RESUMO_MD=$(echo "$DOCS_RESPONSE" | jq -r '.[] | select(.name | contains("05_RESUMO_EXECUTIVO.md")) | "\(.name)|\(.size)"' | head -1)

                if [ -n "$RESUMO_MD" ]; then
                    RESUMO_NAME=$(echo "$RESUMO_MD" | cut -d'|' -f1)
                    RESUMO_SIZE=$(echo "$RESUMO_MD" | cut -d'|' -f2)
                    RESUMO_KB=$((RESUMO_SIZE / 1024))

                    echo -e "${YELLOW}⚠️  Encontrado RESUMO_EXECUTIVO.md (formato ANTIGO):${NC}"
                    echo -e "   Nome: ${RESUMO_NAME}"
                    echo -e "   Tamanho: ${YELLOW}${RESUMO_KB} KB${NC} (formato antigo ~1KB)"
                    echo -e "${RED}❌ Formato esperado: .txt (não .md)${NC}"
                    echo -e "${YELLOW}   Isso indica extração feita antes da atualização${NC}"
                else
                    echo -e "${RED}❌ Nenhum arquivo RESUMO_EXECUTIVO encontrado${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  Nenhum documento na KB para validar${NC}"
        fi

        # Cleanup
        rm -f "$COOKIE_FILE"

    else
        ERROR_MSG=$(echo "$LOGIN_RESPONSE" | jq -r '.error // "Erro desconhecido"')
        echo -e "${RED}❌ Falha no login: ${ERROR_MSG}${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Validação parcial - login não realizado${NC}"
    echo -e "${BLUE}Para validação completa:${NC}"
    echo -e "  1. Acesse ${DOMAIN}"
    echo -e "  2. Faça login"
    echo -e "  3. Vá em Knowledge Base"
    echo -e "  4. Faça upload de um PDF de teste"
    echo -e "  5. Clique em 'Analisar Documento'"
    echo -e "  6. Aguarde conclusão (3-10 minutos)"
    echo -e "  7. Verifique os arquivos gerados:"
    echo -e "     - Procure por: *00_TEXTO_COMPLETO.txt"
    echo -e "     - Procure por: *05_RESUMO_EXECUTIVO.txt (não .md)"
    echo -e "     - Tamanho esperado do resumo: 40-75 KB"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VALIDAÇÃO CONCLUÍDA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Resumo:${NC}"
echo -e "  Versão: ${VERSION}"
echo -e "  Commit: ${COMMIT}"
echo -e "  Status: ${HEALTH}"
echo -e "  Bedrock: ${BEDROCK}"
echo ""

if [ "$COMMIT" == "e14e55c" ]; then
    echo -e "${GREEN}✅ Código atualizado em produção${NC}"
    echo -e "${YELLOW}⚠️  Para validar completamente, é necessário fazer uma nova extração${NC}"
else
    echo -e "${YELLOW}⚠️  Código pode não estar atualizado (commit diferente)${NC}"
fi

echo ""
