#!/usr/bin/env node

/**
 * Teste único do monitor de API
 */

import https from 'https';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔍 Testando monitor de API...${colors.reset}\n`);

const startTime = Date.now();

https.get('https://iarom.com.br', {
  timeout: 10000,
  headers: { 'User-Agent': 'ROM-Agent-Monitor-Test/1.0' }
}, (res) => {
  const responseTime = Date.now() - startTime;

  res.resume();

  if (res.statusCode === 200) {
    console.log(`${colors.green}✅ API online - Status ${res.statusCode} - ${responseTime}ms${colors.reset}`);
    console.log(`${colors.cyan}📊 Headers importantes:${colors.reset}`);
    console.log(`   Server: ${res.headers['server'] || 'N/A'}`);
    console.log(`   X-Render-Origin-Server: ${res.headers['x-render-origin-server'] || 'N/A'}`);
    console.log(`   Content-Type: ${res.headers['content-type'] || 'N/A'}`);
    console.log(`\n${colors.green}✓ Monitor está funcionando corretamente!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Status inesperado: ${res.statusCode}${colors.reset}`);
  }

  process.exit(0);
}).on('error', (err) => {
  console.log(`${colors.red}❌ Erro: ${err.message}${colors.reset}`);
  process.exit(1);
}).on('timeout', () => {
  console.log(`${colors.red}❌ Timeout após 10s${colors.reset}`);
  process.exit(1);
});
