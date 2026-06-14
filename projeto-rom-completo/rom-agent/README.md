# ROM Agent — plugin Claude Code

Agente jurídico do escritório Rodolfo Otávio Mota, da petição inicial ao recurso superior (STJ/STF), com motor de diagnóstico de admissibilidade e verificação determinista de citações.

## O que vem dentro

- **CLAUDE.md** — constituição/metodologia ROM (sempre carregada): leitura integral → diagnóstico (+jurimetria) → redação → auditoria.
- **skills/** — 21 skills:
  - Base: `analise-integral-documentos` (ler processo/inicial na íntegra, OCR, nunca por amostragem).
  - Ciclo processual: petição inicial, contestação/impugnação, apelação/contrarrazões, embargos de declaração, REsp, RE, AREsp/ARE, habeas corpus, memoriais.
  - Admissibilidade: `diagnostico-admissibilidade`, `sumula-7-valoracao`, `cotejo-analitico-dissidio`, `repercussao-geral`, `verificacao-citacoes`.
  - Empírico/dados: `jurimetria` (+ `analisar.py`), `leitura-jurisprudencia` (ementa/voto/acórdão), `diarios-eletronicos` (DJEN + DataJud).
  - Anexos: `dossie-decisoes-anexos` (+ `montar-anexos.py`) — links oficiais de inteiro teor, voto e certidão de julgamento + rol de documentos da petição.
  - 2º grau nacional: `segundo-grau-nacional` (+ `resolver-tribunal.py` e `registro-tribunais.json`) — roteia por número CNJ a qualquer TJ/TRF/TRT; `agravo-instrumento`.
- **agents/** — 6 subagentes somente-leitura: leitor-autos, extrator-acordao, auditor-admissibilidade, verificador-citacoes, revisor-fidedignidade, analista-jurimetrico.
- **commands/** — `/diagnostico-admissibilidade`, `/nova-peca`, `/auditar`, `/linha-recursal`, `/jurimetria`, `/anexos`, `/segundo-grau`.
- **hooks/** — verificação determinista de citações (PostToolUse; bloqueia gravação com citação não conferida).
- **mcp/tribunais2grau/** — servidor MCP FUNCIONAL (build + 8 testes + handshake): roteia qualquer tribunal pelo número CNJ, consulta DataJud, monta anexos.
- **mcp/jurisprudencia/** — servidor MCP FUNCIONAL (7 testes + handshake + ciclo fechado): resolve links de inteiro teor/voto/certidão (STJ/STF/DJEN) e alimenta o montar_anexos.
- **mcp/autos/** — servidor MCP FUNCIONAL (3 testes + handshake): inventário de autos via MNI para a ferramenta de extração do agente + TRAVA de integridade (sem rollback/sem retrocesso). Conectores DataJud/DJEN/verificador do `.mcp.json` seguem como templates.
- **skills/analise-integral-documentos/trava-integridade.py** — trava CLI (selar/verificar/status), fonte única da lógica de integridade (testada em 7 cenários).
- **auditar-plugin.py** / **AUDITORIA.md** — auditoria estrutural (55 verificações, aprovado).
- **knowledge/** — súmulas, dispositivos, metodologia, fontes de dados (mapa skill×plugin×API×habilidade), jurimetria.
- **citacoes-verificadas.txt** — registro que alimenta o hook.


## Instalação

1. Copie a pasta `rom-agent/` para o repositório do agente (ou publique como plugin em um marketplace interno).
2. Como plugin local:
   ```bash
   claude --plugin-dir /caminho/para/rom-agent
   ```
   ou registre em um marketplace e use `/plugin`.
3. Os servidores MCP em `.mcp.json` são **templates** — implemente `mcp/jurisprudencia`, `mcp/processos`, `mcp/verificador` (Node) e configure credenciais por gerenciador de segredos, nunca em texto.
4. O hook exige Python 3 no PATH.

## Fluxo de uso

- Recurso superior: `/diagnostico-admissibilidade` → corrigir o que reprovar (ex.: EDcl) → redigir → `/auditar`.
- Peça de 1º grau: `/nova-peca petição inicial ...`.
- A qualquer gravação, o hook confere as citações e bloqueia se houver citação solta.

## Integração com a infraestrutura ROM
- Roteamento multi-modelo no AWS Bedrock: o Claude Code lê a região de `~/.aws`.
- Subagentes recursivos (até 5 níveis) permitem separar extração → análise → redação → auditoria.
- Empacote como plugin versionado para distribuir aos associados (mesma versão em plugin.json e no marketplace).
