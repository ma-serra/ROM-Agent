# autos-mcp-server

Inventário de autos via MNI (PJe/eproc/Projudi/ESAJ) para a ferramenta de extração já existente do agente ROM, e **TRAVA DE INTEGRIDADE** (sem rollback / sem retrocesso) sobre a análise integral.

## Ferramentas
- `autos_inventario` — lista documentos/peças do processo via MNI (não re-extrai; entrega ao extrator do agente). Acesso credenciado por tribunal.
- `autos_selar_extracao` — sela o inventário integral (ledger forward-only). Selar estado menos completo = bloqueado, salvo autorização.
- `autos_verificar_integridade` — bloqueia artefato que omita item selado, salvo autorização.

## Instalar, compilar, testar
```bash
cd mcp/autos
npm install && npm run build
TRAVA_SCRIPT=../../skills/analise-integral-documentos/trava-integridade.py npm test
TRAVA_SCRIPT=../../skills/analise-integral-documentos/trava-integridade.py node audit-handshake.mjs
```

## Configuração (env)
- `TRAVA_SCRIPT` — caminho do trava-integridade.py (fonte única da lógica de integridade).
- `LEDGER` — caminho do ledger de selos (por escritório, na camada multi-tenant).
- `REGISTRO_MNI` — JSON por tribunal: `{"TJGO":{"endpoint":"...","usuario":"...","senha":"..."}}`.

## Observação honesta
A extração de conteúdo continua na ferramenta do agente — este servidor só inventaria e trava. MNI exige credenciamento (procurador vinculado) e cobertura varia por tribunal; fazer smoke test no ambiente do escritório.
