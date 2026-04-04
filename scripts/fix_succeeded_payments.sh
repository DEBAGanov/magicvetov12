#!/bin/bash

# Скрипт для принудительной обработки платежей со статусом SUCCEEDED
# которые не были отправлены в админский бот из-за проблем с сервером

set -e

BASE_URL="https://api.dimbopizza.ru"

echo "🔧 ИСПРАВЛЕНИЕ ПЛАТЕЖЕЙ СО СТАТУСОМ SUCCEEDED"
echo "=============================================="

echo "📋 Этот скрипт:"
echo "   ✅ Найдет платежи со статусом SUCCEEDED"
echo "   ✅ Принудительно проверит их через API"  
echo "   ✅ Отправит соответствующие заказы в админский бот"
echo ""

# Получаем токен авторизации
echo "🔑 Попытка авторизации..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/sms/verify-code" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+79600948872", "code": "1234"}')

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "❌ Ошибка авторизации: $AUTH_RESPONSE"
    echo "💡 Попробуйте позже или используйте другой номер телефона"
    exit 1
fi

echo "✅ Получен токен авторизации"

# Список ID платежей из БД со статусом SUCCEEDED (из скриншотов)
SUCCEEDED_PAYMENT_IDS=(
    "14"  # СБП 1.00₽
    "22"  # СБП 1.00₽  
)

echo ""
echo "🔍 Обработка платежей со статусом SUCCEEDED..."

for payment_id in "${SUCCEEDED_PAYMENT_IDS[@]}"; do
    echo ""
    echo "💳 Проверка платежа #$payment_id..."
    
    # Принудительная проверка через API polling
    FORCE_CHECK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/payments/polling/$payment_id/force-check" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    FORCE_CHECK_STATUS=$(echo "$FORCE_CHECK_RESPONSE" | jq -r '.success' 2>/dev/null || echo "error")
    
    if [[ "$FORCE_CHECK_STATUS" == "true" ]]; then
        echo "✅ Платеж #$payment_id принудительно проверен"
        echo "📢 Проверьте админский бот - должно появиться уведомление"
    else
        echo "⚠️ Проблема с проверкой платежа #$payment_id: $FORCE_CHECK_RESPONSE"
        
        # Альтернативный подход - проверка статуса платежа
        echo "🔄 Альтернативная проверка статуса..."
        PAYMENT_STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/payments/$payment_id" \
          -H "Authorization: Bearer $TOKEN")
        
        PAYMENT_STATUS=$(echo "$PAYMENT_STATUS_RESPONSE" | jq -r '.status' 2>/dev/null || echo "unknown")
        echo "📊 Текущий статус платежа #$payment_id: $PAYMENT_STATUS"
    fi
done

echo ""
echo "🎯 ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ:"
echo "=========================="

# Проверка статистики polling системы
echo "📊 Проверка статистики системы polling..."
POLLING_STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/payments/polling/statistics" \
  -H "Authorization: Bearer $TOKEN")

POLLING_STATS_SUCCESS=$(echo "$POLLING_STATS_RESPONSE" | jq -r '.success' 2>/dev/null || echo "error")

if [[ "$POLLING_STATS_SUCCESS" == "true" ]]; then
    echo "✅ Статистика polling системы получена"
    echo "📋 Проверьте логи сервера для деталей активных платежей"
else
    echo "⚠️ Проблема получения статистики: $POLLING_STATS_RESPONSE"
fi

# Проверка информации о системе
echo ""
echo "ℹ️ Информация о системе polling..."
POLLING_INFO_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/payments/polling/info")

POLLING_SYSTEM=$(echo "$POLLING_INFO_RESPONSE" | jq -r '.system' 2>/dev/null || echo "unknown")

if [[ "$POLLING_SYSTEM" == "PaymentPollingService" ]]; then
    echo "✅ PaymentPollingService активен"
    echo "📋 Система опрашивает платежи каждую минуту"
else
    echo "❌ PaymentPollingService недоступен: $POLLING_INFO_RESPONSE"
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:"
echo "========================"
echo "✅ Обработано платежей: ${#SUCCEEDED_PAYMENT_IDS[@]}"
echo "📢 ПРОВЕРЬТЕ админский телеграм бот на наличие новых уведомлений"
echo "📊 Смотрите логи сервера: docker logs magicvetov-app | grep -i polling"
echo ""
echo "💡 РЕКОМЕНДАЦИИ:"
echo "   🔄 Перезапустите сервер если проблемы продолжаются"
echo "   📋 Проверьте логи PaymentPollingService каждую минуту"
echo "   🚨 Убедитесь что PaymentPollingService запущен как @Scheduled задача"
echo ""
echo "✅ Скрипт исправления завершен!" 