#!/bin/bash
# Скрипт автоматической сборки SoundNext Desktop Application

set -e  # Остановка при ошибке

echo "🚀 Building SoundNext Desktop Application"
echo "=========================================="

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

error() {
    echo -e "${RED}✗ ${1}${NC}"
    exit 1
}

# 1. Проверка зависимостей
info "Checking dependencies..."

if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install it first."
fi

if ! command -v python3 &> /dev/null; then
    error "Python 3 is not installed. Please install it first."
fi

success "Dependencies OK"

# 2. Build Next.js статических файлов
info "Building Next.js frontend..."

npm install
npm run build

if [ ! -d "out" ]; then
    error "Next.js build failed - 'out' directory not found"
fi

success "Next.js build completed"

# 3. Установка Python зависимостей
info "Installing Python dependencies..."

cd backend

# Активируем виртуальное окружение если оно есть
if [ -d "venv" ]; then
    source venv/bin/activate
fi

pip install -r requirements.txt

success "Python dependencies installed"

# 4. Сборка .app с PyInstaller
info "Building macOS application with PyInstaller..."

pyinstaller soundnext.spec --clean --noconfirm

if [ ! -d "dist/SoundNext.app" ]; then
    error "PyInstaller build failed - .app not found"
fi

success "Application built successfully!"

# 5. Финальная информация
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""
echo "Your application is ready:"
echo "  📦 Location: backend/dist/SoundNext.app"
echo ""
echo "To run the app:"
echo "  • Double-click SoundNext.app in Finder"
echo "  • Or run: open backend/dist/SoundNext.app"
echo ""
echo "To distribute:"
echo "  • Copy SoundNext.app to Applications folder"
echo "  • Or create a .dmg installer (optional)"
echo "=========================================="

