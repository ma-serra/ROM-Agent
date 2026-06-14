import { EventEmitter } from 'events';
import { SubagentManager } from '../modules/subagents.js';
import { EventBus } from './event-bus.js';
import { StateManager } from './state-manager.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * MasterOrchestrator - Orquestrador Mestre Hierárquico
 *
 * Coordena múltiplos orquestradores especializados e implementa
 * a arquitetura híbrida (hierárquica + eventos + pipelines).
 *
 * Funcionalidades:
 * - Roteamento inteligente de tarefas
 * - Pipeline ROM híbrido (5 etapas)
 * - Execução paralela de agentes
 * - Integração com projeto-rom-completo
 * - Gerenciamento de estado persistente
 * - Sistema de eventos assíncrono
 * - Métricas e monitoramento
 */
class MasterOrchestrator extends EventEmitter {
  constructor(apiKey, db, redis) {
    super();

    // Orquestradores especializados
    this.subagentManager = new SubagentManager(apiKey);

    // Infraestrutura
    this.eventBus = new EventBus(redis);
    this.stateManager = new StateManager(db, redis);

    // Estado
    this.activeWorkflows = new Map();
    this.apiKey = apiKey;

    // Métricas
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      executionTimes: []
    };

    // Configuração
    this.config = {
      maxConcurrentWorkflows: 10,
      workflowTimeout: 600000, // 10 minutos
      enableMetrics: true,
      enableStateStorage: true
    };
  }

  /**
   * Roteamento inteligente de tarefas
   *
   * Analisa a tarefa e seleciona a melhor estratégia de execução.
   *
   * @param {object} task - Tarefa a executar
   * @returns {Promise<object>} Resultado da execução
   */
  async routeTask(task) {
    const { type, input, context = {} } = task;

    // Análise de complexidade
    const complexity = this.analyzeComplexity(input, context);

    console.log(`🎯 Roteando tarefa: tipo=${type}, complexidade=${complexity}`);

    // Seleção de estratégia
    switch (complexity) {
      case 'simple':
        return this.executeSimpleSubagent(task);

      case 'complex':
        return this.executeHybridWorkflow(task);

      case 'integration':
        console.warn('Integração com serviços externos não implementada nesta versão');
        return this.executeSimpleSubagent(task);

      default:
        return this.executeHybridWorkflow(task);
    }
  }

  /**
   * Execução simples com único subagente
   *
   * @param {object} task - Tarefa
   * @returns {Promise<object>} Resultado
   */
  async executeSimpleSubagent(task) {
    const { type, input, context = {} } = task;

    // Determinar subagente apropriado
    const subagentId = this.selectSubagentForTask(type, context);

    console.log(`⚙️  Executando subagente: ${subagentId}`);

    const result = await this.subagentManager.invocarSubagente(
      subagentId,
      input,
      context
    );

    return result;
  }

  /**
   * Workflow híbrido - Pipeline ROM completo
   *
   * Implementa o pipeline de 5 etapas do projeto-rom-completo:
   * 1. Leitura Integral (leitor-autos)
   * 2. Extração (extrator-acordao)
   * 3. Diagnóstico (auditor-admissibilidade + analista-jurimetrico)
   * 4. Redação (redator apropriado)
   * 5. Auditoria (3 agentes em paralelo)
   *
   * @param {object} task - Tarefa
   * @returns {Promise<object>} Resultado do pipeline
   */
  async executeHybridWorkflow(task) {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n🚀 Iniciando Workflow ROM Híbrido: ${workflowId}`);
    console.log(`   Tipo: ${task.type || 'não especificado'}`);
    console.log(`   Input: ${task.input.substring(0, 100)}...`);

    // Publicar evento de início
    await this.eventBus.publish('workflow.started', {
      workflowId,
      task: { ...task, input: task.input.substring(0, 200) } // Truncar para eventos
    });

    const execution = {
      id: workflowId,
      type: task.type || 'hybrid-rom',
      task,
      stages: [],
      startedAt: new Date(),
      status: 'running'
    };

    this.activeWorkflows.set(workflowId, execution);

    const startTime = Date.now();

    try {
      // ========================================================================
      // ETAPA 1: Leitura Integral
      // ========================================================================
      console.log(`\n📖 [1/5] Leitura Integral dos autos...`);

      const leituraResult = await this.executeROMAgent(
        'leitor-autos',
        task.input,
        { ...task.context, workflow: workflowId, stage: 'leitura' }
      );

      execution.stages.push({
        stage: 'leitura',
        agent: 'leitor-autos',
        result: leituraResult,
        completedAt: new Date()
      });

      await this.eventBus.publish('workflow.stage.completed', {
        workflowId,
        stage: 'leitura',
        success: true
      });

      console.log(`   ✅ Leitura completada (${leituraResult.tokens?.total_tokens || 0} tokens)`);

      // ========================================================================
      // ETAPA 2: Extração
      // ========================================================================
      console.log(`\n🔍 [2/5] Extração de dados estruturados...`);

      const extracaoResult = await this.executeROMAgent(
        'extrator-acordao',
        leituraResult.response,
        { ...task.context, workflow: workflowId, stage: 'extracao' }
      );

      execution.stages.push({
        stage: 'extracao',
        agent: 'extrator-acordao',
        result: extracaoResult,
        completedAt: new Date()
      });

      await this.eventBus.publish('workflow.stage.completed', {
        workflowId,
        stage: 'extracao',
        success: true
      });

      console.log(`   ✅ Extração completada`);

      // ========================================================================
      // ETAPA 3: Diagnóstico (PARALELO)
      // ========================================================================
      console.log(`\n⚖️  [3/5] Diagnóstico jurídico (admissibilidade + jurimetria)...`);

      const diagnosticoResult = await this.executeParallel([
        {
          agent: 'auditor-admissibilidade',
          input: extracaoResult.response,
          description: 'Análise de admissibilidade'
        },
        {
          agent: 'analista-jurimetrico',
          input: extracaoResult.response,
          description: 'Análise jurimétrica'
        }
      ], { workflow: workflowId });

      execution.stages.push({
        stage: 'diagnostico',
        agents: ['auditor-admissibilidade', 'analista-jurimetrico'],
        result: diagnosticoResult,
        completedAt: new Date()
      });

      await this.eventBus.publish('workflow.stage.completed', {
        workflowId,
        stage: 'diagnostico',
        success: diagnosticoResult.every(r => r.status === 'fulfilled')
      });

      const diagnosticoSuccess = diagnosticoResult.filter(r => r.status === 'fulfilled').length;
      console.log(`   ✅ Diagnóstico completado (${diagnosticoSuccess}/2 agentes)`);

      // ========================================================================
      // ETAPA 4: Redação
      // ========================================================================
      console.log(`\n✍️  [4/5] Redação da peça jurídica...`);

      const tipoRedator = this.determineRedatorType(task.type);
      const contextoDiagnostico = JSON.stringify({
        extracao: extracaoResult.response.substring(0, 1000),
        diagnostico: diagnosticoResult
          .filter(d => d.status === 'fulfilled')
          .map(d => d.result?.response?.substring(0, 500))
      });

      const redacaoResult = await this.subagentManager.invocarSubagente(
        tipoRedator,
        contextoDiagnostico,
        { ...task.context, workflow: workflowId, enableThinking: true }
      );

      execution.stages.push({
        stage: 'redacao',
        agent: tipoRedator,
        result: redacaoResult,
        completedAt: new Date()
      });

      await this.eventBus.publish('workflow.stage.completed', {
        workflowId,
        stage: 'redacao',
        success: true
      });

      console.log(`   ✅ Redação completada com ${tipoRedator}`);

      // ========================================================================
      // ETAPA 5: Auditoria (PARALELO)
      // ========================================================================
      console.log(`\n🔒 [5/5] Auditoria pré-protocolo (3 validadores)...`);

      const auditoriaResult = await this.executeParallel([
        {
          agent: 'auditor-admissibilidade',
          input: redacaoResult.response,
          description: 'Auditoria de admissibilidade'
        },
        {
          agent: 'verificador-citacoes',
          input: redacaoResult.response,
          description: 'Verificação de citações'
        },
        {
          agent: 'revisor-fidedignidade',
          input: redacaoResult.response,
          description: 'Revisão de fidedignidade'
        }
      ], { workflow: workflowId });

      execution.stages.push({
        stage: 'auditoria',
        agents: ['auditor-admissibilidade', 'verificador-citacoes', 'revisor-fidedignidade'],
        result: auditoriaResult,
        completedAt: new Date()
      });

      await this.eventBus.publish('workflow.stage.completed', {
        workflowId,
        stage: 'auditoria',
        success: auditoriaResult.every(r => r.status === 'fulfilled')
      });

      const auditoriaSuccess = auditoriaResult.filter(r => r.status === 'fulfilled').length;
      console.log(`   ✅ Auditoria completada (${auditoriaSuccess}/3 validadores)`);

      // ========================================================================
      // Finalização
      // ========================================================================
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      execution.completedAt = new Date();
      execution.status = 'completed';
      execution.durationSeconds = duration;

      // Salvar no StateManager
      if (this.config.enableStateStorage) {
        await this.stateManager.saveWorkflowExecution(workflowId, execution);

        // Salvar logs de auditoria
        for (const audit of auditoriaResult) {
          if (audit.status === 'fulfilled') {
            await this.stateManager.saveROMAutitLog(
              workflowId,
              'auditoria',
              audit.agent,
              {
                passed: !audit.result?.response?.includes('REPROVADO'),
                result: audit.result?.response
              }
            );
          }
        }
      }

      // Publicar evento de conclusão
      await this.eventBus.publish('workflow.completed', {
        workflowId,
        duration,
        stages: execution.stages.length
      });

      // Atualizar métricas
      this.updateMetrics(true, duration);

      console.log(`\n✅ Workflow ${workflowId} completado em ${duration.toFixed(2)}s`);

      return {
        workflowId,
        stages: execution.stages,
        finalResult: redacaoResult,
        auditoria: auditoriaResult,
        duration,
        status: 'completed'
      };

    } catch (error) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      execution.durationSeconds = duration;

      // Salvar estado de falha
      if (this.config.enableStateStorage) {
        await this.stateManager.saveWorkflowExecution(workflowId, execution);
      }

      // Publicar evento de falha
      await this.eventBus.publish('workflow.failed', {
        workflowId,
        error: error.message,
        stage: execution.stages[execution.stages.length - 1]?.stage
      });

      // Atualizar métricas
      this.updateMetrics(false, duration);

      console.error(`\n❌ Workflow ${workflowId} falhou: ${error.message}`);

      throw error;

    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Executar múltiplos agentes em paralelo
   *
   * @param {Array} agents - Lista de agentes [{agent, input, description}]
   * @param {object} context - Contexto compartilhado
   * @returns {Promise<Array>} Resultados (status: fulfilled/rejected)
   */
  async executeParallel(agents, context = {}) {
    console.log(`   🔀 Executando ${agents.length} agentes em paralelo...`);

    const promises = agents.map(({ agent, input, description }) => {
      console.log(`      - ${description || agent}...`);
      return this.executeROMAgent(agent, input, context);
    });

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => ({
      agent: agents[index].agent,
      status: result.status,
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  /**
   * Executar agente do projeto-rom-completo
   *
   * Carrega definição do agente e invoca com modelo apropriado.
   *
   * @param {string} agentId - ID do agente
   * @param {string} input - Input para o agente
   * @param {object} context - Contexto
   * @returns {Promise<object>} Resultado
   */
  async executeROMAgent(agentId, input, context = {}) {
    // Mapeamento de modelos por agente (conforme projeto-rom-completo)
    const modelMap = {
      'auditor-admissibilidade': 'opus',
      'analista-jurimetrico': 'sonnet',
      'revisor-fidedignidade': 'sonnet',
      'extrator-acordao': 'haiku',
      'leitor-autos': 'opus',
      'verificador-citacoes': 'haiku'
    };

    const model = modelMap[agentId] || 'sonnet';

    // Mapeamento para agentes existentes no SubagentManager
    const subagentMapping = {
      'leitor-autos': 'extrator',
      'auditor-admissibilidade': 'analise-processual',
      'extrator-acordao': 'extrator'
    };

    const mappedId = subagentMapping[agentId] || agentId;

    // Verificar se existe no SubagentManager
    const subagent = this.subagentManager.obterSubagente(mappedId);

    if (subagent) {
      // Usar agente existente
      return this.subagentManager.invocarSubagente(mappedId, input, {
        ...context,
        forceModel: model
      });
    }

    // Agente do projeto-rom-completo: carregar e invocar
    return this.createAndInvokeNewAgent(agentId, input, model, context);
  }

  /**
   * Criar e invocar novo agente do projeto-rom-completo
   *
   * @param {string} agentId - ID do agente
   * @param {string} input - Input
   * @param {string} model - Modelo (haiku/sonnet/opus)
   * @param {object} context - Contexto
   * @returns {Promise<object>} Resultado
   */
  async createAndInvokeNewAgent(agentId, input, model, context = {}) {
    // Carregar definição do agente
    const agentDef = await this.loadROMAgentDefinition(agentId);

    // Construir mensagens
    const messages = [{ role: 'user', content: input }];

    // Invocar Claude API diretamente
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: this.apiKey });

    const modelName = `claude-${model === 'opus' ? 'opus-4-20250514' : model === 'sonnet' ? 'sonnet-4-20250514' : 'haiku-3-5-20250219'}`;

    const response = await client.messages.create({
      model: modelName,
      max_tokens: 150000,
      system: agentDef.systemPrompt,
      messages
    });

    return {
      subagent: agentId,
      type: agentDef.type || 'rom-completo',
      response: response.content.filter(b => b.type === 'text').map(b => b.text).join('\n'),
      tokens: response.usage,
      model: modelName
    };
  }

  /**
   * Carregar definição de agente do projeto-rom-completo
   *
   * @param {string} agentId - ID do agente
   * @returns {Promise<object>} Definição do agente
   */
  async loadROMAgentDefinition(agentId) {
    const agentPath = path.join(
      process.cwd(),
      'projeto-rom-completo/rom-agent/agents',
      `${agentId}.md`
    );

    try {
      const content = await fs.readFile(agentPath, 'utf-8');

      // Parse frontmatter YAML simples
      const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);

      if (!match) {
        throw new Error(`Formato inválido para agente: ${agentId}`);
      }

      const frontmatter = match[1];
      const systemPrompt = match[2];

      // Parse metadata
      const metadata = {};
      frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          metadata[key] = value;
        }
      });

      return {
        name: metadata.name || agentId,
        description: metadata.description || '',
        tools: metadata.tools ? metadata.tools.split(',').map(t => t.trim()) : [],
        model: metadata.model || 'sonnet',
        systemPrompt: systemPrompt.trim(),
        type: 'rom-completo'
      };

    } catch (error) {
      console.warn(`Não foi possível carregar agente ${agentId}: ${error.message}`);

      // Retornar definição básica
      return {
        name: agentId,
        description: `Agente ${agentId} do projeto ROM`,
        tools: [],
        model: 'sonnet',
        systemPrompt: `Você é o agente ${agentId} do projeto ROM. Aguardando configuração completa.`,
        type: 'rom-completo'
      };
    }
  }

  /**
   * Análise de complexidade da tarefa
   *
   * @param {string} input - Input da tarefa
   * @param {object} context - Contexto
   * @returns {string} Nível de complexidade (simple/complex/integration)
   */
  analyzeComplexity(input, context) {
    const inputLength = input.length;
    const hasDocuments = context.documents && context.documents.length > 0;
    const isRecurso = context.type && (
      context.type.includes('recurso') ||
      context.type.includes('agravo') ||
      context.type.includes('apelacao')
    );

    if (isRecurso || inputLength > 10000 || hasDocuments) {
      return 'complex';
    } else if (context.needsIntegration) {
      return 'integration';
    } else {
      return 'simple';
    }
  }

  /**
   * Selecionar subagente apropriado para tarefa simples
   *
   * @param {string} type - Tipo da tarefa
   * @param {object} context - Contexto
   * @returns {string} ID do subagente
   */
  selectSubagentForTask(type, context) {
    if (type && type.includes('analise')) {
      return 'analise-processual';
    } else if (type && type.includes('resumo')) {
      return 'resumo-executivo';
    } else if (type && type.includes('jurisprudencia')) {
      return 'jurisprudencia';
    } else if (type && type.includes('contrato')) {
      return 'contratos';
    } else if (type && type.includes('revisar')) {
      return 'revisor-portugues';
    } else {
      return 'analise-processual'; // Default
    }
  }

  /**
   * Determinar tipo de redator baseado no tipo da tarefa
   *
   * @param {string} type - Tipo da tarefa
   * @returns {string} ID do redator
   */
  determineRedatorType(type) {
    if (!type) return 'redator-civel';

    const typeLower = type.toLowerCase();

    if (typeLower.includes('criminal') || typeLower.includes('penal')) {
      return 'redator-criminal';
    } else if (typeLower.includes('trabalh')) {
      return 'redator-trabalhista';
    } else {
      return 'redator-civel';
    }
  }

  /**
   * Atualizar métricas
   *
   * @param {boolean} success - Se execução foi bem-sucedida
   * @param {number} duration - Duração em segundos
   */
  updateMetrics(success, duration) {
    this.metrics.totalExecutions++;

    if (success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }

    this.metrics.executionTimes.push(duration);

    // Manter apenas últimas 100 execuções
    if (this.metrics.executionTimes.length > 100) {
      this.metrics.executionTimes.shift();
    }

    // Calcular média
    this.metrics.averageExecutionTime =
      this.metrics.executionTimes.reduce((a, b) => a + b, 0) /
      this.metrics.executionTimes.length;
  }

  /**
   * Obter métricas do orquestrador
   *
   * @returns {Promise<object>} Métricas
   */
  async getMetrics() {
    const eventBusMetrics = this.eventBus.getMetrics();
    const stateManagerMetrics = this.stateManager.getMetrics();

    return {
      orchestrator: {
        ...this.metrics,
        activeWorkflows: this.activeWorkflows.size,
        successRate: this.metrics.totalExecutions > 0
          ? ((this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100).toFixed(2) + '%'
          : '0%'
      },
      eventBus: eventBusMetrics,
      stateManager: stateManagerMetrics
    };
  }

  /**
   * Listar workflows ativos
   *
   * @returns {Array} Workflows ativos
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.entries()).map(([id, execution]) => ({
      id,
      type: execution.type,
      status: execution.status,
      startedAt: execution.startedAt,
      currentStage: execution.stages[execution.stages.length - 1]?.stage || 'iniciando',
      stagesCompleted: execution.stages.length
    }));
  }

  /**
   * Fechar conexões e cleanup
   */
  async close() {
    await this.eventBus.close();
    await this.stateManager.close();
    this.removeAllListeners();
  }
}

export { MasterOrchestrator };
