---
name: cotejo-analitico-dissidio
description: "Use para o REsp pela alínea c (dissídio jurisprudencial, art. 105, III, c, CF; art. 1.029, §1º, CPC). Monta o cotejo analítico entre o acórdão recorrido e os paradigmas, com similitude fática e fonte oficial. Trigger: 'dissídio jurisprudencial', 'alínea c', 'divergência entre tribunais', 'cotejo analítico', 'acórdão paradigma'."
---

# Cotejo Analítico — Dissídio Jurisprudencial (alínea c)

A alínea *c* só passa com cotejo ANALÍTICO. Transcrever ementas não basta.

## Requisitos cumulativos (art. 1.029, §1º, CPC)

1. **Paradigma de tribunal diverso** (ou do próprio STJ) — não serve acórdão do mesmo tribunal que prolatou o recorrido.
2. **Similitude fática**: as bases fáticas do recorrido e do paradigma devem ser equivalentes. Se os fatos diferem, não há dissídio.
3. **Demonstração analítica**: confronto trecho a trecho mostrando que, ante o MESMO quadro fático, os tribunais deram soluções jurídicas OPOSTAS.
4. **Fonte oficial**: repositório autorizado, cópia autenticada, certidão, ou indicação do sítio oficial com a URL/identificador do julgado.

## Estrutura do cotejo

Para cada par recorrido × paradigma:

```
ACÓRDÃO RECORRIDO (proc., órgão, data)
  Premissa fática: [...]
  Solução jurídica adotada: [...] (trecho transcrito)

ACÓRDÃO PARADIGMA (proc., tribunal diverso, data, fonte oficial: [...])
  Premissa fática equivalente: [...]
  Solução jurídica oposta: [...] (trecho transcrito)

DEMONSTRAÇÃO DA DIVERGÊNCIA:
  Diante de fatos equivalentes [X], o recorrido decidiu [A] e o paradigma decidiu [B];
  logo, há dissídio sobre a interpretação de [dispositivo].
```

## Armadilhas
- Súmula 83/STJ: se o recorrido segue a jurisprudência ATUAL do STJ, a divergência está superada e a alínea c não passa.
- Paradigma desatualizado / superado → inútil. Confirme a vigência do entendimento.
- Marque `⚠️[NÃO VERIFICADO]` qualquer paradigma cuja existência/teor você não tenha confirmado.

## Anexar o paradigma (obrigatório)
A cópia de fonte oficial do paradigma deve ser anexada (inteiro teor + certidão de julgamento). Acione a skill `dossie-decisoes-anexos` para gerar os links e o rol de documentos, e referencie cada paradigma ao respectivo Doc. NN no cotejo.
