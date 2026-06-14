# Stand-up do Claude Team ROM (4 passos)

1. **Criar o Projeto** — no Claude Team web, novo Projeto "Assistente Jurídico ROM" (um Projeto por escritório, na camada multi-escritório).
2. **Colar as instruções** — cole `INSTRUCOES-DO-PROJETO.md` no campo de instruções personalizadas do Projeto.
3. **Subir o conhecimento** — faça upload de todos os arquivos de `conhecimento/` (comece pelo `00-indice.md`).
4. **Usar a biblioteca de prompts** — abra `conhecimento/05-biblioteca-de-prompts-rom.md` e use os modelos PROMPT_[AREA]_[tipo] prontos.

## Multi-escritório no Team
- Um Projeto por escritório; a base de conhecimento (00–13) é comum.
- Varie só as instruções/segredos por escritório. Acrescentar um escritório = novo Projeto, sem mexer nos existentes (aditivo).

## Espelhamento com o Claude Code
A metodologia, as travas (sem rollback/sem downgrade) e o pré-protocolo são os mesmos do agente ROM (Claude Code). No Team, valem como disciplina de revisão; no Claude Code, como travas deterministas. Detalhe técnico completo: `rom-agent/ORQUESTRACAO.md`.
