---
name: jurimetria
description: "Use para a camada EMPÍRICA do caso: como o órgão julgador (tribunal, turma/câmara, relator) historicamente conhece e decide sobre determinada matéria/tese. Transforma um corpus de acórdãos em taxas de conhecimento (admissibilidade), taxas de provimento, tempo de tramitação e tendências por relator/órgão/fundamento, sempre com os limites estatísticos e éticos. Acopla-se ao diagnostico-admissibilidade acrescentando a probabilidade histórica de êxito. Trigger: 'jurimetria', 'qual a chance', 'como esse relator/turma decide', 'taxa de provimento', 'perfil decisório', 'esse tema costuma passar no STJ?', 'análise preditiva'."
---

# Jurimetria — posicionamento do julgador (camada empírica)

A skill `diagnostico-admissibilidade` responde **se a tese vence as barreiras jurídicas**. A jurimetria responde uma pergunta diferente e complementar: **dado que vence, qual a frequência histórica com que este órgão/relator efetivamente conhece e provê recursos sobre esta matéria?** É base estatística, não profecia.

## O que a jurimetria entrega aqui

1. **Taxa de conhecimento (admissibilidade empírica)** — % de recursos da mesma classe/matéria que o órgão admitiu. É o número que conversa direto com o diagnóstico: se a turma aplica Súmula 7 de forma agressiva, isso aparece aqui.
2. **Taxa de provimento** — entre os conhecidos, % providos (total/parcial).
3. **Perfil por relator e por órgão** — tendências de cada turma/câmara/relator na matéria.
4. **Peso de fundamentos e súmulas** — quais fundamentos e súmulas mais aparecem nas decisões favoráveis x desfavoráveis (orienta qual tese liderar).
5. **Tempo de tramitação** — mediana de dias entre distribuição e julgamento (calibra expectativa e prazo do cliente).
6. **Tendência temporal** — o entendimento está se firmando, mudando ou em divergência (sinal de distinção/superação a explorar).

## Insumos (corpus de decisões)

Monte um dataset de acórdãos da matéria, idealmente vindo do MCP de jurisprudência. Use o schema de `${CLAUDE_SKILL_DIR}/schema-decisoes.csv`. Colunas mínimas:

```
tribunal, orgao, relator, materia, classe, fundamento_principal,
sumula_aplicada, conhecido (sim/nao), resultado (provido/parcial/improvido),
data_distribuicao (AAAA-MM-DD), data_julgamento (AAAA-MM-DD), processo, fonte
```

Rode `python3 ${CLAUDE_SKILL_DIR}/analisar.py corpus.csv` para gerar o relatório de métricas.

## Como integrar ao diagnóstico

Ao final do relatório de admissibilidade, acrescente a coluna **"Base histórica"** por fundamento:

```
| # | Fundamento | ...barreiras... | Resultado jurídico | Base histórica (n, conhec.%, prov.%) | Leitura |
| 1 | ...        | ...             | VIÁVEL c/ ajuste   | n=84; conhec. 61%; prov. 38%        | tese aceita pela 3ª Turma; liderar por ela |
```

A recomendação final passa a combinar **viabilidade jurídica** (passa nas barreiras?) com **viabilidade empírica** (costuma passar neste foro?), indicando qual fundamento liderar, em qual órgão há melhor histórico e quanto tempo esperar.

## Limites estatísticos — obrigatórios no relatório

A jurimetria descreve padrões e taxas-base; **não prediz o voto individual**. Sempre registre:

- **Tamanho da amostra (n)**: taxa sobre n pequeno é frágil. Se n < 30, marque "amostra reduzida — indicativo, não conclusivo".
- **Viés de seleção**: decisões publicadas/ementadas ≠ universo real; acordos e decisões monocráticas não ementadas escapam.
- **Correlação ≠ causalidade**: alta taxa de provimento de um relator não prova que aquele fundamento *causou* o êxito.
- **Passado ≠ futuro**: composição de turma muda, jurisprudência evolui, repetitivos/IRDR alteram o cenário. Datar a janela analisada.
- Toda taxa citada vem do corpus conferível; se a fonte de um dado não foi confirmada, marque `⚠️[NÃO VERIFICADO]`.

## Limites éticos — obrigatórios

- Use **somente dados públicos** de decisões; respeite a LGPD (não tratar dados pessoais de partes além do necessário e do que é público).
- Jurimetria serve à **estratégia e à gestão de expectativa**, jamais a pressionar, constranger ou tentar influenciar indevidamente magistrado. O dever de imparcialidade do juiz (LOMAN, art. 35) é premissa, não variável a manipular.
- A análise **não substitui o mérito**: liderar pela tese com melhor histórico nunca justifica abandonar a tese juridicamente correta nem inventar enquadramento (fidedignidade).
- O debate sobre limites dessas ferramentas ainda amadurece no Brasil; trate o perfil decisório como hipótese de trabalho interna, não como afirmação pública sobre o juiz.

A jurimetria potencializa o ROM porque tira a decisão estratégica do "achismo" e a põe sobre evidência — sem nunca prometer certeza onde só há probabilidade.
