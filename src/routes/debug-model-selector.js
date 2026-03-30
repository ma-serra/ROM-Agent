/**
 * DEBUG ENDPOINT - Model Selector Testing
 *
 * GET /api/debug/model-selector?message=teste
 *
 * Retorna qual modelo seria selecionado sem executar query
 */

import express from 'express';
import { selectOptimalModel } from '../utils/model-selector.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { message = 'teste padrão', maxTokens, kbContext, systemPrompt } = req.query;

    const context = {
      maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
      kbContext: kbContext || '',
      systemPrompt: systemPrompt || ''
    };

    const selection = selectOptimalModel(message, context);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      input: {
        message,
        context
      },
      selection: {
        modelName: selection.modelName,
        modelId: selection.modelId,
        reasoning: selection.reasoning,
        cost: selection.cost,
        explicit: selection.explicit,
        autoSelected: selection.autoSelected
      },
      // Tests com keywords específicas
      tests: {
        'extraia apenas': testMessage('extraia apenas o numero'),
        'liste': testMessage('liste os numeros'),
        'busca': testMessage('busca processo judicial'),
        'redija': testMessage('redija petição')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

function testMessage(message) {
  const selection = selectOptimalModel(message, {});
  return {
    modelName: selection.modelName,
    reasoning: selection.reasoning,
    cost: selection.cost
  };
}

export default router;
