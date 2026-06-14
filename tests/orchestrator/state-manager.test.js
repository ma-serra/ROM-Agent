/**
 * Testes de Integração - StateManager
 *
 * Valida persistência de estado, cache, workflows e métricas
 * (Usa mock de DB - sem PostgreSQL real)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StateManager } from '../../src/services/state-manager.js';

// Mock simples de DB
class MockDB {
  constructor() {
    this.store = new Map();
  }

  async query(sql, params = []) {
    // Simular queries básicas
    if (sql.includes('INSERT INTO agent_states')) {
      const [agentId, state] = params;
      this.store.set(`agent:${agentId}`, { state, updated_at: new Date() });
      return { rows: [] };
    }

    if (sql.includes('SELECT state FROM agent_states')) {
      const [agentId] = params;
      const record = this.store.get(`agent:${agentId}`);
      return { rows: record ? [{ state: record.state }] : [] };
    }

    if (sql.includes('DELETE FROM agent_states')) {
      const [agentId] = params;
      this.store.delete(`agent:${agentId}`);
      return { rows: [] };
    }

    if (sql.includes('INSERT INTO workflow_executions')) {
      const [workflowId] = params;
      this.store.set(`workflow:${workflowId}`, params);
      return { rows: [] };
    }

    if (sql.includes('SELECT * FROM workflow_executions')) {
      const [workflowId] = params;
      const data = this.store.get(`workflow:${workflowId}`);
      if (!data) return { rows: [] };

      return {
        rows: [{
          workflow_id: data[0],
          workflow_type: data[1],
          execution_data: data[2],
          started_at: data[3],
          completed_at: data[4],
          status: data[5],
          error_message: data[6],
          created_at: new Date()
        }]
      };
    }

    if (sql.includes('INSERT INTO agent_metrics')) {
      const key = `metric:${params[0]}:${Date.now()}`;
      this.store.set(key, params);
      return { rows: [] };
    }

    return { rows: [] };
  }
}

describe('StateManager Integration Tests', () => {
  let stateManager;
  let mockDB;

  beforeEach(() => {
    mockDB = new MockDB();
    stateManager = new StateManager(mockDB, null); // Sem Redis
  });

  it('should save and retrieve agent state', async () => {
    const agentId = 'test-agent-1';
    const state = {
      conversationHistory: ['msg1', 'msg2'],
      lastExecution: Date.now(),
      context: { key: 'value' }
    };

    // Salvar
    await stateManager.saveAgentState(agentId, state);

    // Recuperar
    const retrieved = await stateManager.getAgentState(agentId);

    assert.ok(retrieved, 'Estado deve existir');
    assert.deepStrictEqual(retrieved, state);
  });

  it('should return null for non-existent agent', async () => {
    const result = await stateManager.getAgentState('non-existent-agent');

    assert.strictEqual(result, null);
  });

  it('should delete agent state', async () => {
    const agentId = 'delete-test';
    await stateManager.saveAgentState(agentId, { data: 'test' });

    // Verificar que existe
    let state = await stateManager.getAgentState(agentId);
    assert.ok(state);

    // Deletar
    await stateManager.deleteAgentState(agentId);

    // Verificar que não existe mais
    state = await stateManager.getAgentState(agentId);
    assert.strictEqual(state, null);
  });

  it('should save workflow execution', async () => {
    const workflowId = 'workflow-test-1';
    const execution = {
      type: 'recurso-especial',
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'completed',
      stages: [
        { stage: 'leitura', result: { success: true } },
        { stage: 'extracao', result: { success: true } }
      ]
    };

    await stateManager.saveWorkflowExecution(workflowId, execution);

    const retrieved = await stateManager.getWorkflowExecution(workflowId);

    assert.ok(retrieved, 'Workflow deve existir');
    assert.strictEqual(retrieved.type, 'recurso-especial');
    assert.strictEqual(retrieved.status, 'completed');
  });

  it('should save agent metrics', async () => {
    const agentId = 'metric-agent';
    const metricName = 'execution_time';
    const metricValue = 1234.56;
    const metadata = { model: 'sonnet', tokens: 5000 };

    await stateManager.saveAgentMetric(agentId, metricName, metricValue, metadata);

    // Métrica foi salva (verificação indireta via mock)
    assert.ok(mockDB.store.size > 0);
  });

  it('should track cache metrics', () => {
    // Simular reads
    stateManager.metrics.reads = 100;
    stateManager.metrics.cacheHits = 80;
    stateManager.metrics.cacheMisses = 20;

    const metrics = stateManager.getMetrics();

    assert.strictEqual(metrics.cacheHitRate, '80.00%');
    assert.strictEqual(metrics.cacheEnabled, false); // Sem Redis
  });

  it('should update state with new values', async () => {
    const agentId = 'update-test';

    // Salvar estado inicial
    await stateManager.saveAgentState(agentId, { version: 1, data: 'old' });

    // Atualizar estado
    await stateManager.saveAgentState(agentId, { version: 2, data: 'new' });

    // Recuperar
    const state = await stateManager.getAgentState(agentId);

    assert.strictEqual(state.version, 2);
    assert.strictEqual(state.data, 'new');
  });

  it('should handle concurrent saves', async () => {
    const agentId = 'concurrent-test';

    // Salvar múltiplas vezes em paralelo
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(stateManager.saveAgentState(agentId, { index: i }));
    }

    await Promise.all(promises);

    // Última escrita deve prevalecer (sem garantia de ordem)
    const state = await stateManager.getAgentState(agentId);
    assert.ok(state.index >= 0 && state.index < 10);
  });

  it('should serialize complex objects', async () => {
    const agentId = 'complex-test';
    const complexState = {
      nested: {
        deep: {
          value: 123
        }
      },
      array: [1, 2, 3],
      date: new Date().toISOString(),
      nullValue: null,
      boolValue: true
    };

    await stateManager.saveAgentState(agentId, complexState);
    const retrieved = await stateManager.getAgentState(agentId);

    assert.deepStrictEqual(retrieved, complexState);
  });
});

console.log('✅ StateManager integration tests completed');
