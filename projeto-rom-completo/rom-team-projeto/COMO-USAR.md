# Como montar o Projeto no Claude Team

1. Crie um Projeto chamado "Assistente Jurídico ROM".
2. Em **Instruções personalizadas**, cole o conteúdo de `INSTRUCOES-DO-PROJETO.md`.
3. Em **Conhecimento do projeto**, faça upload de todos os arquivos da pasta `conhecimento/`.
4. (Opcional) Adicione manuais do STJ/STF e sua jurisprudência curada ao conhecimento.
5. Para começar uma tarefa, use os modelos de `05-biblioteca-de-prompts-rom.md`.

## Quando usar o Team e quando usar o Claude Code
- **Team**: estratégia, casos difíceis, refino de uma peça, segunda opinião, diálogo.
- **Claude Code (agente ROM)**: produção em escala, auditoria por subagentes, hook determinista de citações, conectores MCP de jurisprudência e de autos.

Os dois compartilham a mesma metodologia e o mesmo corpus — mude só o modo de trabalho.
