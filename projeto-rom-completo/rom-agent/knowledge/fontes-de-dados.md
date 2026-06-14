# Fontes de dados e mapa de mecanismos (ROM)

## Quem faz o quê (skill x plugin x API/MCP x habilidade)
| Capacidade | Mecanismo | Observação |
|---|---|---|
| Ler processo na íntegra / docs da inicial (inclui PDF escaneado) | **habilidade** de file-reading/OCR + **skill** analise-integral-documentos (subagente leitor-autos) | nunca por amostragem; anti-supressão |
| Ler jurisprudência (ementa/voto/acórdão) e estruturar | **skill** leitura-jurisprudencia | ratio decidendi a partir do voto, não só da ementa |
| Coletar diários eletrônicos e metadados p/ jurimetria | **API/MCP**: DJEN-Comunica + DataJud (skill diarios-eletronicos) | DataJud = metadados; DJEN = ementa/dispositivo/intimações |
| Calcular métricas jurimétricas | **skill** jurimetria + script analisar.py | limites estatísticos sempre |
| Verificar citações | **hook** (determinista) + **MCP** verificador | bloqueia gravação com citação solta |
| Diagnóstico de admissibilidade | **skill** diagnostico-admissibilidade (+ Base histórica da jurimetria) | núcleo recursal |
| Empacotar e distribuir ao escritório | **plugin** versionado | mesma versão em plugin.json e no marketplace |

## Fontes oficiais
- **DataJud (CNJ)**: `https://api-publica.datajud.cnj.jus.br/api_publica_<tribunal>/_search` — Elasticsearch, APIKey pública, metadados+movimentos. Bom para jurimetria histórica e tempo. Não traz voto.
- **DJEN/Comunica (CNJ)**: `https://comunica.pje.jus.br/` (Res. 455/2022) — despachos, dispositivo de sentenças, ementa de acórdãos, intimações.
- **Jurisprudência (inteiro teor)**: STJ SCON; STF jurisprudência; portais dos tribunais.
- Privadas (opcional): Judit.io, Data Lawyer, Legal One, Turivius — tempo real/webhooks/documentos.

## Regras transversais
- Só dados públicos; Termo de Uso do CNJ e LGPD.
- Endpoints/chaves mudam → conferir na fonte; marcar ⚠️[NÃO VERIFICADO] o não confirmado.
