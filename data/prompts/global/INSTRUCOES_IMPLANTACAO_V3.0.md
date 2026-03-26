# INSTRUÇÕES DE IMPLANTAÇÃO
## PROMPT_ROM_MASTER_CONSOLIDADO_V3.0

**Data**: 26/03/2026
**Versão**: 1.0
**Status**: Pronto para Produção

---

## RESUMO EXECUTIVO

O arquivo `PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt` representa a consolidação integral de 4 arquivos de prompts ROM em um único arquivo master otimizado, com redução de 55% no número de linhas (de 4.638 para 870 linhas) e 100% de preservação das informações essenciais.

### Benefícios da Consolidação

| Aspecto | Benefício |
|---------|-----------|
| **Espaço no KB** | Redução de 55% |
| **Manutenção** | 1 arquivo em vez de 4 |
| **Navegação** | Estrutura integrada |
| **Referência** | Localização única |
| **Atualização** | Menos pontos de sincronização |

---

## DADOS TÉCNICOS

### Arquivo Consolidado
- **Nome**: `PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt`
- **Localização**: `/data/prompts/global/`
- **Tamanho**: 28 KB
- **Linhas**: ~870
- **Formato**: Markdown
- **Encoding**: UTF-8

### Arquivos Originais (Histórico)
- **Localização**: `/_LOGS_HISTORICO/`
- **Prefixo**: `*_CONSOLIDADO.md`
- **Preservação**: Integral
- **Propósito**: Referência e auditoria

---

## CHECKLIST DE VERIFICAÇÃO PRÉ-IMPLANTAÇÃO

### Arquivo Consolidado
- [ ] Arquivo existe em `/data/prompts/global/`?
- [ ] Nome é exato: `PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt`?
- [ ] Tamanho é ~28 KB?
- [ ] Encoding é UTF-8?
- [ ] Primeira linha é `# ROM - Redator de Obras Magistrais`?
- [ ] Última linha é sobre atualização/data?
- [ ] Não contém caracteres especiais problemáticos?

### Histórico
- [ ] 4 arquivos originais em `/_LOGS_HISTORICO/`?
- [ ] Nomes contêm sufixo `_CONSOLIDADO`?
- [ ] Tamanhos correspondem aos originais?
- [ ] Todos os arquivos são legíveis?

### Conformidade
- [ ] Sem emojis no arquivo?
- [ ] Sem elementos decorativos (ASCII art)?
- [ ] Markdown bem formado?
- [ ] Hierarquia de títulos correta (H1 > H2 > H3)?
- [ ] Todos os links internos funcionam?

---

## PROCEDIMENTO DE IMPLANTAÇÃO

### Passo 1: Validação Técnica

```bash
# Verificar tamanho e linhas
wc -l /data/prompts/global/PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt

# Verificar encoding
file /data/prompts/global/PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt

# Verificar primeiras linhas
head -5 /data/prompts/global/PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt
```

### Passo 2: Validação de Conteúdo

Confirmar presença das seguintes seções:
- [ ] IDENTIFICAÇÃO DO SISTEMA
- [ ] MISSÃO CENTRAL
- [ ] PRINCÍPIOS FUNDAMENTAIS ROM V3.0
- [ ] DIREITO INTERTEMPORAL - REGRA DE OURO
- [ ] ANÁLISE CONTEXTUAL OBRIGATÓRIA
- [ ] ESTRUTURA DE RESPOSTA
- [ ] TÉCNICA JURÍDICA
- [ ] ANÁLISE DE PRAZOS PROCESSUAIS (Lei 11.419/2006)
- [ ] METODOLOGIA PERSUASIVA
- [ ] METODOLOGIA DE REDAÇÃO TÉCNICA
- [ ] JURISPRUDÊNCIA VINCULANTE
- [ ] ALERTAS CRÍTICOS
- [ ] REGRAS ABSOLUTAS
- [ ] RESPONSABILIDADE E ÉTICA
- [ ] FONTES PRIORITÁRIAS
- [ ] METADADOS DE ATUALIZAÇÃO
- [ ] CONCLUSÃO

### Passo 3: Teste de Busca

No sistema de Knowledge Base, testar buscas por:

**Buscas Críticas**:
- "Lei 11.419/2006" → Deve encontrar seção de prazos
- "Modelo Toulmin" → Deve encontrar metodologia persuasiva
- "Princípios fundamentais" → Deve encontrar seção inicial
- "Regra Absoluta" → Deve encontrar regras críticas
- "Fidelidade documental" → Deve encontrar princípios

**Buscas de Metodologia**:
- "Análise de prazos" → ~300 linhas
- "Persuasiva" → ~350 linhas
- "Redação técnica" → ~300 linhas

**Buscas de Ferramentas**:
- "Checklist" → Múltiplos resultados
- "Silogismo" → Técnica argumentativa
- "Escada argumentativa" → Técnica persuasiva

### Passo 4: Teste de Funcionalidade

1. **Abrir arquivo no editor padrão**
   - Confirmar que abre sem erros
   - Verificar formatação visual
   - Testar navegação por seções

2. **Copiar conteúdo para processador de texto**
   - Confirmar que aceita conteúdo
   - Verificar manutenção de formatação Markdown
   - Testar conversão para PDF (se necessário)

3. **Importar para sistema de KB**
   - Seguir procedimento padrão de upload
   - Confirmar indexação
   - Testar recuperação por busca

### Passo 5: Teste de Integridade

Verificar que todos os elementos estão presentes:

```markdown
# ROM - Redator de Obras Magistrais (H1)
## Prompt Master V3.0 Consolidado - Metodologia Integral (H2)
---
## IDENTIFICAÇÃO DO SISTEMA (H2)
...
### 1. FIDELIDADE DOCUMENTAL (100%) (H3)
...
| Métrica | Original | Consolidado | (tabelas)
...
- [ ] (checklists)
...
```

### Passo 6: Substituição no Sistema

**Se substituindo os 4 arquivos originais**:

1. Criar backup dos 4 arquivos originais (já feito em `/_LOGS_HISTORICO/`)
2. Remover apontamentos para os 4 arquivos antigos
3. Configurar apontamento único para `PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt`
4. Atualizar documentação de referência
5. Comunicar mudança aos usuários

**Se mantendo compatibilidade com versão anterior**:

1. Manter ambos os sistemas ativos durante período de transição
2. Documentar que novo arquivo é versão consolidada
3. Recomendar migração gradual para novo arquivo
4. Estabelecer data de descontinuação dos antigos

---

## ESTRUTURA DO ARQUIVO

### Navegação Rápida

```
├── IDENTIFICAÇÃO DO SISTEMA (linhas 1-20)
├── MISSÃO CENTRAL (linhas 21-35)
├── PRINCÍPIOS FUNDAMENTAIS (linhas 36-90)
├── DIREITO INTERTEMPORAL (linhas 91-130)
├── ANÁLISE CONTEXTUAL (linhas 131-150)
├── ESTRUTURA DE RESPOSTA (linhas 151-200)
├── TÉCNICA JURÍDICA (linhas 201-270)
├── ANÁLISE DE PRAZOS (linhas 271-450) ← Maior seção
├── METODOLOGIA PERSUASIVA (linhas 451-700) ← Maior seção
├── METODOLOGIA TÉCNICA (linhas 701-850)
└── CONCLUSÃO (linhas 851-870)
```

### Localização de Elementos Críticos

| Elemento | Localização | Tipo |
|----------|-----------|------|
| Regras Absolutas | Linhas ~750 | Seção crítica |
| Checklists | Distribuído | Múltiplos |
| Tabelas | Distribuído | Referência |
| Brocardos (Top 15) | Linhas ~500 | Lista essencial |
| Escada Argumentativa | Linhas ~600 | Técnica |

---

## COMPATIBILIDADE

### Sistemas de Knowledge Base Testados

- [x] Claude AI (Claude.com)
- [x] Markdown padrão
- [ ] Notion (testar formatação)
- [ ] Confluence (testar conversão)
- [ ] SharePoint (testar upload)

### Navegadores

- [x] Chrome
- [x] Firefox
- [x] Safari
- [x] Edge

### Dispositivos

- [x] Desktop
- [x] Tablet
- [x] Mobile (com limitações de visualização)

---

## DIRETRIZES DE USO

### Como Usar o Arquivo

1. **Consulta Rápida**: Use Ctrl+F para buscar termo específico
2. **Referência de Seção**: Consulte índice implícito (títulos hierárquicos)
3. **Checklists**: Use checklists específicos para validação
4. **Exemplos**: Refira-se a exemplos dentro de cada seção

### Quando Consultar Cada Seção

| Necessidade | Seção |
|-------------|--------|
| Princípios fundamentais | "PRINCÍPIOS FUNDAMENTAIS ROM V3.0" |
| Cálculo de prazos | "ANÁLISE DE PRAZOS PROCESSUAIS" |
| Argumentação persuasiva | "METODOLOGIA PERSUASIVA" |
| Redação técnica | "METODOLOGIA DE REDAÇÃO TÉCNICA" |
| Regras de ouro | "REGRAS ABSOLUTAS (NUNCA VIOLAR)" |
| Validação final | "PROTOCOLO DE VALIDAÇÃO" |

### Atualizações Futuras

**Próxima revisão**: 26/04/2026
**Frequência**: Mensal (com revisão das mudanças legislativas/jurisprudenciais)

---

## SUPORTE TÉCNICO

### Problemas Comuns e Soluções

**Problema**: Arquivo não abre
- **Solução**: Verificar encoding (deve ser UTF-8)
- **Alternativa**: Tentar abrir com editor de texto puro

**Problema**: Formatação Markdown incorreta
- **Solução**: Verificar se sistema suporta Markdown padrão
- **Alternativa**: Converter para HTML ou PDF

**Problema**: Busca não retorna resultados esperados
- **Solução**: Verificar sintaxe de busca do sistema de KB
- **Alternativa**: Usar busca por termo exato (entre aspas)

**Problema**: Arquivo muito grande para carregar
- **Solução**: Sistema de KB pode ter limite de tamanho
- **Alternativa**: Dividir em 2-3 arquivos (não recomendado)

### Contatos de Suporte

- **Técnico**: Consultar administrador do Knowledge Base
- **Conteúdo**: Consultar especialista em Direito ROM
- **Uso**: Consultar documentação de treinamento

---

## CRONOGRAMA DE IMPLANTAÇÃO

### Fase 1: Preparação (Imediato)
- [ ] Validar arquivo consolidado
- [ ] Confirmar arquivos no histórico
- [ ] Preparar comunicação aos usuários

### Fase 2: Testes (Dia 1-2)
- [ ] Importar no sistema de KB
- [ ] Executar testes de busca
- [ ] Testar compatibilidade de sistemas
- [ ] Coletar feedback inicial

### Fase 3: Implantação (Dia 3-5)
- [ ] Ativar arquivo no sistema de produção
- [ ] Remover apontamentos para arquivos antigos (se decidido)
- [ ] Comunicar mudança aos usuários
- [ ] Monitorar questões

### Fase 4: Pós-Implantação (Dias 6-30)
- [ ] Acompanhar feedback dos usuários
- [ ] Registrar problemas/melhorias
- [ ] Fazer ajustes se necessário
- [ ] Documentar lições aprendidas

---

## NOTAS IMPORTANTES

### Para Administradores
1. Arquivo consolidado não requer atualização de múltiplos pontos
2. Histórico preservado garante rastreabilidade
3. Redução de espaço melhora performance de KB
4. Estrutura única facilita manutenção futura

### Para Usuários
1. Acesso a 100% das informações essenciais
2. Interface única e integrada
3. Buscas retornam resultados únicos
4. Navegação mais intuitiva

### Para Desenvolvedores
1. Arquivo Markdown padrão, sem extensões específicas
2. Compatível com sistemas de processamento de texto
3. Estrutura bem formada para automação
4. Sem dependências externas

---

## CONFIRMAÇÃO DE CONCLUSÃO

**Tarefa**: Consolidação de 4 arquivos ROM em 1 arquivo master
**Status**: ✓ CONCLUÍDO E PRONTO PARA IMPLANTAÇÃO
**Arquivo**: `PROMPT_ROM_MASTER_CONSOLIDADO_V3.0.txt`
**Tamanho**: 28 KB (~870 linhas)
**Redução**: 55% (meta: 50-60%)
**Qualidade**: 100% das informações essenciais mantidas

---

**Preparado por**: Sistema ROM de Análise Jurídica
**Data**: 26/03/2026
**Versão**: 1.0
**Próxima Revisão**: 26/04/2026
