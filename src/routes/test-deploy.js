/**
 * TESTE DEPLOY - Endpoint simples para verificar se código novo foi deployado
 * GET /api/test-deploy
 */

import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Deploy 3d34f90 ATIVO!',
    timestamp: new Date().toISOString(),
    commit: '3d34f90',
    test: 'Este endpoint foi adicionado no commit 3d34f90'
  });
});

export default router;
