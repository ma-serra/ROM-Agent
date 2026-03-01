#!/usr/bin/env node
/**
 * START SINGLE SERVER
 * Starts server-enhanced.js in single-server mode (no clustering)
 */

console.log('🚀 Iniciando servidor em modo single (sem clustering)...\n');

// Import and start server
import('../src/server-enhanced.js').then(async (module) => {
  try {
    const serverInfo = await module.startServer();
    console.log(`\n✅ Servidor iniciado com sucesso!`);
    console.log(`   Host: ${serverInfo.host}`);
    console.log(`   Port: ${serverInfo.port}`);
    console.log(`   URL: http://${serverInfo.host === '0.0.0.0' ? 'localhost' : serverInfo.host}:${serverInfo.port}\n`);
  } catch (error) {
    console.error('\n❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro ao importar módulo:', error);
  process.exit(1);
});
