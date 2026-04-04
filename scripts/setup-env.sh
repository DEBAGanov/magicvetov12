#!/bin/bash

# =================================================================
# MagicCvetov Environment Setup Script
# =================================================================

echo "🍕 MagicCvetov Environment Setup"
echo "================================"

# Проверяем наличие .env файла
if [ -f ".env" ]; then
    echo "⚠️  Файл .env уже существует."
    read -p "Перезаписать? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Настройка отменена."
        exit 1
    fi
fi

# Копируем шаблон
if [ -f "env-template.txt" ]; then
    cp env-template.txt .env
    echo "✅ Создан .env файл из шаблона"
else
    echo "❌ Ошибка: Файл env-template.txt не найден"
    exit 1
fi

# Функция для генерации случайного пароля
generate_password() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
    else
        date +%s | sha256sum | base64 | head -c 25
    fi
}

# Функция для генерации JWT секрета
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        echo -n "magicvetov-jwt-secret-$(date +%s)" | base64
    else
        echo "cGl6emFuYXQtand0LXNlY3JldA=="
    fi
}

echo ""
echo "🔧 Настройка переменных..."

# Генерируем безопасные пароли
DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_jwt_secret)

# Заменяем значения в .env файле
if command -v sed &> /dev/null; then
    # macOS/Linux sed
    sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i.bak "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    rm .env.bak
    echo "✅ Сгенерированы безопасные пароли"
else
    echo "⚠️  sed не найден, пароли нужно изменить вручную"
fi

echo ""
echo "📝 Следующие шаги:"
echo "1. Отредактируйте .env файл под ваши потребности:"
echo "   nano .env"
echo ""
echo "2. Обязательно настройте:"
echo "   - MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD (для уведомлений)"
echo "   - ROBOKASSA_* переменные (для платежей)"
echo "   - S3_PUBLIC_URL (для продакшена)"
echo ""
echo "3. Запустите проект:"
echo "   docker compose up -d"
echo ""
echo "📖 Подробная документация: README-env.md"
echo ""
echo "✅ Настройка завершена!"