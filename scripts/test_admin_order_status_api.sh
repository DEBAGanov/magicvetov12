#!/bin/bash

# Тестирование API обновления статуса заказа
# Проверка ТЗ 2: PUT /api/v1/admin/orders/{orderId}/status

set -e

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"

echo "🧪 Тестирование API обновления статуса заказа"
echo "=============================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Проверка доступности сервера
log "Проверка доступности сервера..."
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
    error "Сервер недоступен по адресу $BASE_URL"
    exit 1
fi
success "Сервер доступен"

# Функция для получения JWT токена администратора
get_admin_token() {
    log "Получение JWT токена администратора..."
    
    # Попробуем зарегистрировать админа (если не существует)
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin_order_test",
            "email": "admin_order@magicvetov.test",
            "password": "AdminPass123!",
            "firstName": "Admin",
            "lastName": "Order"
        }' || echo '{"error": "registration_failed"}')
    
    # Авторизация админа
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin_order_test",
            "password": "AdminPass123!"
        }')
    
    if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        success "JWT токен получен"
        echo "$TOKEN"
    else
        error "Не удалось получить JWT токен"
        echo "Ответ: $LOGIN_RESPONSE"
        return 1
    fi
}

# Создание тестового заказа
create_test_order() {
    log "Создание тестового заказа..."
    
    TOKEN=$1
    
    # Попробуем создать заказ (может потребовать товары в корзине)
    ORDER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_URL/orders" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "deliveryAddress": "Тестовый адрес доставки",
            "contactName": "Тест Заказчик",
            "contactPhone": "+79991234567",
            "comment": "Тестовый заказ для проверки API статусов"
        }')
    
    HTTP_STATUS=$(echo $ORDER_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $ORDER_RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$HTTP_STATUS" -eq 201 ] || [ "$HTTP_STATUS" -eq 200 ]; then
        ORDER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        if [ -n "$ORDER_ID" ]; then
            success "Тестовый заказ создан с ID: $ORDER_ID"
            echo "$ORDER_ID"
        else
            error "Не удалось извлечь ID заказа из ответа"
            return 1
        fi
    else
        warning "Не удалось создать тестовый заказ (HTTP $HTTP_STATUS), используем ID заказа = 1"
        echo "1"
    fi
}

# Тест 1: Проверка эндпоинта без авторизации
test_unauthorized_access() {
    log "Тест 1: Проверка доступа без авторизации"
    
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "$API_URL/admin/orders/1/status" \
        -H "Content-Type: application/json" \
        -d '{"statusName": "CONFIRMED"}')
    
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$HTTP_STATUS" -eq 401 ] || [ "$HTTP_STATUS" -eq 403 ]; then
        success "Неавторизованный доступ корректно заблокирован (HTTP $HTTP_STATUS)"
    else
        error "Ожидался HTTP 401/403, получен HTTP $HTTP_STATUS"
        echo "Ответ: $BODY"
    fi
}

# Тест 2: Проверка с некорректным статусом
test_invalid_status() {
    log "Тест 2: Проверка с некорректным статусом"
    
    TOKEN=$(get_admin_token)
    if [ $? -ne 0 ]; then
        error "Не удалось получить токен для тестирования"
        return 1
    fi
    
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "$API_URL/admin/orders/1/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"statusName": "INVALID_STATUS"}')
    
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "HTTP Status: $HTTP_STATUS"
    echo "Response Body: $BODY"
    
    if [ "$HTTP_STATUS" -eq 400 ]; then
        success "Некорректный статус корректно отклонен (HTTP $HTTP_STATUS)"
    else
        warning "Ожидался HTTP 400, получен HTTP $HTTP_STATUS"
    fi
}

# Тест 3: Проверка с корректными статусами
test_valid_statuses() {
    log "Тест 3: Проверка с корректными статусами"
    
    TOKEN=$(get_admin_token)
    if [ $? -ne 0 ]; then
        error "Не удалось получить токен для тестирования"
        return 1
    fi
    
    ORDER_ID=$(create_test_order "$TOKEN")
    
    # Тестируем различные статусы
    STATUSES=("CONFIRMED" "PREPARING" "READY" "DELIVERING" "DELIVERED")
    
    for STATUS in "${STATUSES[@]}"; do
        log "Тестирование статуса: $STATUS"
        
        RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "$API_URL/admin/orders/$ORDER_ID/status" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"statusName\": \"$STATUS\"}")
        
        HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
        
        echo "  Статус: $STATUS | HTTP: $HTTP_STATUS"
        
        if [ "$HTTP_STATUS" -eq 200 ]; then
            if echo "$BODY" | grep -q "\"status\":\"$STATUS\""; then
                success "  Статус $STATUS успешно установлен"
            else
                warning "  Статус установлен, но ответ не содержит ожидаемого статуса"
            fi
        elif [ "$HTTP_STATUS" -eq 400 ]; then
            if echo "$BODY" | grep -q "не найден"; then
                warning "  Заказ с ID $ORDER_ID не найден в БД"
            else
                error "  Ошибка валидации для статуса $STATUS: $BODY"
            fi
        elif [ "$HTTP_STATUS" -eq 500 ]; then
            error "  КРИТИЧЕСКАЯ ОШИБКА: HTTP 500 для статуса $STATUS"
            echo "  Ответ: $BODY"
            break
        else
            warning "  Неожиданный HTTP статус $HTTP_STATUS для $STATUS"
        fi
        
        sleep 1 # Небольшая пауза между запросами
    done
}

# Тест 4: Проверка с неверным ID заказа
test_invalid_order_id() {
    log "Тест 4: Проверка с несуществующим ID заказа"
    
    TOKEN=$(get_admin_token)
    if [ $? -ne 0 ]; then
        error "Не удалось получить токен для тестирования"
        return 1
    fi
    
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "$API_URL/admin/orders/999999/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"statusName": "CONFIRMED"}')
    
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "HTTP Status: $HTTP_STATUS"
    echo "Response Body: $BODY"
    
    if [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 400 ]; then
        success "Несуществующий заказ корректно обработан (HTTP $HTTP_STATUS)"
    else
        warning "Ожидался HTTP 404/400, получен HTTP $HTTP_STATUS"
    fi
}

# Запуск всех тестов
echo ""
test_unauthorized_access
echo ""
test_invalid_status
echo ""
test_valid_statuses
echo ""
test_invalid_order_id

echo ""
echo "=============================================="
echo "🏁 Тестирование завершено"
echo "==============================================" 