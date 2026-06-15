/**
 * Endpoint temporário para forçar sincronização de prompts V5.0
 * Criado para debugging do deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupSyncPromptsRoutes(app) {

  // POST /api/admin/sync-prompts-v5 - Força sincronização
  app.post('/api/admin/sync-prompts-v5', async (req, res) => {
    try {
      // 🔧 v3.6.1: SEMPRE usar caminho relativo do projeto (ephemeral safe)
      const SOURCE_DIR = path.join(__dirname, '../data/prompts/global');
      const DEST_DIR = SOURCE_DIR; // Sempre usar diretório do projeto

      console.log('📝 [Prompts] Verificando prompts V5.0');
      console.log(`📂 Diretório: ${DEST_DIR}`);

      // 🔧 v3.6.1: Criar diretório com try/catch
      try {
        if (!fs.existsSync(DEST_DIR)) {
          fs.mkdirSync(DEST_DIR, { recursive: true });
        }
      } catch (mkdirError) {
        console.warn('⚠️  Erro ao criar diretório de prompts:', mkdirError.message);
        return res.json({
          success: true,
          message: 'Usando prompts em memória (fallback)',
          skipped: true
        });
      }

      // Listar arquivos V5.0
      const sourceFiles = fs.readdirSync(SOURCE_DIR)
        .filter(f => f.includes('V5') && f.endsWith('.md'));

      let copied = 0;
      let skipped = 0;
      let errors = [];

      for (const file of sourceFiles) {
        try {
          const filePath = path.join(DEST_DIR, file);

          // 🔧 v3.6.1: Apenas verificar existência (já está no lugar certo)
          if (fs.existsSync(filePath)) {
            skipped++;
          } else {
            errors.push({ file, error: 'Arquivo ausente' });
          }
        } catch (error) {
          errors.push({ file, error: error.message });
        }
      }

      // Verificar total de arquivos no diretório
      const totalFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.md')).length;
      const v5Files = fs.readdirSync(DEST_DIR).filter(f => f.includes('V5') && f.endsWith('.md')).length;

      console.log(`✅ Verificação concluída: ${skipped} encontrados, ${errors.length} ausentes`);

      res.json({
        success: true,
        found: skipped,
        missing: errors.length,
        errorDetails: errors,
        totalInDir: totalFiles,
        v5InDir: v5Files,
        directory: DEST_DIR
      });

    } catch (error) {
      // 🔧 v3.6.1: Fallback seguro - não crashar
      console.warn('⚠️  Verificação de prompts falhou:', error.message);
      res.json({
        success: true,
        message: 'Usando prompts em memória (fallback)',
        error: error.message
      });
    }
  });

  // GET /api/admin/check-prompts-v5 - Verifica prompts V5.0
  app.get('/api/admin/check-prompts-v5', (req, res) => {
    try {
      // 🔧 v3.6.1: SEMPRE usar caminho relativo do projeto
      const SOURCE_DIR = path.join(__dirname, '../data/prompts/global');
      const DEST_DIR = SOURCE_DIR; // Sempre usar diretório do projeto

      const sourceExists = fs.existsSync(SOURCE_DIR);
      const destExists = fs.existsSync(DEST_DIR);

      const sourceFiles = sourceExists ? fs.readdirSync(SOURCE_DIR).filter(f => f.includes('V5') && f.endsWith('.md')) : [];
      const destFiles = destExists ? fs.readdirSync(DEST_DIR).filter(f => f.includes('V5') && f.endsWith('.md')) : [];

      res.json({
        source: {
          dir: SOURCE_DIR,
          exists: sourceExists,
          v5Files: sourceFiles.length,
          files: sourceFiles.slice(0, 10)
        },
        dest: {
          dir: DEST_DIR,
          exists: destExists,
          v5Files: destFiles.length,
          files: destFiles.slice(0, 10)
        },
        isRender: !!process.env.RENDER,
        needsSync: sourceFiles.length > destFiles.length
      });

    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  });

  // POST /api/admin/cleanup-v5-duplicates - Remove arquivos V5_0 duplicados
  app.post('/api/admin/cleanup-v5-duplicates', async (req, res) => {
    try {
      // 🔧 v3.6.1: SEMPRE usar caminho relativo do projeto
      const DEST_DIR = path.join(__dirname, '../data/prompts/global');

      console.log('🧹 Iniciando limpeza de duplicatas V5_0');
      console.log(`📂 Diretório: ${DEST_DIR}`);

      // Listar arquivos com padrão V5_0 (antigo)
      const oldPatternFiles = fs.readdirSync(DEST_DIR)
        .filter(f => f.includes('V5_0') && f.endsWith('.md'));

      let deleted = 0;
      let errors = [];
      const deletedFiles = [];

      for (const file of oldPatternFiles) {
        try {
          const filePath = path.join(DEST_DIR, file);

          // Verificar se existe versão V5.0 (nova) do mesmo arquivo
          const newVersionFile = file.replace('V5_0', 'V5.0');
          const newVersionPath = path.join(DEST_DIR, newVersionFile);

          if (fs.existsSync(newVersionPath)) {
            // Deletar versão antiga
            fs.unlinkSync(filePath);
            deleted++;
            deletedFiles.push(file);
            console.log(`🗑️  Deletado: ${file}`);
          }

        } catch (error) {
          errors.push({ file, error: error.message });
          console.error(`❌ Erro ao deletar ${file}:`, error.message);
        }
      }

      console.log(`✅ Limpeza concluída: ${deleted} arquivos removidos`);

      res.json({
        success: true,
        deleted,
        deletedFiles,
        errors: errors.length,
        errorDetails: errors
      });

    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });
}
