---
name: verificacao-citacoes
description: "Use sempre que a peça citar lei, súmula, tema repetitivo, acórdão ou precedente. Disciplina a conferência em fonte oficial e a marcação obrigatória de citações não verificadas. Trigger: qualquer redação que contenha citação jurídica; 'conferir citações', 'verificar jurisprudência', 'isso existe mesmo?'."
---

# Verificação de Citações (conferibilidade)

Regra ROM: nenhuma citação entra sem conferência ou sem marca de alerta.

## Procedimento
1. Para cada citação (lei/súmula/tema/acórdão), confirmar em fonte oficial (planalto.gov.br, STJ, STF, DJe) ou no MCP de jurisprudência do escritório.
2. Confirmado → manter, registrando a fonte.
3. NÃO confirmado → manter o texto MAS marcar `⚠️[NÃO VERIFICADO: <citação> — conferir antes de protocolar]`. Nunca apagar a marca silenciosamente.
4. Registrar as citações verificadas em `citacoes-verificadas.txt` na raiz do projeto (uma por linha) — o hook usa esse registro.

## O hook é determinista
O hook `verificar-citacoes` roda a cada gravação de peça e bloqueia o arquivo se houver padrão de citação (Súmula nº, REsp/HC/AgRg nº, art. nº) que não esteja no registro de verificadas nem marcado como NÃO VERIFICADO. Isso é proposital e não deve ser contornado.

## Link para anexo
Ao confirmar uma citação de acórdão, registre o link do inteiro teor (e, se possível, da certidão de julgamento) para que a skill `dossie-decisoes-anexos` possa disponibilizá-lo para download e anexo à petição.
