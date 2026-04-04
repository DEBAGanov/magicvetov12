#!/bin/bash

# Тестирование исправления CORS заголовка X-Client-Type
# Проверяет, что заголовок x-client-type теперь разрешен в CORS

echo "🧪 Тестирование исправления CORS заголовка X-Client-Type"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки CORS заголовков
test_cors_header() {
    local url=$1
    local origin=$2
    local header=$3
    
    echo -e "\n${YELLOW}Тестирование CORS для:${NC}"
    echo "URL: $url"
    echo "Origin: $origin"
    echo "Header: $header"
    
    response=$(curl -s -X OPTIONS "$url" \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: $header" \
        -I)
    
    echo -e "\n${YELLOW}Ответ сервера:${NC}"
    echo "$response"
    
    # Проверяем наличие заголовка в ответе
    if echo "$response" | grep -i "access-control-allow-headers" | grep -i "$header" > /dev/null; then
        echo -e "\n${GREEN}✅ УСПЕХ: Заголовок $header разрешен${NC}"
        return 0
    else
        echo -e "\n${RED}❌ ОШИБКА: Заголовок $header НЕ разрешен${NC}"
        return 1
    fi
}

# Функция для проверки реального запроса
test_real_request() {
    local url=$1
    local origin=$2
    
    echo -e "\n${YELLOW}Тестирование реального POST запроса:${NC}"
    echo "URL: $url"
    echo "Origin: $origin"
    
    response=$(curl -s -X POST "$url" \
        -H "Origin: $origin" \
        -H "Content-Type: application/json" \
        -H "X-Client-Type: web" \
        -d '{"phone": "+79999999999"}' \
        -w "HTTP_CODE:%{http_code}" \
        -v 2>&1)
    
    echo -e "\n${YELLOW}Ответ сервера:${NC}"
    echo "$response"
    
    # Извлекаем HTTP код
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    
    if [ "$http_code" != "403" ] && [ "$http_code" != "0" ]; then
        echo -e "\n${GREEN}✅ УСПЕХ: Запрос не заблокирован CORS (HTTP $http_code)${NC}"
        return 0
    else
        echo -e "\n${RED}❌ ОШИБКА: Запрос заблокирован CORS или сервер недоступен (HTTP $http_code)${NC}"
        return 1
    fi
}

# Основные тесты
echo -e "\n${YELLOW}1. Тестирование локального сервера${NC}"
echo "=================================="

# Проверяем локальный сервер
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo -e "${GREEN}✅ Локальный сервер доступен${NC}"
    
    # Тест CORS для localhost
    test_cors_header "http://localhost:8080/api/v1/auth/telegram/init" "https://magicvetov.ru" "x-client-type"
    
    # Тест реального запроса
    test_real_request "http://localhost:8080/api/v1/auth/telegram/init" "https://magicvetov.ru"
    
else
    echo -e "${RED}❌ Локальный сервер недоступен${NC}"
fi

echo -e "\n${YELLOW}2. Тестирование продакшн сервера${NC}"
echo "=================================="

# Проверяем продакшн сервер
if curl -s https://api.magicvetov.ru/api/health > /dev/null; then
    echo -e "${GREEN}✅ Продакшн сервер доступен${NC}"
    
    # Тест CORS для продакшн
    test_cors_header "https://api.magicvetov.ru/api/v1/auth/telegram/init" "https://magicvetov.ru" "x-client-type"
    
    # Тест реального запроса
    test_real_request "https://api.magicvetov.ru/api/v1/auth/telegram/init" "https://magicvetov.ru"
    
else
    echo -e "${RED}❌ Продакшн сервер недоступен${NC}"
fi

echo -e "\n${YELLOW}3. Тестирование множественных заголовков${NC}"
echo "========================================"

# Тест с несколькими заголовками включая x-client-type
test_cors_header "http://localhost:8080/api/v1/auth/telegram/init" "https://magicvetov.ru" "content-type,x-client-type,authorization"

echo -e "\n${YELLOW}4. Проверка nginx конфигурации${NC}"
echo "==============================="

# Проверяем конфигурацию nginx
if [ -f "nginx/nginx.conf" ]; then
    echo -e "${GREEN}✅ Файл nginx.conf найден${NC}"
    
    # Проверяем наличие x-client-type в конфигурации
    if grep -i "x-client-type" nginx/nginx.conf > /dev/null; then
        echo -e "${GREEN}✅ Заголовок X-Client-Type найден в nginx.conf${NC}"
        
        # Показываем строки с этим заголовком
        echo -e "\n${YELLOW}Строки с X-Client-Type:${NC}"
        grep -n -i "x-client-type" nginx/nginx.conf
        
    else
        echo -e "${RED}❌ Заголовок X-Client-Type НЕ найден в nginx.conf${NC}"
    fi
else
    echo -e "${RED}❌ Файл nginx.conf не найден${NC}"
fi

echo -e "\n${YELLOW}5. Инструкции для тестирования в браузере${NC}"
echo "============================================"

echo "Для проверки исправления в браузере:"
echo "1. Откройте https://magicvetov.ru/auth"
echo "2. Откройте DevTools (F12)"
echo "3. Перейдите на вкладку Network"
echo "4. Попробуйте авторизоваться через Telegram"
echo "5. Проверьте, что нет ошибок CORS с заголовком x-client-type"

echo -e "\n${YELLOW}6. Команды для перезапуска nginx${NC}"
echo "=================================="

echo "Для применения изменений nginx:"
echo "docker-compose restart nginx"
echo ""
echo "Для полного перезапуска:"
echo "docker-compose down && docker-compose up -d"

echo -e "\n${GREEN}✅ Тестирование завершено${NC}"
echo "Проверьте результаты выше для подтверждения исправления CORS" 