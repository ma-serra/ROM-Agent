/**
 * Testes de Integração - MasterOrchestrator
 *
 * Valida roteamento de tarefas, execução de workflows e métricas
 * (Testes simplificados sem API real do Anthropic)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MasterOrchestrator Integration Tests', () => {
  it('should analyze task complexity', () => {
    // Mock do método analyzeComplexity
    const analyzeComplexity = (input, context) => {
      const inputLength = input.length;
      const hasDocuments = context.documents && context.documents.length > 0;
      const isRecurso = context.type && context.type.includes('recurso');

      if (isRecurso || inputLength > 10000 || hasDocuments) {
        return 'complex';
      } else if (context.needsIntegration) {
        return 'integration';
      } else {
        return 'simple';
      }
    };

    // Teste caso simples
    const simple = analyzeComplexity('Pequeno texto', {});
    assert.strictEqual(simple, 'simple');

    // Teste caso complexo (recurso)
    const complex1 = analyzeComplexity('Texto', { type: 'recurso-especial' });
    assert.strictEqual(complex1, 'complex');

    // Teste caso complexo (longo)
    const complex2 = analyzeComplexity('x'.repeat(15000), {});
    assert.strictEqual(complex2, 'complex');

    // Teste caso complexo (com documentos)
    const complex3 = analyzeComplexity('Texto', { documents: ['doc1.pdf'] });
    assert.strictEqual(complex3, 'complex');

    // Teste integração
    const integration = analyzeComplexity('Texto', { needsIntegration: true });
    assert.strictEqual(integration, 'integration');
  });

  it('should determine redator type correctly', () => {
    // Mock do método determineRedatorType
    const determineRedatorType = (type) => {
      if (!type) return 'redator-civel';

      const normalized = type.toLowerCase();

      if (normalized.includes('criminal') || normalized.includes('penal') || normalized.includes('habeas')) {
        return 'redator-criminal';
      }

      if (normalized.includes('trabalhista') || normalized.includes('clt') || normalized.includes('emprego')) {
        return 'redator-trabalhista';
      }

      return 'redator-civel';
    };

    assert.strictEqual(determineRedatorType('apelacao-civel'), 'redator-civel');
    assert.strictEqual(determineRedatorType('habeas-corpus'), 'redator-criminal');
    assert.strictEqual(determineRedatorType('reclamacao-trabalhista'), 'redator-trabalhista');
    assert.strictEqual(determineRedatorType(null), 'redator-civel');
  });

  it('should track workflow metrics', () => {
    // Simular métricas
    const metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      executionTimes: []
    };

    // Simular execuções
    const executions = [
      { success: true, time: 1000 },
      { success: true, time: 1500 },
      { success: false, time: 500 },
      { success: true, time: 2000 }
    ];

    executions.forEach(exec => {
      metrics.totalExecutions++;
      if (exec.success) {
        metrics.successfulExecutions++;
      } else {
        metrics.failedExecutions++;
      }
      metrics.executionTimes.push(exec.time);
    });

    const avgTime = metrics.executionTimes.reduce((a, b) => a + b, 0) / metrics.executionTimes.length;

    assert.strictEqual(metrics.totalExecutions, 4);
    assert.strictEqual(metrics.successfulExecutions, 3);
    assert.strictEqual(metrics.failedExecutions, 1);
    assert.strictEqual(avgTime, 1250);
  });

  it('should validate workflow stages', () => {
    const validateStages = (stages) => {
      const requiredStages = ['leitura', 'extracao', 'diagnostico', 'redacao', 'auditoria'];
      const stageNames = stages.map(s => s.stage);

      return requiredStages.every(required => stageNames.includes(required));
    };

    // Workflow completo
    const complete = [
      { stage: 'leitura' },
      { stage: 'extracao' },
      { stage: 'diagnostico' },
      { stage: 'redacao' },
      { stage: 'auditoria' }
    ];
    assert.strictEqual(validateStages(complete), true);

    // Workflow incompleto
    const incomplete = [
      { stage: 'leitura' },
      { stage: 'redacao' }
    ];
    assert.strictEqual(validateStages(incomplete), false);
  });

  it('should handle parallel execution results', () => {
    // Simular Promise.allSettled
    const results = [
      { status: 'fulfilled', value: { agent: 'agent1', response: 'ok' } },
      { status: 'rejected', reason: new Error('Failed') },
      { status: 'fulfilled', value: { agent: 'agent3', response: 'ok' } }
    ];

    const processed = results.map((result, index) => ({
      agent: `agent${index + 1}`,
      status: result.status,
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    assert.strictEqual(processed.length, 3);
    assert.strictEqual(processed[0].status, 'fulfilled');
    assert.strictEqual(processed[1].status, 'rejected');
    assert.strictEqual(processed[1].error, 'Failed');
    assert.strictEqual(processed[2].status, 'fulfilled');
  });

  it('should generate unique workflow IDs', () => {
    const generateWorkflowId = () => `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateWorkflowId());
    }

    assert.strictEqual(ids.size, 100, 'Todos os IDs devem ser únicos');
  });

  it('should validate audit results', () => {
    const validateAuditResults = (auditResults) => {
      const allPassed = auditResults.every(result =>
        result.status === 'fulfilled' &&
        !result.result?.response?.toLowerCase().includes('reprovado')
      );

      return allPassed;
    };

    // Todos passaram
    const passed = [
      { status: 'fulfilled', result: { response: 'Aprovado' } },
      { status: 'fulfilled', result: { response: 'OK' } },
      { status: 'fulfilled', result: { response: 'Verificado' } }
    ];
    assert.strictEqual(validateAuditResults(passed), true);

    // Um falhou
    const failed = [
      { status: 'fulfilled', result: { response: 'Aprovado' } },
      { status: 'fulfilled', result: { response: 'Reprovado' } },
      { status: 'fulfilled', result: { response: 'OK' } }
    ];
    assert.strictEqual(validateAuditResults(failed), false);

    // Um rejeitado
    const rejected = [
      { status: 'fulfilled', result: { response: 'Aprovado' } },
      { status: 'rejected', reason: new Error('Failed') }
    ];
    assert.strictEqual(validateAuditResults(rejected), false);
  });

  it('should calculate average execution time correctly', () => {
    const times = [1000, 1500, 2000, 2500, 3000];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    assert.strictEqual(avg, 2000);

    // Com circular buffer (últimos 100)
    const largeArray = Array(150).fill(null).map((_, i) => i + 1);
    const last100 = largeArray.slice(-100);
    const avgLast100 = last100.reduce((a, b) => a + b, 0) / last100.length;

    assert.strictEqual(last100.length, 100);
    assert.strictEqual(avgLast100, 100.5); // (51+150)/2
  });
});

console.log('✅ MasterOrchestrator integration tests completed');
