/**
 * Teste de Integração JusBrasil em Produção
 * Verifica se o terceiro corredor está funcionando
 */

import https from 'https';

const PROD_URL = 'https://iarom.com.br';
const TEST_QUERY = 'dano moral';

console.log('🧪 TESTE: Integração JusBrasil - Terceiro Corredor');
console.log('================================================\n');

async function testJurisprudenceAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: `procure jurisprudencia sobre ${TEST_QUERY}`,
      sessionId: 'test-jusbrasil-' + Date.now(),
      userId: 'test-user'
    });

    const options = {
      hostname: 'iarom.com.br',
      port: 443,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000
    };

    console.log('📡 Enviando requisição para:', PROD_URL + '/api/chat');
    console.log('📝 Query:', TEST_QUERY);
    console.log('⏱️  Timeout: 60s\n');

    const startTime = Date.now();
    let responseData = '';

    const req = https.request(options, (res) => {
      console.log('✅ Status:', res.statusCode);
      console.log('📦 Headers:', JSON.stringify(res.headers, null, 2));
      console.log('\n📨 Recebendo resposta...\n');

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        responseData += chunk;

        // Parse SSE events
        const lines = chunk.split('\n');
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              // Log eventos importantes
              if (data.type === 'system') {
                console.log('🔧 [SYSTEM]:', data.content);
              } else if (data.type === 'tool_start') {
                console.log('🔨 [TOOL START]:', data.tool_name);
              } else if (data.type === 'tool_result') {
                console.log('✅ [TOOL RESULT]:', data.tool_name);

                // Verificar se usou JusBrasil
                if (data.result && typeof data.result === 'string') {
                  if (data.result.includes('jusbrasil')) {
                    console.log('   🎯 JusBrasil detectado no resultado!');
                  }
                  if (data.result.includes('JUSBRASIL')) {
                    console.log('   🎯 JUSBRASIL (maiúscula) detectado!');
                  }
                  if (data.result.includes('terceiro corredor')) {
                    console.log('   🎯 Terceiro corredor mencionado!');
                  }
                }
              } else if (data.type === 'text') {
                // Buscar por menções ao JusBrasil na resposta
                if (data.content.toLowerCase().includes('jusbrasil')) {
                  console.log('📝 [TEXTO] Menção ao JusBrasil:', data.content.substring(0, 100) + '...');
                }
              }
            } catch (e) {
              // Não é JSON válido, ignorar
            }
          }
        });
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log('\n⏱️  Tempo total:', duration + 'ms');
        console.log('\n📊 ANÁLISE DA RESPOSTA:');
        console.log('======================\n');

        // Análise da resposta completa
        const hasJusbrasil = responseData.toLowerCase().includes('jusbrasil');
        const hasJusbra = responseData.toLowerCase().includes('jusbra');
        const hasTerceirocorredor = responseData.toLowerCase().includes('terceiro corredor');
        const hasDatajud = responseData.toLowerCase().includes('datajud');
        const hasGoogle = responseData.toLowerCase().includes('google');

        console.log('✅ Menções encontradas:');
        console.log('   - JusBrasil:', hasJusbrasil ? '✅ SIM' : '❌ NÃO');
        console.log('   - Jusbra:', hasJusbra ? '✅ SIM' : '❌ NÃO');
        console.log('   - Terceiro corredor:', hasTerceirocorredor ? '✅ SIM' : '❌ NÃO');
        console.log('   - DataJud:', hasDatajud ? '✅ SIM' : '❌ NÃO');
        console.log('   - Google:', hasGoogle ? '✅ SIM' : '❌ NÃO');

        // Contar fontes mencionadas
        const fontes = [];
        if (hasDatajud) fontes.push('DataJud');
        if (hasGoogle) fontes.push('Google');
        if (hasJusbrasil || hasJusbra) fontes.push('JusBrasil');

        console.log('\n📈 Fontes utilizadas:', fontes.length);
        console.log('   ', fontes.join(', ') || 'Nenhuma identificada');

        console.log('\n💾 Salvando resposta completa em: /tmp/test-jusbrasil-response.txt');
        require('fs').writeFileSync('/tmp/test-jusbrasil-response.txt', responseData);

        console.log('\n🎯 CONCLUSÃO:');
        if (hasJusbrasil || hasJusbra) {
          console.log('✅ JUSBRASIL ESTÁ ATIVO E FUNCIONANDO!');
        } else {
          console.log('⚠️  JusBrasil NÃO detectado na resposta');
          console.log('   Possíveis motivos:');
          console.log('   1. JUSBRASIL_ENABLED=false no Render');
          console.log('   2. JusBrasil foi bloqueado (anti-bot)');
          console.log('   3. Deploy ainda não concluiu');
        }

        resolve({
          duration,
          hasJusbrasil: hasJusbrasil || hasJusbra,
          hasTerceirocorredor,
          hasDatajud,
          hasGoogle,
          fontes
        });
      });
    });

    req.on('error', (e) => {
      console.error('❌ ERRO:', e.message);
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ TIMEOUT: Requisição excedeu 60s');
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Executar teste
testJurisprudenceAPI()
  .then((result) => {
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  });
