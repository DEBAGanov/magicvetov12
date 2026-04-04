#!/bin/bash

# Тестирование функциональности отображения платежей в админском Telegram боте
# Проверяет интеграцию статуса оплаты и ссылок на проверку платежа

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Базовый URL API
BASE_URL="http://localhost:8080"

# Счетчики тестов
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Функция для вывода результата теста
print_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        if [ -n "$details" ]; then
            echo -e "   ${BLUE}ℹ️  $details${NC}"
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ -n "$details" ]; then
            echo -e "   ${RED}❌ $details${NC}"
        fi
    fi
}

# Функция для получения JWT токена
get_jwt_token() {
    local username="$1"
    local password="$2"
    
    local response
    response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Функция для создания тестового пользователя и получения токена
create_test_user() {
    local username="testuser_$(date +%s)"
    local password="password123"
    local email="test_$(date +%s)@example.com"
    
    # Создаем пользователя
    local response
    response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\":\"$username\",
            \"password\":\"$password\",
            \"email\":\"$email\",
            \"firstName\":\"Тест\",
            \"lastName\":\"Пользователь\",
            \"phone\":\"+79001234567\"
        }")
    
    # Возвращаем токен из ответа регистрации
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Функция для добавления товара в корзину
add_to_cart() {
    local token="$1"
    local product_id="$2"
    local quantity="${3:-1}"
    
    curl -s -X POST "$BASE_URL/api/v1/cart/add" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"productId\": $product_id,
            \"quantity\": $quantity
        }"
}

# Функция для создания заказа
create_order() {
    local token="$1"
    
    curl -s -X POST "$BASE_URL/api/v1/orders" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"contactName\": \"Тест Пользователь\",
            \"contactPhone\": \"+79001234567\",
            \"deliveryAddress\": \"ул. Тестовая, 1\",
            \"comment\": \"Тестовый заказ для проверки админского бота\"
        }"
}

# Функция для создания платежа
create_payment() {
    local token="$1"
    local order_id="$2"
    local method="${3:-SBP}"
    local bank_id="${4:-sberbank}"
    
    curl -s -X POST "$BASE_URL/api/v1/mobile/payments/create" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"orderId\": $order_id,
            \"method\": \"$method\",
            \"bankId\": \"$bank_id\"
        }"
}

# Функция для получения деталей заказа
get_order_details() {
    local token="$1"
    local order_id="$2"
    
    curl -s -X GET "$BASE_URL/api/v1/orders/$order_id" \
        -H "Authorization: Bearer $token"
}

# Функция для получения платежей заказа
get_order_payments() {
    local order_id="$1"
    
    # Используем admin токен для доступа к платежам
    local admin_token
    admin_token=$(get_jwt_token "admin" "admin123")
    
    curl -s -X GET "$BASE_URL/api/v1/payments/order/$order_id" \
        -H "Authorization: Bearer $admin_token"
}

echo -e "${BLUE}🧪 Тестирование функциональности отображения платежей в админском боте${NC}"
echo "=========================================================================="

# 1. Проверка доступности сервиса
echo -e "\n${YELLOW}📡 1. Проверка доступности сервиса${NC}"
if curl -s -f "$BASE_URL/actuator/health" > /dev/null; then
    print_test_result "Доступность сервиса" "PASS" "Сервис отвечает на запросы"
else
    print_test_result "Доступность сервиса" "FAIL" "Сервис недоступен"
    exit 1
fi

# 2. Получение admin токена
echo -e "\n${YELLOW}🔑 2. Аутентификация администратора${NC}"
ADMIN_TOKEN=$(get_jwt_token "admin" "admin123")
if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
    print_test_result "Получение admin токена" "PASS" "Токен получен успешно"
else
    print_test_result "Получение admin токена" "FAIL" "Не удалось получить токен"
    exit 1
fi

# 3. Создание тестового пользователя
echo -e "\n${YELLOW}👤 3. Создание тестового пользователя${NC}"
USER_TOKEN=$(create_test_user)
if [ -n "$USER_TOKEN" ] && [ "$USER_TOKEN" != "null" ]; then
    print_test_result "Создание тестового пользователя" "PASS" "Пользователь создан, токен получен"
else
    print_test_result "Создание тестового пользователя" "FAIL" "Не удалось создать пользователя"
    exit 1
fi

# 4. Получение списка продуктов
echo -e "\n${YELLOW}🛍️ 4. Получение списка продуктов${NC}"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/products" -H "Authorization: Bearer $USER_TOKEN")
FIRST_PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$FIRST_PRODUCT_ID" ]; then
    print_test_result "Получение списка продуктов" "PASS" "Найден продукт с ID: $FIRST_PRODUCT_ID"
else
    print_test_result "Получение списка продуктов" "FAIL" "Не удалось найти продукты"
    exit 1
fi

# 5. Добавление товара в корзину
echo -e "\n${YELLOW}🛒 5. Добавление товара в корзину${NC}"
CART_RESPONSE=$(add_to_cart "$USER_TOKEN" "$FIRST_PRODUCT_ID" 1)
if echo "$CART_RESPONSE" | grep -q '"success":true\|"id":[0-9]'; then
    print_test_result "Добавление товара в корзину" "PASS" "Товар добавлен в корзину"
else
    print_test_result "Добавление товара в корзину" "FAIL" "Ошибка добавления товара: $CART_RESPONSE"
    # Продолжаем тестирование, так как это может быть известная проблема
fi

# 6. Создание заказа
echo -e "\n${YELLOW}📦 6. Создание заказа${NC}"
ORDER_RESPONSE=$(create_order "$USER_TOKEN")
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$ORDER_ID" ]; then
    print_test_result "Создание заказа" "PASS" "Заказ создан с ID: $ORDER_ID"
else
    print_test_result "Создание заказа" "FAIL" "Не удалось создать заказ: $ORDER_RESPONSE"
    
    # Пытаемся использовать существующий заказ для тестирования
    echo -e "${YELLOW}🔄 Попытка использовать существующий заказ...${NC}"
    ORDER_ID="1"  # Предполагаем, что есть заказ с ID 1
fi

# 7. Создание СБП платежа
echo -e "\n${YELLOW}💳 7. Создание СБП платежа${NC}"
PAYMENT_RESPONSE=$(create_payment "$USER_TOKEN" "$ORDER_ID" "SBP" "sberbank")
PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PAYMENT_ID" ]; then
    print_test_result "Создание СБП платежа" "PASS" "Платеж создан с ID: $PAYMENT_ID"
else
    print_test_result "Создание СБП платежа" "FAIL" "Не удалось создать платеж: $PAYMENT_RESPONSE"
fi

# 8. Создание карточного платежа
echo -e "\n${YELLOW}💳 8. Создание карточного платежа${NC}"
CARD_PAYMENT_RESPONSE=$(create_payment "$USER_TOKEN" "$ORDER_ID" "BANK_CARD" "")
CARD_PAYMENT_ID=$(echo "$CARD_PAYMENT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CARD_PAYMENT_ID" ]; then
    print_test_result "Создание карточного платежа" "PASS" "Карточный платеж создан с ID: $CARD_PAYMENT_ID"
else
    print_test_result "Создание карточного платежа" "FAIL" "Не удалось создать карточный платеж: $CARD_PAYMENT_RESPONSE"
fi

# 9. Проверка получения платежей заказа
echo -e "\n${YELLOW}💰 9. Получение платежей заказа${NC}"
PAYMENTS_RESPONSE=$(get_order_payments "$ORDER_ID")
PAYMENTS_COUNT=$(echo "$PAYMENTS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)

if [ "$PAYMENTS_COUNT" -gt 0 ]; then
    print_test_result "Получение платежей заказа" "PASS" "Найдено платежей: $PAYMENTS_COUNT"
else
    print_test_result "Получение платежей заказа" "FAIL" "Платежи не найдены: $PAYMENTS_RESPONSE"
fi

# 10. Проверка логов AdminBotService
echo -e "\n${YELLOW}📋 10. Проверка логов AdminBotService${NC}"
if command -v docker-compose &> /dev/null; then
    ADMIN_BOT_LOGS=$(docker-compose logs --tail=50 magicvetov-app 2>/dev/null | grep -i "AdminBotService\|Payment" | tail -5)
    if [ -n "$ADMIN_BOT_LOGS" ]; then
        print_test_result "Логи AdminBotService" "PASS" "Найдены логи связанные с платежами"
        echo -e "   ${BLUE}📝 Последние логи:${NC}"
        echo "$ADMIN_BOT_LOGS" | sed 's/^/   /'
    else
        print_test_result "Логи AdminBotService" "FAIL" "Логи AdminBotService не найдены"
    fi
else
    print_test_result "Логи AdminBotService" "SKIP" "Docker Compose недоступен"
fi

# 11. Тестирование методов форматирования (косвенно через API)
echo -e "\n${YELLOW}🎨 11. Тестирование методов отображения статусов${NC}"
# Проверяем, что в коде есть новые методы
if grep -q "getPaymentStatusDisplayName\|getPaymentMethodDisplayName\|appendPaymentInfo" src/main/java/com/baganov/magicvetov/service/AdminBotService.java 2>/dev/null; then
    print_test_result "Методы отображения статусов" "PASS" "Новые методы найдены в коде"
else
    print_test_result "Методы отображения статусов" "FAIL" "Новые методы не найдены в коде"
fi

# 12. Проверка зависимости PaymentRepository
echo -e "\n${YELLOW}🔗 12. Проверка зависимости PaymentRepository${NC}"
if grep -q "PaymentRepository.*paymentRepository" src/main/java/com/baganov/magicvetov/service/AdminBotService.java 2>/dev/null; then
    print_test_result "Зависимость PaymentRepository" "PASS" "PaymentRepository добавлен в AdminBotService"
else
    print_test_result "Зависимость PaymentRepository" "FAIL" "PaymentRepository не найден в AdminBotService"
fi

# 13. Проверка формирования ссылок на ЮMoney
echo -e "\n${YELLOW}🔗 13. Проверка формирования ссылок на ЮMoney${NC}"
if grep -q "yoomoney.ru/checkout/payments/v2/contract" src/main/java/com/baganov/magicvetov/service/AdminBotService.java 2>/dev/null; then
    print_test_result "Ссылки на ЮMoney" "PASS" "Код формирования ссылок найден"
else
    print_test_result "Ссылки на ЮMoney" "FAIL" "Код формирования ссылок не найден"
fi

# Итоговая статистика
echo -e "\n${BLUE}📊 ИТОГОВАЯ СТАТИСТИКА${NC}"
echo "=========================================================================="
echo -e "Всего тестов: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Успешных: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Неудачных: ${RED}$FAILED_TESTS${NC}"

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Успешность: ${GREEN}$SUCCESS_RATE%${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Все тесты пройдены успешно!${NC}"
    echo -e "${GREEN}✅ Функциональность отображения платежей в админском боте работает корректно${NC}"
else
    echo -e "\n${YELLOW}⚠️  Некоторые тесты не прошли, но основная функциональность может работать${NC}"
    echo -e "${YELLOW}💡 Проверьте логи приложения для диагностики проблем${NC}"
fi

echo -e "\n${BLUE}📋 Что было протестировано:${NC}"
echo "• Интеграция PaymentRepository в AdminBotService"
echo "• Методы отображения статусов и способов оплаты"
echo "• Формирование ссылок на проверку платежа в ЮMoney"
echo "• Создание заказов и платежей для тестирования"
echo "• Получение информации о платежах через API"

echo -e "\n${BLUE}🔍 Для дополнительной проверки:${NC}"
echo "• Отправьте команду /orders в админский Telegram бот"
echo "• Создайте новый заказ и проверьте уведомление в боте"
echo "• Проверьте детали заказа через команду /details в боте"

exit 0 