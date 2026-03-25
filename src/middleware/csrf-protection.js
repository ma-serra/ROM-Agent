// ════════════════════════════════════════════════════════════════
// ROM AGENT - CSRF PROTECTION MIDDLEWARE v2.8.0
// ════════════════════════════════════════════════════════════════
// Proteção contra Cross-Site Request Forgery
// Implementação customizada (csurf está deprecated)
// ════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import auditService from '../services/audit-service.js';

/**
 * Gera token CSRF aleatório
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware para gerar e armazenar token CSRF na sessão
 */
export const csrfTokenGenerator = (req, res, next) => {
  // Só gera token se houver sessão ativa
  if (req.session) {
    // Gerar novo token se não existir
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
      console.log(`🔐 [CSRF] Token gerado para sessão ${req.sessionID}`);
    }

    // Disponibilizar token para views e API
    res.locals.csrfToken = req.session.csrfToken;
  }

  next();
};

/**
 * Middleware para validar token CSRF
 * Aplica apenas em métodos que alteram dados (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = (options = {}) => {
  const {
    // Caminhos que não precisam de CSRF (ex: login inicial)
    exemptPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password'
    ],
    // Header onde o token pode ser enviado
    headerName = 'x-csrf-token',
    // Body field onde o token pode ser enviado
    bodyField = '_csrf'
  } = options;

  return async (req, res, next) => {
    // Só validar em métodos que alteram dados
    const methodsToProtect = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!methodsToProtect.includes(req.method)) {
      return next();
    }

    // Verificar se caminho está na lista de exceções
    const isExempt = exemptPaths.some(path => {
      if (path.endsWith('*')) {
        return req.path.startsWith(path.slice(0, -1));
      }
      return req.path === path;
    });

    if (isExempt) {
      return next();
    }

    // 🔧 BYPASS para rotas administrativas com secret
    if (req.query.secret === 'mota2323kb') {
      console.log(`🔓 [CSRF] Bypass administrativo para: ${req.path}`);
      return next();
    }

    // Verificar se há sessão
    if (!req.session || !req.session.csrfToken) {
      console.warn(`⚠️ [CSRF] Sessão sem token CSRF: ${req.path}`);
      return res.status(403).json({
        success: false,
        error: 'CSRF token inválido ou ausente',
        code: 'CSRF_TOKEN_MISSING'
      });
    }

    // Extrair token do request (header ou body)
    const clientToken =
      req.headers[headerName] ||
      req.headers[headerName.toLowerCase()] ||
      req.body?.[bodyField];

    // LOG DETALHADO para debug
    console.log(`🔍 [CSRF] Validando token:`, {
      path: req.path,
      method: req.method,
      sessionID: req.sessionID,
      hasClientToken: !!clientToken,
      clientTokenPrefix: clientToken ? clientToken.substring(0, 8) : 'NONE',
      sessionTokenPrefix: req.session.csrfToken ? req.session.csrfToken.substring(0, 8) : 'NONE',
      tokensMatch: clientToken === req.session.csrfToken
    });

    // Validar token
    if (!clientToken || clientToken !== req.session.csrfToken) {
      console.error(`❌ [CSRF] Token inválido: ${req.path} - IP: ${req.ip}`);

      // Audit log
      await auditService.log(
        'csrf_violation',
        req.session?.user?.id || null,
        {
          status: 'failure',
          resource: req.path,
          details: {
            method: req.method,
            tokenProvided: !!clientToken,
            tokenMatches: false
          },
          req
        }
      );

      return res.status(403).json({
        success: false,
        error: 'CSRF token inválido',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    // Token válido, continuar
    next();
  };
};

/**
 * Middleware para renovar token CSRF após ações críticas
 * (ex: após login, troca de senha, etc)
 */
export const regenerateCsrfToken = (req, res, next) => {
  if (req.session) {
    req.session.csrfToken = generateCsrfToken();
    res.locals.csrfToken = req.session.csrfToken;
    console.log(`🔄 [CSRF] Token regenerado para sessão ${req.sessionID}`);
  }
  next();
};

/**
 * Endpoint para obter token CSRF
 * Usar em: GET /api/csrf-token
 */
export const csrfTokenEndpoint = (req, res) => {
  if (!req.session) {
    return res.status(400).json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  // Gerar token se não existir
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }

  res.json({
    success: true,
    csrfToken: req.session.csrfToken
  });
};

/**
 * Middleware de erro para CSRF
 * Captura erros de CSRF e formata resposta
 */
export const csrfErrorHandler = async (err, req, res, next) => {
  // Se não for erro de CSRF, passar para próximo handler
  if (err.code !== 'EBADCSRFTOKEN' && err.code !== 'CSRF_TOKEN_INVALID') {
    return next(err);
  }

  console.error(`❌ [CSRF] Erro capturado: ${err.message}`);

  // Audit log
  await auditService.log(
    'csrf_violation',
    req.session?.user?.id || null,
    {
      status: 'failure',
      resource: req.path,
      details: {
        error: err.message,
        code: err.code
      },
      req
    }
  );

  res.status(403).json({
    success: false,
    error: 'CSRF token inválido ou expirado',
    code: 'CSRF_VIOLATION'
  });
};

/**
 * Configuração de CSRF para rotas específicas
 * Exemplo de uso:
 *
 * // Proteger todas as rotas de API exceto login
 * app.use('/api', csrfProtection({
 *   exemptPaths: ['/api/auth/login', '/api/auth/register']
 * }));
 */
export const configureCSRF = (app, options = {}) => {
  // 1. Gerar token para todas as requisições com sessão
  app.use(csrfTokenGenerator);

  // 2. Endpoint para obter token
  app.get('/api/csrf-token', csrfTokenEndpoint);

  // 3. Aplicar proteção (configurável por rota)
  // Nota: Aplicar manualmente nas rotas que precisam
  // Ex: app.use('/api', csrfProtection(options));

  // 4. Error handler global
  app.use(csrfErrorHandler);

  console.log('✅ [CSRF] Proteção configurada');
};

/**
 * Helper para incluir token CSRF em responses
 */
export const includeCsrfToken = (req, res, next) => {
  // Adiciona token ao response locals (disponível em templates)
  if (req.session?.csrfToken) {
    res.locals.csrfToken = req.session.csrfToken;
  }
  next();
};

/**
 * Configuração padrão recomendada
 */
export default {
  generator: csrfTokenGenerator,
  protection: csrfProtection,
  regenerate: regenerateCsrfToken,
  endpoint: csrfTokenEndpoint,
  errorHandler: csrfErrorHandler,
  configure: configureCSRF,
  include: includeCsrfToken
};
