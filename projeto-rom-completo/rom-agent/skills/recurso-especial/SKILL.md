---
name: recurso-especial
description: "Use para redigir Recurso Especial ao STJ (art. 105, III, CF; arts. 1.029-1.041 CPC). SEMPRE depois de rodar diagnostico-admissibilidade. Trigger: 'recurso especial', 'REsp', 'recorrer ao STJ'."
---

# Recurso Especial (STJ)

Pré-requisito: o relatório da skill `diagnostico-admissibilidade` deve existir. Só redija os fundamentos marcados VIÁVEL. Para os marcados a corrigir, redija a peça de correção (EDcl) primeiro.

## Estrutura

1. Endereçamento ao Presidente do Tribunal de origem (juízo de admissibilidade na origem).
2. Qualificação e tempestividade (com a data de intimação e o termo).
3. **Cabimento e admissibilidade** (tópico próprio, ANTES do mérito):
   - Permissivo constitucional (alínea a: violação a lei federal; e/ou c: dissídio).
   - Prequestionamento: apontar onde cada tese foi decidida no acórdão (citar trecho).
   - Afastamento das Súmulas 7 e 5 (acionar `sumula-7-valoracao` quando houver risco).
   - Se alínea c: cotejo analítico (acionar `cotejo-analitico-dissidio`).
4. **Mérito recursal**: para cada dispositivo violado — indicação exata (art./§/inc./al.) + demonstração ANALÍTICA da violação (Súmula 284/STF).
5. Pedido: conhecimento e provimento; consequência concreta pretendida.

## Regras
- Demonstração analítica, nunca genérica.
- Indicar dispositivo com precisão cirúrgica.
- Antecipar e neutralizar os fundamentos que a presidência usaria para inadmitir.
- Toda súmula/tema/precedente citado passa pela verificação de citações.
