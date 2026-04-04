#!/bin/bash

# Тестирование подсказок адресов для мобильного приложения
# Проверка новой логики: только названия улиц без города и региона

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Счетчики
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${BLUE}🏠 Тестирование подсказок адресов MagicCvetov${NC}"
echo "=================================================="
echo -e "${WHITE}Новая логика: только названия улиц Волжска для мобильного приложения${NC}"
echo

# Функция для тестирования подсказок
test_address_suggestions() {
    local test_name="$1"
    local query="$2"
    local expected_count="$3"
    local should_contain="$4"
    local should_not_contain="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}🧪 Тест $TOTAL_TESTS: $test_name${NC}"
    echo "   Запрос: '$query'"
    
    # Выполняем запрос к API подсказок с правильным URL кодированием
    response=$(curl -s -X GET \
        "http://localhost:8080/api/v1/delivery/address-suggestions" \
        -G --data-urlencode "query=${query}" \
        -H "Content-Type: application/json" \
        -w "\n%{http_code}")
    
    # Разделяем response и HTTP код
    http_code=$(echo "$response" | tail -n1)
    json_response=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        # Парсим JSON для получения количества результатов
        suggestions_count=$(echo "$json_response" | jq '. | length' 2>/dev/null || echo "0")
    
        echo "   Получено подсказок: $suggestions_count"
    
        # Проверяем количество результатов
        if [ "$suggestions_count" -ge "$expected_count" ]; then
            echo -e "   ✅ Количество результатов: OK ($suggestions_count >= $expected_count)"
        else
            echo -e "   ❌ Количество результатов: FAIL ($suggestions_count < $expected_count)"
            echo "$json_response" | jq '.' 2>/dev/null || echo "$json_response"
            return 1
        fi
        
        # Проверяем содержимое в shortAddress (если указано)
        if [ -n "$should_contain" ]; then
            if echo "$json_response" | jq -r '.[].shortAddress' | grep -q "$should_contain"; then
                echo -e "   ✅ shortAddress содержит '$should_contain': OK"
            else
                echo -e "   ❌ shortAddress не содержит '$should_contain': FAIL"
                echo "$json_response" | jq '.' 2>/dev/null || echo "$json_response"
                return 1
            fi
        fi
        
        # Проверяем что НЕ содержит в shortAddress (если указано)
        if [ -n "$should_not_contain" ]; then
            if echo "$json_response" | jq -r '.[].shortAddress' | grep -q "$should_not_contain"; then
                echo -e "   ❌ shortAddress содержит '$should_not_contain' (не должно): FAIL"
                echo "$json_response" | jq '.' 2>/dev/null || echo "$json_response"
                return 1
            else
                echo -e "   ✅ shortAddress не содержит '$should_not_contain': OK"
        fi
        fi
        
        # Показываем примеры подсказок
        echo "   Примеры подсказок:"
        echo "$json_response" | jq -r '.[0:3][] | "     - " + .shortAddress' 2>/dev/null || echo "     (не удалось распарсить)"
        
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "   ${GREEN}✅ ПРОЙДЕН${NC}"
        
    else
        echo -e "   ❌ HTTP ошибка: $http_code"
        echo "$json_response"
        return 1
    fi
    
    echo
}

echo -e "${WHITE}📍 Тестирование подсказок улиц Волжска${NC}"
echo

# Тест 1: Поиск по первой букве (минимум 2 символа)
test_address_suggestions \
    "Поиск улиц на 'Ле'" \
    "Ле" \
    1 \
    "Ленина" \
    "Волжск"

# Тест 2: Поиск по части названия
test_address_suggestions \
    "Поиск улиц 'Лен'" \
    "Лен" \
    1 \
    "Ленина" \
    "улица"

# Тест 3: Поиск улиц 'Садовая'
test_address_suggestions \
    "Поиск улиц 'Садовая'" \
    "Садовая" \
    1 \
    "Садовая" \
    "переулок"

# Тест 4: Поиск несуществующей улицы
test_address_suggestions \
    "Поиск несуществующей улицы" \
    "НесуществующаяУлица" \
    0 \
    "" \
    ""

# Тест 5: Поиск улиц на 'Промышленная'
test_address_suggestions \
    "Поиск 'Промышленная'" \
    "Промышленная" \
    1 \
    "Промышленная" \
    "Республика"

# Тест 6: Проверка что не показываем полные адреса
test_address_suggestions \
    "Проверка отсутствия полных адресов" \
    "Мира" \
    1 \
    "Мира" \
    "Республика Марий Эл"

echo
echo "=================================================="
echo -e "${WHITE}📊 Результаты тестирования подсказок адресов:${NC}"
echo -e "Всего тестов: $TOTAL_TESTS"
echo -e "Пройдено: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Провалено: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✅ Все тесты подсказок адресов пройдены успешно!${NC}"
    echo -e "${WHITE}🎯 Новая логика работает корректно:${NC}"
    echo "   - Показываются только названия улиц без города"
    echo "   - Поиск работает с первой буквы"
    echo "   - Фильтруются только улицы Волжска"
    exit 0
else
    echo -e "${RED}❌ Некоторые тесты подсказок адресов провалены${NC}"
    echo -e "${YELLOW}⚠️  Проверьте логику AddressSuggestionService${NC}"
    exit 1
fi 