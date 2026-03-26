# ROM - Redator de Obras Magistrais

Agente de IA para Redação de Peças Jurídicas com Excelência.

## 🎉 Status do Projeto

**Fase 2 Concluída:** 74/83 prompts refatorados (89%)
**Última atualização:** 26/03/2026
**Conformidade ROM V3.0:** 100%

### Progresso da Refatoração

- ✅ **Wave 1-2:** 16 prompts criminais + cíveis (100%)
- ✅ **Wave 3:** 8 prompts recursos cíveis (100%)
- ✅ **Wave 4:** 6 prompts trabalhistas (100%)
- ✅ **Wave 5:** 8 prompts petições iniciais (100%)
- ✅ **Wave 6:** 8 prompts ações especiais (100%)
- ✅ **Wave 7:** 8 prompts especiais + contratos (100%)
- ✅ **Wave 8:** 8 prompts contratos (100%)
- ✅ **Wave 9:** 8 prompts extrajudiciais + revisão (100%)
- ✅ **Wave 10:** 4 prompts instrumentais (100%)

**Total:** 74 prompts com 7 partes obrigatórias Fase 1.5 cada (~518 partes adicionadas)

## Instalação

```bash
cd ROM-Agent
npm install
```

## Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione sua chave da API Anthropic:
```
ANTHROPIC_API_KEY=sua_chave_aqui
```

## Uso

### CLI Interativo
```bash
npm run cli
```

### Como Módulo
```javascript
import { ROMAgent } from './src/index.js';

const agent = new ROMAgent(process.env.ANTHROPIC_API_KEY);
const resposta = await agent.processar('Redija uma petição inicial');
console.log(resposta);
```

## Capacidades

- ✅ Redação de peças jurídicas (cíveis, criminais, trabalhistas)
- ✅ Pesquisa de legislação nacional e internacional
- ✅ Consulta de jurisprudência em todos os tribunais
- ✅ Análise e extração de processos judiciais (PDF)
- ✅ Correção ortográfica e gramatical
- ✅ Formatação profissional com papel timbrado
- ✅ Criação de tabelas, fluxogramas e linhas do tempo
- ✅ Busca de artigos científicos jurídicos

## 📚 Prompts Refatorados (Fase 1.5)

### 7 Partes Obrigatórias por Prompt
1. **PARTE VII:** Estrutura Redacional (8-12 pág)
2. **PARTE VIII:** LINDB Arts. 1º-6º + Art. 14 CPC / Retroatividade Benéfica (criminal) (8-12 pág)
3. **PARTE IX:** Direito Material (15-20 pág)
4. **PARTE XIII:** Distinguishing + Overruling (6-10 pág)
5. **Standard Probatório** (4-6 pág)
6. **Tratados Internacionais** (3-8 pág)
7. **Dissídios Jurisprudenciais STJ/STF** (6-12 pág)

### Áreas Cobertas
- **Criminais:** 12 prompts (Habeas Corpus, Apelação, Recursos, Revisão, etc.)
- **Cíveis:** 22 prompts (Apelação, Agravos, Embargos, Ações, etc.)
- **Trabalhistas:** 7 prompts (Reclamação, Contestação, Recursos, etc.)
- **Petições Iniciais:** 8 prompts (Petição, Contestação, Réplica, etc.)
- **Contratos:** 17 prompts (Social, Compra/Venda, Locação, etc.)
- **Revisão/Análise:** 8 prompts (Análise, Revisão Geral, Parecer, etc.)

**Crescimento médio:** +250% linhas, +220% palavras por prompt

## Ferramentas Integradas

### Legislação
- Constituição Federal + 132 Emendas
- Códigos: CC, CPC, CP, CPP, CLT, CDC, CTN, ECA, LEP, e mais
- Tratados internacionais (DUDH, CADH, etc.)
- Súmulas do STF, STJ, TST, TSE

### Tribunais
- Superiores: STF, STJ, TST, TSE, STM
- TRFs: 1ª a 6ª Região
- TJs: Todos os 27 estados
- TRTs: 24 regiões
- Justiça Militar e Desportiva

### Web Search
- JusBrasil
- Conjur, Migalhas, JOTA
- SciELO, BDTD, Google Scholar
- PubMed, IEEE, Scopus

### Extração de PDFs
- 33 ferramentas de processamento
- 10 processadores de otimização
- Divisão inteligente em chunks
- Extração de metadados jurídicos

## Estrutura do Projeto

```
ROM-Agent/
├── src/
│   ├── index.js        # Agente principal
│   ├── cli.js          # Interface de linha de comando
│   └── modules/
│       ├── legislacao.js   # Legislação e códigos
│       ├── tribunais.js    # Integração com tribunais
│       ├── webSearch.js    # Busca web jurídica
│       ├── portugues.js    # Correção e estilo
│       ├── documentos.js   # Formatação de documentos
│       └── extracao.js     # Extração de PDFs
├── config/
├── templates/
├── package.json
└── README.md
```

## Comandos do CLI

| Comando | Descrição |
|---------|-----------|
| `/ajuda` | Exibe ajuda |
| `/limpar` | Limpa histórico |
| `/prompts` | Lista prompts |
| `/tribunais` | Lista tribunais |
| `/codigos` | Lista códigos |
| `/pecas` | Lista tipos de peças |
| `/extrair [pdf]` | Extrai texto de PDF |
| `/sair` | Encerra |

## Licença

MIT
