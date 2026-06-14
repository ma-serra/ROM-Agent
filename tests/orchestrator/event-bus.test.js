/**
 * Testes de Integração - EventBus
 *
 * Valida pub/sub, métricas e persistência de eventos
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { EventBus } from '../../src/services/event-bus.js';

describe('EventBus Integration Tests', () => {
  let eventBus;

  beforeEach(() => {
    // Criar instância sem Redis (modo local)
    eventBus = new EventBus(null);
  });

  afterEach(async () => {
    await eventBus.close();
  });

  it('should publish and receive events', async () => {
    let receivedEvent = null;

    // Subscrever ao tópico
    eventBus.subscribe('test.event', (event) => {
      receivedEvent = event;
    });

    // Publicar evento
    await eventBus.publish('test.event', { message: 'Hello World' }, { source: 'test' });

    // Aguardar processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 100));

    // Validar
    assert.ok(receivedEvent, 'Evento deve ter sido recebido');
    assert.strictEqual(receivedEvent.topic, 'test.event');
    assert.strictEqual(receivedEvent.payload.message, 'Hello World');
    assert.strictEqual(receivedEvent.metadata.source, 'test');
    assert.ok(receivedEvent.metadata.eventId, 'EventId deve existir');
  });

  it('should handle multiple subscribers', async () => {
    const received = [];

    // Três subscribers
    eventBus.subscribe('multi.test', (e) => received.push(1));
    eventBus.subscribe('multi.test', (e) => received.push(2));
    eventBus.subscribe('multi.test', (e) => received.push(3));

    await eventBus.publish('multi.test', { data: 'test' });

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(received.length, 3);
    assert.deepStrictEqual(received, [1, 2, 3]);
  });

  it('should maintain event log', async () => {
    // Publicar múltiplos eventos
    for (let i = 0; i < 5; i++) {
      await eventBus.publish('log.test', { index: i });
    }

    const recentEvents = eventBus.getRecentEvents('log.test', 10);

    assert.strictEqual(recentEvents.length, 5);
    assert.strictEqual(recentEvents[0].payload.index, 0);
    assert.strictEqual(recentEvents[4].payload.index, 4);
  });

  it('should track metrics', async () => {
    await eventBus.publish('metrics.test', { data: 'test' });

    const metrics = eventBus.getMetrics();

    assert.ok(metrics.totalEvents >= 1);
    assert.ok(metrics.eventsByTopic.has('metrics.test'));
    assert.ok(metrics.lastEventTime);
  });

  it('should filter events by topic', async () => {
    await eventBus.publish('topic.a', { value: 'A' });
    await eventBus.publish('topic.b', { value: 'B' });
    await eventBus.publish('topic.a', { value: 'A2' });

    const topicAEvents = eventBus.getRecentEvents('topic.a', 10);

    assert.strictEqual(topicAEvents.length, 2);
    assert.ok(topicAEvents.every(e => e.topic === 'topic.a'));
  });

  it('should unsubscribe correctly', async () => {
    let count = 0;
    const handler = () => count++;

    eventBus.subscribe('unsub.test', handler);
    await eventBus.publish('unsub.test', {});
    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(count, 1);

    eventBus.unsubscribe('unsub.test', handler);
    await eventBus.publish('unsub.test', {});
    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(count, 1, 'Não deve receber após unsubscribe');
  });

  it('should respect maxLogSize', async () => {
    // Publicar mais eventos do que o max (1000)
    for (let i = 0; i < 1100; i++) {
      await eventBus.publish('overflow.test', { index: i });
    }

    const allEvents = eventBus.getRecentEvents(null, 2000);

    assert.strictEqual(allEvents.length, 1000, 'Deve respeitar maxLogSize de 1000');
  });

  it('should generate unique event IDs', async () => {
    const ids = new Set();

    for (let i = 0; i < 100; i++) {
      await eventBus.publish('id.test', {});
    }

    const events = eventBus.getRecentEvents('id.test', 100);
    events.forEach(e => ids.add(e.metadata.eventId));

    assert.strictEqual(ids.size, 100, 'Todos os IDs devem ser únicos');
  });
});

console.log('✅ EventBus integration tests completed');
