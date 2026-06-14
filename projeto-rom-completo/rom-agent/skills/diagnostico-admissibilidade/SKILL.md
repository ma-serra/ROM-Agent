---
name: diagnostico-admissibilidade
description: "Use SEMPRE antes de redigir qualquer recurso para tribunal superior (Recurso Especial/STJ, Recurso Extraordinário/STF, Agravo do art. 1.042, Habeas Corpus substitutivo, Embargos de Divergência). Examina o acórdão recorrido e cada tese proposta, aplica cada barreira de admissibilidade conhecida (prequestionamento, Súmulas 7, 5, 83, 211, 282, 284, 356, 279, 636; repercussão geral; ofensa direta), diz se cada fundamento passa, e — se não passar — indica a correção processual cabível. Gera um relatório estruturado por fundamento. Trigger: 'cabe REsp/RE?', 'esse caso sobe?', 'diagnóstico de admissibilidade', 'vai passar na admissibilidade', antes de qualquer minuta de recurso superior."
---

# Motor de Diagnóstico de Admissibilidade (STJ/STF)

Este é o estágio que NÃO pode ser pulado. Você examina o acórdão recorrido e cada tese antes de qualquer redação, e produz um relatório que diz, fundamento por fundamento, se ele sobrevive ao juízo de admissibilidade.

## Insumos necessários (peça ao usuário se faltar)

1. **Acórdão recorrido** (inteiro teor, incluindo voto e ementa).
2. **Eventuais embargos de declaração** já opostos e seu acórdão.
3. **Teses/fundamentos** que o advogado pretende levar ao tribunal superior.
4. **Dispositivos** (lei federal / Constituição) supostamente violados.
5. Para dissídio (alínea c): os **acórdãos-paradigma**.

Se faltar o acórdão recorrido, NÃO diagnostique por suposição — solicite-o. Fidedignidade acima de tudo.

## Procedimento

Para CADA fundamento, percorra as barreiras na ordem abaixo e registre PASSA / NÃO PASSA / RISCO, com a citação do trecho do acórdão que sustenta o juízo.

### Barreira 1 — Cabimento da via (a tese é de direito federal infraconstitucional → REsp; constitucional → RE?)
- Matéria infraconstitucional (lei federal) → STJ, art. 105, III, CF.
- Matéria constitucional → STF, art. 102, III, CF.
- Ofensa **reflexa/indireta** à Constituição (depende de interpretar norma infraconstitucional antes) → **NÃO cabe RE** (Súmula 636/STF). Reenquadre como REsp.

### Barreira 2 — Prequestionamento (a tese foi efetivamente decidida no acórdão?)
- Súmulas 282 e 356/STF; Súmula 211/STJ.
- Localize no acórdão o trecho que decidiu a questão. Cite-o.
- **Se a questão NÃO foi enfrentada** → o fundamento NÃO PASSA. Correção: **opor embargos de declaração** (art. 1.022 CPC) para obter prequestionamento; lembrar do prequestionamento ficto (art. 1.025 CPC: consideram-se prequestionados os elementos suscitados nos EDcl ainda que inadmitidos/rejeitados, se o tribunal superior reconhecer omissão/contradição/obscuridade). → acionar skill `embargos-declaracao`.

### Barreira 3 — Reexame de prova (Súmula 7/STJ; Súmula 279/STF)
- A tese exige **rever o conjunto fático-probatório**? → NÃO PASSA.
- A tese é de **valoração/qualificação jurídica do fato** (premissas fáticas mantidas, discute-se a consequência jurídica)? → PASSA. → acionar skill `sumula-7-valoracao` para fazer o reenquadramento.
- Esta é a barreira que mais derruba recursos. Trate-a com prioridade.

### Barreira 4 — Interpretação de cláusula contratual (Súmula 5/STJ)
- A tese depende de reinterpretar cláusula de contrato? → NÃO PASSA no REsp.
- Reenquadre como **qualificação jurídica** ou questão de **lei** (ex.: nulidade por violação de norma cogente, abusividade à luz do CDC) sempre que cabível.

### Barreira 5 — Acórdão conforme a jurisprudência do STJ (Súmula 83/STJ)
- O acórdão recorrido **já está alinhado** ao entendimento atual do STJ? → REsp pela alínea *a* tende a NÃO PASSAR (e a alínea *c* fica prejudicada).
- Verifique se há **distinção** (distinguishing) ou **superação** (overruling) a explorar, ou tese repetitiva/IRDR pendente.

### Barreira 6 — Deficiência de fundamentação (Súmula 284/STF)
- O dispositivo violado está indicado com **precisão** (artigo + parágrafo + inciso + alínea)?
- A demonstração da violação é **analítica** (não genérica)? → se não, NÃO PASSA por deficiência. Correção: reescrever a demonstração.

### Barreira 7 — Dissídio jurisprudencial, se alínea *c* (art. 1.029, §1º, CPC)
- Há **cotejo analítico** (não só transcrição de ementas)?
- Há **similitude fática** entre o caso e o paradigma?
- Os paradigmas são de **tribunal diverso** (ou do próprio STJ) e estão em **repositório oficial / com cópia autenticada / indicação de fonte**?
- → acionar skill `cotejo-analitico-dissidio`.

### Barreira 8 — Repercussão geral (só RE; art. 1.035 CPC)
- Há preliminar **formal e fundamentada** de repercussão geral?
- → acionar skill `repercussao-geral`.

### Barreira 9 — Admissão na origem
- O recurso será submetido ao juízo de admissibilidade da presidência do TJ/TRF.
- Se **inadmitido na origem** → cabe **Agravo do art. 1.042 CPC** (AREsp / ARE). → acionar skill `agravo-resp-re`.
- Antecipe os argumentos que a presidência costuma usar para barrar e neutralize-os já no recurso.

## Saída — formato do relatório

Produza SEMPRE esta tabela e, abaixo, a recomendação:

```
RELATÓRIO DE ADMISSIBILIDADE — [proc. nº] — [tribunal de destino]

| # | Fundamento | Via | Prequest. | Súm.7/279 | Súm.5 | Súm.83 | Súm.284 | Dissídio | Resultado |
|---|-----------|-----|-----------|-----------|-------|--------|---------|----------|-----------|
| 1 | ...       | REsp| PASSA     | RISCO     | n/a   | PASSA  | PASSA   | n/a      | VIÁVEL c/ ajuste |
| 2 | ...       | RE  | NÃO PASSA | ...       | ...   | ...    | ...     | ...      | INVIÁVEL → EDcl |

RECOMENDAÇÃO:
- Fundamentos viáveis: [...]
- Fundamentos a corrigir antes: [...] (correção: [...])
- Fundamentos a abandonar: [...] (motivo: [...])
- Próxima peça sugerida: [...]
```

Nunca diga que um fundamento "passa" sem citar o trecho do acórdão que sustenta isso. Marque com `⚠️[NÃO VERIFICADO]` qualquer súmula/tese que você não confirmou na fonte.

## Camada empírica (acoplar a skill `jurimetria`)

Depois do exame jurídico, acrescente a leitura empírica por fundamento, quando houver corpus disponível:

```
| # | Fundamento | Resultado jurídico | Base histórica (n; conhec.%; prov.%) | Leitura estratégica |
| 1 | ...        | VIÁVEL c/ ajuste   | n=84; conhec. 61%; prov. 38%        | tese aceita pela 3ª Turma; liderar por ela |
```

A recomendação final combina **viabilidade jurídica** (vence as barreiras?) e **viabilidade empírica** (costuma vencer neste foro?), indicando qual fundamento liderar, em qual órgão há melhor histórico e o tempo esperado. Declare sempre os limites estatísticos (n pequeno, viés, correlação≠causa, passado≠futuro) e éticos (dados públicos, LGPD, não substitui o mérito).
