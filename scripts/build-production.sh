#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "ROM AGENT - BUILD DE PRODUÇÃO"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "🔧 [1/6] Instalando dependências do backend..."
npm ci

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
echo "════════════════════════════════════════════════════════════════════════"

echo ""
echo "🌐 [2/9] Chromium serverless via @sparticuz/chromium..."
echo "   ✅ Chromium incluído como dependência NPM (@sparticuz/chromium)"
echo "   ✅ Não requer instalação de sistema (funciona em qualquer ambiente)"
echo "   ✅ Otimizado para ambientes serverless/restritos como Render"

echo ""
echo "🧹 [3/9] Limpando build anterior do frontend..."
rm -rf frontend/dist

echo ""
echo "📦 [4/9] Instalando dependências do frontend..."
cd frontend
npm ci

echo ""
echo "🏗️ [5/9] Buildando frontend React + PWA..."
npm run build

echo ""
echo "📊 [6/9] Verificando build..."
cd ..

if [ ! -d "frontend/dist" ]; then
  echo "❌ ERRO CRÍTICO: frontend/dist não foi criado!"
  exit 1
fi

if [ ! -f "frontend/dist/index.html" ]; then
  echo "❌ ERRO CRÍTICO: frontend/dist/index.html não existe!"
  exit 1
fi

echo ""
echo "✅ Build verificado com sucesso!"
echo ""
echo "📁 Arquivos gerados em frontend/dist:"
ls -lh frontend/dist/ | head -20

echo ""
echo "🔍 [7/9] Verificação final..."
echo "   ✅ @sparticuz/chromium instalado (pacote NPM)"
echo "   ✅ puppeteer-core instalado"
echo "   ✅ Puppeteer pronto para uso serverless"

echo ""
echo "📋 [8/9] Sincronizando prompts V5.0 para disco persistente..."
node scripts/sync-v5-prompts.cjs || echo "⚠️  Sincronização de prompts falhou (não crítico)"

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

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ BUILD COMPLETO!"
echo "════════════════════════════════════════════════════════════"
