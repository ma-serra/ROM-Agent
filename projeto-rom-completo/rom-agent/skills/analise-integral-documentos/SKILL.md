---
name: analise-integral-documentos
description: "Use SEMPRE, e antes de qualquer peticionamento (petição inicial, contestação, recurso, qualquer manifestação), para ler INTEGRALMENTE os documentos da causa e o processo na íntegra. Nunca resuma por amostragem, nunca pule páginas, nunca descarte anexos. Cobre PDFs escaneados (OCR), processos volumosos, documentos da inicial e autos completos. Trigger: qualquer tarefa que dependa de fatos dos autos; 'analisar o processo', 'ler os documentos', 'peticionar', upload de processo/documentos."
---

# Análise integral de documentos (regra inegociável)

Nenhuma peça é redigida sem leitura COMPLETA do que foi entregue. Isto realiza a fidedignidade e a anti-supressão: o que não foi lido não pode ser invocado, e o que está nos autos não pode ser ignorado nem simplificado sem autorização expressa.

## Princípio
- **Integralidade**: leia todas as páginas, todos os anexos, todas as procurações, todos os documentos. Processos volumosos não autorizam leitura por amostragem.
- **Não-supressão**: não corte, não condense nem omita conteúdo dos documentos do cliente/advogado sem autorização. Em dúvida, pergunte.
- **Rastreabilidade**: toda afirmação de fato na peça aponta a folha/ID do documento que a sustenta.

## Procedimento
1. **Inventário**: liste todos os arquivos/peças recebidos (autos, contratos, laudos, decisões, procurações, comprovantes). Em processo eletrônico, mapeie por evento/ID.
2. **Leitura**: para documento nativo digital, leia o texto. Para PDF escaneado/imagem, use a habilidade de leitura com OCR (ver skill de file-reading / pdf-reading) antes de qualquer análise — não "presuma" o conteúdo de um documento ilegível.
3. **Extração estruturada** (ficha do caso):
   - Partes e qualificação; procurações (conferir poderes, CNPJ/CPF corretos, parte certa).
   - Linha do tempo dos fatos, ancorada em folhas/IDs.
   - Pedidos e causas de pedir já deduzidos.
   - Provas existentes e provas faltantes.
   - Decisões proferidas (sentença, acórdão, interlocutórias) e seus fundamentos.
   - Prazos em curso.
   - Vícios/oportunidades (parte errada, nulidade, tempestividade, prequestionamento ausente).
4. **Lacunas**: aponte expressamente o que falta nos autos para a peça pretendida e peça ao advogado.

## Saída
Uma **ficha integral do caso** que serve de base a qualquer peticionamento. A skill da peça específica (inicial, contestação, recurso) consome essa ficha; o diagnóstico de admissibilidade e a jurimetria também.

## Conexão com as demais skills
- Para inicial → skill `peticao-inicial` (já plantando teses federais/constitucionais).
- Para qualquer recurso → skill `diagnostico-admissibilidade` usa a ficha + o acórdão recorrido.
- Decisões lidas aqui alimentam, via skill `leitura-jurisprudencia`, o corpus de jurimetria.

Regra final: se não foi lido na íntegra, não está pronto para peticionar.

## Conector de autos e trava de integridade
A leitura dos autos via MNI é feita pelo servidor MCP `autos` (`autos_inventario`), que entrega o inventário à FERRAMENTA DE EXTRAÇÃO já existente do agente ROM — não re-extraímos, só somamos inventário + trava.

Fluxo com a trava (sem rollback/sem retrocesso):
1. Extração integral (ferramenta do agente) → lista de itens.
2. `autos_selar_extracao` sela o inventário integral (ledger forward-only). Selar estado menos completo que o anterior é recusado, salvo autorização.
3. Antes de finalizar qualquer peça, `autos_verificar_integridade` confere que o artefato não omite item selado; se omitir, bloqueia até reinclusão ou autorização expressa.

CLI equivalente (para pipeline/hook): `skills/analise-integral-documentos/trava-integridade.py` (selar/verificar/status).
