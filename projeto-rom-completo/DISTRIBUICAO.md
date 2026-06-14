# Distribuição — o que é do Agente IA ROM (Claude Code) e do Claude Team

Critério simples: **o Claude Team web NÃO executa código** — não roda MCP, hooks, scripts, subagentes nem orquestrador. Logo, tudo que é determinista/executável é do **Claude Code (agente ROM)**; o **Claude Team** recebe a mesma metodologia como **instruções + conhecimento + prompts** (disciplina de revisão, não automação).

---

## A) AGENTE IA ROM — Claude Code (pasta `rom-agent/`)
Tudo aqui roda no Claude Code; nada disso funciona no Team web.

**Núcleo e execução**
- `CLAUDE.md` — constituição/metodologia sempre carregada.
- `ORQUESTRACAO.md` — runbook mestre de execução autônoma.
- `bootstrap.sh` — montagem idempotente (install + build + testes + auditoria).
- `auditar-plugin.py` / `AUDITORIA.md` — auditoria estrutural.
- `.claude-plugin/plugin.json`, `README.md`, `LICENSE`.

**Skills (23)** — metodologia executável por tipo de peça e por barreira:
peticao-inicial, contestacao-impugnacao, apelacao-contrarrazoes, embargos-declaracao, recurso-especial, recurso-extraordinario, agravo-resp-re, agravo-instrumento, habeas-corpus, memoriais, diagnostico-admissibilidade, sumula-7-valoracao, cotejo-analitico-dissidio, repercussao-geral, verificacao-citacoes, jurimetria, leitura-jurisprudencia, diarios-eletronicos, dossie-decisoes-anexos, segundo-grau-nacional, analise-integral-documentos, roteamento-modelos, protocolo-auditoria.

**Subagentes (7)** — orquestrador + auditoria (modelo travado no YAML):
orquestrador, auditor-admissibilidade, verificador-citacoes, extrator-acordao, leitor-autos, revisor-fidedignidade, analista-jurimetrico.

**Comandos (10)**: /rom, /diagnostico-admissibilidade, /nova-peca, /auditar, /linha-recursal, /jurimetria, /anexos, /segundo-grau, /roteador, /protocolo.

**Servidores MCP (3)** — conectores vivos (só Claude Code):
- `mcp/tribunais2grau` (roteia por nº CNJ + DataJud + anexos),
- `mcp/jurisprudencia` (links de inteiro teor/voto/certidão; DJEN),
- `mcp/autos` (inventário via MNI + trava de integridade).

**Hooks** — `hooks/verificar-citacoes.py` (bloqueio determinista de citação não conferida).

**Scripts** — trava-integridade.py, roteador.py, pre-protocolo.py, jurimetria/analisar.py, dossie/montar-anexos.py, segundo-grau/resolver-tribunal.py.

**Configuração** — `config/tenancy.example.json` (multi-escritório/multiusuário), `citacoes-verificadas.txt`, `selos`/`gasto` (gerados em runtime, por tenant).

**Conhecimento de referência (RAG do agente)** — `knowledge/`: súmulas, dispositivos, metodologia, fontes de dados, jurimetria, roteamento/custos.

> Exclusivo do Claude Code: MCP, hooks, scripts, subagentes, orquestrador, bootstrap, travas deterministas (sem rollback/sem downgrade), teto de custo, multi-tenant em disco.

---

## B) CLAUDE TEAM — web (pasta `rom-team-projeto/`)
Sem código. Você cola instruções e sobe arquivos de conhecimento.

- `TEAM-SETUP.md` — stand-up em 4 passos (um Projeto por escritório).
- `INSTRUCOES-DO-PROJETO.md` — cola no campo de instruções do Projeto.
- `COMO-USAR.md` — guia de uso.
- `conhecimento/` (14 arquivos) — sobe na base do Projeto:
  00-indice, 00-metodologia, 01-mapa-ciclo, 02-barreiras, 03-checklist-resp, 04-checklist-re, 05-biblioteca-de-prompts, 06-jurimetria, 07-fontes-de-dados, 08-leitura-integral, 09-anexos, 10-segundo-grau, 11-autos-e-trava, 12-roteamento-custos, 13-protocolo.

> No Team, travas/roteamento/pré-protocolo valem como **disciplina de revisão** (o modelo segue as regras), não como automação determinista.

---

## C) Compartilhado (mesma fonte, duas formas)
A doutrina e a metodologia são as mesmas; mudam só o formato e o modo de uso:

| Conteúdo | No Claude Code | No Claude Team |
|---|---|---|
| Metodologia ROM | `CLAUDE.md` + `knowledge/metodologia-rom.md` | `conhecimento/00-metodologia-rom.md` |
| Súmulas/barreiras | `knowledge/sumulas-admissibilidade.md` | `conhecimento/02-barreiras-admissibilidade.md` |
| Jurimetria | skill + `knowledge/jurimetria-metodologia.md` | `conhecimento/06-jurimetria.md` |
| Fontes de dados | `knowledge/fontes-de-dados.md` | `conhecimento/07-fontes-de-dados.md` |
| Prompts | skills/comandos | `conhecimento/05-biblioteca-de-prompts-rom.md` |
| Multi-escritório | `config/tenancy.example.json` (em disco) | um Projeto por escritório |

---

## Regra de bolso
- Precisa **rodar, conectar, travar ou auditar de forma determinista** → **Agente ROM (Claude Code)**.
- Precisa **pensar junto, revisar e redigir interativamente** com a mesma metodologia → **Claude Team**.
