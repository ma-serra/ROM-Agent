#!/usr/bin/env bash
# ROM Agent — bootstrap autônomo, idempotente, aditivo, SEM downgrade.
# Instala deps e builda os 3 servidores MCP, roda testes e a auditoria estrutural.
# Conclui em verde apenas se tudo passar; caso contrário, para (não opera degradado).
set -uo pipefail
cd "$(dirname "$0")"
RAIZ="$(pwd)"
FALHAS=0

log()  { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
ok()   { printf '  ✔ %s\n' "$1"; }
erro() { printf '  ✗ %s\n' "$1"; FALHAS=$((FALHAS+1)); }

log "Pré-requisitos"
command -v node >/dev/null && ok "node $(node --version)" || erro "node ausente (>=18)"
command -v python3 >/dev/null && ok "python3 $(python3 --version 2>&1)" || erro "python3 ausente"
if command -v claude >/dev/null; then
  V="$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
  ok "claude code ${V:-?} (recomendado >= 2.1.154; não fazer downgrade)"
else
  printf '  ! claude code não encontrado no PATH (instale: npm i -g @anthropic-ai/claude-code@latest)\n'
fi

log "Servidores MCP (npm install + build, sem downgrade)"
for srv in tribunais2grau jurisprudencia autos; do
  if [ -d "mcp/$srv" ]; then
    ( cd "mcp/$srv" && npm install --no-audit --no-fund >/dev/null 2>&1 && npm run build >/dev/null 2>&1 ) \
      && ok "mcp/$srv: build OK" || erro "mcp/$srv: falha no install/build"
  else
    erro "mcp/$srv ausente"
  fi
done

log "Testes dos servidores MCP"
for srv in tribunais2grau jurisprudencia autos; do
  if [ -f "mcp/$srv/dist/lib.test.js" ]; then
    if [ "$srv" = "autos" ]; then
      export TRAVA_SCRIPT="$RAIZ/skills/analise-integral-documentos/trava-integridade.py"
    fi
    ( cd "mcp/$srv" && node --test dist/lib.test.js >/dev/null 2>&1 ) \
      && ok "mcp/$srv: testes OK" || erro "mcp/$srv: testes falharam"
  fi
done

log "Scripts Python (compilação)"
while IFS= read -r py; do
  python3 -m py_compile "$py" >/dev/null 2>&1 && ok "$(basename "$py")" || erro "$(basename "$py") não compila"
done < <(find skills hooks -name '*.py' 2>/dev/null)

log "Auditoria estrutural do plugin"
if python3 auditar-plugin.py >/tmp/rom-audit.txt 2>&1; then
  ok "auditoria APROVADA"
  grep -E "OK:|RESULTADO" /tmp/rom-audit.txt | sed 's/^/    /'
else
  erro "auditoria REPROVADA (ver /tmp/rom-audit.txt)"
fi

log "Camada multi-tenant"
[ -f config/tenancy.example.json ] && ok "tenancy de exemplo presente (copie p/ config/tenancy.json e ajuste)" || erro "tenancy ausente"

echo
if [ "$FALHAS" -eq 0 ]; then
  printf '\033[1;32mBOOTSTRAP CONCLUÍDO — tudo verde.\033[0m Registre o plugin: claude --plugin-dir "%s"\n' "$RAIZ"
  exit 0
else
  printf '\033[1;31mBOOTSTRAP COM %s FALHA(S).\033[0m Corrija antes de operar (não opere degradado).\n' "$FALHAS"
  exit 1
fi
