#!/bin/bash

# Тест уведомлений о статусе заказа
# Проверяет отправку уведомлений пользователю при изменении статуса заказа в админ-боте

set -e

API_BASE="${API_BASE:-http://localhost:8080}"
TOKEN_FILE="/tmp/magicvetov_test_token.txt"
ORDER_ID_FILE="/tmp/magicvetov_test_order_id.txt"

echo "🔍 Тестирование уведомлений о статусе заказа..."
echo "📍 API: $API_BASE"

# Функция для логирования
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Функция для авторизации
auth() {
    log "🔐 Авторизация..."
    response=$(curl -s "$API_BASE/api/v1/auth/test-login" \
        -H "Content-Type: application/json" \
        -d '{
            "phone": "+79999999999", 
            "name": "Test User"
        }')
    
    if echo "$response" | grep -q '"token"'; then
        token=$(echo "$response" | sed 's/.*"token":"\([^"]*\)".*/\1/')
        echo "$token" > "$TOKEN_FILE"
        log "✅ Авторизация успешна"
        return 0
    else
        log "❌ Ошибка авторизации: $response"
        return 1
    fi
}

# Функция для создания тестового заказа
create_test_order() {
    local token=$(cat "$TOKEN_FILE")
    log "📝 Создание тестового заказа..."
    
    # Очистка корзины
    curl -s "$API_BASE/api/v1/cart/clear" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" > /dev/null
    
    # Добавление товара в корзину
    curl -s "$API_BASE/api/v1/cart/items" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"productId": 1, "quantity": 1}' > /dev/null
    
    # Создание заказа
    response=$(curl -s "$API_BASE/api/v1/orders" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{
            "contactName": "Test User",
            "contactPhone": "+79999999999",
            "paymentMethod": "CASH",
            "deliveryLocationId": 1,
            "deliveryType": "Самовывоз",
            "deliveryCost": 0,
            "comment": "Тестовый заказ для проверки уведомлений"
        }')
    
    if echo "$response" | grep -q '"id"'; then
        order_id=$(echo "$response" | sed 's/.*"id":\([0-9]*\).*/\1/')
        echo "$order_id" > "$ORDER_ID_FILE"
        log "✅ Заказ #$order_id создан успешно"
        return 0
    else
        log "❌ Ошибка создания заказа: $response"
        return 1
    fi
}

# Функция для проверки статуса заказа
check_order_status() {
    local token=$(cat "$TOKEN_FILE")
    local order_id=$(cat "$ORDER_ID_FILE")
    
    log "🔍 Проверка текущего статуса заказа #$order_id..."
    
    response=$(curl -s "$API_BASE/api/v1/orders/$order_id" \
        -H "Authorization: Bearer $token")
    
    if echo "$response" | grep -q '"status"'; then
        status=$(echo "$response" | sed 's/.*"status":{"name":"\([^"]*\)".*/\1/')
        log "📋 Текущий статус: $status"
        echo "$status"
        return 0
    else
        log "❌ Ошибка получения статуса: $response"
        return 1
    fi
}

# Функция для симуляции изменения статуса через админ API
simulate_admin_status_change() {
    local order_id=$(cat "$ORDER_ID_FILE")
    local new_status="$1"
    
    log "🔄 Симуляция изменения статуса на '$new_status' через админ API..."
    
    # Используем админский API для изменения статуса
    response=$(curl -s "$API_BASE/api/v1/admin/orders/$order_id/status" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "{\"status\": \"$new_status\"}")
    
    if echo "$response" | grep -q '"status"' || [ "$response" = "" ]; then
        log "✅ Статус изменен на '$new_status'"
        log "📱 Уведомление должно быть отправлено пользователю"
        return 0
    else
        log "❌ Ошибка изменения статуса: $response"
        return 1
    fi
}

# Функция для проверки логов уведомлений
check_notification_logs() {
    local order_id=$(cat "$ORDER_ID_FILE")
    log "📋 Проверка логов уведомлений в контейнере..."
    
    # Проверяем логи контейнера на наличие записей об отправке уведомлений
    if docker logs magicvetov-app 2>&1 | tail -50 | grep -q "Уведомление о статусе заказа #$order_id отправлено"; then
        log "✅ В логах найдены записи об отправке уведомлений"
        docker logs magicvetov-app 2>&1 | tail -20 | grep "уведомление\|Уведомление\|статус" || true
    else
        log "⚠️ В логах не найдены записи об отправке уведомлений"
        log "📋 Последние логи:"
        docker logs magicvetov-app 2>&1 | tail -10
    fi
}

# Основной тест
main() {
    log "🚀 Начало тестирования уведомлений"
    
    # Авторизация
    if ! auth; then
        exit 1
    fi
    
    # Создание тестового заказа
    if ! create_test_order; then
        exit 1
    fi
    
    local order_id=$(cat "$ORDER_ID_FILE")
    log "🎯 Заказ для тестирования: #$order_id"
    
    # Проверка начального статуса
    initial_status=$(check_order_status)
    log "📊 Начальный статус: $initial_status"
    
    # Тестируем изменения статусов
    log "🔄 Тестирование изменений статусов..."
    
    # Переводим в "Готовится"
    log "1️⃣ Переводим в статус 'PREPARING'"
    if simulate_admin_status_change "PREPARING"; then
        sleep 2
        check_order_status
        check_notification_logs
    fi
    
    echo ""
    
    # Переводим в "Готов"
    log "2️⃣ Переводим в статус 'READY'"
    if simulate_admin_status_change "READY"; then
        sleep 2
        check_order_status
        check_notification_logs
    fi
    
    echo ""
    
    # Переводим в "Доставляется"
    log "3️⃣ Переводим в статус 'DELIVERING'"
    if simulate_admin_status_change "DELIVERING"; then
        sleep 2
        check_order_status
        check_notification_logs
    fi
    
    echo ""
    
    # Переводим в "Доставлен"
    log "4️⃣ Переводим в статус 'DELIVERED'"
    if simulate_admin_status_change "DELIVERED"; then
        sleep 2
        check_order_status
        check_notification_logs
    fi
    
    echo ""
    log "✅ Тестирование завершено!"
    log "📋 Заказ #$order_id прошел через все статусы"
    log "📱 Проверьте Telegram бот на наличие уведомлений"
    
    # Показываем итоговые логи
    log "📄 Итоговые логи уведомлений:"
    docker logs magicvetov-app 2>&1 | grep -E "(Уведомление|уведомление|статус.*заказа.*#$order_id)" | tail -10 || log "Логи уведомлений не найдены"
}

# Очистка временных файлов при выходе
cleanup() {
    rm -f "$TOKEN_FILE" "$ORDER_ID_FILE"
}
trap cleanup EXIT

# Запуск
main "$@"
