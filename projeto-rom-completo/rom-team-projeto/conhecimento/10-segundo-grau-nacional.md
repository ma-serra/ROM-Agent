---
name: segundo-grau-nacional
description: "Use para tratar decisões de 2º grau de QUALQUER tribunal do país (TJ de qualquer estado, TRF, TRT, TRE), independentemente do sistema (ESAJ/SAJ, PJe, eproc, Projudi). A partir do número único CNJ identifica segmento e tribunal, deriva o alias do DataJud e roteia para o portal de jurisprudência/consulta correto, resolvendo inteiro teor, voto e certidão de julgamento para anexar. Replica no 2º grau o dossiê, a jurimetria e a leitura de jurisprudência. Trigger: 'acórdão do TJ/TRF/TRT', 'segundo grau', 'qualquer tribunal', 'desembargador relator', 'câmara/turma', 'baixar acórdão de 2º grau', número CNJ de 2ª instância."
---

# Segundo grau, nacional (independente da unidade judiciária)

No 2º grau não há sistema único: cada TJ/TRF/TRT tem seu portal e seu sistema (ESAJ/SAJ, PJe, eproc, Projudi). O que unifica tudo é o **número único CNJ** (Res. 65/2008) + as bases nacionais do CNJ (**DataJud** e **DJEN**).

## Como funciona o roteamento
O número `NNNNNNN-DD.AAAA.J.TR.OOOO` codifica:
- **J** = segmento (4 Federal · 5 Trabalho · 6 Eleitoral · 8 Estadual · 1 STF · 3 STJ · 9 Militar Estadual).
- **TR** = tribunal dentro do segmento (ex.: 8.09 = TJGO; 8.26 = TJSP; 4.01 = TRF1; 5.18 = TRT18).
- **OOOO** = unidade de origem.

Rode `python3 ${CLAUDE_SKILL_DIR}/resolver-tribunal.py <numero>` para obter: segmento, sigla do tribunal, alias do DataJud (`api_publica_<sigla>`), portal de jurisprudência/consulta (do `registro-tribunais.json`) e o fallback DJEN. O alias do DataJud é derivado por regra (confiável); portais por tribunal vêm do registro e devem ser confirmados (⚠️[NÃO VERIFICADO] quando não conferidos).

## Camadas nacionais
- **DataJud** (todos os 91 tribunais): metadados + movimentos → jurimetria de 2º grau (taxa de provimento por câmara/turma/desembargador, tempo de tramitação).
- **DJEN/Comunica** (cobertura nacional): ementa de acórdãos, dispositivo, intimações; traz link de inteiro teor.
- **Portal do tribunal** (por sigla): inteiro teor completo (relatório + votos + certidão de julgamento da sessão da câmara/turma).

## Componentes de 2º grau para anexar
Iguais aos das cortes superiores, com terminologia de 2ª instância: **acórdão/ementa**, **relatório e voto** (Desembargador relator; atenção a votos vencidos/divergências), **certidão de julgamento** (sessão da Câmara/Turma/Seção/Órgão Especial) e **inteiro teor**. Acione a skill `dossie-decisoes-anexos` para montar o rol e os links de download.

## Reaproveitamento (replica o que já existe)
- Leitura: skill `leitura-jurisprudencia` (ementa/voto/acórdão) — agnóstica ao tribunal.
- Anexos/links: skill `dossie-decisoes-anexos`.
- Jurimetria: skill `jurimetria` + `analisar.py` (recorte por órgão/relator de 2º grau).
- Admissibilidade: o acórdão de 2º grau é o **acórdão recorrido** do REsp/RE → skill `diagnostico-admissibilidade`.
- Coleta: skill `diarios-eletronicos` (DataJud + DJEN, por alias do tribunal).

## Manter para preencher
O `registro-tribunais.json` traz os tribunais conhecidos preenchidos e os demais como template. Complete sistema/portais por sigla à medida que confirmar; o alias do DataJud já sai automático para qualquer um.
