# ROM Agent - Monitor de Saúde da API

Monitor contínuo para verificar a saúde da API https://iarom.com.br/api/health

## Funcionalidades

- ✅ Verificação HTTP a cada 60 segundos no endpoint `/api/health`
- ✅ **Parse e validação de JSON** com detecção de problemas em componentes individuais
- ✅ **Monitoramento de PostgreSQL e Redis** - alertas específicos por componente
- ✅ Logging colorido no terminal com timestamps e latências
- ✅ Salvamento automático de erros em arquivo de log com detalhes dos componentes
- ✅ Notificações macOS em caso de erro ou recuperação
- ✅ Estatísticas de uptime e taxa de sucesso
- ✅ Detecção de erros consecutivos com alertas críticos
- ✅ Graceful shutdown com relatório final

## Validação Inteligente de Componentes

O monitor não verifica apenas o status HTTP, mas também **valida componentes internos** através do JSON retornado por `/api/health`:

### Componentes Monitorados

1. **Status Geral** (`status`)
   - Deve ser `"healthy"`
   - Alerta disparado se for `"degraded"` ou outro valor

2. **PostgreSQL** (`postgres.available`)
   - Deve ser `true`
   - Alerta disparado se for `false` (banco indisponível)
   - Inclui latência no log de sucesso

3. **Redis** (`redis.available`)
   - Deve ser `true`
   - Alerta disparado se for `false` (cache indisponível)
   - Inclui latência no log de sucesso

### Exemplo de Resposta Monitorada

```json
{
  "status": "healthy",
  "postgres": {
    "available": true,
    "latency": 1
  },
  "redis": {
    "available": true,
    "latency": 2
  },
  "memory": {...},
  "uptime": 437
}
```

### Alertas por Componente

Se **qualquer componente** falhar, o monitor:
1. ❌ Dispara notificação macOS identificando o componente
2. 📝 Salva erro detalhado em `logs/monitor-errors.log`
3. 🖥️ Loga erro no terminal com identificação do componente

**Exemplo de alerta:**
```
❌ Componentes com falha: PostgreSQL: indisponível [PostgreSQL: offline]
```

## Instalação

Já está instalado! O script está em `scripts/monitor-api.js`

## Uso

### Iniciar o Monitor

```bash
# Via npm script (recomendado)
npm run monitor:api

# Diretamente
node scripts/monitor-api.js
```

### Parar o Monitor

Pressione `Ctrl+C` para parar o monitor. Um relatório final será exibido.

## Configuração

Configure via variáveis de ambiente ou edite o script diretamente:

```bash
# URL para monitorar (padrão: https://iarom.com.br)
MONITOR_URL=https://iarom.com.br

# Intervalo entre verificações em ms (padrão: 60000 = 60s)
MONITOR_INTERVAL=60000

# Timeout de requisição em ms (padrão: 10000 = 10s)
MONITOR_TIMEOUT=10000
```

### Exemplo com configuração customizada:

```bash
MONITOR_URL=https://iarom.com.br/api/health MONITOR_INTERVAL=30000 npm run monitor:api
```

## Saída do Monitor

### Sucesso (API OK com componentes saudáveis)

```
[2026-06-11T23:20:34.811Z] ✓ API OK - Status 200 - 933ms (PG: 1ms, Redis: 2ms) - Uptime: 0h 5m 30s
```

### Erro HTTP (API com problemas)

```
[2026-06-11T23:05:45.456Z] ❌ Status 502 - Status 502 - Bad Gateway - 5000ms
```

### Erro de Componente (Status HTTP OK mas componente com falha)

```
[2026-06-11T23:10:15.789Z] ❌ Status 200 - Componentes com falha: PostgreSQL: indisponível [PostgreSQL: offline] - 250ms
```

### Estatísticas (a cada 10 verificações)

```
══════════════════════════════════════════════════════════════════════
  ESTATÍSTICAS DO MONITOR
══════════════════════════════════════════════════════════════════════
  Total de verificações: 50
  Sucessos: 48 | Erros: 2
  Taxa de sucesso: 96.0%
  Erros consecutivos: 0
  Tempo de execução: 0h 50m 15s
  Último sucesso: 11/06/2026, 23:10:15
══════════════════════════════════════════════════════════════════════
```

## Arquivo de Log

Os erros são salvos automaticamente em `logs/monitor-errors.log` com **detalhes dos componentes**:

```json
{"timestamp":"2026-06-11T23:05:45.456Z","url":"https://iarom.com.br/api/health","statusCode":502,"error":"Status 502 - Bad Gateway","responseTime":5000,"consecutiveErrors":1,"healthDetails":null}
{"timestamp":"2026-06-11T23:06:45.789Z","url":"https://iarom.com.br/api/health","statusCode":200,"error":"Componentes com falha: PostgreSQL: indisponível","responseTime":250,"consecutiveErrors":1,"healthDetails":{"status":"degraded","postgres":{"available":false,"latency":null},"redis":{"available":true,"latency":2}}}
```

**Nota:** O campo `healthDetails` contém o JSON completo do endpoint `/api/health` quando disponível, permitindo análise detalhada pós-incidente.

## Notificações macOS

O monitor envia notificações automaticamente em caso de:

### 1. Erro Detectado
**Título:** ROM Agent - Erro 502! 🚨
**Mensagem:** Status 502 - Bad Gateway
**Som:** Sosumi

### 2. API Recuperada
**Título:** ROM Agent - API Recuperada! ✅
**Mensagem:** API voltou ao normal após X erros
**Som:** Sosumi

### 3. Alerta Crítico (5 erros consecutivos)
**Título:** ROM Agent - ALERTA CRÍTICO! 🔥
**Mensagem:** API com 5 falhas consecutivas!
**Som:** Sosumi

## Códigos de Status

### Status Saudáveis (OK)
- 200 - OK
- 301 - Moved Permanently
- 302 - Found
- 304 - Not Modified

### Status de Alerta (Disparam notificação)
- 500 - Internal Server Error
- 502 - Bad Gateway
- 503 - Service Unavailable
- 504 - Gateway Timeout

### Erros de Rede
- Connection refused
- Timeout
- DNS resolution failed

## Teste Rápido

Para testar se o monitor está funcionando:

```bash
# Teste único
node scripts/test-monitor.js
```

Saída esperada:
```
🔍 Testando monitor de API...

✅ API online - Status 200 - 245ms
📊 Headers importantes:
   Server: cloudflare
   X-Render-Origin-Server: Render
   Content-Type: text/html; charset=UTF-8

✓ Monitor está funcionando corretamente!
```

## Dicas de Uso

### Rodar em Background (macOS/Linux)

```bash
# Iniciar em background
nohup npm run monitor:api > /dev/null 2>&1 &

# Verificar se está rodando
ps aux | grep monitor-api

# Parar o processo
pkill -f monitor-api
```

### Rodar com PM2 (Recomendado para produção)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar monitor com PM2
pm2 start npm --name "rom-api-monitor" -- run monitor:api

# Ver logs
pm2 logs rom-api-monitor

# Parar
pm2 stop rom-api-monitor

# Remover
pm2 delete rom-api-monitor
```

### Integração com Cron (Verificação Periódica)

```bash
# Editar crontab
crontab -e

# Adicionar linha para rodar a cada 5 minutos
*/5 * * * * cd /path/to/ROM-Agent && node scripts/test-monitor.js >> logs/cron-monitor.log 2>&1
```

## Troubleshooting

### Notificações macOS não aparecem

1. Verifique se as notificações estão habilitadas:
   - Abra **Preferências do Sistema** > **Notificações**
   - Procure por **Script Editor** ou **osascript**
   - Habilite notificações

2. Teste manualmente:
```bash
osascript -e 'display notification "Teste" with title "ROM Agent"'
```

### Monitor não está salvando logs

Verifique se o diretório `logs/` existe:

```bash
mkdir -p logs
chmod 755 logs
```

### API sempre retorna erro

1. Verifique se o site está online:
```bash
curl -I https://iarom.com.br
```

2. Verifique se há firewall bloqueando:
```bash
ping iarom.com.br
```

3. Aumente o timeout no script se a API for lenta:
```bash
MONITOR_TIMEOUT=30000 npm run monitor:api
```

## Estrutura do Script

```javascript
scripts/
├── monitor-api.js          # Monitor principal
├── test-monitor.js         # Teste único
└── logs/
    └── monitor-errors.log  # Log de erros
```

## Roadmap / Melhorias Futuras

- [ ] Integração com Slack/Discord para alertas
- [ ] Dashboard web para visualizar estatísticas
- [ ] Suporte para múltiplos endpoints
- [ ] Métricas de latência e disponibilidade
- [ ] Integração com Grafana/Prometheus
- [ ] Alertas por email
- [ ] Relatórios diários automáticos

## Autor

ROM Agent Team

## Licença

MIT

---

**Última atualização:** 2026-06-11
**Versão:** 1.0.0
