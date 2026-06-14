# ORQUESTRAÇÃO ROM — documento mestre (execução autônoma)

Este é o documento único que o Claude Code lê para montar e operar o agente ROM de forma autônoma, com múltiplos agentes e um orquestrador, respeitando segurança, funcionalidades preexistentes, **sem rollback**, **sem downgrade** e **sem quebrar multiusuário/multi-escritório**. O projeto do Claude Team espelha esta mesma lógica de forma simplificada.

> Princípio condutor: cortar custo e ganhar velocidade no operacional; **nunca** rebaixar qualidade, integridade ou segurança no jurídico.

---

## 0. Pré-requisitos (o que atualizar)

1. **Claude Code ≥ v2.1.154** (Opus 4.8 como padrão; effort `xhigh` p/ casos difíceis). Atualizar sem downgrade:
   ```bash
   npm i -g @anthropic-ai/claude-code@latest
   claude --version    # confirmar >= 2.1.154
   ```
2. **Node ≥ 18** (testado em 22) e **Python 3** no PATH (scripts e hook).
3. **Servidores MCP**: `npm install && npm run build` em `mcp/tribunais2grau`, `mcp/jurisprudencia`, `mcp/autos` (o `bootstrap.sh` faz isso).
4. **Plugin ROM**: registrar como diretório local ou .zip:
   ```bash
   claude --plugin-dir /caminho/para/rom-agent
   ```
5. **Bedrock**: `~/.aws` configurado e acesso liberado aos modelos (Haiku/Sonnet/Opus + abertos). O Claude Code lê a região do `~/.aws`.
6. **Credenciais/chaves** (env): `DATAJUD_APIKEY` (CNJ), `REGISTRO_MNI` (por tribunal), `DJEN_API` (confirmar vigente).
7. (Opcional) Agent Teams colaborativo: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

Nada disso faz downgrade do que já existe: o `bootstrap.sh` é idempotente e aditivo (checa versões, não sobrescreve config nem reduz dependências).

---

## 1. Bootstrap autônomo

```bash
bash bootstrap.sh            # instala deps, builda os 3 MCP, roda auditoria + testes
```
O script só conclui em verde se: os 3 servidores compilam, os testes passam, e `auditar-plugin.py` aprova. Em caso de falha, ele para e reporta — não prossegue em estado degradado.

---

## 2. Orquestração multiagente

Padrões nativos do Claude Code usados:
- **Subagentes** (contexto dedicado, modelo travado no YAML) para cada papel.
- **Workflow / orquestrador** (`/rom`) que decompõe a tarefa e despacha subagentes com critérios de término e teto de custo.
- (Opcional) **Agent Teams** para colaboração com lista de tarefas/mailbox e worktrees.

### Orquestrador (`agents/orquestrador.md`, comando `/rom`)
Conduz o pipeline ROM ponta a ponta:
```
0 LEITURA INTEGRAL  → leitor-autos (sonnet) + ferramenta de extração existente + autos_inventario (MNI)
1 SELAR INTEGRIDADE → autos_selar_extracao (trava: sem rollback)
2 DIAGNÓSTICO       → auditor-admissibilidade (OPUS, crítico) + jurimetria (sonnet)
3 REDAÇÃO           → redação final (OPUS, crítico)
4 ANEXOS            → jurisprudencia_resolver_links → tribunais_montar_anexos
5 AUDITORIA         → verificador-citacoes (sonnet) + revisor-fidedignidade (sonnet) + hook de citações
6 PRÉ-PROTOCOLO     → pre-protocolo.py (GO/NO-GO) + autorização humana
```

Regras do orquestrador (inegociáveis):
- **Sem downgrade**: cada subagente tem `model:` travado no YAML; o orquestrador NUNCA troca o modelo de uma etapa crítica por um mais barato. A `roteador.py` bloqueia rebaixamento de tarefa crítica (exit 2). Modo operacional pode usar Haiku; jurídico crítico permanece Opus.
- **Sem rollback**: a trava de integridade (ledger forward-only) impede reduzir/omitir itens selados sem autorização.
- **Teto de recursão/custo**: critérios de término explícitos por subagente; sem subagentes gerando subagentes sem limite; respeitar o teto de gasto por sessão (`roteador.py`).
- **Pré-protocolo obrigatório**: nada vai a protocolo sem GO + autorização humana; o peticionamento eletrônico nunca é automático.

---

## 3. Segurança e funcionalidades preexistentes

- O `bootstrap.sh` e o orquestrador são **aditivos**: não removem skills, agentes, conectores ou dados existentes.
- Travas que protegem o estado: integridade (sem rollback), qualidade (sem downgrade), pré-protocolo (sem envio sem auditoria/autorização).
- Credenciais por gerenciador de segredos (nunca em texto). MNI exige procurador vinculado; respeitar sigilo e LGPD.
- (Opcional) plugin `security-guidance` do Claude Code para revisar mudanças de código.

---

## 4. Multiusuário e multi-escritório (multi-tenant)

Isolamento por **escritório (tenant)** e **usuário**, para que vários escritórios possam ser acrescidos sem interferência:

```
data/
  <escritorio>/
    citacoes-verificadas.txt
    selos-integridade.jsonl
    jurimetria/corpus.csv
    <usuario>/gasto-sessao.jsonl
```

- Cada estado mutável (registro de citações, selos de integridade, corpus de jurimetria, ledger de custo) vive em caminho **por escritório/usuário** — sem estado global compartilhado, sem colisão.
- O orquestrador resolve os caminhos a partir de `TENANT` e `USUARIO` (env) e os passa às ferramentas (`--ledger`, registro, etc.). Ver `config/tenancy.example.json`.
- **Acrescentar um escritório** = criar `data/<novo>/...` + uma entrada no tenancy; jamais alterar dados de tenants existentes (aditivo, sem rollback).
- No Claude Team: **um Projeto por escritório**, compartilhando a base de conhecimento comum e variando só as instruções/segredos do escritório.

---

## 5. Espelhamento no Claude Team (simplificar programação e prompts)

- `rom-team-projeto/TEAM-SETUP.md` resume o stand-up em 4 passos (criar projeto → colar instruções → subir conhecimento → usar a biblioteca de prompts).
- A biblioteca `05-biblioteca-de-prompts-rom.md` traz prompts prontos (PROMPT_[AREA]_[tipo]); o índice `00-indice.md` orienta a navegação.
- A mesma metodologia, travas e camada multi-escritório valem no Team como **disciplina de revisão** (sem a automação determinista do Claude Code).

---

## 6. Mapa do que executar (resumo)

| Quero | Comando/arquivo |
|------|-----------------|
| Montar tudo | `bash bootstrap.sh` |
| Pipeline autônomo de uma peça | `/rom <descrição + nº processo>` |
| Diagnóstico de admissibilidade | `/diagnostico-admissibilidade` |
| Anexos (inteiro teor/voto/certidão) | `/anexos` + `/segundo-grau` |
| Jurimetria | `/jurimetria` |
| Escolher modelo por custo | `/roteador` |
| Auditar antes de protocolar | `/protocolo` |
| Auditoria estrutural do plugin | `python3 auditar-plugin.py` |

Tudo o que foi construído nesta consolidação está inventariado em `../CONSOLIDACAO.md` e o relatório de testes em `AUDITORIA.md`.
