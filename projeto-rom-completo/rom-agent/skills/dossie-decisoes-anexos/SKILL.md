---
name: dossie-decisoes-anexos
description: "Use para disponibilizar os links oficiais das decisões para baixar e anexar à petição: inteiro teor, ementa/acórdão, relatório e voto e certidão de julgamento. Monta o 'Rol de documentos anexos' pronto para a peça (numeração Doc. NN) e a lista de download com nomes padronizados. Essencial no dissídio (alínea c), que exige cópia de fonte oficial do paradigma anexada. Trigger: 'link do inteiro teor', 'baixar acórdão', 'certidão de julgamento', 'anexar decisão', 'documentos da petição', 'rol de anexos', 'juntar paradigma'."
---

# Dossiê de decisões e anexos da petição

Para cada decisão citada (precedente próprio ou paradigma de dissídio), entregue os links OFICIAIS dos quatro componentes, prontos para baixar e anexar, e monte o rol de documentos da peça.

## Os quatro componentes (e onde obtê-los)

No STJ, o inteiro teor é composto de relatório + votos + certidão da Turma/Seção/Corte (resumo da sessão e resultado). A página de jurisprudência permite baixar o todo ou as partes: **Ementa/Acórdão · Relatório e Voto · Certidão (de Julgamento)**.

| Componente | Para que serve na peça | Fonte |
|---|---|---|
| **Inteiro teor** (PDF) | prova plena do julgado; base do cotejo | STJ (Revista Eletrônica/espelho do acórdão); STF (pesquisarInteiroTeor); DJEN ("Inteiro teor") |
| **Ementa/Acórdão** | tese e dispositivo | espelho do acórdão / DJEN |
| **Relatório e Voto** | ratio decidendi (fundamento real) | inteiro teor (parte) |
| **Certidão de julgamento** | comprova órgão, data, quórum e resultado | espelho/consulta processual |

Sempre registre também o link de **consulta processual/andamento** e a **data de acesso**.

## Procedimento
1. Para cada decisão, resolva os links (via MCP `jurisprudencia-tribunais`; STJ SCON, STF inteiro teor, DJEN). Se algum componente não estiver disponível online, marque `⚠️[NÃO VERIFICADO: obter na Secretaria de Documentação]` e não invente URL.
2. Baixe (ou gere a lista de download) com nomes padronizados:
   `Doc-NN_<tribunal>_<classe-numero>_<componente>.pdf`
   ex.: `Doc-03_STJ_REsp-1234567_inteiro-teor.pdf`, `Doc-03b_STJ_REsp-1234567_certidao-julgamento.pdf`.
3. Rode `python3 ${CLAUDE_SKILL_DIR}/montar-anexos.py anexos.csv` para gerar o **Rol de documentos** e a **lista de download**.
4. Insira o rol na petição e amarre cada citação no corpo ao respectivo Doc. NN.

## Integração
- **Dissídio (alínea c)**: a skill `cotejo-analitico-dissidio` EXIGE cópia de fonte oficial do paradigma; o paradigma entra no dossiê como inteiro teor + certidão, anexados e referenciados.
- **Verificação de citações**: ao confirmar a citação, registre o link no dossiê e em `citacoes-verificadas.txt`.
- **Peças**: ao final de qualquer recurso/petição, gere o rol de anexos e a remissão no texto ("conforme inteiro teor anexo — Doc. 03").

## Copyright/forma
Disponibilizar links oficiais e anexar cópias de decisões públicas à própria petição é prática regular. No corpo da peça, prefira paráfrase fiel da ratio e transcreva só o mínimo necessário, sempre identificando a fonte e o Doc. anexo.

## Decisões de 2º grau (qualquer tribunal)
Para acórdãos de TJ/TRF/TRT, use antes a skill `segundo-grau-nacional` (resolver-tribunal.py) para identificar o tribunal pelo número CNJ e obter o portal/alias corretos. Os componentes são os mesmos (inteiro teor, ementa/acórdão, relatório e voto do Desembargador relator, certidão de julgamento da sessão da câmara/turma).

## Resolução automática de links (conector)
O servidor MCP `jurisprudencia` resolve os links a partir do número CNJ: `jurisprudencia_resolver_links` devolve o objeto pronto e `jurisprudencia_buscar_djen` recupera o inteiro teor; a saída alimenta direto o `tribunais_montar_anexos`. O que o conector não conseguir resolver permanece ⚠️[NÃO VERIFICADO].
