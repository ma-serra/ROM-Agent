# jurisprudencia-mcp-server

Resolve links oficiais de decisões (inteiro teor, ementa/acórdão, relatório e voto, certidão de julgamento) no STJ, STF e DJEN a partir do número CNJ, e busca publicações no DJEN — alimentando o `tribunais_montar_anexos`.

## Ferramentas
- `jurisprudencia_resolver_links` — número CNJ → objeto pronto para o montar_anexos (entradas determinísticas + componentes; ausentes ficam ⚠️[NÃO VERIFICADO]).
- `jurisprudencia_buscar_djen` — publicações do DJEN por número (ementa/dispositivo/intimações + link de inteiro teor).
- `jurisprudencia_portal_inteiro_teor` — portal de inteiro teor por segmento (STJ SCON / STF / DJEN).

## Instalar, compilar, testar
```bash
cd mcp/jurisprudencia
npm install && npm run build
npm test                 # 7 testes unitários
node audit-handshake.mjs # handshake + ciclo fechado com tribunais_montar_anexos
```

## Observação honesta
As URLs de consulta/portal são determinísticas; os links de documento (PDF de inteiro teor/certidão) exigem resolução em runtime via `jurisprudencia_buscar_djen` ou no portal do tribunal. A rede do ambiente de build não acessa os sites dos tribunais — faça um smoke test de `buscar_djen` no ambiente do escritório. Confirme o endpoint vigente da API de comunicações do CNJ (`DJEN_API`).
