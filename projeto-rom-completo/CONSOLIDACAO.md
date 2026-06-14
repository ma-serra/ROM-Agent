# Consolidação — Projeto ROM (todas as etapas da conversa)

Confirmação de que tudo o que construímos está no pacote.

## Linha do tempo do que foi feito
1. Arquitetura: Claude Code (agente) + Claude Team (projeto), integrados.
2. Plugin ROM: constituição (CLAUDE.md), pipeline (leitura integral → diagnóstico → redação → auditoria), hook determinista de citações.
3. Motor de admissibilidade (STJ/STF) + skills de barreiras (Súmula 7, cotejo/dissídio, repercussão geral, EDcl/prequestionamento).
4. Jurimetria: skill + analisar.py + schema + subagente.
5. Diários eletrônicos e leitura de jurisprudência (DataJud, DJEN, ementa/voto/acórdão); análise integral de documentos.
6. Dossiê de anexos: links de inteiro teor/voto/certidão + montar-anexos.py.
7. Segundo grau nacional: resolver-tribunal.py + registro-tribunais.json (qualquer TJ/TRF/TRT).
8. Servidor MCP tribunais-2grau (TS, testado, handshake).
9. Servidor MCP jurisprudencia (TS, testado, handshake, ciclo fechado com montar_anexos).
10. Conector de autos (MNI) + TRAVA de integridade (sem rollback/sem retrocesso), integrado à ferramenta de extração existente.
11. Roteamento de modelos por custo (Haiku/Sonnet/Opus) com trava de qualidade e teto de gasto; auditoria pré-protocolo obrigatória (GO/NO-GO + autorização humana).
12. Orquestração autônoma (orquestrador + /rom + bootstrap.sh), multi-escritório/multiusuário (tenancy) e documento mestre ORQUESTRACAO.md. CLI >= v2.1.154.

## Inventário atual do plugin (rom-agent)
- Skills (23): agravo-instrumento, agravo-resp-re, analise-integral-documentos, apelacao-contrarrazoes, contestacao-impugnacao, cotejo-analitico-dissidio, diagnostico-admissibilidade, diarios-eletronicos, dossie-decisoes-anexos, embargos-declaracao, habeas-corpus, jurimetria, leitura-jurisprudencia, memoriais, peticao-inicial, protocolo-auditoria, recurso-especial, recurso-extraordinario, repercussao-geral, roteamento-modelos, segundo-grau-nacional, sumula-7-valoracao, verificacao-citacoes
- Subagentes (7): analista-jurimetrico.md, auditor-admissibilidade.md, extrator-acordao.md, leitor-autos.md, orquestrador.md, revisor-fidedignidade.md, verificador-citacoes.md
- Comandos (10): anexos.md, auditar.md, diagnostico-admissibilidade.md, jurimetria.md, linha-recursal.md, nova-peca.md, protocolo.md, rom.md, roteador.md, segundo-grau.md
- Servidores MCP (3): autos, jurisprudencia, tribunais2grau
- Scripts: analisar.py, montar-anexos.py, resolver-tribunal.py, verificar-citacoes.py, trava-integridade.py, roteador.py, pre-protocolo.py
- Auditoria: auditar-plugin.py, AUDITORIA.md

## Projeto Team (rom-team-projeto)
- Instruções + 14 arquivos de conhecimento (00-indice a 13-protocolo-auditoria) + biblioteca de prompts + auto-auditoria de qualidade

## Pendências de ambiente (do escritório)
- Chaves/credenciais: DATAJUD_APIKEY (CNJ); REGISTRO_MNI (endpoints/credenciais por tribunal); confirmar DJEN_API vigente.
- Completar portais por tribunal em registro-tribunais.json (alias DataJud já automático).
- npm install && npm run build em cada servidor MCP (pacote vai sem node_modules).
