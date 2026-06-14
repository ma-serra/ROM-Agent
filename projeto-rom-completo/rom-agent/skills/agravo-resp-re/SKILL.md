---
name: agravo-resp-re
description: "Use quando o REsp ou RE foi INADMITIDO na origem e cabe Agravo do art. 1.042 CPC (AREsp / ARE) para destrancar o recurso ao STJ/STF. Trigger: 'agravo em recurso especial', 'AREsp', 'ARE', 'recurso foi inadmitido na origem', 'destrancar recurso', 'art. 1042'."
---

# Agravo do art. 1.042 (AREsp / ARE)

Destranca o REsp/RE inadmitido pela presidência do tribunal de origem.

## Estrutura
1. Endereçamento (ao STJ ou STF, conforme o caso).
2. Tempestividade (15 dias úteis da intimação da decisão de inadmissão).
3. **Enfrentamento PONTO A PONTO da decisão de inadmissão**: para cada fundamento usado pela presidência para barrar, demonstre por que está errado. Esta é a essência do agravo — não basta repetir o recurso.
4. Reafirmação da admissibilidade do recurso trancado (prequestionamento, afastamento de súmulas, etc. — reaproveitar o relatório de `diagnostico-admissibilidade`).
5. Pedido: provimento do agravo + conhecimento e provimento do REsp/RE (efeito de devolver o recurso ao tribunal superior).

## Armadilha (Súmula 182/STJ)
É inadmissível o agravo que não ataca ESPECIFICAMENTE os fundamentos da decisão agravada. Combata cada fundamento da inadmissão, nominalmente.
