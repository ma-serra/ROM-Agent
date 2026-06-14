# tribunais-2grau-mcp-server

Servidor MCP do ROM que roteia decisões de **qualquer tribunal brasileiro** (TJ/TRF/TRT) pelo número único CNJ, consulta o **DataJud** e monta o **rol de anexos** (inteiro teor, ementa/acórdão, relatório e voto, certidão de julgamento).

## Ferramentas
- `tribunais_resolver_processo` — decodifica o número CNJ → segmento, tribunal, alias do DataJud, portais (do registro) e fallback DJEN.
- `tribunais_buscar_datajud` — consulta a API pública do DataJud (metadados/movimentos) por número ou filtros (jurimetria/tempo de tramitação).
- `tribunais_montar_anexos` — monta o bloco "DOS DOCUMENTOS ANEXOS" + lista de download + pendências.

## Instalar, compilar, testar
```bash
cd mcp/tribunais2grau
npm install
npm run build      # tsc estrito -> dist/
npm test           # 8 testes unitários (node:test)
node audit-handshake.mjs   # handshake MCP completo (initialize/list/call)
```

## Configuração (env)
- `REGISTRO` — caminho do registro-tribunais.json (sistema/portais por tribunal).
- `DATAJUD_APIKEY` — chave pública vigente do CNJ (datajud-wiki.cnj.jus.br/api-publica/acesso).

## Transporte
stdio (uso local como subprocesso do Claude Code), conforme `.mcp.json` do plugin.
