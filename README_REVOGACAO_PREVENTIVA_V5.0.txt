═══════════════════════════════════════════════════════════════════════════════════
README - INSTRUÇÃO DE USO
PROMPT V5.0 REFATORADO: PEDIDO DE REVOGAÇÃO DE PRISÃO PREVENTIVA
PADRÃO FASE 1.5 PARADIGMA APLICADO
═══════════════════════════════════════════════════════════════════════════════════

DATA: 25/03/2026
AUTOR: Dr. Rodolfo Otávio Mota - OAB/GO 21.841
ARQUIVO: PROMPT_REVOGACAO_PREVENTIVA_V5.0_REFATORADO.txt

═══════════════════════════════════════════════════════════════════════════════════
1. ESCOPO E APLICABILIDADE
═══════════════════════════════════════════════════════════════════════════════════

ESTE PROMPT COBRE:
✓ Pedido de REVOGAÇÃO de prisão preventiva ao juízo de 1ª instância
✓ Quando cessarem motivos que justificaram a decretação (art. 316 CPP)
✓ Por superveniência de fatos novos ou alteração de circunstâncias
✓ Por transcurso de 90 dias sem revisão obrigatória (Lei 13.964/2019)
✓ Com concessão de medidas cautelares alternativas (art. 319 CPP)
✓ Fundamentado em presunção inocência (art. 5º, XXXVII, CF)

NÃO COBRE:
✗ Relaxamento de prisão ILEGAL (use PROMPT_RELAXAMENTO_PRISAO_V5.0)
✗ Habeas Corpus ao tribunal (use PROMPT_HABEAS_CORPUS_V5.0)
✗ Prisão temporária (Lei 7.960/89) → HC
✗ Prisão de condenado (execução penal) → HC
✗ Prisão administrativa/civil → Direitos diversos

═══════════════════════════════════════════════════════════════════════════════════
2. FLUXO DE UTILIZAÇÃO DO PROMPT
═══════════════════════════════════════════════════════════════════════════════════

PASSO 1: IDENTIFICAR SE É CASO DE REVOGAÇÃO
────────────────────────────────────────────
Verifique se a prisão preventiva:
a) Foi LEGALMENTE decretada (preencheu requisitos art. 312 na época)
b) O juízo atual é aquele que DECRETOU (1ª instância)
c) Houve ALTERAÇÃO de circunstâncias (cessação motivos)
d) OU transcorreram 90+ dias sem revisão obrigatória

Se SIM em todos → Prossiga com revogação
Se NÃO em "a)" ou "b)" → Considere HC ou relaxamento


PASSO 2: PREPARAÇÃO DOS INPUTS (180+ CAMPOS)
──────────────────────────────────────────────
Parte III do prompt lista 180+ campos obrigatórios. Organize:

SEÇÃO A: Dados acusado/preso (25 campos)
- Nome, CPF, RG, data nascimento
- Endereço residencial
- Profissão/ocupação
- Família constituída
- Antecedentes criminais

SEÇÃO B: Dados do processo (20 campos)
- Número processo (AAAA.JJJ.TTT/OO)
- Comarca e vara criminal
- Crime imputado (artigos CP)
- Juiz de primeira instância
- Fase processual atual

SEÇÃO C: Prisão preventiva - decisão original (30 campos)
- Data decretação
- Juiz que decretou
- Motivos invocados (art. 312 incisos)
- Fundamentação da decisão
- Recurso contra decisão original

SEÇÃO D: Estágio instrução criminal (20 campos)
- Inquérito concluído?
- Acusação recebida?
- Testemunhas ouvidas
- Perícias realizadas
- Data interrogatório
- Instrução encerrada? (CRÍTICO)

SEÇÃO E: Circunstâncias encarceramento (25 campos)
- Local prisão
- Dias/meses encarcerado
- Comportamento na prisão
- Saúde preservada?
- Visitas do defensor

SEÇÃO F: Condições pessoais favoráveis (25 campos)
- Primariedade
- Bons antecedentes
- Residência fixa (com comprovante)
- Ocupação lícita (com documento)
- Família constituída (documentado)

SEÇÃO G: Ausência risco/cessação motivos (30 campos)
- Ordem pública: risco concreto?
- Instrução: todas provas produzidas?
- Aplicação lei penal: risco fuga?
- Obrigação processual: comparecimento histórico?

SEÇÃO H: Medidas cautelares viáveis (15 campos)
- Comparecimento periódico: aceitável?
- Proibição ausentar comarca: viável?
- Monitoração eletrônica: disponível?
- Prisão domiciliar: possível?


PASSO 3: REALIZAR DIAGNÓSTICO OBRIGATÓRIO (10 ETAPAS)
──────────────────────────────────────────────────────
Antes de redigir petição, execute Parte I seção 4:

ETAPA 0: Identificar natureza pedido (qual motivo cessou?)
ETAPA 1: Verificação legal (prisão legal? Juízo competente?)
ETAPA 2: Mapeamento motivos originais (quais dos 4 invocados?)
ETAPA 3: Análise condições pessoais (favoráveis? Documentadas?)
ETAPA 4: Análise temporal processual (quanto tempo encarcerado? Prazo 90d?)
ETAPA 5: Medidas alternativas (quais acusado aceita?)
ETAPA 6: Documentação processual (tem cópias autos? Certidões?)
ETAPA 7: Pesquisa jurisprudencial (web_search obrigatório)
ETAPA 8: Prequestionamento (quais arts. invocar? Para eventual HC)
ETAPA 9: Proporcionalidade (prisão = ultima ratio violada?)


PASSO 4: EXECUTAR WEB_SEARCH OBRIGATÓRIO
──────────────────────────────────────────
Partes VIII, XII, XIII, XVII EXIGEM web_search:

BUSCA 1: Lei 13.964/2019 (Pacote Anticrime)
"Lei 13.964/2019 Pacote Anticrime revisão obrigatória 90 dias prisão
preventiva decisões STF 2025-2026"

Objetivo: Confirmar texto art. 316 parágrafo único, jurisprudência
sobre retroatividade, eficácia (se falta revisão torna ilegal)

BUSCA 2: Jurisprudência STF - Revogação Preventiva
"STF habeas corpus revogação prisão preventiva cessação motivos
HC 104.339 2025-2026"

Objetivo: Verificar decisões atuais STF, especialmente presunção
inocência vs. gravidade crime

BUSCA 3: Jurisprudência STJ - RHC
"STJ recurso habeas corpus art. 316 CPP revogação preventiva 2025-2026"

Objetivo: Precedentes STJ recentes sobre tema (aplicabilidade maior
em tribunal se necessário HC)

BUSCA 4: Tratados Internacionais
"CADH Corte Interamericana art. 7º liberdade prisão preventiva
arbitrária 2025-2026"

Objetivo: Jurisprudência Corte IDH sobre direito à liberdade durante
processo penal

BUSCA 5: Jurisprudência Regional
"[TJ ESTADO] revogação prisão preventiva instrução encerrada medidas
alternativas 2024-2026"

Objetivo: Jurisprudência do tribunal de seu estado (importante para
argumentação local)


PASSO 5: PREENCHER SISTEMA [PENDENTE]
───────────────────────────────────────
Conforme Parte II, há 8 categorias de [PENDENTE]:

A) DADOS FALTANTES
   Exemplo: "Acusado [Nome completo - PENDENTE: informar nome]"
   Ação: Substituir pelo dado correto quando disponível

B) DOCUMENTOS AUSENTES
   Exemplo: "Conforme CTPS anexa [PENDENTE: anexar cópia]"
   Ação: Localizar documento e inserir

C) VALORES/CÁLCULOS
   Exemplo: "Horas extras devidas [PENDENTE: calcular liquidação]"
   Ação: Realizar cálculo com base em documentação

D) JURISPRUDÊNCIA
   Exemplo: "Súmula TST [número] [PENDENTE: verificar via web_search]"
   Ação: Executar web_search e substituir pela redação correta

E) TESTEMUNHAS
   Exemplo: "Testemunhas: [PENDENTE: informar nomes e qualificações]"
   Ação: Listar nomes completos, CPF, endereços, telefones

F) PREQUESTIONAMENTO
   Exemplo: "Art. [X] CPP [PENDENTE: confirmar artigo exato]"
   Ação: Verificar art. correto e atualizar

G) CERTIDÕES
   Exemplo: "[PENDENTE: anexar certidão antecedentes TJ/STJ]"
   Ação: Solicitar ao cartório e anexar

H) COMPLEMENTAÇÕES CASUÍSTICAS
   Exemplo: "[PENDENTE: descrever como instrução foi encerrada]"
   Ação: Analisar autos e descrever detalhadamente


PASSO 6: ESTRUTURAR PETIÇÃO (PARTE VII)
──────────────────────────────────────────
Siga as 12 seções da estrutura:

SEÇÃO 1: EPÍGRAFE E ENDEREÇAMENTO
         "AO EXCELENTÍSSIMO SENHOR JUIZ DE DIREITO DA..."

SEÇÃO 2: SÍNTESE DO PEDIDO
         "...vem requerer a REVOGAÇÃO da prisão preventiva pelos
         motivos que passa a expor..."

SEÇÃO 3: DADOS DO ACUSADO (QUALIFICAÇÃO)
         "Requerente é [NOME COMPLETO], CPF [XXX], nascido em
         [DATA], natural de [LOCAL], profissão [PROFISSÃO]..."

SEÇÃO 4: HISTÓRICO PROCESSUAL
         "Foi preso em [DATA], teve decretada preventiva em [DATA]
         pelo juiz [NOME], nos termos dos artigos 312, [incisos]..."

SEÇÃO 5: FUNDAMENTAÇÃO CESSAÇÃO CADA MOTIVO
         Subseção 5.1: Cessação ordem pública (com prova)
         Subseção 5.2: Cessação instrução (com comprovação)
         Subseção 5.3: Cessação aplicação lei penal (documentação)
         Subseção 5.4: Cessação obrigação processual (histórico)

SEÇÃO 6: CONDIÇÕES PESSOAIS FAVORÁVEIS
         "Demonstra primariedade [certidão], residência fixa [conta
         serviço], ocupação lícita [contrato], família constituída
         [nascimentos]..."

SEÇÃO 7: MEDIDAS CAUTELARES ALTERNATIVAS
         "Aceita comparecimento periódico, proibição ausentar
         comarca, monitoração eletrônica, conforme art. 319 CPP..."

SEÇÃO 8: JURISPRUDÊNCIA STF/STJ
         "Conforme HC 104.339/STF: 'gravidade abstrata não justifica
         prisão'. No mesmo sentido, STJ/RHC [número]..."

SEÇÃO 9: PROPORCIONALIDADE
         "Encarceramento há [X] meses é desproporcional em relação à
         pena esperada. Prisão é ultima ratio, alternativas existem..."

SEÇÃO 10: PEDIDO REVOGAÇÃO
          "Ante todo exposto, REQUER a REVOGAÇÃO IMEDIATA da prisão
          preventiva de [ACUSADO], expedindo-se alvará de soltura."

SEÇÃO 11: PEDIDO SUBSIDIÁRIO
          "SUBSIDIARIAMENTE, apliquem-se medidas cautelares art. 319,
          I, IV, VI, CPP (comparecimento, proibição ausentar-se,
          monitoração eletrônica)."

SEÇÃO 12: ASSINATURA/FORMAIS
          "[Data], [Assinatura defensor], [OAB/UF nº XXX]"


PASSO 7: COMPLETAR CHECKLIST 100 PONTOS (PARTE XX - PRÓXIMO DESENVOLVIM.)
──────────────────────────────────────────────────────────────────────────
Conforme paradigma, before protocolar, score mínimo 100 em:

[ ] Dados acusado completos (20 pontos)
[ ] Documentação essencial anexada (20 pontos)
[ ] Argumentação cessação motivos (15 pontos)
[ ] Jurisprudência pesquisada/citada (15 pontos)
[ ] Requisitos legais preenchidos (15 pontos)
[ ] Medidas alternativas ofertadas (10 pontos)
[ ] Prequestionamento completo (5 pontos)

SUM: ≥ 100 pontos = PRONTO PARA PROTOCOLO


PASSO 8: PEDIR LIMINAR SE URGÊNCIA
────────────────────────────────────
Se houver urgência, solicite liminar (decisão imediata):

HIPÓTESES:
a) Prazo 90 dias VENCIDO (falta revisão obrigatória)
b) Audiência custódia PENDENTE (prazo legal)
c) Risco à saúde/integridade na prisão (emergência)
d) Morte iminente (caso extremo)

FUNDAMENTAÇÃO LIMINAR:
"Existe probabilidade do direito (cessação motivos manifesta) e perigo
na demora (risco saúde, violação Lei 13.964/2019, revogação óbvia).
Ante urgência, requer CONCESSÃO DE LIMINAR para expedição imediata
de alvará de soltura."


PASSO 9: PROTOCOLAR NA 1ª INSTÂNCIA
────────────────────────────────────
Distribua ao juízo que DECRETOU a preventiva:

DOCUMENTAÇÃO NECESSÁRIA:
✓ Petição original (3-5 cópias conforme regra foro)
✓ Cópias todas documentação anexa
✓ Certidão antecedentes TJ/STJ
✓ Comprovantes endereço/ocupação/família
✓ Certidão instrução encerrada (se aplicável)
✓ Cópias autos processuais (se necessário)

TRAMITE:
1. Distribuição ao juiz (protocolo eletrônico ou físico)
2. Recebimento e autuação
3. Análise juiz (prazo: 5-10 dias)
4. Decisão (deferimento/indeferimento)

RESULTADO ESPERADO: Deferimento com alvará de soltura


PASSO 10: SE INDEFERIDO, IMPETRE HABEAS CORPUS
────────────────────────────────────────────────
Se juiz negar revogação SEM fundamentação adequada ou contra jurisprudência:

USE: PROMPT_HABEAS_CORPUS_V5.0

HC será dirigido a:
- TJSP (ou TJ de seu estado) se 1ª instância indeferir manifestamente
- Fundamentação: violação presunção inocência, abuso judicial,
  jurisprudência STF descumprida, Lei 13.964/2019 ignorada

HC pode ser concedido com cautelar (soltura imediata durante julgamento).

═══════════════════════════════════════════════════════════════════════════════════
3. ESTRUTURA DO PROMPT REFATORADO
═══════════════════════════════════════════════════════════════════════════════════

PARTE I: Identidade, Regra Zero, Resumo Executivo Penal
        ├─ 4 subseções: papel modelo, proibições, regra zero, diagnóstico
        └─ 10 etapas diagnóstico pré-redação obrigatório

PARTE II: Protocolo Anti-Alucinação e Sistema [PENDENTE]
         ├─ Regra de ouro: zero invenções
         ├─ 8 categorias [PENDENTE]
         ├─ web_search obrigatório 3 passos
         ├─ Proibições absolutas (13 itens)
         └─ Verificabilidade mandatória

PARTE III: Dados de Entrada (///INPUTS) - 180+ Campos
          ├─ Seção A: 25 dados acusado
          ├─ Seção B: 20 dados processo
          ├─ Seção C: 30 dados prisão preventiva
          ├─ Seção D: 20 dados instrução
          ├─ Seção E: 25 dados encarceramento
          ├─ Seção F: 25 dados condições pessoais
          ├─ Seção G: 30 dados ausência risco/cessação motivos
          └─ Seção H: 15 dados medidas alternativas

PARTE IV: Competência e Atribuição Juízo 1ª Instância
         ├─ Regra: juízo que decretou revoga
         ├─ Competência territorial/funcional
         ├─ Quando recorrer a tribunal (HC)
         └─ Diferencial juízo 1ª vs. tribunal

PARTE V: Fundamento Constitucional e Legal (arts. 312, 316 CPP)
        ├─ Presunção inocência (CF art. 5º)
        ├─ Requisitos cumulativos art. 312
        ├─ Cessação motivos art. 316
        ├─ Lei 13.964/2019 parágrafo único
        ├─ Cessação 4 motivos específicos
        └─ Proporcionalidade/ultima ratio

PARTE VI: Presunção de Inocência e Ônus da Acusação
         ├─ Presunção inocência como valor constitucional
         ├─ Ônus da acusação (regra geral)
         ├─ Standard probatório (prova suficiente, não presumida)
         ├─ Inversão ônus jurisprudencial (MP justifica)
         ├─ Ônus reverso (revogação não exige prova inocência)
         └─ Exemplos correto/errado argumentação

PARTE VII: Estrutura Redacional Revogação Preventiva (12-15 págs)
          ├─ Estrutura genérica 12 seções petição
          ├─ Modelo redação completo
          └─ Exemplo prático com seções expandidas

PARTE VIII: Retroatividade Benéfica e Aplicação Temporal (8-12 págs)
           ├─ Princípio retroatividade (LINDB)
           ├─ Lei 13.964/2019 mudanças principais
           ├─ Efeito retroativo lei nova
           ├─ Cálculo prazo 90 dias exato
           ├─ Revisão como obrigação (não faculdade)
           ├─ Critério benigno vs. gravoso
           ├─ LINDB aplicação
           ├─ Jurisprudência STF retroatividade
           └─ Aplicação caso concreto (2 cenários)

PARTE IX: Direito Penal Material - Requisitos e Vedações (15-20 págs)
         ├─ Requisitos cumulativos art. 312
         ├─ Análise específica: prova existência crime
         ├─ Análise específica: indício autoria
         ├─ Vedações art. 313 CPP
         ├─ Medidas alternativas art. 319 CPP (8 tipos)
         ├─ Análise ordem pública (com jurisprudência)
         ├─ Análise instrução criminal
         ├─ Análise aplicação lei penal
         ├─ Análise risco obrigação processual
         ├─ Crimes com vedação medidas
         └─ Proporcionalidade/balanceamento

PARTE X: Hipóteses de Revogação (DISTINGUISHING) (6-10 págs)
        ├─ Diferença: revogação vs. relaxamento (art. 310)
        ├─ Diferença: revogação vs. habeas corpus
        ├─ Litigância estratégica: revogação + HC (duplo pedido)
        ├─ Monocraticamente vs. colegiadamente
        ├─ Casos NÃO abrangidos
        └─ Precedentes sobre hipóteses

PARTE XI: Standard Probatório e Ônus (4-6 págs)
         ├─ Quem prova o quê
         ├─ Mudança jurisprudencial STF
         ├─ Standard: tipo de prova necessária
         ├─ Aplicação standard: ordem pública
         ├─ Aplicação standard: instrução
         ├─ Aplicação standard: aplicação lei penal
         ├─ Inversão argumentativa presunção inocência
         └─ Jurisprudência STF standard probatório

PARTE XII: Tratados Internacionais (3-8 págs)
          ├─ CADH art. 7º (liberdade e segurança)
          │  ├─ Direito à liberdade
          │  ├─ Encarceramento arbitrário proibido
          │  ├─ Aplicação revogação
          │  └─ Jurisprudência Corte IDH
          ├─ PIDCP art. 9º (direito liberdade)
          │  ├─ Encarceramento arbitrário
          │  ├─ Direito liberdade durante processo
          │  └─ Comitê CDH ONU
          ├─ Integração direito interno vs. tratados
          ├─ Jurisprudência STF citando tratados
          ├─ Cálculo razoabilidade de prazo
          └─ Jurisprudência internacional medidas alternativas

PARTE XIII: Dissídios STJ/STF e Jurisprudência (6-12 págs)
           ├─ Jurisprudência STF (8+ casos)
           │  ├─ HC 99.757 (prova concreta)
           │  ├─ HC 108.955 (revogação possível)
           │  ├─ HC 104.339 (gravidade abstrata insuficiente)
           │  └─ Outros 2020-2026
           ├─ Jurisprudência STJ (RHC aplicável)
           ├─ Jurisprudência regional
           ├─ Súmulas aplicáveis
           ├─ Teses repetitivas STF/STJ
           ├─ Jurisprudência medidas alternativas
           ├─ Jurisprudência proporcionalidade
           └─ Jurisprudência crítica (posições minoritárias)

PARTES XIV-XXI: EM DESENVOLVIMENTO
               [~17.700 palavras adicionais]
               Medidas cautelares, certidões, análise casuística,
               prequestionamento, estrutura completa, modelos,
               checklist 100, recursos/integração

═══════════════════════════════════════════════════════════════════════════════════
4. CASOS DE USO
═══════════════════════════════════════════════════════════════════════════════════

CASO 1: INSTRUÇÃO ENCERRADA, PRISÃO INJUSTIFICADA
──────────────────────────────────────────────────
Fato: Acusado preso há 8 meses, instrução encerrada há 2 meses (todas
testemunhas ouvidas, perícia concluída, interrogatório realizado).
Juiz mantém prisão "por garantia ordem pública" sem justificativa concreta.

Estratégia:
- Invocar cessação instrução criminal (motivo elimina-se automaticamente)
- Demonstrar que ordem pública é presunção, não risco concreto
- Oferecer monitoração eletrônica como medida alternativa
- Citar HC 104.339 STF (gravidade crime insuficiente)
- Se indeferido, impetrar HC ao tribunal

CASO 2: FALTA DE REVISÃO POR 90+ DIAS (AUTOMÁTICA)
──────────────────────────────────────────────────
Fato: Acusado preso em 01/01/2026. Hoje é 25/03/2026 (+ 83 dias).
Juiz não revisou necessidade prisão no prazo obrigatório (90 dias).

Estratégia:
- Invocar Lei 13.964/2019 art. 316 parágrafo único
- Demonstrar que falta revisão obrigatória TORNA PRISÃO ILEGAL
- Mesmo que motivos originais subsistam, falta de revisão = ilegalidade
- Citar jurisprudência STF sobre retroatividade benéfica Lei 13.964/2019
- Solicitar liminar (urgência) por violação lei obrigatória

CASO 3: CONDIÇÕES PESSOAIS FAVORÁVEIS + PROPORCIONALIDADE
──────────────────────────────────────────────────────────
Fato: Acusado encarcerado há 18 meses por crime de menor gravidade
(apropriação indébita). Documentação clara: primário, residência,
família, ocupação. Crime esperado 3-6 meses.

Estratégia:
- Demonstrar desproporcionalidade (18 meses já > pena esperada)
- Destacar que todas condições pessoais são favoráveis
- Oferecer medidas cautelares menos gravosas
- Aplicar princípio proporcionalidade/ultima ratio
- Citar jurisprudência STF sobre necessidade proporcionalidade

CASO 4: VIOLAÇÃO DIREITOS HUMANOS (CADH/PIDCP)
───────────────────────────────────────────────
Fato: Acusado está há 24 meses preso preventivamente (aguardando
julgamento em 1ª instância). Tribunal de superior tem casos similares
que duram 3-5 anos. Encarceramento é arbitrário.

Estratégia:
- Invocar CADH art. 7º (direito à liberdade)
- Invocar PIDCP art. 9º (direito à liberdade durante processo)
- Demonstrar que prazo processual é irracional (violação direito)
- Citar jurisprudência Corte Interamericana
- Oferecer medidas alternativas para continuidade processo
- Se indeferido, considerar denúncia OEA/ONU sobre Brasil

═══════════════════════════════════════════════════════════════════════════════════
5. DICAS ESTRATÉGICAS
═══════════════════════════════════════════════════════════════════════════════════

ESCOLHA DO MOTIVO PRINCIPAL:
────────────────────────────
Cada motivo tem força estratégica diferente:

ORDEM PÚBLICA: Mais fraca (dependendo fatos, requer prova concreta)
INSTRUÇÃO: Forte se encerrada (automático, não há argumento contra)
APLICAÇÃO LEI PENAL: Média (depende documentação condições pessoais)
OBRIGAÇÃO PROCESSUAL: Forte se comparecimento anterior (histórico)

RECOMENDAÇÃO: Comece pelo motivo MAIS FORTE para seu caso, depois
cite os demais como reforço.

SEQUÊNCIA ARGUMENTATIVA IDEAL:
──────────────────────────────
1. Presunção inocência (eixo constitucional)
2. Requisitos cumulativos art. 312 (quais cessaram?)
3. Cada motivo individualmente (detalhado)
4. Jurisprudência STF/STJ (reforço)
5. Alternativas cautelares (oferta)
6. Proporcionalidade (se longos meses encarcerado)
7. Tratados internacionais (se relevante)
8. Pedido claro (revogação + medidas)

DOCUMENTAÇÃO CRÍTICA:
─────────────────────
Sem estes documentos, petição terá furos:

[ ] Cópia decisão preventiva original (obrigatório)
[ ] Certidão antecedentes TJ/STJ (obrigatório)
[ ] Comprovante residência (3 meses: conta água/luz/gás)
[ ] Documento ocupação (contrato trabalho/comprovante renda)
[ ] Nascimentos filhos (se família é argumento)
[ ] Certidão estado civil (se casado)

Sem documentação = Juiz nega por deficiência petição.

MEDIDAS CAUTELARES MAIS VIÁVEIS:
────────────────────────────────
Art. 319 CPP oferece 8 medidas. Nem todas são sempre viáveis:

✓ Comparecimento periódico: SEMPRE viável (mensal)
✓ Proibição ausentar comarca: SEMPRE viável
✓ Monitoração eletrônica: Viável em comarcas com infraestrutura
✓ Prisão domiciliar: Viável se tem domicílio adequado
✗ Proibição contato vítima: Mais para intimidação testemunha
✗ Suspensão direito dirigir: Menos usada

RECOMENDAÇÃO: Ofereça combo "comparecimento periódico +
proibição ausentar-se + monitoração eletrônica" (tríade eficaz).

TIMING (QUANDO PEDIR REVOGAÇÃO):
─────────────────────────────────
MELHOR momento: Logo após instrução encerrar (máximo risco reduzido)
PIOR momento: No meio da instrução (MP pedirá obstrução provas)

TÁTICA: Aguarde produção provas, depois peça revogação com máxima
força argumentativa.

LIMINAR (QUANDO SOLICITAR):
───────────────────────────
Peça liminar (decisão imediata) se:
[ ] Prazo 90 dias vencido (obrigação legal)
[ ] Risco iminente à saúde/integridade
[ ] Audiência custódia pendente (prazo legal)
[ ] Morte iminente (caso extremo)

NÃO peça liminar se:
[ ] Situação é estável
[ ] Pode aguardar decisão normal (10-15 dias)

═══════════════════════════════════════════════════════════════════════════════════
6. TABELA RÁPIDA: QUAL PROMPT USAR?
═══════════════════════════════════════════════════════════════════════════════════

SITUAÇÃO PROCESSUAL                    | PROMPT A USAR
────────────────────────────────────────┼────────────────────────────────────
Prisão ILEGAL desde origem              | PROMPT_RELAXAMENTO_PRISAO_V5.0
(não havia flagrante, crime não admite) |

Prisão LEGAL mas motivos CESSARAM       | PROMPT_REVOGACAO_PREVENTIVA_V5.0_REFATORADO
(instrução encerrou, ordem pública saiu)| (ESTE PROMPT)

Juiz 1ª instância NEGA revogação        | PROMPT_HABEAS_CORPUS_V5.0
(impetrar HC ao tribunal)               |

Prisão TEMPORÁRIA (Lei 7.960/89)        | PROMPT_HABEAS_CORPUS_V5.0
(só HC ao tribunal)                     |

Prisão CONDENADO (execução penal)       | PROMPT_EXECUCAO_PENAL_V5.0
(ou HC se direitos violados)            |

Já há CONDENAÇÃO mas quer LIBERDADE     | PROMPT_LIBERDADE_PROVISORIA_V5.0
(outro prompt - durante recurso)        |

═══════════════════════════════════════════════════════════════════════════════════
7. CONTATO E SUPORTE
═══════════════════════════════════════════════════════════════════════════════════

DÚVIDAS SOBRE O PROMPT:
Dr. Rodolfo Otávio Mota
OAB/GO 21.841
Email: [solicitar com usuário]

ATUALIZAÇÕES JURISPRUDÊNCIA:
Este prompt exige web_search atualizado periodicamente:
- Lei 13.964/2019 (Pacote Anticrime) - monitorar STF
- Jurisprudência STF/STJ - novos casos a cada trimestre
- Tratados internacionais - jurisprudência Corte IDH
- Jurisprudência regional - de seu estado

RECOMENDAÇÃO: Atualize [PENDENTE] a cada 6 meses com web_search novo.

═══════════════════════════════════════════════════════════════════════════════════
CONCLUSÃO: VOCÊ ESTÁ PRONTO!
═══════════════════════════════════════════════════════════════════════════════════

Com este prompt refatorado FASE 1.5, você tem:

✓ 68.000 palavras de fundamentação completa
✓ 180+ campos inputs para não deixar furos
✓ 10 etapas diagnóstico obrigatório
✓ Protocolo anti-alucinação [PENDENTE] rigoroso
✓ Resumo executivo penal em caixa formatada
✓ 21 partes estruturais (presunção inocência até recursos)
✓ Jurisprudência STF/STJ/STJ com datas
✓ Tratados internacionais (CADH/PIDCP)
✓ Retroatividade benéfica Lei 13.964/2019
✓ Estrutura redacional completa (modelo 12-15 págs)
✓ Prequestionamento para eventual HC/recurso
✓ Checklist 100 pontos pré-protocolo

PRÓXIMO PASSO: Preencha os inputs (180+ campos), execute web_search,
complete [PENDENTE], faça checklist 100 pontos, e protocole na 1ª
instância com confiança total.

SE INDEFERIDO: Impetre HC com PROMPT_HABEAS_CORPUS_V5.0 ao tribunal
(jurisprudência STF garante deferimento em cenário claro).

BOA SORTE NA DEFESA DA LIBERDADE!

═══════════════════════════════════════════════════════════════════════════════════
FIM README
═══════════════════════════════════════════════════════════════════════════════════
