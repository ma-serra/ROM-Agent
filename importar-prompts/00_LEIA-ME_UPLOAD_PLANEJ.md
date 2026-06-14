# 00_LEIA-ME_UPLOAD_PLANEJ - GUIA DE MONTAGEM E OPERACAO DO PROJETO
# "PLANEJADOR TRIBUTARIO ROM"
Rodolfo Otavio Mota Advogados Associados S/S
Versao 1.4 | Junho/2026 | Status: Ativo

===============================================================================
1. ARQUITETURA DO PROJETO (DOIS NIVEIS)
===============================================================================

NIVEL 1 - CUSTOM INSTRUCTIONS (campo "instrucoes" do projeto Claude):
- Colar INTEGRALMENTE o conteudo de:
  CUSTOM_INSTRUCTIONS_PLANEJ_TRIB_V1_0_3.txt
- Funcao: camada de GOVERNANCA (missao, Secao 0, principios
  inviolaveis - incluindo Principio 8/licitude absoluta -, regras
  anti-IA, classificacao de risco, gestao do KB).

NIVEL 2 - KNOWLEDGE BASE (arquivos do projeto), nesta ordem:
| Ordem | Arquivo                                        | Funcao                                  |
| 01    | 00_LEIA-ME_UPLOAD_PLANEJ.md                    | Este guia                               |
| 02    | IAROM_PLANEJ_CONSOLIDACAO_V1_4.txt             | FONTE OPERACIONAL UNICA (22 Partes)     |
| 03    | PROMPT_PLANEJ_parecer_planejamento_V1_4.txt    | Moldura redacional do parecer           |
| 04    | 01_M_METODOS_CONSOLIDADO_ROM_V3_0.txt          | Metodos universais ROM (replicado)      |
| 05    | 05_M_DIRETRIZES_REDACIONAIS_UNIVERSAIS.txt     | Diretrizes redacionais ROM (replicado)  |

ARQUIVOS ABSORVIDOS (NAO subir ao KB, salvo determinacao expressa):
- PROMPT_PLANEJ_comparativo_regimes_V1_0.txt -> absorvido pelas
  PARTES I-V, XII e XIII do consolidado;
- PROMPT_PLANEJ_reforma_tributaria_V1_0.txt -> absorvido pela
  PARTE XI do consolidado.
Motivo: evitar duas fontes para as mesmas tabelas (vetor de
divergencia silenciosa). Mante-los apenas em arquivo morto local.

===============================================================================
2. ORDEM DE PREVALENCIA NORMATIVA
===============================================================================

PARTE 0 (Protocolo Universal de Jurisprudencia)
  > Custom Instructions V1.0.0
    > IAROM_PLANEJ_CONSOLIDACAO (demais Partes)
      > PROMPT_PLANEJ_parecer_planejamento
        > Metodos e diretrizes universais (01_M e 05_M)

===============================================================================
3. FLUXO DE USO (COMANDOS TIPICOS)
===============================================================================

COMANDO DE ABERTURA PADRAO (dispara etapa-zero + pronuncia previa):
"Inicie estudo de planejamento tributario para [empresa], documentos
anexos: execute a certificacao de vigencia e a pronuncia previa."

(a) NOVO ESTUDO COMPLETO:
"Execute a pronuncia previa de planejamento para a empresa [nome],
com os documentos anexos" -> Claude responde a PARTE I.2 do
consolidado, lista [PENDENTE] e aguarda os dados faltantes;
em seguida: "Prossiga com a triagem e as simulacoes" -> PARTES II a
XIII, com calculos em codigo; por fim: "Emita o parecer" -> moldura
do PROMPT_PLANEJ_parecer + apenso xlsx.

(b) ESTUDO PARCIAL (modulo isolado):
"Analise apenas o Fator R e a remuneracao dos socios" / "apenas o
impacto da Reforma no cenario atual" -> Claude aplica as Partes
pertinentes SEM dispensar a triagem minima (PARTE II) nem o validador.

(c) REORGANIZACAO:
"Avalie a segregacao da atividade [X] em PJ propria" -> PARTE X
integral, com teste de licitude documentado; estrutura reprovada em
qualquer item do teste NAO e recomendada.

(d) ATUALIZACAO PERIODICA:
"Reavalie o parecer PT-[AAAA-NNN] para a janela de opcao de [AAAA+1]"
-> reconferencia integral das tabelas (data-base nova) + nova matriz.

===============================================================================
4. REGRAS PERMANENTES DE OPERACAO
===============================================================================

- DATA-BASE: toda tabela do consolidado tem data-base 11/06/2026 e
  DEVE ser reconferida via web_search em fonte oficial a cada estudo,
  com registro da data da conferencia no produto;
- VOLATILIDADE MAXIMA: PARTE XI (Reforma - LC 214/2025, LC 227/2026,
  regulamentos, NTs, Resolucao do Senado sobre aliquotas de
  referencia) e PARTE VII (Lei 15.270/2025 - regulamentacao RFB);
- CALCULOS: sempre em codigo/planilha, dupla passagem, memoria
  exportavel;
- CONTENCIOSO: oportunidades de recuperacao/defesa identificadas no
  estudo sao apenas REGISTRADAS como correlatas e remetidas ao
  projeto "Redator Excepcional Juridico Tributario" (V2.0.0);
- VERSIONAMENTO: toda alteracao de arquivo gera nova versao com
  changelog; apos cada ciclo de consolidacao, AUDITORIA FORENSE
  anti-supressao comparando o tamanho e o conteudo das Partes com a
  versao anterior (Principio 3);
- CERTIFICACAO DE VIGENCIA (V1.1): etapa-zero de toda execucao -
  auditoria de atualizacao normativa conforme PARTE XVII do
  consolidado, com certificado datado no produto e proposta de
  atualizacao do KB sempre que detectada alteracao (substituicao de
  arquivo somente com autorizacao expressa do Dr. Rodolfo);
- CUSTO TOTAL CONSOLIDADO (V1.1): metrica decisoria unica (PARTE
  XVIII.1 - tributos + previdencia + FGTS/provisoes + folha +
  remuneracao dos socios + retencoes + conformidade); vedada
  recomendacao por tributo isolado;
- RELATORIO FINAL CONSOLIDADO (V1.1): fecho obrigatorio de todo
  estudo (PARTE XVIII.3 - cotejo de todos os regimes com diferencas
  em R$ e %, implicacoes juridicas e obrigacionais, sintese
  executiva);
- CHECKLIST DOCUMENTAL (V1.1): rol da PARTE XIX remetido ao cliente
  na abertura; itens essenciais (*) condicionam a conclusao;
- BASE TERRITORIAL PREPONDERANTE (V1.4): Goiania/GO e Estado de
  Goias consolidados na PARTE XXI (CTM/RCTM; CTE/RCTE; sociedade de
  profissionais; TARE/ProGoias; PROTEGE; monitoramento do PLC
  28/2021); qualquer OUTRO municipio ou estado exige FICHA
  TERRITORIAL (XXI.5) em fontes oficiais, vedada a analogia com a
  base goiana; territorio recorrente vira modulo permanente mediante
  autorizacao;
- COBERTURA SETORIAL UNIVERSAL (V1.3): toda atividade passa pela
  matriz setorial da PARTE XX (incluindo academias/condicionamento
  fisico e varejo) OU pela clausula residual (pesquisa normativa
  especifica documentada); atividades novas recorrentes geram
  proposta de expansao da matriz pelo rito da PARTE XVII.5 -
  ATUALIZACAO CONTINUA DOS PROMPTS sempre que exigido;
- VALIDADOR: nenhum produto e entregue sem a PARTE 0.10 (quatro
  etapas), a PARTE XVI do consolidado e o checklist complementar
  V1.1.

===============================================================================
5. ESTADO ATUAL E ROADMAP
===============================================================================

CONCLUIDO (Junho/2026):
[x] Custom Instructions V1.0.0
[x] IAROM_PLANEJ_CONSOLIDACAO_V1_1 (V1.0 consolidou e absorveu os
    satelites; V1.1 acresceu as PARTES XVII-XIX: auditoria de
    atualizacao normativa/KB, custo total consolidado + relatorio
    final consolidado, e checklist documental)
[x] PROMPT_PLANEJ_parecer_planejamento_V1_1
[x] Este LEIA-ME

PROXIMOS PASSOS:
[ ] Replicar 01_M_METODOS_CONSOLIDADO_ROM_V3_0 e 05_M_DIRETRIZES no
    KB do novo projeto (copia dos arquivos ja existentes);
[ ] VALIDACAO EM CASO REAL: aplicar o sistema a uma empresa da
    carteira; calibrar pronuncia previa e motor de simulacao -> V1.1;
[x] Secao 18 das Custom Instructions atualizada para a arquitetura
    consolidada (CI V1.0.1, autorizada em junho/2026);
[x] Auditoria forense integral de junho/2026 aplicada (consolidado
    V1.2; parecer V1.2): art. 32 da Lei 4.357/1964, lucro arbitrado
    residual, art. 23 da Lei 9.249/1995, IOF intercompany, IRPF dos
    socios e CNDs no checklist, retencoes nominadas, Decreto
    8.426/2015, MEI, FGTS Digital, art. 26-A da Lei 11.457/2007,
    nota JCP/Lei 14.789/2023 e harmonizacoes textuais;
[x] V1.3: PARTE XX - Matriz Setorial (12 modulos, incluindo
    academias/condicionamento fisico e varejo), clausula residual e
    protocolo de expansao setorial continua (junho/2026);
[x] V1.4: PARTE XXI - Base territorial Goias/Goiania + protocolo de
    expansao territorial (junho/2026);
[ ] Lembretes recorrentes de auditoria na agenda (Google Calendar) -
    PENDENTE de indicacao de dia/horario pelo Dr. Rodolfo.

===============================================================================

00_LEIA-ME_UPLOAD_PLANEJ | Rodolfo Otavio Mota Advogados Associados
S/S | Versao 1.4 | Junho/2026
