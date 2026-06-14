---
name: diarios-eletronicos
description: "Use para coletar e tratar diários eletrônicos e publicações oficiais (DJEN/Comunica do CNJ e metadados do DataJud) com dois fins: alimentar o corpus de jurimetria e monitorar intimações/andamentos. Trigger: 'diário eletrônico', 'DJe', 'DJEN', 'publicações', 'intimações', 'coletar decisões para jurimetria', 'DataJud'."
---

# Diários eletrônicos e bases oficiais → jurimetria

Duas fontes oficiais e gratuitas do CNJ, com papéis complementares.

## DataJud (metadados) — análise histórica e tempo
- Endpoint: `https://api-publica.datajud.cnj.jus.br/api_publica_<tribunal>/_search` (ex.: `api_publica_stj`, `api_publica_trtX`).
- Backend Elasticsearch; autenticação por **APIKey pública** do CNJ (obter na wiki oficial; pode mudar). Limite ~10.000 registros/consulta; paginar com `from`/`size` ou `search_after`.
- Traz: capa processual, classe, assunto, órgão julgador, datas e **movimentos** padronizados (tabela TPU/CNJ). Serve para: taxa por tipo de movimento (ex.: conhecimento/provimento via códigos), distribuição por órgão, tempo de tramitação. NÃO traz voto nem inteiro teor.

## DJEN / Comunica (publicações) — ementa, dispositivo, intimações
- Consulta: `https://comunica.pje.jus.br/` (Res. CNJ 455/2022).
- Publica: conteúdo de despachos e decisões interlocutórias, dispositivo das sentenças e **ementa dos acórdãos** (art. 205, §3º, CPC), intimações e listas de distribuição.
- Serve para: alimentar o corpus de jurimetria com ementa/dispositivo e para **monitorar prazos/intimações** do escritório.

## Pipeline
1. Coletar (via MCP/conector): DataJud para metadados+movimentos; DJEN para ementas/dispositivo.
2. Normalizar para o schema da skill `jurimetria` (`schema-decisoes.csv`).
3. Quando faltar o inteiro teor (DJEN só dá ementa) → marcar `⚠️[NÃO VERIFICADO]` o que não puder ser confirmado no voto; complementar pelo portal de jurisprudência (skill `leitura-jurisprudencia`).
4. Rodar `analisar.py` para as métricas.

## Limites
- DataJud = metadados; para texto integral, ir aos portais de jurisprudência.
- Respeitar Termo de Uso do CNJ e LGPD (dados de partes); usar somente o público.
- Endpoints e chaves podem mudar — confirmar na fonte; marcar como NÃO VERIFICADO o que não foi conferido.
