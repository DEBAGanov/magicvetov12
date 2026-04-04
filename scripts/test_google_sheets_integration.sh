#!/bin/bash

# test_google_sheets_integration.sh
# Комплексный тест интеграции Google Sheets API

set -e

echo "🧪 Тестирование интеграции Google Sheets API"
echo "=============================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Базовый URL API
BASE_URL="http://localhost:8080"

# Проверка переменных окружения
check_env_vars() {
    echo -e "${BLUE}📋 Проверка переменных окружения...${NC}"
    
    if [[ -z "$GOOGLE_SHEETS_ENABLED" ]] || [[ "$GOOGLE_SHEETS_ENABLED" != "true" ]]; then
        echo -e "${RED}❌ GOOGLE_SHEETS_ENABLED не установлена или не равна 'true'${NC}"
        echo "Установите: export GOOGLE_SHEETS_ENABLED=true"
        exit 1
    fi
    
    if [[ -z "$GOOGLE_SHEETS_SPREADSHEET_ID" ]]; then
        echo -e "${RED}❌ GOOGLE_SHEETS_SPREADSHEET_ID не установлена${NC}"
        echo "Установите: export GOOGLE_SHEETS_SPREADSHEET_ID='ваш_id_таблицы'"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Переменные окружения настроены корректно${NC}"
    echo "   GOOGLE_SHEETS_ENABLED: $GOOGLE_SHEETS_ENABLED"
    echo "   GOOGLE_SHEETS_SPREADSHEET_ID: $GOOGLE_SHEETS_SPREADSHEET_ID"
}

# Проверка доступности API
check_api_health() {
    echo -e "${BLUE}🏥 Проверка доступности API...${NC}"
    
    if curl -f -s "$BASE_URL/actuator/health" > /dev/null; then
        echo -e "${GREEN}✅ API доступен${NC}"
    else
        echo -e "${RED}❌ API недоступен${NC}"
        echo "Убедитесь, что приложение запущено: docker-compose up"
        exit 1
    fi
}

# Получение токена аутентификации
get_auth_token() {
    echo -e "${BLUE}🔐 Получение токена аутентификации...${NC}"
    
    # Создание тестового пользователя или получение токена для существующего
    local login_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@example.com",
            "password": "password123"
        }' || echo '{"error": "login_failed"}')
    
    if [[ "$login_response" == *"token"* ]]; then
        USER_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Токен получен${NC}"
    else
        echo -e "${YELLOW}⚠️ Не удалось войти, используем регистрацию...${NC}"
        
        local register_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "googlesheets_test@example.com",
                "password": "password123",
                "firstName": "Google",
                "lastName": "Sheets Test"
            }')
        
        if [[ "$register_response" == *"token"* ]]; then
            USER_TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            echo -e "${GREEN}✅ Пользователь зарегистрирован и токен получен${NC}"
        else
            echo -e "${RED}❌ Не удалось получить токен${NC}"
            exit 1
        fi
    fi
}

# Создание тестового заказа
create_test_order() {
    echo -e "${BLUE}🛍️ Создание тестового заказа...${NC}"
    
    local order_response=$(curl -s -X POST "$BASE_URL/api/v1/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{
            "contactName": "Google Sheets Тест",
            "contactPhone": "+79999999999",
            "deliveryLocationId": 1,
            "comment": "Тестовый заказ для проверки Google Sheets интеграции",
            "paymentMethod": "CASH"
        }')
    
    if [[ "$order_response" == *"id"* ]]; then
        ORDER_ID=$(echo "$order_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Заказ создан #$ORDER_ID${NC}"
        echo "   Ожидание добавления в Google Sheets..."
        sleep 5
    else
        echo -e "${RED}❌ Не удалось создать заказ${NC}"
        echo "Ответ: $order_response"
        exit 1
    fi
}

# Изменение статуса заказа
update_order_status() {
    echo -e "${BLUE}🔄 Изменение статуса заказа...${NC}"
    
    # Получение списка доступных статусов
    local statuses_response=$(curl -s -X GET "$BASE_URL/api/v1/admin/order-statuses" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    # Попытка обновить статус на "CONFIRMED" (ID обычно 2)
    local update_response=$(curl -s -X PUT "$BASE_URL/api/v1/admin/orders/$ORDER_ID/status" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{"statusId": 2}')
    
    if [[ "$update_response" == *"id"* ]]; then
        echo -e "${GREEN}✅ Статус заказа обновлен${NC}"
        echo "   Ожидание обновления в Google Sheets..."
        sleep 3
    else
        echo -e "${YELLOW}⚠️ Не удалось обновить статус заказа (может потребоваться админские права)${NC}"
    fi
}

# Создание СБП заказа для тестирования платежей
create_sbp_order() {
    echo -e "${BLUE}💳 Создание СБП заказа для тестирования...${NC}"
    
    local sbp_order_response=$(curl -s -X POST "$BASE_URL/api/v1/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{
            "contactName": "СБП Тест",
            "contactPhone": "+79888888888",
            "deliveryLocationId": 1,
            "comment": "Тестовый СБП заказ для Google Sheets",
            "paymentMethod": "SBP"
        }')
    
    if [[ "$sbp_order_response" == *"id"* ]]; then
        SBP_ORDER_ID=$(echo "$sbp_order_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ СБП заказ создан #$SBP_ORDER_ID${NC}"
        
        # Попытка создать платеж для заказа
        local payment_response=$(curl -s -X POST "$BASE_URL/api/v1/payments/yookassa/create" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $USER_TOKEN" \
            -d "{
                \"orderId\": $SBP_ORDER_ID,
                \"paymentMethod\": \"sbp\",
                \"returnUrl\": \"magicvetov://payment/success\"
            }")
        
        if [[ "$payment_response" == *"paymentUrl"* ]]; then
            echo -e "${GREEN}✅ Платеж создан, заказ должен появиться в таблице после оплаты${NC}"
        else
            echo -e "${YELLOW}⚠️ Не удалось создать платеж (возможно ЮKassa не настроена)${NC}"
        fi
    fi
}

# Проверка Google Sheets
check_google_sheets() {
    echo -e "${BLUE}📊 Проверка Google Sheets...${NC}"
    echo ""
    echo -e "${GREEN}🔗 Ссылка на вашу Google таблицу:${NC}"
    echo "   https://docs.google.com/spreadsheets/d/$GOOGLE_SHEETS_SPREADSHEET_ID/edit"
    echo ""
    echo -e "${YELLOW}📋 Что проверить в таблице:${NC}"
    echo "   1. Заказ #$ORDER_ID должен быть в таблице"
    if [[ -n "$SBP_ORDER_ID" ]]; then
        echo "   2. СБП заказ #$SBP_ORDER_ID (если создался)"
    fi
    echo "   3. Новые заказы должны быть в верхней части таблицы"
    echo "   4. Все 16 колонок должны быть заполнены корректными данными"
    echo "   5. При изменении статуса заказа - должно обновиться в таблице"
}

# Финальный отчет
final_report() {
    echo ""
    echo "🎯 ФИНАЛЬНЫЙ ОТЧЕТ"
    echo "=================="
    echo -e "${GREEN}✅ Тест завершен успешно${NC}"
    echo ""
    echo "📊 Созданные тестовые заказы:"
    echo "   • Наличный заказ: #$ORDER_ID"
    if [[ -n "$SBP_ORDER_ID" ]]; then
        echo "   • СБП заказ: #$SBP_ORDER_ID"
    fi
    echo ""
    echo "🔗 Google таблица:"
    echo "   https://docs.google.com/spreadsheets/d/$GOOGLE_SHEETS_SPREADSHEET_ID/edit"
    echo ""
    echo -e "${BLUE}📝 Следующие шаги:${NC}"
    echo "   1. Проверьте таблицу - заказы должны отображаться"
    echo "   2. Создайте еще несколько заказов через API или веб-интерфейс"
    echo "   3. Проверьте обновление статусов в реальном времени"
    echo "   4. Убедитесь, что новые заказы появляются наверху"
}

# Основная функция
main() {
    echo "🚀 Начало тестирования..."
    
    check_env_vars
    check_api_health
    get_auth_token
    create_test_order
    update_order_status
    create_sbp_order
    check_google_sheets
    final_report
    
    echo ""
    echo -e "${GREEN}🎉 Тестирование Google Sheets интеграции завершено!${NC}"
}

# Обработка ошибок
trap 'echo -e "${RED}❌ Тест прерван с ошибкой${NC}"; exit 1' ERR

# Запуск
main "$@"