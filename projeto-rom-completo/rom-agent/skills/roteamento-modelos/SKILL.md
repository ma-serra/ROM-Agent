---
name: roteamento-modelos
description: "Use para escolher o modelo de IA por custo/tarefa no agente ROM — desonerar e acelerar sem perder qualidade. Escalona tarefas operacionais para modelos baratos (Haiku) e reserva os premium (Opus) para o julgamento jurídico; trava de qualidade impede rebaixar tarefas críticas; teto de custo por sessão. Trigger: 'qual modelo usar', 'reduzir custo', 'ficou caro', 'tarefa operacional', 'roteamento de modelos', 'orçamento de tokens'."
---

# Roteamento de modelos por custo (sem perder qualidade)

Princípio: o custo de um erro jurídico (admissibilidade errada, citação alucinada) supera de longe a economia de tokens. Por isso o cost-cutting só vale para o operacional; o julgamento jurídico permanece premium.

## Escalonamento (política em `${CLAUDE_SKILL_DIR}/politica-modelos.json`)
- **Haiku ($1/$5)** — operacional/alto volume: inventário de autos, triagem, formatação, anotação, roteamento.
- **Sonnet ($3/$15)** — intermediário: leitura estruturada, extração, jurimetria (interpretação), redação de apoio, RAG.
- **Opus ($5/$25)** — crítico: diagnóstico de admissibilidade, redação final de recurso, auditoria adversarial, pré-protocolo.
- **Modelo aberto no Bedrock** — só para o puramente mecânico, se a qualidade se mantiver (confirmar).

## Trava de qualidade
As tarefas em `criticas_nunca_rebaixar` NÃO podem ser movidas para um tier mais barato. `roteador.py escolher --forcar haiku` numa tarefa crítica é bloqueado (exit 2). Subir de tier é permitido.

## Alavancas de custo (usar antes de cortar qualidade)
1. **Cache de contexto (−90%)** no que se repete: constituição ROM, súmulas, jurisprudência fixa.
2. **Batch (−50%)** para o não urgente (jurimetria em lote, leitura de muitos acórdãos).
3. **Haiku no operacional**; Sonnet como padrão; Opus só no crítico.
4. **Effort/adaptive thinking** do Opus 4.8 (low/high/xhigh/max) calibrado à dificuldade.

## Uso
- `roteador.py escolher --tarefa <nome>` → modelo recomendado + tier.
- `roteador.py custo --modelo <tier> --in <Mtok> --out <Mtok> [--batch]` → estimativa.
- `roteador.py registrar ...` / `status` → ledger de gasto por sessão com teto e alerta.

Mapeamento de subagentes ao tier consta no frontmatter `model:` de cada um (`agents/`). Não existe API permanentemente gratuita da Anthropic; "gratuito/mais barato" = Haiku + batch + cache + (se preciso) modelo aberto no Bedrock para o mecânico.
