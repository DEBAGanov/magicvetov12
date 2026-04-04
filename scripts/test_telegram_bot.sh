#!/bin/bash

echo "🤖 Тестирование MagicCvetov Telegram Bot"
echo "======================================"

# Проверяем, запущено ли приложение
echo "1. Проверка статуса приложения..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Приложение запущено"
else
    echo "❌ Приложение не запущено. Запустите: ./gradlew bootRun"
    exit 1
fi

# Проверяем webhook info
echo ""
echo "2. Проверка webhook информации..."
curl -s http://localhost:8080/api/v1/telegram/webhook/info | jq '.' || echo "Webhook info недоступен"

# Проверяем регистрацию webhook
echo ""
echo "3. Попытка регистрации webhook..."
curl -s -X POST http://localhost:8080/api/v1/telegram/webhook/register | jq '.' || echo "Регистрация webhook недоступна"

echo ""
echo "4. Инструкции для тестирования:"
echo "   - Откройте Telegram и найдите бота @MagicCvetovBot"
echo "   - Отправьте команду /start"
echo "   - Отправьте команду /help"
echo "   - Отправьте команду /menu"
echo "   - Попробуйте отправить контакт через кнопку"

echo ""
echo "5. Для тестирования авторизации:"
echo "   - Используйте ссылку: https://t.me/MagicCvetovBot?start=test_token_123"
echo "   - Нажмите кнопку 'Отправить телефон'"
echo "   - Нажмите кнопку 'Подтвердить вход'"

echo ""
echo "🔍 Мониторинг логов приложения:"
echo "   tail -f logs/spring.log" 