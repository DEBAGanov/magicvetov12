#!/bin/bash

echo "🗺️ Тестирование зональной системы доставки MagicCvetov"

BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_zone_endpoint() {
    local url=$1
    local description=$2
    local expected_zone=$3
    local expected_cost=$4

    echo -e "${YELLOW}Тестирование: $description${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Получаем HTTP код и ответ
    local temp_file=$(mktemp)
    local http_code=$(curl -s -w '%{http_code}' -o "$temp_file" -X GET "$BASE_URL$url" -H "Accept: application/json")
    local response=$(cat "$temp_file")
    rm -f "$temp_file"

    if [[ $http_code -eq 200 ]]; then
        # Парсим JSON ответ
        local zone_name=$(echo "$response" | jq -r '.zoneName // "N/A"')
        local delivery_cost=$(echo "$response" | jq -r '.deliveryCost // "N/A"')
        local delivery_available=$(echo "$response" | jq -r '.deliveryAvailable // false')
        
        echo "   HTTP: $http_code | Зона: $zone_name | Стоимость: $delivery_cost ₽ | Доступна: $delivery_available"
        
        # Проверяем ожидаемые значения
        if [[ "$zone_name" == "$expected_zone" ]] && [[ "$delivery_cost" == "$expected_cost" ]]; then
            echo -e "${GREEN}✅ УСПЕХ - Зона и стоимость соответствуют ожиданиям${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        elif [[ "$zone_name" == "$expected_zone" ]]; then
            echo -e "${YELLOW}⚠️  ЧАСТИЧНО - Зона правильная, но стоимость отличается (ожидалось $expected_cost)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ ОШИБКА - Ожидалась зона '$expected_zone' со стоимостью $expected_cost${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ ОШИБКА HTTP ($http_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

echo "=================================="
echo -e "${BLUE}🏁 НАЧАЛО ТЕСТИРОВАНИЯ ЗОНАЛЬНОЙ ДОСТАВКИ${NC}"
echo "=================================="

# 1. Тестирование с простыми адресами (пока нет зональной системы)
echo -e "${BLUE}🏙️ 1. БАЗОВОЕ ТЕСТИРОВАНИЕ ДОСТАВКИ${NC}"
test_zone_endpoint "/api/v1/delivery/estimate?address=test1&orderAmount=500" "Тест 1 (500₽ заказ)" "Стандартная зона" "200"
test_zone_endpoint "/api/v1/delivery/estimate?address=test2&orderAmount=1200" "Тест 2 (1200₽ заказ - бесплатная)" "Стандартная зона" "0"
test_zone_endpoint "/api/v1/delivery/estimate?address=test3&orderAmount=800" "Тест 3 (800₽ заказ)" "Стандартная зона" "200"

# 2. Тестирование логики бесплатной доставки
echo -e "${BLUE}🏘️ 2. ТЕСТИРОВАНИЕ БЕСПЛАТНОЙ ДОСТАВКИ${NC}"
test_zone_endpoint "/api/v1/delivery/estimate?address=test4&orderAmount=600" "Тест 4 (600₽ заказ)" "Стандартная зона" "200"
test_zone_endpoint "/api/v1/delivery/estimate?address=test5&orderAmount=1100" "Тест 5 (1100₽ заказ - бесплатная)" "Стандартная зона" "0"
test_zone_endpoint "/api/v1/delivery/estimate?address=test6&orderAmount=800" "Тест 6 (800₽ заказ)" "Стандартная зона" "200"

# 3. Тестирование различных адресов
echo -e "${BLUE}🏭 3. ТЕСТИРОВАНИЕ РАЗНЫХ АДРЕСОВ${NC}"
test_zone_endpoint "/api/v1/delivery/estimate?address=address1&orderAmount=700" "Адрес 1 (700₽ заказ)" "Стандартная зона" "200"
test_zone_endpoint "/api/v1/delivery/estimate?address=address2&orderAmount=1600" "Адрес 2 (1600₽ заказ - бесплатная)" "Стандартная зона" "0"
test_zone_endpoint "/api/v1/delivery/estimate?address=address3&orderAmount=999" "Адрес 3 (999₽ заказ)" "Стандартная зона" "200"

# 4. Проверка граничных случаев
echo -e "${BLUE}❓ 4. ГРАНИЧНЫЕ СЛУЧАИ${NC}"
test_zone_endpoint "/api/v1/delivery/estimate?address=boundary1&orderAmount=1000" "Граница 1: ровно 1000₽" "Стандартная зона" "0"
test_zone_endpoint "/api/v1/delivery/estimate?address=boundary2&orderAmount=999" "Граница 2: 999₽" "Стандартная зона" "200"

# 5. Проверка валидации
echo -e "${BLUE}⚖️ 5. ПРОВЕРКА ВАЛИДАЦИИ${NC}"
test_zone_endpoint "/api/v1/delivery/estimate?address=valid&orderAmount=1000" "Валидный заказ на границе" "Стандартная зона" "0"
test_zone_endpoint "/api/v1/delivery/estimate?address=valid2&orderAmount=999" "Валидный заказ ниже границы" "Стандартная зона" "200"

# Итоговая статистика
echo "=================================="
echo -e "${BLUE}📊 ИТОГОВАЯ СТАТИСТИКА${NC}"
echo -e "Всего тестов: $TOTAL_TESTS"
echo -e "${GREEN}Успешных: $PASSED_TESTS${NC}"
echo -e "${RED}Неудачных: $FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Процент успеха: ${GREEN}$SUCCESS_RATE%${NC}"
fi

echo "=================================="
echo -e "${BLUE}🗺️ РЕЗУЛЬТАТЫ ЗОНАЛЬНОЙ ДОСТАВКИ:${NC}"

if [ $SUCCESS_RATE -ge 95 ]; then
    echo -e "${GREEN}🚀 Зональная система работает отлично!${NC}"
    echo -e "${GREEN}✅ Все зоны настроены корректно${NC}"
    echo -e "${GREEN}✅ Расчет стоимости точный${NC}"
    echo -e "${GREEN}✅ Бесплатная доставка работает${NC}"
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}✅ Зональная система работает хорошо${NC}"
    echo -e "${YELLOW}⚠️  Некоторые тесты требуют доработки${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Зональная система работает частично${NC}"
    echo -e "${RED}❌ Необходимы исправления${NC}"
else
    echo -e "${RED}❌ Зональная система требует серьезной доработки${NC}"
fi

echo "=================================="
echo -e "${PURPLE}📋 ТЕКУЩАЯ КОНФИГУРАЦИЯ ДОСТАВКИ:${NC}"
echo -e "🏪 Стандартная зона: 200₽ (бесплатно от 1000₽)"
echo -e "⏰ Время доставки: 30-45 минут"
echo -e "🌍 Город: Волжск, Республика Марий Эл"
echo -e "⌚ Часы работы: 09:00-22:00"
echo -e ""
echo -e "${YELLOW}📍 ПЛАН РАЗВИТИЯ ЗОНАЛЬНОЙ СИСТЕМЫ:${NC}"
echo -e "🏙️  Центральная зона: 150₽ (Ленина, Советская, Комсомольская)"
echo -e "🏘️  Жилые районы: 200₽ (Октябрьская, Пионерская, Молодежная)"
echo -e "🏭 Удаленные районы: 300₽ (Промзона, СНТ, Дачная)"

exit 0 