# Relatório de auditoria — Projeto ROM

Data: 2026-06-14

## 1. Auditoria estrutural do plugin
```
============================================================
AUDITORIA ESTRUTURAL — PLUGIN ROM
============================================================
OK: 55 | AVISOS: 0 | FALHAS: 0

RESULTADO: APROVADO (sem falhas)
```

## 2. Servidor MCP tribunais-2grau

- Build TypeScript estrito (`tsc`): OK
- Testes unitários (`node --test`): 8/8 OK
- Handshake MCP (cliente oficial: initialize → tools/list → tools/call): OK
- Ferramentas: tribunais_resolver_processo, tribunais_buscar_datajud, tribunais_montar_anexos
- Tratamento de erro acionável e marcação ⚠️[NÃO VERIFICADO] verificados

## 3. Scripts Python
- analisar.py (jurimetria), montar-anexos.py, resolver-tribunal.py, verificar-citacoes.py: compilam e passam nos testes funcionais

## 4. Hook determinista
- Bloqueia gravação com citação não conferida (exit 2); libera citação registrada ou marcada como NÃO VERIFICADO

## Pendências de ambiente (dependem do escritório)
- Obter a chave pública do DataJud (DATAJUD_APIKEY) na wiki do CNJ.
- Implementar os demais conectores MCP (DJEN, jurisprudência STJ/STF, autos) cujos templates estão no .mcp.json.
- Completar os portais por tribunal em registro-tribunais.json (o alias do DataJud já é automático).

## 5. Servidor MCP jurisprudencia (NOVO)
- Build TypeScript estrito: OK
- Testes unitários: 7/7 OK
- Handshake MCP (cliente oficial): OK — 3 ferramentas
- **Ciclo fechado auditado**: jurisprudencia_resolver_links → tribunais_montar_anexos (o inteiro teor flui ao rol; certidão ausente vira pendência marcada)
- Limitação de ambiente: a rede de build não acessa STJ/STF/DJEN; busca ao vivo (buscar_djen) deve ser fumada no ambiente do escritório. Confirmar endpoint DJEN_API vigente.

## 6. Conector de autos + TRAVA de integridade (NOVO)
- trava-integridade.py: 7 cenários testados (selar v1/v2 forward; rollback bloqueado exit 3; redução autorizada; verificar omissão bloqueada exit 2; verificar íntegro; status forward-only).
- Servidor MCP autos: build estrito OK; 3 testes unitários OK; handshake MCP OK.
- Trava exercida via MCP: selar OK, verificar íntegro OK, omissão BLOQUEIA (exit 2), omissão COM autorização OK, inventário sem credencial → erro acionável.
- Integração: NÃO re-implementa extração — usa a ferramenta de extração já existente do agente; soma inventário (MNI) + trava (fonte única em Python, evitando duplicação).
- Limitação de ambiente: rede de build não acessa MNI dos tribunais; inventário ao vivo exige credenciamento (procurador vinculado) e deve ser fumado no escritório.

## 7. Roteamento de modelos por custo + pré-protocolo (NOVO)
- roteador.py: escalonamento por tarefa (operacional→Haiku, crítico→Opus); trava de qualidade bloqueia rebaixar tarefa crítica (exit 2); estimativa de custo (batch −50%); ledger de gasto por sessão com teto/alerta. Cenários testados OK.
- Subagentes re-escalonados no frontmatter `model:` (auditor=opus; demais=sonnet).
- pre-protocolo.py: GO/NO-GO; NO-GO sem autorização humana ou com qualquer pendência (exit 2); GO só com tudo aprovado + autorização. Testado.
- Constituição: §6 roteamento de custo (trava de qualidade) e §7 auditoria pré-protocolo obrigatória; peticionamento eletrônico nunca automático.
- Preços de referência (jun/2026): Haiku $1/$5, Sonnet $3/$15, Opus 4.8 $5/$25; conferir no console/Bedrock.

## 8. Orquestração autônoma + multi-tenant (NOVO)
- bootstrap.sh executado de ponta a ponta: 3 servidores MCP build+test OK, 7 scripts Python compilam, auditoria estrutural APROVADA, tenancy presente — conclui em verde.
- Orquestrador (`/rom`) com modelos travados por etapa (sem downgrade) + travas de integridade (sem rollback) + teto de custo + pré-protocolo.
- Multi-escritório/multiusuário: estado isolado por escritório/usuário (config/tenancy.example.json); acréscimo de escritório é aditivo (sem rollback).
- Documento mestre ORQUESTRACAO.md cobre pré-requisitos/CLI, bootstrap, orquestração, segurança, multi-tenant e espelhamento no Team.
- CLI: requer Claude Code >= v2.1.154 (Opus 4.8 default). bootstrap é idempotente e não faz downgrade.
