/**
 * Orchestrator Setup
 *
 * Inicialização do MasterOrchestrator, StateManager e EventBus
 * para uso no servidor Express
 */

import { MasterOrchestrator } from '../services/master-orchestrator.js';
import { StateManager } from '../services/state-manager.js';
import { EventBus } from '../services/event-bus.js';
import { MCPIntegrationService } from '../services/mcp-integration.js';
import dotenv from 'dotenv';

dotenv.config();

let orchestratorInstance = null;
let stateManagerInstance = null;
let eventBusInstance = null;
let mcpServiceInstance = null;

/**
 * Inicializa o sistema de orquestração
 *
 * @param {object} options - Opções de configuração
 * @param {object} options.db - Conexão PostgreSQL (pool)
 * @param {object} options.redisConfig - Configuração Redis (opcional)
 * @param {string} options.apiKey - API Key do Anthropic
 * @returns {object} Instâncias inicializadas
 */
export async function initializeOrchestrator(options = {}) {
  const {
    db = null,
    redisConfig = null,
    apiKey = process.env.ANTHROPIC_API_KEY
  } = options;

  try {
    console.log('🎭 Inicializando MasterOrchestrator...');

    // Configuração Redis (opcional)
    const redisConf = redisConfig || (process.env.REDIS_URL ? {
      enabled: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0
    } : null);

    // Inicializar EventBus
    eventBusInstance = new EventBus(redisConf);

    // Inicializar StateManager
    stateManagerInstance = new StateManager(db, redisConf);

    // Inicializar MasterOrchestrator
    orchestratorInstance = new MasterOrchestrator(apiKey, db, redisConf);

    // Inicializar MCP Integration Service
    mcpServiceInstance = new MCPIntegrationService(eventBusInstance, stateManagerInstance);

    // Iniciar servidores MCP em background (não bloquear)
    mcpServiceInstance.initializeAll()
      .then(results => {
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ MCP Servers inicializados: ${successCount}/${results.length}`);
      })
      .catch(error => {
        console.warn('⚠️ Erro ao inicializar MCP Servers:', error.message);
      });

    console.log('✅ MasterOrchestrator inicializado com sucesso');

    return {
      masterOrchestrator: orchestratorInstance,
      stateManager: stateManagerInstance,
      eventBus: eventBusInstance,
      mcpService: mcpServiceInstance
    };
  } catch (error) {
    console.error('❌ Erro ao inicializar MasterOrchestrator:', error.message);

    // Retornar null se falhar (não bloquear servidor)
    return {
      masterOrchestrator: null,
      stateManager: null,
      eventBus: null,
      error: error.message
    };
  }
}

/**
 * Obtém instâncias existentes (singleton)
 */
export function getOrchestratorInstances() {
  return {
    masterOrchestrator: orchestratorInstance,
    stateManager: stateManagerInstance,
    eventBus: eventBusInstance,
    mcpService: mcpServiceInstance
  };
}

/**
 * Fecha conexões do orquestrador
 */
export async function closeOrchestrator() {
  try {
    if (mcpServiceInstance) {
      await mcpServiceInstance.closeAll();
    }
    if (eventBusInstance) {
      await eventBusInstance.close();
    }
    if (stateManagerInstance) {
      await stateManagerInstance.close();
    }

    console.log('✅ Orquestrador encerrado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao encerrar orquestrador:', error);
  }
}

export default {
  initializeOrchestrator,
  getOrchestratorInstances,
  closeOrchestrator
};
