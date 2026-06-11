# CLAUDE.md - Diretrizes Fixas do Projeto ROM-Agent

**IMPORTANTE**: Este arquivo contém informações críticas sobre o projeto. Leia atentamente antes de qualquer modificação no código ou deploy.

---

## 📋 INFORMAÇÕES DO PROJETO

### Identificação
- **Nome do Projeto**: ROM-Agent (Redator de Obras Magistrais)
- **Repositório GitHub**: https://github.com/rodolfo-svg/ROM-Agent
- **Usuário GitHub**: rodolfo-svg
- **Serviço Render**: srv-d4ueaf2li9vc73d3rj00
- **Versão Atual**: 2.8.0

---

## 🔧 AMBIENTE DE EXECUÇÃO

### Linguagem Principal e Runtime
- **Ambiente**: Node.js
- **Versão do Node.js**: 25.2.1 (FIXA - não alterar sem testes completos)
- **Tipo de Módulo**: ESM (type: "module" no package.json)
- **Entry Point**: src/index.js

### Componentes Secundários
- **Python Scrapers**: Módulos Python para extração de dados de tribunais
  - Localização: `/python-scrapers`
  - Gerenciador: pip
  - Arquivo de dependências: `requirements.txt`

---

## 🧪 FRAMEWORKS DE TESTE

### Node.js
O projeto utiliza o test runner nativo do Node.js com os seguintes scripts configurados:

```json
{
  "test": "node --test",
  "test:unit": "node tests/run-export-tests.js unit",
  "test:integration": "node tests/run-export-tests.js integration",
  "test:export": "node tests/run-export-tests.js",
  "test:all": "node tests/run-export-tests.js all",
  "test:watch": "node --test --watch tests/unit/"
}
```

### Python
Os scrapers Python utilizam pytest com os seguintes plugins:
- **pytest**: Framework principal de testes
- **pytest-asyncio**: Suporte para testes assíncronos
- **pytest-cov**: Cobertura de código
- **pytest-mock**: Mocking em testes

---

## 📝 ÚLTIMOS COMMITS

```
fe62a75 - fix: Corrigir import de pool em admin-password-fix.js
07c035b - feat: EMERGENCY - Add password reset endpoint without CSRF
a0c3501 - deploy: FORCE URGENT - Password fix deployment [2026-04-07 20:20:54]
```

**Contexto dos últimos commits**: Correções emergenciais relacionadas a sistema de autenticação e reset de senha.

---

## ⚠️ REGRAS CRÍTICAS DE DEPLOY

### ANTES DE QUALQUER COMMIT:

1. **SEMPRE execute os testes**:
   ```bash
   npm test
   npm run test:all
   ```

2. **Verifique a integridade do banco de dados**:
   ```bash
   npm run db:check
   ```

3. **Valide o sistema completo**:
   ```bash
   npm run validate:system
   ```

### ANTES DE QUALQUER PUSH/DEPLOY:

1. **Confirme que está na branch correta**
2. **Verifique se não há secrets/credenciais expostos**
3. **Execute o build de produção**:
   ```bash
   npm run build
   ```
4. **Teste localmente antes do deploy no Render**

### DEPLOY NO RENDER:

O projeto está configurado para deploy automático no Render. **NÃO faça push direto para main sem testes**.

- **Service ID no Render**: `srv-d4ueaf2li9vc73d3rj00`
- **Build Command**: `bash scripts/build-production.sh`
- **Start Command**: `node scripts/start-with-migrations.js`

---

## 🖥️ MONITORAMENTO E VALIDAÇÃO DA CLI

### Regra Obrigatória para Modificações na CLI

**SEMPRE** que modificar qualquer arquivo relacionado à interface de linha de comando (CLI), você **DEVE** executar comandos de teste para garantir que a CLI não está lançando exceções de inicialização.

### Arquivos da CLI que Requerem Validação

Quando modificar qualquer um destes arquivos:
- `src/cli.js` - CLI básico
- `src/cli-advanced.js` - CLI avançado (rom)
- `lib/cli/` - Módulos da CLI
- `src/modules/` - Módulos core usados pela CLI
- Qualquer arquivo importado pela CLI

### Comandos de Teste Obrigatórios

Execute **TODOS** estes comandos após modificar a CLI:

```bash
# 1. Validar sintaxe da CLI básica
node --check src/cli.js

# 2. Validar sintaxe da CLI avançada
node --check src/cli-advanced.js

# 3. Testar inicialização da CLI avançada (versão)
node src/cli-advanced.js --version

# 4. Testar comando help da CLI avançada
node src/cli-advanced.js --help

# 5. Testar comando rom via npm (CLI avançada)
npm run rom -- --version

# 6. Testar inicialização da CLI básica (modo interativo - deve iniciar sem erros)
timeout 3 node src/cli.js || true
```

### O Que Verificar

✅ **Sucesso esperado:**
- CLI inicia sem erros
- Versão é exibida corretamente
- Ajuda (--help) é exibida
- Nenhuma exceção não tratada
- Nenhum erro de import/export

❌ **Falha - NÃO commitar:**
- `Error: Cannot find module`
- `SyntaxError`
- `ReferenceError`
- `TypeError` durante inicialização
- Exceções não tratadas
- CLI trava ou não responde

### Exemplo de Validação Bem-Sucedida

```bash
$ node --check src/cli.js
✅ Sintaxe válida

$ node --check src/cli-advanced.js
✅ Sintaxe válida

$ node src/cli-advanced.js --version
ROM Agent CLI Avançado v2.8.0
Powered by Claude Agent SDK

$ node src/cli-advanced.js --help
ROM Agent - Assistente de IA para Redação Jurídica

Uso: rom [comando] [opções]
...
```

### Workflow Recomendado

1. **Modificar arquivo da CLI**
2. **Executar comandos de teste** (listados acima)
3. **Verificar que não há erros**
4. **Se houver erro**: corrigir antes de continuar
5. **Apenas após sucesso**: commitar as alterações

### Integração com CI/CD

Os testes da CLI devem ser incluídos no pipeline de CI/CD:

```bash
# No script de validação
npm run validate:system  # Já inclui validação de sintaxe
node src/cli.js --version
node src/cli-advanced.js --version
```

### Nota Importante

A CLI é o ponto de entrada principal para muitos usuários. Uma falha na inicialização da CLI pode tornar o sistema **completamente inutilizável** para usuários que dependem da linha de comando. Por isso, esta validação é **CRÍTICA** e **OBRIGATÓRIA**.

---

## 🔐 ARQUIVOS SENSÍVEIS

**NUNCA commite os seguintes arquivos**:
- `.env` (configurações de ambiente)
- `.env.render-corrected` (configurações do Render)
- `*.json` com credenciais (já em .gitignore)
- `.jusbrasil-cookies.json`
- Qualquer arquivo com tokens/senhas

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

### Node.js
- **@anthropic-ai/claude-agent-sdk**: SDK oficial do Claude Agent
- **@aws-sdk/client-bedrock**: Integração com AWS Bedrock
- **express**: Framework web
- **puppeteer**: Automação de navegador para scrapers
- **socket.io**: Comunicação em tempo real
- **pdf-parse, pdf-lib**: Processamento de PDFs

### Python
- **requests, beautifulsoup4**: Web scraping
- **aiohttp, asyncio**: Requisições assíncronas
- **cryptography, pyOpenSSL**: Certificados digitais para PJe

---

## 🏗️ ESTRUTURA DO PROJETO

```
ROM-Agent/
├── src/                    # Código-fonte Node.js principal
├── python-scrapers/        # Scrapers Python para tribunais
├── frontend/              # Frontend da aplicação
├── lib/                   # Bibliotecas compartilhadas
├── scripts/               # Scripts de automação e deploy
├── tests/                 # Testes automatizados
├── data/                  # Dados e prompts do sistema
├── config/                # Arquivos de configuração
├── logs/                  # Logs da aplicação
└── public/                # Arquivos públicos estáticos
```

---

## 🎯 SCRIPTS ÚTEIS

```bash
# Desenvolvimento
npm run dev              # Modo watch
npm run cli             # CLI básico
npm run rom             # CLI avançado

# Produção
npm run build           # Build de produção
npm start              # Inicia com migrações

# Banco de Dados
npm run db:diagnose    # Diagnóstico do BD
npm run db:migrate     # Executa migrações
npm run db:check       # Verifica integridade

# Usuários
npm run create-admin   # Cria usuário admin
npm run user:create    # Cria novo usuário
npm run user:list      # Lista usuários

# Monitoramento
npm run monitor        # Monitor contínuo
npm run monitor:once   # Monitor single-run
```

---

## 🚨 CHECKLIST PRÉ-DEPLOY

- [ ] Todos os testes passando (npm test && npm run test:all)
- [ ] Build de produção executado com sucesso (npm run build)
- [ ] Banco de dados verificado (npm run db:check)
- [ ] Sistema validado (npm run validate:system)
- [ ] Sem credenciais expostas no código
- [ ] .env atualizado no Render (se necessário)
- [ ] Commits com mensagens claras e descritivas
- [ ] README atualizado (se houve mudanças significativas)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `README.md`: Documentação principal do projeto
- `docs/`: Documentação técnica detalhada
- `LESSONS-LEARNED.md`: Lições aprendidas durante o desenvolvimento
- `PRE-DEPLOY-CHECKLIST.md`: Checklist detalhado pré-deploy

---

## 🤖 INSTRUÇÕES PARA CLAUDE

Quando trabalhar neste projeto:

1. **SEMPRE leia este arquivo antes de fazer modificações**
2. **NUNCA faça commits que quebrem o deploy no Render**
3. **SEMPRE execute testes antes de commitar**
4. **Mantenha a compatibilidade com Node.js 25.2.1**
5. **Respeite a estrutura ESM do projeto (import/export)**
6. **Consulte o histórico de commits para entender o contexto**
7. **Em caso de dúvida sobre integração com Render, consulte render.yaml**
8. **Priorize estabilidade sobre novas features em produção**

---

**Última atualização**: 2026-06-11
**Responsável pela manutenção**: rodolfo-svg
**Status**: Produção Ativa no Render (srv-d4ueaf2li9vc73d3rj00)
