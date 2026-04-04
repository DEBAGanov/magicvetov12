#!/bin/bash

# Скрипт для настройки webhook уведомлений ЮКасса
# Автор: AI Assistant
# Дата: 2025-01-29

set -e

echo "🔧 Настройка webhook уведомлений ЮКасса..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Функция для вывода успеха
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждения
print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Функция для вывода ошибки
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header "Получение текущей конфигурации ЮКасса"

# Получаем переменные окружения из контейнера
YOOKASSA_SHOP_ID=$(docker exec magicvetov-app printenv YOOKASSA_SHOP_ID 2>/dev/null || echo "")
YOOKASSA_SECRET_KEY=$(docker exec magicvetov-app printenv YOOKASSA_SECRET_KEY 2>/dev/null || echo "")
DOMAIN=$(docker exec magicvetov-app printenv DOMAIN 2>/dev/null || echo "localhost")

if [ -z "$YOOKASSA_SHOP_ID" ] || [ -z "$YOOKASSA_SECRET_KEY" ]; then
    print_error "Переменные окружения ЮКасса не найдены в контейнере"
    print_warning "Убедитесь, что контейнер запущен и настроен"
    exit 1
fi

print_success "Shop ID: $YOOKASSA_SHOP_ID"
print_success "Secret Key: ${YOOKASSA_SECRET_KEY:0:20}..."
print_success "Domain: $DOMAIN"

print_header "Информация о webhook настройках"

echo "📋 Для настройки webhook в личном кабинете ЮКасса:"
echo ""
echo "🔗 Webhook URL:"
if [ "$DOMAIN" = "localhost" ]; then
    print_warning "https://your-domain.com/api/v1/payments/yookassa/webhook"
    echo "   (замените your-domain.com на ваш реальный домен)"
else
    print_success "https://$DOMAIN/api/v1/payments/yookassa/webhook"
fi

echo ""
echo "📝 Шаги для настройки в личном кабинете ЮКасса:"
echo "1. Войдите в личный кабинет: https://yookassa.ru/"
echo "2. Перейдите в раздел 'Интеграция' -> 'Webhook'"
echo "3. Добавьте новый webhook с URL выше"
echo "4. Выберите события для уведомлений:"
echo "   - payment.succeeded (успешный платеж)"
echo "   - payment.canceled (отмененный платеж)"
echo "   - payment.waiting_for_capture (ожидание подтверждения)"
echo "   - refund.succeeded (успешный возврат)"

print_header "Проверка доступности webhook endpoint"

# Проверяем доступность webhook endpoint
WEBHOOK_URL="http://localhost:8080/api/v1/payments/yookassa/webhook"

echo "🔍 Проверка доступности: $WEBHOOK_URL"

# Тестовый POST запрос к webhook
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook_test.json \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-YooKassa-Event-Type: payment.succeeded" \
    -d '{"event":"payment.succeeded","type":"notification","object":{"id":"test-webhook","status":"succeeded"}}' \
    "$WEBHOOK_URL" 2>/dev/null || echo "000")

if [ "$WEBHOOK_RESPONSE" = "200" ]; then
    print_success "Webhook endpoint доступен (HTTP 200)"
    echo "📄 Ответ: $(cat /tmp/webhook_test.json 2>/dev/null || echo 'пустой')"
elif [ "$WEBHOOK_RESPONSE" = "400" ]; then
    print_warning "Webhook endpoint доступен, но вернул HTTP 400 (ожидаемо для тестовых данных)"
    echo "📄 Ответ: $(cat /tmp/webhook_test.json 2>/dev/null || echo 'пустой')"
else
    print_error "Webhook endpoint недоступен (HTTP $WEBHOOK_RESPONSE)"
    echo "📄 Проверьте, что приложение запущено на порту 8080"
fi

print_header "Проверка поддержки СБП"

# Проверяем API банков СБП
SBP_URL="http://localhost:8080/api/v1/payments/yookassa/sbp/banks"
echo "🔍 Проверка API банков СБП: $SBP_URL"

SBP_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sbp_test.json "$SBP_URL" 2>/dev/null || echo "000")

if [ "$SBP_RESPONSE" = "200" ]; then
    print_success "API банков СБП работает (HTTP 200)"
    BANKS_COUNT=$(cat /tmp/sbp_test.json | jq length 2>/dev/null || echo "неизвестно")
    echo "📊 Количество банков: $BANKS_COUNT"
    echo "🏦 Первые 3 банка:"
    cat /tmp/sbp_test.json | jq -r '.[0:3][] | "   - \(.name) (\(.bankId))"' 2>/dev/null || echo "   (ошибка парсинга JSON)"
else
    print_error "API банков СБП недоступен (HTTP $SBP_RESPONSE)"
fi

print_header "Тестирование создания платежа с СБП"

# Получаем JWT токен для тестирования
echo "🔑 Получение JWT токена..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null || echo "{}")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)

if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
    print_success "JWT токен получен"

    # Тестируем создание платежа с СБП
    echo "💳 Тестирование создания СБП платежа..."

    PAYMENT_REQUEST='{
        "orderId": 999,
        "amount": 500.00,
        "method": "SBP",
        "bankId": "sberbank",
        "description": "Тестовый СБП платеж",
        "returnUrl": "https://example.com/return"
    }'

    PAYMENT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/payment_test.json \
        -X POST "http://localhost:8080/api/v1/payments/yookassa/create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "$PAYMENT_REQUEST" 2>/dev/null || echo "000")

    if [ "$PAYMENT_RESPONSE" = "200" ]; then
        print_success "СБП платеж создан успешно (HTTP 200)"
        PAYMENT_ID=$(cat /tmp/payment_test.json | jq -r '.id // empty' 2>/dev/null)
        CONFIRMATION_URL=$(cat /tmp/payment_test.json | jq -r '.confirmationUrl // empty' 2>/dev/null)
        echo "📝 ID платежа: $PAYMENT_ID"
        echo "🔗 URL подтверждения: $CONFIRMATION_URL"
    elif [ "$PAYMENT_RESPONSE" = "400" ]; then
        print_warning "Ошибка создания платежа (HTTP 400) - ожидаемо без реального заказа"
        ERROR_MSG=$(cat /tmp/payment_test.json | jq -r '.message // .error // empty' 2>/dev/null)
        echo "📄 Ошибка: $ERROR_MSG"
    else
        print_error "Ошибка создания СБП платежа (HTTP $PAYMENT_RESPONSE)"
        cat /tmp/payment_test.json 2>/dev/null || echo "Нет ответа"
    fi
else
    print_error "Не удалось получить JWT токен"
    echo "📄 Ответ авторизации: $LOGIN_RESPONSE"
fi

print_header "Мониторинг логов ЮКасса"

echo "📊 Последние записи в логах ЮКасса:"
docker logs --tail=10 magicvetov-app 2>/dev/null | grep -i yookassa || echo "Логи ЮКасса не найдены"

print_header "Инструкции по дальнейшей настройке"

echo "📋 Следующие шаги:"
echo ""
echo "1. 🌐 Настройте webhook в личном кабинете ЮКасса:"
echo "   URL: https://your-domain.com/api/v1/payments/yookassa/webhook"
echo "   События: payment.succeeded, payment.canceled, refund.succeeded"
echo ""
echo "2. 🧪 Протестируйте webhook:"
echo "   - Создайте тестовый платеж"
echo "   - Оплатите его тестовой картой"
echo "   - Проверьте обновление статуса в базе данных"
echo ""
echo "3. 📱 Для мобильного приложения:"
echo "   - Убедитесь, что СБП банки доступны через API"
echo "   - Протестируйте создание СБП платежей"
echo "   - Проверьте корректность confirmation_url"
echo ""
echo "4. 🔍 Мониторинг:"
echo "   - Следите за логами: docker logs -f magicvetov-app | grep -i yookassa"
echo "   - Проверяйте метрики: curl http://localhost:8080/api/v1/payments/metrics/summary"

print_header "Полезные ссылки"

echo "📚 Документация:"
echo "- Webhook ЮКасса: https://yookassa.ru/developers/api#webhook"
echo "- Тестовые карты: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing"
echo "- СБП интеграция: https://yookassa.ru/developers/payment-acceptance/scenario-extensions/sbp"
echo "- Личный кабинет: https://yookassa.ru/"

# Очистка временных файлов
rm -f /tmp/webhook_test.json /tmp/sbp_test.json /tmp/payment_test.json

print_success "Настройка webhook завершена!"
echo ""
echo "💡 Основная проблема: webhook не настроен в личном кабинете ЮКасса"
echo "🔧 Решение: добавьте webhook URL в настройки интеграции"
echo "✅ После настройки webhook статусы платежей будут обновляться автоматически"