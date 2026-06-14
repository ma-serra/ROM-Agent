---
name: protocolo-auditoria
description: "Use SEMPRE antes de qualquer protocolo/peticionamento eletrônico. Roda a auditoria pré-protocolo (integridade, admissibilidade, citações, fidedignidade, anexos) e exige autorização humana explícita. O agente NUNCA protocola sozinho. Trigger: 'protocolar', 'peticionar', 'enviar a petição', 'dar entrada', 'pré-protocolo'."
---

# Auditoria pré-protocolo (obrigatória)

Nenhum protocolo ocorre sem (a) TODAS as auditorias aprovadas e (b) AUTORIZAÇÃO HUMANA expressa. O agente prepara o pacote auditado; o protocolo em si é ação do advogado.

## Checklist GO/NO-GO (cada item deve passar)
1. **Integridade** — `autos_verificar_integridade`: nenhum item selado foi omitido (ou omissão autorizada).
2. **Admissibilidade** — para recursos: subagente `auditor-admissibilidade` aprovou (ou correções feitas).
3. **Citações** — `verificador-citacoes`: nada solto; tudo verificado ou marcado.
4. **Fidedignidade** — `revisor-fidedignidade`: todo fato com lastro em folha/ID.
5. **Anexos** — `dossie-decisoes-anexos`: rol completo (inteiro teor/voto/certidão) e remissão Doc. NN.
6. **Tempestividade e competência** — prazo e endereçamento conferidos.
7. **Autorização humana** — o advogado confirma expressamente "protocolar".

## Ferramenta
`${CLAUDE_SKILL_DIR}/pre-protocolo.py --resultados r.json` agrega o checklist e emite GO/NO-GO; só dá GO com todos os itens verdadeiros E autorizacao_humana=true. Sem isso, NO-GO (bloqueia).

## Regra inegociável
O peticionamento eletrônico (MNI/entrega de manifestação) não é automatizado pelo agente. Mesmo com GO, exige o comando direto e autorizado do advogado.
