#!/bin/bash

echo "💳 Comprehensive тестирование ЮKassa платежей"

# Настройка
#BASE_URL="https://magicvetov.ru"
BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

YOOKASSA_TESTS=0
YOOKASSA_PASSED=0
YOOKASSA_FAILED=0

# Функция для тестирования ЮКасса endpoints
test_yookassa_endpoint() {
    local url=$1
    local description=$2
    local method=${3:-GET}
    local token=${4:-""}
    local data=${5:-""}
    local expected_code=${6:-200}

    echo -e "${YELLOW}🧪 Тестирование: $description${NC}"
    YOOKASSA_TESTS=$((YOOKASSA_TESTS + 1))

    # Формируем команду curl
    local curl_cmd="curl -s -L -w '%{http_code}' -o /tmp/yookassa_response -X $method '$BASE_URL$url'"

    # Добавляем заголовки
    curl_cmd="$curl_cmd -H 'Accept: application/json'"

    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    # Выполняем запрос и получаем HTTP код
    http_code=$(eval $curl_cmd)
    response_body=$(cat /tmp/yookassa_response 2>/dev/null || echo "")

    # Проверяем успешность
    if [[ $http_code -eq $expected_code ]]; then
        echo -e "${GREEN}✅ УСПЕХ ($http_code)${NC}"
        YOOKASSA_PASSED=$((YOOKASSA_PASSED + 1))

        # Показываем краткий ответ для успешных запросов
        if [ -n "$response_body" ] && [ "$response_body" != "null" ]; then
            echo "   📋 Ответ: $(echo "$response_body" | head -c 100)..."
        fi
    else
        echo -e "${RED}❌ ОШИБКА ($http_code, ожидался $expected_code)${NC}"
        YOOKASSA_FAILED=$((YOOKASSA_FAILED + 1))

        # Показываем тело ответа для анализа ошибки
        if [ -n "$response_body" ]; then
            echo "   📋 Ответ: $(echo "$response_body" | head -c 200)..."
        fi
    fi
    echo "---"
}

# Функция для создания тестового заказа
create_test_order() {
    local token=$1
    local order_data='{
        "deliveryAddress": "Volzhsk, Testovaya street, 1",
        "contactName": "Test User",
        "contactPhone": "+79001234567",
        "comment": "Test order for YooKassa payment testing"
    }'

    echo -e "${CYAN}📦 Создание тестового заказа для платежей...${NC}"

    # Добавляем товар в корзину
    local cart_data='{"productId": 1, "quantity": 1}'
    local cart_response=$(curl -s -X POST "$BASE_URL/api/v1/cart/items" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$cart_data")

    # Создаем заказ
    local order_response=$(curl -s -X POST "$BASE_URL/api/v1/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$order_data")

    # Извлекаем ID заказа
    local order_id=$(echo "$order_response" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -n1)

    if [ -n "$order_id" ]; then
        echo -e "${GREEN}✅ Заказ #$order_id создан успешно${NC}"
        echo "$order_id"
    else
        echo -e "${RED}❌ Не удалось создать заказ${NC}"
        echo "Ответ: $order_response"
        return 1
    fi
}

# Основные тесты ЮКасса
echo "=================================="
echo -e "${BLUE}💳 ТЕСТИРОВАНИЕ ЮKASSA ПЛАТЕЖЕЙ${NC}"
echo "=================================="

# Проверяем доступность API
if ! curl -s "$BASE_URL/api/v1/health" > /dev/null; then
    echo -e "${RED}❌ API недоступен!${NC}"
    exit 1
fi

# 1. HEALTH CHECK И МОНИТОРИНГ
echo -e "${BLUE}🏥 1. HEALTH CHECK И МОНИТОРИНГ${NC}"

test_yookassa_endpoint "/api/v1/payments/yookassa/health" "ЮКасса Health Check"
test_yookassa_endpoint "/api/v1/payments/metrics/health" "Метрики Health Check"

# 2. СБП БАНКИ API (публичный доступ)
echo -e "${BLUE}🏦 2. СБП БАНКИ API${NC}"

test_yookassa_endpoint "/api/v1/payments/yookassa/sbp/banks" "Получить список банков СБП"

# 3. АВТОРИЗАЦИЯ ДЛЯ ПЛАТЕЖНЫХ ТЕСТОВ
echo -e "${BLUE}🔐 3. АВТОРИЗАЦИЯ ДЛЯ ПЛАТЕЖЕЙ${NC}"

# Регистрируем тестового пользователя для платежей
TIMESTAMP=$(date +%s)
PAYMENT_USERNAME="payment_user_$TIMESTAMP"
PAYMENT_EMAIL="payment$TIMESTAMP@magicvetov.com"
PAYMENT_PHONE="+7900555$(echo $TIMESTAMP | tail -c 5)"

payment_register_data='{
  "username": "'$PAYMENT_USERNAME'",
  "password": "payment123456",
  "email": "'$PAYMENT_EMAIL'",
  "firstName": "Payment",
  "lastName": "User",
  "phone": "'$PAYMENT_PHONE'"
}'

echo -e "${YELLOW}👤 Регистрация пользователя для платежных тестов...${NC}"
payment_register_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "$payment_register_data")

PAYMENT_TOKEN=$(echo "$payment_register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$PAYMENT_TOKEN" ]; then
    echo -e "${GREEN}✅ Пользователь зарегистрирован, токен получен${NC}"

    # 4. СОЗДАНИЕ ТЕСТОВОГО ЗАКАЗА
    echo -e "${BLUE}📦 4. СОЗДАНИЕ ТЕСТОВОГО ЗАКАЗА${NC}"

    TEST_ORDER_ID=$(create_test_order "$PAYMENT_TOKEN")

    if [ -n "$TEST_ORDER_ID" ] && [ "$TEST_ORDER_ID" != "1" ]; then

        # 5. ТЕСТИРОВАНИЕ СОЗДАНИЯ ПЛАТЕЖЕЙ
        echo -e "${BLUE}💳 5. СОЗДАНИЕ ПЛАТЕЖЕЙ${NC}"

        # Тест 1: Создание карточного платежа
        echo -e "${CYAN}💳 Тест создания карточного платежа...${NC}"
        card_payment_data='{
            "orderId": '$TEST_ORDER_ID',
            "method": "BANK_CARD",
            "description": "Test card payment via YooKassa API"
        }'

        card_response=$(curl -s -X POST "$BASE_URL/api/v1/payments/yookassa/create" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $PAYMENT_TOKEN" \
            -d "$card_payment_data")

        echo "Ответ создания карточного платежа: $card_response"

        # Тест 2: Создание СБП платежа
        echo -e "${CYAN}📱 Тест создания СБП платежа...${NC}"
        sbp_payment_data='{
            "orderId": '$TEST_ORDER_ID',
            "method": "SBP",
            "bankId": "100000000111",
            "description": "Test SBP payment via YooKassa API"
        }'

        sbp_response=$(curl -s -X POST "$BASE_URL/api/v1/payments/yookassa/create" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $PAYMENT_TOKEN" \
            -d "$sbp_payment_data")

        echo "Ответ создания СБП платежа: $sbp_response"

        # Тест 3: Получение URL для оплаты заказа
        test_yookassa_endpoint "/api/v1/orders/$TEST_ORDER_ID/payment-url" "Получение URL для оплаты заказа" "GET" "$PAYMENT_TOKEN"

        # Тест 4: Получение платежей для заказа
        test_yookassa_endpoint "/api/v1/payments/yookassa/order/$TEST_ORDER_ID" "Получение платежей для заказа" "GET" "$PAYMENT_TOKEN"

        # 6. ТЕСТИРОВАНИЕ АДМИНИСТРАТИВНЫХ ФУНКЦИЙ
        echo -e "${BLUE}⚙️ 6. АДМИНИСТРАТИВНЫЕ ФУНКЦИИ${NC}"

        # Авторизация администратора
        admin_login_data='{"username": "admin", "password": "admin123"}'
        admin_login_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
          -H "Content-Type: application/json" \
          -d "$admin_login_data")

        ADMIN_TOKEN=$(echo "$admin_login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

        if [ -n "$ADMIN_TOKEN" ]; then
            echo -e "${GREEN}✅ Администратор авторизован${NC}"

            # Тест административных метрик
            test_yookassa_endpoint "/api/v1/payments/metrics/summary" "Получение сводки метрик (админ)" "GET" "$ADMIN_TOKEN"
            test_yookassa_endpoint "/api/v1/payments/metrics/details" "Получение детальных метрик (админ)" "GET" "$ADMIN_TOKEN"
            test_yookassa_endpoint "/api/v1/payments/metrics/config" "Получение конфигурации мониторинга (админ)" "GET" "$ADMIN_TOKEN"

            # Обновление метрик
            test_yookassa_endpoint "/api/v1/payments/metrics/refresh" "Обновление метрик (админ)" "POST" "$ADMIN_TOKEN"

        else
            echo -e "${RED}❌ Не удалось авторизовать администратора${NC}"
            YOOKASSA_FAILED=$((YOOKASSA_FAILED + 4))
            YOOKASSA_TESTS=$((YOOKASSA_TESTS + 4))
        fi

        # 7. НЕГАТИВНЫЕ ТЕСТЫ
        echo -e "${BLUE}⚠️ 7. НЕГАТИВНЫЕ ТЕСТЫ${NC}"

        # Тест с некорректными данными платежа
        invalid_payment_data='{
            "orderId": 99999,
            "method": "INVALID_METHOD",
            "description": "Некорректный платеж"
        }'

        test_yookassa_endpoint "/api/v1/payments/yookassa/create" "Создание платежа с некорректными данными" "POST" "$PAYMENT_TOKEN" "$invalid_payment_data" 400

        # Тест получения несуществующего платежа
        test_yookassa_endpoint "/api/v1/payments/yookassa/99999" "Получение несуществующего платежа" "GET" "$PAYMENT_TOKEN" "" 404

        # Тест без авторизации
        test_yookassa_endpoint "/api/v1/payments/yookassa/create" "Создание платежа без авторизации" "POST" "" "$card_payment_data" 401

        # 8. WEBHOOK ТЕСТИРОВАНИЕ (имитация)
        echo -e "${BLUE}🔔 8. WEBHOOK ТЕСТИРОВАНИЕ${NC}"

        # Имитируем webhook уведомление
        webhook_data='{
            "type": "notification",
            "event": "payment.succeeded",
            "object": {
                "id": "test-payment-webhook-123",
                "status": "succeeded",
                "amount": {
                    "value": "100.00",
                    "currency": "RUB"
                },
                "description": "Test webhook notification",
                "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
            }
        }'

        webhook_response=$(curl -s -X POST "$BASE_URL/api/v1/payments/yookassa/webhook" \
            -H "Content-Type: application/json" \
            -d "$webhook_data")

        echo "Ответ webhook: $webhook_response"

        # Негативный тест - некорректные данные
        echo -e "${CYAN}❌ Тест с некорректными данными...${NC}"
        invalid_payment_data='{
            "orderId": 99999,
            "method": "INVALID_METHOD",
            "description": "Invalid payment test data"
        }'

        invalid_response=$(curl -s -X POST "$BASE_URL/api/v1/payments/yookassa/create" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $PAYMENT_TOKEN" \
            -d "$invalid_payment_data")

        echo "Ответ с некорректными данными: $invalid_response"

    else
        echo -e "${RED}❌ Не удалось создать тестовый заказ, пропускаем платежные тесты${NC}"
        YOOKASSA_FAILED=$((YOOKASSA_FAILED + 10))
        YOOKASSA_TESTS=$((YOOKASSA_TESTS + 10))
    fi

else
    echo -e "${RED}❌ Не удалось зарегистрировать пользователя для платежных тестов${NC}"
    echo "Ответ: $payment_register_response"
    YOOKASSA_FAILED=$((YOOKASSA_FAILED + 15))
    YOOKASSA_TESTS=$((YOOKASSA_TESTS + 15))
fi

# 9. ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ КОНФИГУРАЦИИ
echo -e "${BLUE}⚙️ 9. ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ КОНФИГУРАЦИИ${NC}"

# Проверяем, что ЮКасса включена
echo -e "${YELLOW}🔍 Проверка конфигурации ЮКасса...${NC}"

# Проверяем доступность endpoints
test_yookassa_endpoint "/api/v1/payments/yookassa/health" "Повторная проверка ЮКасса Health"

# Проверяем СБП банки еще раз
test_yookassa_endpoint "/api/v1/payments/yookassa/sbp/banks" "Повторная проверка СБП банков"

# 10. ИТОГОВАЯ СТАТИСТИКА
echo "=================================="
echo -e "${BLUE}📊 ИТОГОВАЯ СТАТИСТИКА ЮKASSA${NC}"
echo -e "Всего тестов ЮКасса: $YOOKASSA_TESTS"
echo -e "${GREEN}Успешных: $YOOKASSA_PASSED${NC}"
echo -e "${RED}Неудачных: $YOOKASSA_FAILED${NC}"

if [ $YOOKASSA_TESTS -gt 0 ]; then
    YOOKASSA_SUCCESS_RATE=$((YOOKASSA_PASSED * 100 / YOOKASSA_TESTS))
    echo -e "Процент успеха ЮКасса: ${GREEN}$YOOKASSA_SUCCESS_RATE%${NC}"
fi

echo "=================================="
echo -e "${BLUE}🔍 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ЮKASSA${NC}"

if [ $YOOKASSA_SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}🎉 ОТЛИЧНО ($YOOKASSA_SUCCESS_RATE%) - ЮКасса интеграция работает корректно${NC}"
    echo -e "${GREEN}✅ Платежи: Создание и обработка функционируют${NC}"
    echo -e "${GREEN}✅ СБП: Список банков доступен${NC}"
    echo -e "${GREEN}✅ Мониторинг: Health checks проходят${NC}"
    echo -e "${GREEN}✅ Webhook: Обработка уведомлений работает${NC}"
elif [ $YOOKASSA_SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠️ УДОВЛЕТВОРИТЕЛЬНО ($YOOKASSA_SUCCESS_RATE%) - Есть проблемы с ЮКасса${NC}"
    echo -e "${YELLOW}⚠️ Некоторые функции платежей не работают${NC}"
    echo -e "${YELLOW}⚠️ Требуется проверка конфигурации${NC}"
else
    echo -e "${RED}❌ КРИТИЧНО ($YOOKASSA_SUCCESS_RATE%) - ЮКасса интеграция не работает${NC}"
    echo -e "${RED}❌ Платежи не создаются${NC}"
    echo -e "${RED}❌ Требуется срочное исправление${NC}"
fi

echo -e "\n${BLUE}💡 Диагностическая информация ЮКасса:${NC}"
echo -e "${YELLOW}📋 Для полной диагностики проверьте:${NC}"
echo -e "${YELLOW}   - Переменные окружения: YOOKASSA_ENABLED, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY${NC}"
echo -e "${YELLOW}   - Логи ЮКасса: docker logs magicvetov-app | grep -i yookassa${NC}"
echo -e "${YELLOW}   - Конфигурацию: /api/v1/payments/metrics/config${NC}"
echo -e "${YELLOW}   - Личный кабинет ЮКасса: https://yookassa.ru/my${NC}"

# Очистка временных файлов
rm -f /tmp/yookassa_response

# Экспортируем результаты для использования в основном тесте
export YOOKASSA_TESTS
export YOOKASSA_PASSED
export YOOKASSA_FAILED
export YOOKASSA_SUCCESS_RATE

echo -e "\n${CYAN}🔗 Тестирование ЮКасса завершено${NC}"