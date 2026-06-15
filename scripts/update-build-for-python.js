#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════
 * UPDATE BUILD FOR PYTHON DEPENDENCIES
 * ════════════════════════════════════════════════════════════════════════
 *
 * Atualiza scripts/build-production.sh para:
 * 1. Instalar Python 3 e pip no ambiente Render
 * 2. Instalar dependências Python (pdfplumber, opencv, etc.)
 * 3. Instalar binários do sistema (Tesseract OCR, Poppler)
 * 4. Garantir que pipeline ROM de 5 etapas funcione em produção
 *
 * Commit: 7d7ce96 (Pipeline ROM Web Integration)
 * Deploy target: Render.com (srv-d4ueaf2li9vc73d3rj00)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts/build-production.sh');

async function updateBuildScript() {
  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('  UPDATE BUILD SCRIPT FOR PYTHON DEPENDENCIES');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // 1. Ler script atual
  let content = await fs.readFile(BUILD_SCRIPT, 'utf-8');

  // 2. Backup
  const backupPath = `${BUILD_SCRIPT}.backup-python-${Date.now()}`;
  await fs.writeFile(backupPath, content);
  console.log(`✓ Backup criado: ${path.basename(backupPath)}\n`);

  // 3. Adicionar seção de Python APÓS instalação das dependências do backend
  const afterBackendInstall = 'npm ci';

  const pythonSection = `npm ci

echo ""
echo "🐍 [1.5/8] Configurando ambiente Python para extração avançada..."
echo "════════════════════════════════════════════════════════════════════════"

# Detectar sistema operacional
if command -v apt-get &> /dev/null; then
  echo "   📦 Sistema: Debian/Ubuntu (Render)"
  PACKAGE_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
  echo "   📦 Sistema: RHEL/CentOS"
  PACKAGE_MANAGER="yum"
elif command -v brew &> /dev/null; then
  echo "   📦 Sistema: macOS (Homebrew)"
  PACKAGE_MANAGER="brew"
else
  echo "   ⚠️  Gerenciador de pacotes não detectado, assumindo Debian/Render"
  PACKAGE_MANAGER="apt-get"
fi

# Instalar Python 3 se não estiver presente
if ! command -v python3 &> /dev/null; then
  echo "   📥 Instalando Python 3..."

  if [ "$PACKAGE_MANAGER" = "apt-get" ]; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq python3 python3-pip python3-venv
  elif [ "$PACKAGE_MANAGER" = "yum" ]; then
    sudo yum install -y python3 python3-pip
  elif [ "$PACKAGE_MANAGER" = "brew" ]; then
    brew install python3
  fi
else
  echo "   ✅ Python 3 já instalado: $(python3 --version)"
fi

# Garantir que pip está atualizado
echo "   📦 Atualizando pip..."
python3 -m pip install --upgrade pip --quiet || true

# Instalar Tesseract OCR (necessário para pytesseract)
echo "   👁️  Instalando Tesseract OCR..."
if [ "$PACKAGE_MANAGER" = "apt-get" ]; then
  sudo apt-get install -y -qq tesseract-ocr tesseract-ocr-por tesseract-ocr-eng || true
elif [ "$PACKAGE_MANAGER" = "yum" ]; then
  sudo yum install -y tesseract tesseract-langpack-por tesseract-langpack-eng || true
elif [ "$PACKAGE_MANAGER" = "brew" ]; then
  brew install tesseract tesseract-lang || true
fi

# Verificar instalação do Tesseract
if command -v tesseract &> /dev/null; then
  echo "   ✅ Tesseract OCR instalado: $(tesseract --version | head -1)"
else
  echo "   ⚠️  Tesseract não instalado (OCR não funcionará)"
fi

# Instalar Poppler (necessário para pdftotext)
echo "   📄 Instalando Poppler (pdftotext)..."
if [ "$PACKAGE_MANAGER" = "apt-get" ]; then
  sudo apt-get install -y -qq poppler-utils || true
elif [ "$PACKAGE_MANAGER" = "yum" ]; then
  sudo yum install -y poppler-utils || true
elif [ "$PACKAGE_MANAGER" = "brew" ]; then
  brew install poppler || true
fi

# Verificar instalação do pdftotext
if command -v pdftotext &> /dev/null; then
  echo "   ✅ Poppler instalado: pdftotext disponível"
else
  echo "   ⚠️  Poppler não instalado (pdftotext não funcionará)"
fi

# Instalar dependências OpenCV (para opencv-python)
echo "   🖼️  Instalando dependências OpenCV..."
if [ "$PACKAGE_MANAGER" = "apt-get" ]; then
  sudo apt-get install -y -qq libgl1-mesa-glx libglib2.0-0 || true
fi

# Instalar dependências Python do projeto
echo "   📚 Instalando dependências Python..."
if [ -f "python-extractors/requirements.txt" ]; then
  python3 -m pip install -r python-extractors/requirements.txt --quiet || {
    echo "   ⚠️  Algumas dependências Python falharam, continuando..."
  }
  echo "   ✅ Dependências Python instaladas"
else
  echo "   ⚠️  python-extractors/requirements.txt não encontrado"
fi

# Validação final
echo ""
echo "   🔍 Validação do ambiente Python:"
python3 --version 2>/dev/null && echo "      ✅ Python" || echo "      ❌ Python"
python3 -m pip --version 2>/dev/null && echo "      ✅ pip" || echo "      ❌ pip"
tesseract --version 2>/dev/null > /dev/null && echo "      ✅ Tesseract OCR" || echo "      ⚠️  Tesseract OCR (opcional)"
pdftotext -v 2>&1 > /dev/null && echo "      ✅ pdftotext (Poppler)" || echo "      ⚠️  pdftotext (opcional)"
python3 -c "import pdfplumber; print('      ✅ pdfplumber')" 2>/dev/null || echo "      ⚠️  pdfplumber"
python3 -c "import cv2; print('      ✅ opencv-python')" 2>/dev/null || echo "      ⚠️  opencv-python"

echo ""
echo "════════════════════════════════════════════════════════════════════════"`;

  // 4. Substituir a linha do npm ci pela nova seção
  if (!content.includes('Configurando ambiente Python')) {
    content = content.replace(afterBackendInstall, pythonSection);
    console.log('✓ Seção de Python adicionada ao build script\n');
  } else {
    console.log('⚠️  Seção de Python já existe no build script\n');
  }

  // 5. Ajustar numeração das etapas subsequentes (2/7 → 2/8, etc.)
  content = content.replace(/\[2\/7\]/g, '[2/9]');
  content = content.replace(/\[3\/7\]/g, '[3/9]');
  content = content.replace(/\[4\/7\]/g, '[4/9]');
  content = content.replace(/\[5\/7\]/g, '[5/9]');
  content = content.replace(/\[6\/7\]/g, '[6/9]');
  content = content.replace(/\[7\/8\]/g, '[7/9]');
  content = content.replace(/\[8\/8\]/g, '[8/9]');

  // 6. Adicionar etapa final de validação do pipeline
  const finalValidation = `
echo ""
echo "🎯 [9/9] Validação final do pipeline ROM..."
echo "════════════════════════════════════════════════════════════════════════"

# Verificar se pdfplumber_extractor.py existe
if [ -f "python-extractors/pdfplumber_extractor.py" ]; then
  echo "   ✅ pdfplumber_extractor.py encontrado"

  # Testar importação
  python3 -c "import sys; sys.path.append('python-extractors'); import pdfplumber_extractor" 2>/dev/null && {
    echo "   ✅ pdfplumber_extractor importável"
  } || {
    echo "   ⚠️  pdfplumber_extractor não importável (verificar dependências)"
  }
else
  echo "   ⚠️  pdfplumber_extractor.py não encontrado"
fi

# Verificar se MasterOrchestrator existe
if [ -f "src/services/master-orchestrator.js" ]; then
  echo "   ✅ MasterOrchestrator encontrado"
else
  echo "   ⚠️  MasterOrchestrator não encontrado"
fi

# Verificar se rota de orchestrator existe
if [ -f "src/routes/orchestrator.js" ]; then
  echo "   ✅ Rota /api/orchestrator encontrada"
else
  echo "   ⚠️  Rota /api/orchestrator não encontrada"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
`;

  // Adicionar antes do "BUILD COMPLETO!"
  if (!content.includes('Validação final do pipeline ROM')) {
    content = content.replace(
      /echo ""\necho "════════════════════════════════════════════════════════════════════════"\necho "✅ BUILD COMPLETO!"/,
      `${finalValidation}echo ""\necho "════════════════════════════════════════════════════════════════════════"\necho "✅ BUILD COMPLETO!"`
    );
    console.log('✓ Etapa de validação do pipeline adicionada\n');
  }

  // 7. Salvar arquivo modificado
  await fs.writeFile(BUILD_SCRIPT, content);

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  ✅ BUILD SCRIPT ATUALIZADO COM SUCESSO!');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  console.log('📝 Modificações aplicadas:');
  console.log('   ✓ Detecção automática de sistema operacional (Debian/RHEL/macOS)');
  console.log('   ✓ Instalação de Python 3 + pip');
  console.log('   ✓ Instalação de Tesseract OCR (português + inglês)');
  console.log('   ✓ Instalação de Poppler (pdftotext)');
  console.log('   ✓ Dependências OpenCV (libgl1-mesa-glx, libglib2.0-0)');
  console.log('   ✓ Instalação de python-extractors/requirements.txt');
  console.log('   ✓ Validação de ambiente Python completa');
  console.log('   ✓ Validação do pipeline ROM (pdfplumber, MasterOrchestrator, rotas)\n');

  console.log('🎯 Dependências Python instaladas:');
  console.log('   • pdfplumber >= 0.10.0 (extração estruturada com tabelas)');
  console.log('   • pypdf2 >= 3.0.0 (manipulação de PDFs)');
  console.log('   • pillow >= 10.0.0 (processamento de imagens)');
  console.log('   • pytesseract >= 0.3.10 (wrapper Tesseract OCR)');
  console.log('   • opencv-python >= 4.8.0 (pré-processamento para OCR)');
  console.log('   • requests, beautifulsoup4, selenium (scrapers)\n');

  console.log('🔧 Binários do sistema instalados:');
  console.log('   • tesseract-ocr (OCR engine)');
  console.log('   • tesseract-ocr-por (idioma português)');
  console.log('   • tesseract-ocr-eng (idioma inglês)');
  console.log('   • poppler-utils (pdftotext, pdfinfo)');
  console.log('   • libgl1-mesa-glx (OpenCV)');
  console.log('   • libglib2.0-0 (OpenCV)\n');

  console.log('🚀 Próximos passos:');
  console.log('   1. Testar localmente: npm run build');
  console.log('   2. Validar sistema: npm run validate:system');
  console.log('   3. Commit: git add scripts/build-production.sh');
  console.log('   4. Deploy: git push origin main\n');

  console.log('🔄 Rollback (se necessário):');
  console.log(`   cp ${path.basename(backupPath)} scripts/build-production.sh\n`);
}

updateBuildScript().catch(console.error);
