# Autos (MNI) e trava de integridade (Team)

## Leitura dos autos
No Claude Code, o servidor `autos` inventaria o processo via MNI (PJe/eproc/Projudi/ESAJ) e entrega à ferramenta de extração do agente. No Team, trabalhe sobre os autos/peças anexados ao projeto, sempre em análise INTEGRAL (nada de amostragem; OCR para escaneados).

## Trava de integridade (sem rollback, sem retrocesso)
Princípio anti-supressão tornado determinista:
- Ao concluir a extração integral, registre o inventário (lista de documentos/teses) como "selo".
- Nenhum passo posterior pode reduzir, omitir ou reverter itens selados sem AUTORIZAÇÃO EXPRESSA.
- Antes de finalizar qualquer peça, confira que o artefato preserva todos os itens selados; se faltar algum, ou o advogado autoriza a omissão (com motivo) ou o item é reincluído.

No Team, aplique isso como disciplina de revisão; no Claude Code, é a trava `autos_selar_extracao` / `autos_verificar_integridade` (e o CLI trava-integridade.py).
