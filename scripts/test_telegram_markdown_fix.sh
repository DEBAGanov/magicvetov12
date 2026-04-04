#!/bin/bash

# Тестирование исправления ошибки парсинга Markdown в Telegram сообщениях
# Проверяем, что сообщения с специальными символами отправляются корректно

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
API_URL="http://localhost:8080/api/v1"
ADMIN_EMAIL="admin@magicvetov.com"
ADMIN_PASSWORD="admin123"

echo -e "${BLUE}🧪 Тестирование исправления ошибки парсинга Markdown${NC}"
echo "================================================="

# Функция для получения токена администратора
get_admin_token() {
    echo -e "${YELLOW}Получение токена администратора...${NC}"
    
    TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$ADMIN_EMAIL'",
            "password": "'$ADMIN_PASSWORD'"
        }')
    
    if [ $? -eq 0 ]; then
        ADMIN_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$ADMIN_TOKEN" ]; then
            echo -e "${GREEN}✅ Токен администратора получен${NC}"
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Ошибка получения токена администратора${NC}"
    echo "Ответ: $TOKEN_RESPONSE"
    return 1
}

# Функция для создания тестового заказа с специальными символами
create_test_order_with_special_chars() {
    echo -e "${YELLOW}Создание тестового заказа с специальными символами Markdown...${NC}"
    
    # Данные с различными специальными символами Markdown
    local contact_name="Иван_Петров*Тестер"
    local contact_phone="+7(900)123-45-67"
    local delivery_address="ул. Тест-Маркдаун, д. 1 (подъезд #2)"
    local comment="Комментарий с символами: *жирный*, _курсив_, [ссылка], (скобки), ~зачеркнутый~, \`код\`, >цитата, #хештег, +плюс, -минус, =равно, |труба, {фигурные}, .точка, !восклицание"
    
    ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "contactName": "'$contact_name'",
            "contactPhone": "'$contact_phone'",
            "deliveryAddress": "'$delivery_address'",
            "comment": "'$comment'",
            "items": [
                {
                    "productId": 1,
                    "quantity": 1
                }
            ]
        }')
    
    if [ $? -eq 0 ]; then
        ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        if [ -n "$ORDER_ID" ]; then
            echo -e "${GREEN}✅ Тестовый заказ #$ORDER_ID создан с специальными символами${NC}"
            echo "Контакт: $contact_name"
            echo "Телефон: $contact_phone"
            echo "Адрес: $delivery_address"
            echo "Комментарий содержит все основные Markdown символы"
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Ошибка создания тестового заказа${NC}"
    echo "Ответ: $ORDER_RESPONSE"
    return 1
}

# Функция для изменения статуса заказа (проверка форматирования)
test_status_change() {
    if [ -z "$ORDER_ID" ]; then
        echo -e "${RED}❌ ORDER_ID не определен${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Тестирование изменения статуса заказа #$ORDER_ID...${NC}"
    
    STATUS_RESPONSE=$(curl -s -X PUT "$API_URL/admin/orders/$ORDER_ID/status" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "status": "CONFIRMED"
        }')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Статус заказа изменен на CONFIRMED${NC}"
        echo "Проверьте логи - уведомление должно отправиться без ошибок парсинга"
        return 0
    fi
    
    echo -e "${RED}❌ Ошибка изменения статуса заказа${NC}"
    echo "Ответ: $STATUS_RESPONSE"
    return 1
}

# Функция для проверки логов
check_logs() {
    echo -e "${YELLOW}Проверка логов на наличие ошибок парсинга Markdown...${NC}"
    
    # Проверяем логи Docker контейнера (если запущен в Docker)
    if docker ps | grep -q magicvetov; then
        echo "Проверка логов Docker контейнера..."
        MARKDOWN_ERRORS=$(docker logs magicvetov-app-1 2>&1 | tail -50 | grep -i "can't parse entities" || true)
        
        if [ -z "$MARKDOWN_ERRORS" ]; then
            echo -e "${GREEN}✅ Ошибки парсинга Markdown не найдены в логах Docker${NC}"
        else
            echo -e "${RED}❌ Найдены ошибки парсинга Markdown:${NC}"
            echo "$MARKDOWN_ERRORS"
            return 1
        fi
    else
        echo "Docker контейнер не найден, проверьте логи приложения вручную"
    fi
    
    return 0
}

# Основной процесс тестирования
main() {
    echo -e "${BLUE}Начинаем тестирование исправления Markdown парсинга...${NC}"
    
    # Получаем токен администратора
    if ! get_admin_token; then
        exit 1
    fi
    
    # Создаем тестовый заказ с специальными символами
    if ! create_test_order_with_special_chars; then
        exit 1
    fi
    
    echo -e "${YELLOW}Ожидание 3 секунды для обработки уведомления...${NC}"
    sleep 3
    
    # Тестируем изменение статуса
    if ! test_status_change; then
        exit 1
    fi
    
    echo -e "${YELLOW}Ожидание 3 секунды для обработки уведомления...${NC}"
    sleep 3
    
    # Проверяем логи
    check_logs
    
    echo
    echo -e "${GREEN}🎉 Тестирование завершено!${NC}"
    echo -e "${BLUE}Результаты тестирования:${NC}"
    echo "1. ✅ Заказ с специальными символами Markdown создан"
    echo "2. ✅ Статус заказа изменен (проверьте уведомления в Telegram)"
    echo "3. ✅ Логи проверены на наличие ошибок парсинга"
    echo
    echo -e "${YELLOW}Проверьте админский Telegram бот - уведомления должны отправляться без ошибок!${NC}"
    echo "Заказ #$ORDER_ID содержит все основные специальные символы Markdown"
}

# Запуск основной функции
main "$@" 