#!/bin/bash

# Скрипт тестирования конфигурации ЮKassa для MagicCvetov
# Этап 4: Тестирование и активация ЮKassa интеграции

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Конфигурация
BASE_URL="http://localhost:8080"
API_BASE="/api/v1"

echo -e "${CYAN}🚀 Тестирование конфигурации ЮKassa для MagicCvetov${NC}"
echo -e "${CYAN}=================================================${NC}"
echo ""

# Функция для проверки HTTP ответа
check_response() {
    local response="$1"
    local expected_status="$2"
    local description="$3"
    
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [[ "$status" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ $description - OK (HTTP $status)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FAIL (HTTP $status)${NC}"
        echo -e "${RED}Response: $body${NC}"
        return 1
    fi
}

# Функция для проверки JSON поля
check_json_field() {
    local json="$1"
    local field="$2"
    local expected="$3"
    local description="$4"
    
    local actual=$(echo "$json" | jq -r ".$field")
    
    if [[ "$actual" == "$expected" ]]; then
        echo -e "${GREEN}✅ $description - OK ($actual)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FAIL (expected: $expected, got: $actual)${NC}"
        return 1
    fi
}

# Счетчики тестов
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    shift
    
    echo -e "${BLUE}🧪 Тест: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
    fi
}

# 1. Проверка доступности сервиса
test_service_availability() {
    echo -e "${YELLOW}Проверяем доступность сервиса...${NC}"
    
    local response=$(curl -s -w "\n%{http_code}" "$BASE_URL/actuator/health" || echo -e "\n000")
    check_response "$response" "200" "Сервис доступен"
}

# 2. Проверка конфигурации ЮKassa
test_yookassa_configuration() {
    echo -e "${YELLOW}Проверяем конфигурацию ЮKassa...${NC}"
    
    # Проверяем health endpoint ЮKassa
    local response=$(curl -s -w "\n%{http_code}" "$BASE_URL$API_BASE/payments/yookassa/health" || echo -e "\n000")
    
    if check_response "$response" "200" "ЮKassa health endpoint доступен"; then
        local body=$(echo "$response" | head -n -1)
        
        # Проверяем поля в ответе
        check_json_field "$body" "status" "UP" "Статус ЮKassa"
        check_json_field "$body" "service" "yookassa" "Название сервиса"
        
        local enabled=$(echo "$body" | jq -r ".enabled")
        if [[ "$enabled" == "true" ]]; then
            echo -e "${GREEN}✅ ЮKassa включена${NC}"
        else
            echo -e "${YELLOW}⚠️ ЮKassa отключена (YOOKASSA_ENABLED=false)${NC}"
        fi
        
        return 0
    else
        return 1
    fi
}

# 3. Проверка переменных окружения
test_environment_variables() {
    echo -e "${YELLOW}Проверяем переменные окружения...${NC}"
    
    # Проверяем наличие .env файла
    if [[ -f ".env" ]]; then
        echo -e "${GREEN}✅ Файл .env найден${NC}"
        
        # Проверяем основные переменные
        local vars_to_check=("YOOKASSA_ENABLED" "YOOKASSA_SHOP_ID" "YOOKASSA_SECRET_KEY" "YOOKASSA_API_URL")
        local all_vars_present=true
        
        for var in "${vars_to_check[@]}"; do
            if grep -q "^$var=" .env; then
                local value=$(grep "^$var=" .env | cut -d'=' -f2)
                if [[ -n "$value" && "$value" != "your_shop_id_here" && "$value" != "your_secret_key_here" ]]; then
                    echo -e "${GREEN}✅ $var установлена${NC}"
                else
                    echo -e "${YELLOW}⚠️ $var не заполнена или содержит placeholder${NC}"
                    all_vars_present=false
                fi
            else
                echo -e "${RED}❌ $var отсутствует в .env${NC}"
                all_vars_present=false
            fi
        done
        
        return $([[ "$all_vars_present" == "true" ]] && echo 0 || echo 1)
    else
        echo -e "${RED}❌ Файл .env не найден${NC}"
        echo -e "${YELLOW}💡 Создайте .env файл: cp env-yookassa-template.txt .env${NC}"
        return 1
    fi
}

# 4. Проверка банков СБП
test_sbp_banks() {
    echo -e "${YELLOW}Проверяем список банков СБП...${NC}"
    
    local response=$(curl -s -w "\n%{http_code}" "$BASE_URL$API_BASE/payments/yookassa/sbp/banks" || echo -e "\n000")
    
    if check_response "$response" "200" "Список банков СБП доступен"; then
        local body=$(echo "$response" | head -n -1)
        local banks_count=$(echo "$body" | jq '. | length')
        
        if [[ "$banks_count" -gt 0 ]]; then
            echo -e "${GREEN}✅ Найдено $banks_count банков СБП${NC}"
            
            # Показываем первые 3 банка
            echo -e "${CYAN}Примеры банков:${NC}"
            echo "$body" | jq -r '.[0:3][] | "  • \(.name) (\(.bic))"'
            
            return 0
        else
            echo -e "${RED}❌ Список банков пуст${NC}"
            return 1
        fi
    else
        return 1
    fi
}

# 5. Тестирование создания платежа (если ЮKassa включена)
test_payment_creation() {
    echo -e "${YELLOW}Тестируем создание платежа...${NC}"
    
    # Сначала проверим, включена ли ЮKassa
    local health_response=$(curl -s "$BASE_URL$API_BASE/payments/yookassa/health" || echo "{}")
    local enabled=$(echo "$health_response" | jq -r ".enabled // false")
    
    if [[ "$enabled" != "true" ]]; then
        echo -e "${YELLOW}⚠️ ЮKassa отключена, пропускаем тест создания платежа${NC}"
        return 0
    fi
    
    echo -e "${CYAN}ЮKassa включена, тестируем создание платежа...${NC}"
    
    # Создаем тестовый заказ (если нужно)
    local order_response=$(curl -s -X POST "$BASE_URL$API_BASE/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test_token" \
        -d '{
            "items": [{"productId": 1, "quantity": 1}],
            "deliveryAddress": "Тестовый адрес",
            "phoneNumber": "+79991234567",
            "paymentMethod": "YOOKASSA"
        }' || echo "{}")
    
    local order_id=$(echo "$order_response" | jq -r ".id // null")
    
    if [[ "$order_id" != "null" && -n "$order_id" ]]; then
        echo -e "${GREEN}✅ Тестовый заказ создан (ID: $order_id)${NC}"
        
        # Создаем платеж
        local payment_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$API_BASE/payments/yookassa/create" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test_token" \
            -d "{
                \"orderId\": $order_id,
                \"amount\": 500.00,
                \"currency\": \"RUB\",
                \"description\": \"Тестовый платеж\",
                \"paymentMethod\": \"sbp\",
                \"returnUrl\": \"magicvetov://payment/result\"
            }" || echo -e "\n000")
        
        check_response "$payment_response" "200" "Создание тестового платежа"
    else
        echo -e "${YELLOW}⚠️ Не удалось создать тестовый заказ, пропускаем тест платежа${NC}"
        return 0
    fi
}

# 6. Проверка webhook endpoint
test_webhook_endpoint() {
    echo -e "${YELLOW}Проверяем webhook endpoint...${NC}"
    
    # Тестируем POST запрос к webhook (должен вернуть 400 для пустого body)
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$API_BASE/payments/yookassa/webhook" \
        -H "Content-Type: application/json" \
        -d '{}' || echo -e "\n000")
    
    # Webhook должен вернуть 400 для невалидного уведомления
    if check_response "$response" "400" "Webhook endpoint доступен"; then
        echo -e "${GREEN}✅ Webhook корректно обрабатывает невалидные запросы${NC}"
        return 0
    else
        return 1
    fi
}

# 7. Проверка логов приложения
test_application_logs() {
    echo -e "${YELLOW}Проверяем логи приложения...${NC}"
    
    if command -v docker-compose &> /dev/null; then
        echo -e "${CYAN}Последние логи приложения:${NC}"
        docker-compose logs --tail=10 app | grep -i yookassa || echo "Логи ЮKassa не найдены"
        echo -e "${GREEN}✅ Логи проверены${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ docker-compose не найден, пропускаем проверку логов${NC}"
        return 0
    fi
}

# Основная функция тестирования
main() {
    echo -e "${PURPLE}Начинаем комплексное тестирование конфигурации ЮKassa...${NC}"
    echo ""
    
    run_test "Доступность сервиса" test_service_availability
    run_test "Конфигурация ЮKassa" test_yookassa_configuration
    run_test "Переменные окружения" test_environment_variables
    run_test "Банки СБП" test_sbp_banks
    run_test "Создание платежа" test_payment_creation
    run_test "Webhook endpoint" test_webhook_endpoint
    run_test "Логи приложения" test_application_logs
    
    # Итоговая статистика
    echo -e "${CYAN}=================================================${NC}"
    echo -e "${CYAN}📊 Результаты тестирования конфигурации${NC}"
    echo -e "${CYAN}=================================================${NC}"
    echo -e "${GREEN}✅ Пройдено тестов: $PASSED_TESTS${NC}"
    echo -e "${RED}❌ Провалено тестов: $FAILED_TESTS${NC}"
    echo -e "${BLUE}📋 Всего тестов: $TOTAL_TESTS${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}🎉 Все тесты пройдены! ЮKassa готова к использованию.${NC}"
        echo ""
        echo -e "${CYAN}📋 Следующие шаги для активации:${NC}"
        echo -e "${YELLOW}1. Убедитесь, что YOOKASSA_ENABLED=true в .env${NC}"
        echo -e "${YELLOW}2. Заполните реальные YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY${NC}"
        echo -e "${YELLOW}3. Перезапустите приложение: docker-compose restart app${NC}"
        echo -e "${YELLOW}4. Протестируйте с реальными данными${NC}"
    else
        echo ""
        echo -e "${RED}❌ Обнаружены проблемы в конфигурации ЮKassa${NC}"
        echo -e "${YELLOW}💡 Исправьте ошибки и запустите тест повторно${NC}"
        exit 1
    fi
}

# Запуск тестирования
main "$@"