import { EventEmitter } from 'events';
import Redis from 'ioredis';

/**
 * EventBus - Sistema global de pub/sub para comunicação entre agentes
 *
 * Implementa padrão EventEmitter com suporte opcional a Redis para
 * distribuição de eventos entre instâncias.
 *
 * Tópicos de Eventos:
 * - agent.started: Agente iniciou execução
 * - agent.progress: Progresso de agente
 * - agent.completed: Agente concluiu
 * - agent.failed: Agente falhou
 * - workflow.started: Workflow iniciado
 * - workflow.stage.completed: Etapa de workflow concluída
 * - workflow.completed: Workflow completo
 * - workflow.failed: Workflow falhou
 * - validation.failed: Validação falhou
 * - citation.verified: Citação verificada
 * - cost.updated: Custo atualizado
 */
class EventBus extends EventEmitter {
  constructor(redisConfig = null) {
    super();

    // Configuração Redis opcional
    this.redis = null;
    this.redisSubscriber = null;

    if (redisConfig && redisConfig.enabled) {
      this.initializeRedis(redisConfig);
    }

    // Estado interno
    this.subscribers = new Map(); // Map<topic, handlers[]>
    this.eventLog = []; // Histórico de eventos (últimos 1000)
    this.maxLogSize = 1000;

    // Métricas
    this.metrics = {
      totalEvents: 0,
      eventsByTopic: new Map(),
      lastEventTime: null
    };
  }

  /**
   * Inicializa conexão Redis para eventos distribuídos
   */
  initializeRedis(config) {
    try {
      // Cliente para publicação
      this.redis = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Cliente separado para subscrição
      this.redisSubscriber = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0
      });

      // Inscrever em todos os canais de eventos
      this.redisSubscriber.psubscribe('event:*', (err) => {
        if (err) {
          console.error('Erro ao subscrever eventos Redis:', err);
        } else {
          console.log('✅ EventBus conectado ao Redis');
        }
      });

      // Handler para eventos recebidos do Redis
      this.redisSubscriber.on('pmessage', (pattern, channel, message) => {
        try {
          const topic = channel.replace('event:', '');
          const event = JSON.parse(message);

          // Emitir localmente (sem republicar no Redis)
          super.emit(topic, event);
        } catch (error) {
          console.error('Erro ao processar evento Redis:', error);
        }
      });

      this.redis.on('error', (err) => {
        console.error('Erro na conexão Redis:', err);
      });

    } catch (error) {
      console.warn('Não foi possível conectar ao Redis. Eventos serão apenas locais:', error.message);
      this.redis = null;
      this.redisSubscriber = null;
    }
  }

  /**
   * Publicar evento para múltiplos agentes
   *
   * @param {string} topic - Tópico do evento (ex: 'agent.started')
   * @param {object} payload - Dados do evento
   * @param {object} metadata - Metadados opcionais
   */
  async publish(topic, payload, metadata = {}) {
    const event = {
      topic,
      payload,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        eventId: this.generateEventId()
      }
    };

    // Adicionar ao log (circular buffer)
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Atualizar métricas
    this.metrics.totalEvents++;
    this.metrics.lastEventTime = event.metadata.timestamp;

    const topicCount = this.metrics.eventsByTopic.get(topic) || 0;
    this.metrics.eventsByTopic.set(topic, topicCount + 1);

    // Publicar no Redis se configurado
    if (this.redis) {
      try {
        await this.redis.publish(
          `event:${topic}`,
          JSON.stringify(event)
        );
      } catch (error) {
        console.error(`Erro ao publicar evento ${topic} no Redis:`, error);
      }
    }

    // Emitir localmente (assíncrono)
    setImmediate(() => {
      this.emit(topic, event);
    });
  }

  /**
   * Subscrever a tópico
   *
   * @param {string} topic - Tópico para subscrever
   * @param {function} handler - Função callback
   */
  subscribe(topic, handler) {
    this.on(topic, handler);

    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }

    this.subscribers.get(topic).push(handler);
  }

  /**
   * Cancelar subscrição
   *
   * @param {string} topic - Tópico
   * @param {function} handler - Handler para remover
   */
  unsubscribe(topic, handler) {
    this.off(topic, handler);

    const handlers = this.subscribers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Listar eventos recentes
   *
   * @param {string|null} topic - Filtrar por tópico (null = todos)
   * @param {number} limit - Limite de eventos
   * @returns {Array} Eventos recentes
   */
  getRecentEvents(topic = null, limit = 100) {
    let events = this.eventLog;

    if (topic) {
      events = events.filter(e => e.topic === topic);
    }

    return events.slice(-limit);
  }

  /**
   * Obter métricas do EventBus
   *
   * @returns {object} Métricas
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalTopics: this.subscribers.size,
      activeSubscribers: Array.from(this.subscribers.entries()).reduce(
        (acc, [topic, handlers]) => acc + handlers.length,
        0
      ),
      redisConnected: this.redis && this.redis.status === 'ready'
    };
  }

  /**
   * Limpar log de eventos
   */
  clearEventLog() {
    this.eventLog = [];
  }

  /**
   * Gerar ID único para evento
   *
   * @returns {string} ID do evento
   */
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fechar conexões
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }

    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }

    this.removeAllListeners();
  }
}

// Singleton instance
let eventBusInstance = null;

/**
 * Get or create EventBus singleton instance
 * @param {Object} redisConfig - Optional Redis configuration
 * @returns {EventBus}
 */
export function getEventBus(redisConfig = null) {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(redisConfig);
  }
  return eventBusInstance;
}

export { EventBus };
