#!/bin/bash

# Диагностика проблемы CORS для MagicCvetov
# Проверка запросов от magicvetov.ru к api.magicvetov.ru

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ДИАГНОСТИКА ПРОБЛЕМЫ CORS${NC}"
echo "====================================="
echo

# Функция для тестирования CORS
test_cors_request() {
    local description="$1"
    local origin="$2"
    local method="$3"
    local url="$4"
    
    echo -e "${YELLOW}🧪 $description${NC}"
    echo "   🔗 Origin: $origin"
    echo "   📡 Method: $method"
    echo "   🌐 URL: $url"
    
    # Выполняем запрос с детальным выводом
    echo "   📋 Выполняем запрос..."
    
    response=$(curl -s -w "\n%{http_code}\n%{response_headers}" \
        -X "$method" \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: $method" \
        -H "Access-Control-Request-Headers: Authorization,Content-Type" \
        "$url" 2>/dev/null || echo -e "\n000\n")
    
    # Разбираем ответ
    body=$(echo "$response" | head -n -2)
    http_code=$(echo "$response" | tail -2 | head -1)
    headers=$(echo "$response" | tail -1)
    
    echo "   📊 HTTP Code: $http_code"
    
    # Ищем CORS заголовки
    allow_origin=$(echo "$headers" | grep -i "access-control-allow-origin" || echo "")
    allow_methods=$(echo "$headers" | grep -i "access-control-allow-methods" || echo "")
    allow_headers=$(echo "$headers" | grep -i "access-control-allow-headers" || echo "")
    allow_credentials=$(echo "$headers" | grep -i "access-control-allow-credentials" || echo "")
    
    # Анализируем результат
    if [[ "$http_code" == "200" || "$http_code" == "204" ]]; then
        echo -e "   ✅ Запрос успешен"
        
        if [[ -n "$allow_origin" ]]; then
            echo -e "   ✅ CORS заголовки найдены:"
            [[ -n "$allow_origin" ]] && echo "      • $allow_origin"
            [[ -n "$allow_methods" ]] && echo "      • $allow_methods"
            [[ -n "$allow_headers" ]] && echo "      • $allow_headers"
            [[ -n "$allow_credentials" ]] && echo "      • $allow_credentials"
        else
            echo -e "   ❌ CORS заголовки отсутствуют!"
            echo -e "   🚨 ${RED}ЭТО ПРИЧИНА ПРОБЛЕМЫ!${NC}"
        fi
    else
        echo -e "   ❌ Ошибка запроса: HTTP $http_code"
    fi
    
    echo
}

# Определяем доступные URL для тестирования
echo -e "${BLUE}🎯 Определение доступных эндпоинтов...${NC}"

ENDPOINTS=()

# Проверяем различные варианты
if curl -s "https://api.magicvetov.ru/api/v1/health" >/dev/null 2>&1; then
    ENDPOINTS+=("https://api.magicvetov.ru")
    echo "   ✅ Продакшен API: https://api.magicvetov.ru"
fi

if curl -s "https://magicvetov.ru/api/v1/health" >/dev/null 2>&1; then
    ENDPOINTS+=("https://magicvetov.ru")
    echo "   ✅ Основной домен: https://magicvetov.ru"
fi

if curl -s "http://localhost:8080/api/v1/health" >/dev/null 2>&1; then
    ENDPOINTS+=("http://localhost:8080")
    echo "   ✅ Локальный сервер: http://localhost:8080"
fi

if [[ ${#ENDPOINTS[@]} -eq 0 ]]; then
    echo -e "${RED}❌ Ни один API эндпоинт недоступен!${NC}"
    echo "Убедитесь, что приложение запущено"
    exit 1
fi

echo

# Тестируем каждый доступный эндпоинт
for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "${BLUE}📋 ТЕСТИРОВАНИЕ: $endpoint${NC}"
    echo "----------------------------------------"
    
    # Тест 1: Preflight запрос
    test_cors_request \
        "Preflight запрос (OPTIONS)" \
        "https://magicvetov.ru" \
        "OPTIONS" \
        "$endpoint/api/v1/categories"
    
    # Тест 2: Обычный GET запрос
    test_cors_request \
        "GET запрос с Origin" \
        "https://magicvetov.ru" \
        "GET" \
        "$endpoint/api/v1/health"
    
    # Тест 3: POST запрос (как в реальной ситуации)
    test_cors_request \
        "POST запрос (как в браузере)" \
        "https://magicvetov.ru" \
        "POST" \
        "$endpoint/api/v1/auth/login"
done

echo -e "${BLUE}🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ${NC}"
echo "=================================="
echo
echo "1. 🌐 Убедитесь, что nginx настроен с CORS заголовками"
echo "2. 🔄 Перезапустите docker-compose с обновленной конфигурацией"
echo "3. 🧪 Используйте scripts/test_cors_configuration.sh для полного тестирования"
echo "4. 📋 Проверьте переменные окружения CORS_ALLOWED_ORIGINS"
echo
echo -e "${YELLOW}Команды для исправления:${NC}"
echo "docker-compose down"
echo "docker-compose up -d --build"
echo "docker-compose logs nginx"
echo
echo -e "${BLUE}🎯 Для тестирования в браузере:${NC}"
echo "Откройте Developer Tools → Network → посмотрите заголовки ответа"
echo "Должны присутствовать заголовки Access-Control-Allow-*" 