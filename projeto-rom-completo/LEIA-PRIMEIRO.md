# Projeto ROM — duas frentes integradas (v2)

Da petição inicial ao recurso superior, com análise integral de documentos, jurimetria e foco em superar as barreiras de admissibilidade do STJ/STF.

## As duas frentes rodam JUNTAS (não são excludentes)
- **`rom-agent/` (plugin Claude Code)** — produção em escala + checagens deterministas.
- **`rom-team-projeto/` (projeto Claude Team)** — trabalho estratégico e interativo.
- Compartilham metodologia, corpus de jurimetria e registro de citações. Mesma cabeça, dois modos de trabalho.

## Pipeline (sempre nesta ordem)
0. **Leitura integral** do processo e documentos (nunca por amostragem; OCR p/ escaneado).
1. Extração → ficha do caso.
2. Diagnóstico de admissibilidade + camada empírica de jurimetria.
3. Redação da peça.
4. Auditoria por subagentes (admissibilidade, citações, fidedignidade).

## Mapa skill × plugin × API/MCP × habilidade
| Capacidade | Mecanismo |
|---|---|
| Ler processo/inicial na íntegra (inclui PDF escaneado) | habilidade file-reading/OCR + skill analise-integral-documentos (subagente leitor-autos) |
| Ler jurisprudência (ementa/voto/acórdão) | skill leitura-jurisprudencia |
| Coletar diários p/ jurimetria | API/MCP DataJud + DJEN-Comunica (skill diarios-eletronicos) |
| Métricas de jurimetria | skill jurimetria + analisar.py |
| Verificar citações | hook determinista + MCP verificador |
| Admissibilidade (+ base histórica) | skill diagnostico-admissibilidade |
| Empacotar/distribuir | plugin versionado |

## Fontes oficiais (gratuitas)
- DataJud (CNJ): metadados/movimentos → jurimetria e tempo.
- DJEN/Comunica (CNJ): ementa, dispositivo, intimações.
- STJ SCON / STF: inteiro teor (voto).

## O que ainda depende de você
1. Implementar os servidores MCP (Node) cujos templates estão em `rom-agent/.mcp.json`: DataJud, DJEN/Comunica, jurisprudência STJ/STF, autos, verificador. Obter a chave pública do DataJud na wiki do CNJ; credenciais por gerenciador de segredos.
2. Alimentar `citacoes-verificadas.txt` e o corpus de jurimetria (schema em `rom-agent/skills/jurimetria/schema-decisoes.csv`).
3. Publicar `rom-agent/` como plugin versionado no marketplace interno do escritório.

Tudo o que pôde ser automatizado deste lado já está pronto, testado e validado.
