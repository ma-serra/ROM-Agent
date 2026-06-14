-- ============================================================================
-- Migration: Sistema Multi-Agente Orchestrator
-- Data: 2026-06-14
-- Descrição: Schema para estado de agentes, workflows e métricas
-- ============================================================================

-- Tabela: agent_states
-- Armazena estado persistente de cada agente
CREATE TABLE IF NOT EXISTS agent_states (
  agent_id VARCHAR(255) PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_states_updated_at ON agent_states(updated_at);

-- Tabela: workflow_executions
-- Histórico completo de execuções de workflows
CREATE TABLE IF NOT EXISTS workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL UNIQUE,
  workflow_type VARCHAR(100),
  execution_data JSONB NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(50), -- 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- Tabela: agent_metrics
-- Métricas de performance por agente
CREATE TABLE IF NOT EXISTS agent_metrics (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX idx_agent_metrics_timestamp ON agent_metrics(timestamp DESC);
CREATE INDEX idx_agent_metrics_name ON agent_metrics(metric_name);

-- Tabela: orchestrator_events
-- Log de eventos do sistema de orquestração
CREATE TABLE IF NOT EXISTS orchestrator_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  topic VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orchestrator_events_topic ON orchestrator_events(topic);
CREATE INDEX idx_orchestrator_events_created_at ON orchestrator_events(created_at DESC);
CREATE INDEX idx_orchestrator_events_event_id ON orchestrator_events(event_id);

-- Tabela: agent_conversations
-- Histórico de conversações por agente (backup persistente)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255) NOT NULL,
  message_role VARCHAR(50) NOT NULL, -- 'user' ou 'assistant'
  message_content TEXT NOT NULL,
  tokens_used INTEGER,
  model VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_conversations_agent_id ON agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_conversation_id ON agent_conversations(conversation_id);
CREATE INDEX idx_agent_conversations_timestamp ON agent_conversations(timestamp DESC);

-- Tabela: mcp_server_status
-- Status e health check dos MCP servers
CREATE TABLE IF NOT EXISTS mcp_server_status (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'running', 'stopped', 'error'
  last_health_check TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_server_status_name ON mcp_server_status(server_name);
CREATE INDEX idx_mcp_server_status_status ON mcp_server_status(status);

-- Tabela: rom_audit_logs
-- Logs de auditoria do pipeline ROM
CREATE TABLE IF NOT EXISTS rom_audit_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL, -- 'leitura', 'extracao', 'diagnostico', 'redacao', 'auditoria'
  agent_id VARCHAR(255) NOT NULL,
  audit_result JSONB NOT NULL,
  passed BOOLEAN,
  issues JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rom_audit_logs_workflow_id ON rom_audit_logs(workflow_id);
CREATE INDEX idx_rom_audit_logs_stage ON rom_audit_logs(stage);
CREATE INDEX idx_rom_audit_logs_passed ON rom_audit_logs(passed);
CREATE INDEX idx_rom_audit_logs_timestamp ON rom_audit_logs(timestamp DESC);

-- View: workflow_summary
-- Sumário de workflows para dashboard
CREATE OR REPLACE VIEW workflow_summary AS
SELECT
  workflow_type,
  status,
  COUNT(*) as total_executions,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
  MAX(started_at) as last_execution
FROM workflow_executions
WHERE started_at IS NOT NULL
GROUP BY workflow_type, status;

-- View: agent_performance
-- Performance agregada por agente
CREATE OR REPLACE VIEW agent_performance AS
SELECT
  agent_id,
  COUNT(*) as total_executions,
  AVG(metric_value) as avg_metric,
  MAX(timestamp) as last_activity
FROM agent_metrics
WHERE metric_name = 'execution_time'
GROUP BY agent_id;

-- Comentários
COMMENT ON TABLE agent_states IS 'Estado persistente de cada agente do sistema';
COMMENT ON TABLE workflow_executions IS 'Histórico completo de execuções de workflows';
COMMENT ON TABLE agent_metrics IS 'Métricas de performance e telemetria dos agentes';
COMMENT ON TABLE orchestrator_events IS 'Log de eventos do sistema de orquestração';
COMMENT ON TABLE agent_conversations IS 'Histórico de conversações por agente (backup persistente)';
COMMENT ON TABLE mcp_server_status IS 'Status e health check dos MCP servers';
COMMENT ON TABLE rom_audit_logs IS 'Logs de auditoria do pipeline ROM';

-- Conceder permissões (ajustar conforme necessário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rom_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rom_app_user;

-- Concluído
SELECT 'Migration 20260614_orchestrator_schema aplicada com sucesso!' as status;
