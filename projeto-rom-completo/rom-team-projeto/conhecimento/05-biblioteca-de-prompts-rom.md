# Biblioteca de prompts ROM (PROMPT_[AREA]_[tipo])

Modelos de abertura de tarefa. Cole e preencha os [campos].

## PROMPT_RECURSAL_DIAGNOSTICO
"Antes de minutar, faça o diagnóstico de admissibilidade do caso [proc. nº] para [STJ/STF]. Segue o acórdão recorrido: [colar]. Teses pretendidas: [listar]. Dispositivos supostamente violados: [listar]. Produza o relatório por fundamento (PASSA/RISCO/NÃO PASSA, com trecho) e a recomendação."

## PROMPT_RECURSAL_RESP
"Com base no diagnóstico aprovado, minute o Recurso Especial. Inclua tópico de admissibilidade (prequestionamento, afastamento das Súmulas 7 e 5; se alínea c, cotejo analítico) antes do mérito. Demonstração analítica por dispositivo. Marque toda citação não confirmada com ⚠️[NÃO VERIFICADO]."

## PROMPT_RECURSAL_RE
"Minute o Recurso Extraordinário com preliminar destacada de repercussão geral (relevância + transcendência), afastando ofensa reflexa (Súmula 636) e Súmula 279. Demonstração analítica da contrariedade ao dispositivo constitucional."

## PROMPT_RECURSAL_EDCL_PREQUESTIONAMENTO
"O acórdão foi omisso quanto a [tese/dispositivo]. Minute embargos de declaração para sanar a omissão e prequestionar expressamente os dispositivos [X, Y], invocando o art. 1.025 CPC. Afaste caráter protelatório."

## PROMPT_RECURSAL_ARESP
"O REsp/RE foi inadmitido na origem pelos fundamentos [colar a decisão]. Minute o agravo do art. 1.042 atacando CADA fundamento da inadmissão (Súmula 182/STJ) e reafirmando a admissibilidade do recurso trancado."

## PROMPT_1GRAU_INICIAL
"Minute petição inicial de [ação] para [cliente] contra [réu]. Fatos: [...]. Pedidos: [...]. Já nomeie os dispositivos federais/constitucionais aplicáveis para facilitar futuro prequestionamento."

## PROMPT_CRIMINAL_HC
"Minute habeas corpus para o paciente [nome], autoridade coatora [...], apontando a flagrante ilegalidade [...]. Trabalhe a ilegalidade manifesta sem depender de reexame de prova; peça subsidiariamente concessão de ofício."

## PROMPT_AUDITORIA
"Aja como auditor adversarial de admissibilidade: tente derrubar esta peça como faria a presidência do tribunal e o relator. Aponte fundamentos reprovados e a correção cabível, e liste citações não verificadas."

## PROMPT_BASE_ANALISE_INTEGRAL
"Antes de qualquer peça, leia integralmente os documentos anexados (e o processo na íntegra). Não resuma por amostragem. Faça OCR se houver páginas escaneadas. Devolva a ficha do caso (partes/procurações, linha do tempo com folha/ID, pedidos, provas, decisões e fundamentos, prazos, vícios) e aponte lacunas. Não omita nada sem minha autorização."

## PROMPT_JURIMETRIA
"Monte o perfil jurimétrico para [matéria] no [órgão/relator]: taxas de conhecimento e provimento, fundamentos vencedores, tempo de tramitação e tendência, a partir do corpus [colar/descrever]. Declare os limites (n, viés, correlação≠causa, passado≠futuro) e os limites éticos. Indique qual fundamento liderar e em qual foro."

## PROMPT_LEITURA_JURISPRUDENCIA
"Leia este acórdão decompondo em ementa, voto e dispositivo. Extraia a ratio decidendi (em suas palavras), fundamentos, súmulas/temas, se conheceu e o resultado. Marque ⚠️[NÃO VERIFICADO] o que só constar da ementa sem o voto."

## PROMPT_ANEXOS
"Para as decisões citadas/paradigmas [listar], disponibilize os links oficiais para baixar e anexar: inteiro teor, ementa/acórdão, relatório e voto e certidão de julgamento (STJ/STF/DJEN). Monte o bloco 'DOS DOCUMENTOS ANEXOS' com numeração Doc. NN e a remissão no corpo da peça. Marque ⚠️[NÃO VERIFICADO] o que não tiver link oficial. Lembre que no dissídio (alínea c) a cópia oficial do paradigma é requisito."

## PROMPT_SEGUNDO_GRAU
"A partir do número CNJ [colar], identifique segmento e tribunal (J.TR), o alias do DataJud (api_publica_<sigla>) e o portal de jurisprudência/consulta do tribunal (qualquer TJ/TRF/TRT do país). Em seguida, disponibilize os links para baixar e anexar inteiro teor, ementa/acórdão, relatório e voto (Desembargador relator) e certidão de julgamento (sessão da câmara/turma). Marque ⚠️[NÃO VERIFICADO] o que não conferir. Use DJEN como fallback nacional."

## PROMPT_AUTOAUDITORIA_QUALIDADE
"Antes de entregar, auto-audite esta peça: (1) integridade — nenhum documento/tese dos autos foi omitido sem minha autorização; (2) admissibilidade — cada fundamento de recurso superior passa nas barreiras (ou indica a correção); (3) conferibilidade — toda citação verificada ou marcada ⚠️[NÃO VERIFICADO]; (4) anexos — rol de documentos com inteiro teor/voto/certidão e remissão Doc. NN; (5) fidedignidade — todo fato tem lastro em folha/ID. Liste o que falta antes de eu protocolar."


## PROMPT_PRE_PROTOCOLO
"Trate como pré-protocolo: rode o checklist GO/NO-GO (integridade, admissibilidade se recurso, citações, fidedignidade, anexos, tempestividade). Liste pendências. NÃO considere pronto sem todos os itens e a minha autorização expressa para protocolar."
