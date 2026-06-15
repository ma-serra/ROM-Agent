import React, { useEffect, useState } from 'react'
import { X, CheckCircle2, Loader2, AlertCircle, Brain, FileText, Scale, PenTool, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PipelineStage {
  id: string
  name: string
  icon: React.ElementType
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message?: string
  duration?: number
}

interface PipelineProgressModalProps {
  workflowId: string
  documentId: string
  onClose: () => void
}

export function PipelineProgressModal({ workflowId, documentId, onClose }: PipelineProgressModalProps) {
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'leitura', name: 'Leitura Integral', icon: Brain, status: 'pending' },
    { id: 'extracao', name: 'Extração de Dados', icon: FileText, status: 'pending' },
    { id: 'diagnostico', name: 'Diagnóstico Jurídico', icon: Scale, status: 'pending' },
    { id: 'redacao', name: 'Redação', icon: PenTool, status: 'pending' },
    { id: 'auditoria', name: 'Auditoria (3 Eixos)', icon: Shield, status: 'pending' }
  ])
  const [overallStatus, setOverallStatus] = useState<'running' | 'completed' | 'failed'>('running')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer para atualizar tempo decorrido
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Conectar ao SSE do EventBus
  useEffect(() => {
    const eventSource = new EventSource(`/api/orchestrator/events/stream?workflowId=${workflowId}`)

    eventSource.addEventListener('workflow.stage.completed', (e) => {
      const data = JSON.parse(e.data)
      updateStageStatus(data.payload.stage, 'completed')
    })

    eventSource.addEventListener('workflow.stage.started', (e) => {
      const data = JSON.parse(e.data)
      updateStageStatus(data.payload.stage, 'in_progress')
    })

    eventSource.addEventListener('workflow.completed', (e) => {
      setOverallStatus('completed')
      updateAllPendingToCompleted()
    })

    eventSource.addEventListener('workflow.failed', (e) => {
      const data = JSON.parse(e.data)
      setOverallStatus('failed')
      setErrorMessage(data.payload.error || 'Erro desconhecido no pipeline')
    })

    eventSource.onerror = () => {
      console.error('SSE connection error')
    }

    return () => {
      eventSource.close()
    }
  }, [workflowId])

  const updateStageStatus = (stageId: string, status: PipelineStage['status']) => {
    setStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, status } : stage
    ))
  }

  const updateAllPendingToCompleted = () => {
    setStages(prev => prev.map(stage =>
      stage.status === 'pending' || stage.status === 'in_progress'
        ? { ...stage, status: 'completed' }
        : stage
    ))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const completed = stages.filter(s => s.status === 'completed').length
    return Math.round((completed / stages.length) * 100)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Pipeline ROM - Análise Avançada</h2>
              <p className="text-purple-100 text-sm mt-1">
                Processando: {documentId}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              disabled={overallStatus === 'running'}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{getProgressPercentage()}% concluído</span>
              <span className="text-purple-200">Tempo: {formatTime(elapsedTime)}</span>
            </div>
            <div className="w-full bg-purple-900/30 rounded-full h-2.5">
              <div
                className="bg-white h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="p-6 space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            const isActive = stage.status === 'in_progress'
            const isCompleted = stage.status === 'completed'
            const isFailed = stage.status === 'failed'
            const isPending = stage.status === 'pending'

            return (
              <div
                key={stage.id}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-300
                  ${isActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg' : ''}
                  ${isCompleted ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''}
                  ${isFailed ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}
                  ${isPending ? 'border-stone-200 bg-stone-50 dark:bg-stone-800/50' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${isActive ? 'bg-purple-600 text-white' : ''}
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${isFailed ? 'bg-red-600 text-white' : ''}
                    ${isPending ? 'bg-stone-300 text-stone-600' : ''}
                  `}>
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${
                        isActive ? 'text-purple-600' :
                        isCompleted ? 'text-green-600' :
                        isFailed ? 'text-red-600' :
                        'text-stone-400'
                      }`} />
                      <h3 className="font-semibold text-lg text-stone-800 dark:text-white">
                        {stage.name}
                      </h3>
                    </div>

                    {stage.message && (
                      <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
                        {stage.message}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isActive && (
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    )}
                    {isFailed && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-stone-100 dark:bg-stone-800 p-6 rounded-b-xl border-t border-stone-200 dark:border-stone-700">
          {overallStatus === 'running' && (
            <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Processando pipeline em background...</span>
            </div>
          )}

          {overallStatus === 'completed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Pipeline concluído com sucesso!</span>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Ver Resultado na Knowledge Base
              </Button>
            </div>
          )}

          {overallStatus === 'failed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Erro no pipeline</span>
              </div>
              {errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {errorMessage}
                </p>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
