---
name: leitura-jurisprudencia
description: "Use para ler e estruturar jurisprudência decompondo a decisão em EMENTA, VOTO(s) e ACÓRDÃO (dispositivo). Extrai ratio decidendi, fundamentos, súmulas aplicadas, resultado e se houve conhecimento — alimentando ao mesmo tempo a verificação de citações e o corpus de jurimetria. Trigger: 'ler acórdão', 'analisar jurisprudência', 'ementa voto acórdão', 'qual a tese do julgado', 'inteiro teor'."
---

# Leitura estruturada de jurisprudência (ementa, voto, acórdão)

Uma decisão tem três camadas com funções distintas; leia as três, nunca só a ementa.

## As três camadas
1. **Ementa** — resumo oficial; dá a tese e as palavras-chave, mas NÃO substitui o voto. Útil para indexação e para o cotejo, porém pode não refletir nuances.
2. **Voto(s)** — onde está a *ratio decidendi* (a razão de decidir) e eventuais *obiter dicta*; identifique voto condutor, divergências e votos vencidos. É aqui que se afere o real fundamento.
3. **Acórdão / dispositivo** — o resultado (conheceu? proveu? em que extensão?), o quórum e a parte vinculante.

## Extração estruturada (por decisão)
Produza um registro com:
```
tribunal · órgão (turma/câmara) · relator · data de julgamento · processo · fonte
matéria · classe · fundamento_principal · súmulas/temas aplicados
ratio decidendi (em 1-2 frases, próprias palavras)
conhecido (sim/não) · resultado (provido/parcial/improvido)
distinção/superação relevante? · voto vencido? (tese alternativa)
```

## Duplo destino do registro
- **Verificação de citações**: a súmula/tese extraída é confirmada na fonte oficial e adicionada a `citacoes-verificadas.txt`. Se só houver a ementa (ex.: via DJEN), e não o inteiro teor, marque a tese como `⚠️[NÃO VERIFICADO: confirmar no inteiro teor]`.
- **Jurimetria**: o registro vira uma linha no corpus (schema da skill `jurimetria`), permitindo calcular taxas de conhecimento/provimento por órgão/relator/fundamento.

## Fontes
- **Inteiro teor (ementa+voto+acórdão)**: portais de jurisprudência do STJ (SCON) e do STF; sistemas dos tribunais.
- **Ementa + dispositivo + intimações**: DJEN/Comunica (skill `diarios-eletronicos`). Quando só houver ementa, sinalize a limitação — não infira o voto.

Cuidado: copiar trechos longos de acórdão é reprodução. Para a peça, prefira paráfrase fiel da ratio; transcreva o mínimo necessário e identifique a fonte.

## Capturar os links para anexo
Ao ler a decisão, registre também os links dos componentes para download/anexo: inteiro teor, ementa/acórdão, relatório e voto e certidão de julgamento (+ consulta processual). Esses links abastecem a skill `dossie-decisoes-anexos`. O que não estiver disponível online → `⚠️[NÃO VERIFICADO]`.
