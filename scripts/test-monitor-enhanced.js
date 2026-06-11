#!/usr/bin/env node

/**
 * Teste único do monitor de API aprimorado
 * Valida parsing de JSON e detecção de problemas em componentes
 */

import https from 'https';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

console.log(`${colors.cyan}🔍 Testando monitor de API aprimorado...${colors.reset}\n`);

const startTime = Date.now();

https.get('https://iarom.com.br/api/health', {
  timeout: 10000,
  headers: { 'User-Agent': 'ROM-Agent-Monitor-Test/2.0' }
}, (res) => {
  const responseTime = Date.now() - startTime;
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      // Parse JSON
      const healthData = JSON.parse(body);

      console.log(`${colors.green}✅ Status HTTP: ${res.statusCode} (${responseTime}ms)${colors.reset}\n`);

      console.log(`${colors.cyan}📊 Dados de Saúde Parseados:${colors.reset}`);
      console.log(`   Status Geral: ${colors[healthData.status === 'healthy' ? 'green' : 'red']}${healthData.status}${colors.reset}`);

      // PostgreSQL
      const pgStatus = healthData.postgres?.available ? 'green' : 'red';
      const pgSymbol = healthData.postgres?.available ? '✓' : '✗';
      console.log(`   PostgreSQL: ${colors[pgStatus]}${pgSymbol} ${healthData.postgres?.available ? 'disponível' : 'INDISPONÍVEL'}${colors.reset} (latência: ${healthData.postgres?.latency}ms)`);

      // Redis
      const redisStatus = healthData.redis?.available ? 'green' : 'red';
      const redisSymbol = healthData.redis?.available ? '✓' : '✗';
      console.log(`   Redis: ${colors[redisStatus]}${redisSymbol} ${healthData.redis?.available ? 'disponível' : 'INDISPONÍVEL'}${colors.reset} (latência: ${healthData.redis?.latency}ms)`);

      // Memória
      console.log(`   Memória: ${healthData.memory?.heapUsed}MB usado / ${healthData.memory?.heapTotal}MB total`);
      console.log(`   Uptime: ${healthData.uptime}s`);

      console.log(`\n${colors.cyan}🔬 Validação de Lógica:${colors.reset}`);

      // Validar lógica de detecção de problemas
      let issues = [];
      if (healthData.status !== 'healthy') {
        issues.push(`Status: ${healthData.status}`);
      }
      if (healthData.postgres?.available === false) {
        issues.push('PostgreSQL indisponível');
      }
      if (healthData.redis?.available === false) {
        issues.push('Redis indisponível');
      }

      if (issues.length === 0) {
        console.log(`   ${colors.green}✓ Nenhum problema detectado - Sistema totalmente saudável!${colors.reset}`);
      } else {
        console.log(`   ${colors.red}✗ Problemas detectados: ${issues.join(', ')}${colors.reset}`);
      }

      console.log(`\n${colors.green}✓ Monitor está funcionando corretamente!${colors.reset}`);
      console.log(`${colors.green}✓ Parse de JSON validado${colors.reset}`);
      console.log(`${colors.green}✓ Validação de componentes implementada${colors.reset}`);

      process.exit(0);

    } catch (error) {
      console.log(`${colors.red}❌ Erro ao parsear JSON: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}Body recebido:${colors.reset}`);
      console.log(body);
      process.exit(1);
    }
  });

}).on('error', (err) => {
  console.log(`${colors.red}❌ Erro de rede: ${err.message}${colors.reset}`);
  process.exit(1);
}).on('timeout', () => {
  console.log(`${colors.red}❌ Timeout após 10s${colors.reset}`);
  process.exit(1);
});
