import React, { useState } from 'react'
import { Brain, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PipelineProgressModal } from './PipelineProgressModal'

interface RunPipelineButtonProps {
  documentId: string
  documentName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RunPipelineButton({
  documentId,
  documentName,
  variant = 'default',
  size = 'md',
  className = ''
}: RunPipelineButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [workflowId, setWorkflowId] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleRunPipeline = async () => {
    setIsRunning(true)
    setError('')

    try {
      const response = await fetch('/api/orchestrator/run-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          documentId,
          type: 'analise-completa',
          options: {
            model: 'sonnet',
            enableThinking: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setWorkflowId(data.workflowId)
        setShowModal(true)
      } else {
        throw new Error(data.error || 'Erro ao iniciar pipeline')
      }

    } catch (err) {
      console.error('[RunPipelineButton] Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao iniciar análise')
      alert(`❌ Erro ao iniciar análise avançada:\n\n${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setWorkflowId('')
    // Opcional: refresh da lista de documentos
  }

  return (
    <>
      <Button
        onClick={handleRunPipeline}
        disabled={isRunning}
        variant={variant}
        size={size}
        className={`${className} ${
          variant === 'default'
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30'
            : ''
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            Executar Análise Avançada ROM
          </>
        )}
      </Button>

      {showModal && workflowId && (
        <PipelineProgressModal
          workflowId={workflowId}
          documentId={documentName || documentId}
          onClose={handleCloseModal}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </>
  )
}
