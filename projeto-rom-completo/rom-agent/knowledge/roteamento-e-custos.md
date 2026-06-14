# Roteamento de modelos e custos (ROM)

Preços por milhão de tokens (conferir no console/Bedrock): Haiku 4.5 $1/$5 · Sonnet 4.6 $3/$15 · Opus 4.8 $5/$25. Batch −50%; cache de contexto repetido −90%. Não há API permanentemente gratuita da Anthropic; "gratuito/mais barato" = Haiku + batch + cache + modelo aberto no Bedrock para o puramente mecânico.

## Tiers por tarefa
- Haiku: inventário, triagem, formatação, anotação, roteamento.
- Sonnet: extração estruturada, leitura de jurisprudência, jurimetria (interpretação), redação de apoio.
- Opus: diagnóstico de admissibilidade, redação final de recurso, auditoria adversarial, pré-protocolo.

## Trava de qualidade
Tarefas críticas (admissibilidade, redação final, auditoria, verificação de citações, pré-protocolo) não podem ser rebaixadas. O roteador bloqueia o downgrade (exit 2).

## Teto de gasto
Ledger por sessão com cap; ao alertar/estourar, economiza-se no operacional (Haiku/batch/cache) — nunca no jurídico. Subagentes têm o tier no frontmatter `model:`.
