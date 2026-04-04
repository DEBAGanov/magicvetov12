#!/bin/bash

# Диагностический скрипт для анализа проблем Telegram аутентификации
echo "🔍 MagicCvetov - Диагностика Telegram аутентификации"
echo "================================================="

API_URL="https://debaganov-magicvetov-0177.twc1.net"
#API_URL="http://localhost:8080"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Проверяемые аспекты:${NC}"
echo "1. Доступность API"
echo "2. Конфигурация Telegram аутентификации"
echo "3. Webhook регистрация"
echo "4. Telegram Bot API соединение"
echo "5. Инициализация токенов"
echo ""

# Функция для выполнения HTTP запросов с детальной диагностикой
diagnose_request() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4

    echo -e "${YELLOW}🔍 Тест: $description${NC}"
    echo "📍 $method $url"

    if [[ "$method" == "GET" ]]; then
        response=$(curl -s -w "HTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" "$url")
    else
        response=$(curl -s -w "HTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi

    # Извлекаем информацию
    status_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d' | sed '/TIME_TOTAL:/d')

    echo "📊 Статус: $status_code (время: ${time_total}s)"

    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ УСПЕШНО${NC}"
        echo "📋 Ответ: $(echo "$body" | jq . 2>/dev/null || echo "$body")"

        # Анализируем конкретный ответ для дополнительной диагностики
        if [[ "$description" == *"Health check"* ]]; then
            if echo "$body" | grep -q '"serviceAvailable":true'; then
                echo -e "${GREEN}   ✓ Сервис доступен${NC}"
            else
                echo -e "${RED}   ✗ Сервис недоступен${NC}"
            fi
        fi

        if [[ "$description" == *"Инициализация"* ]]; then
            if echo "$body" | grep -q '"success":true'; then
                echo -e "${GREEN}   ✓ Инициализация успешна${NC}"
                # Извлекаем authToken
                if [[ "$body" =~ \"authToken\":\"([^\"]+)\" ]]; then
                    AUTH_TOKEN="${BASH_REMATCH[1]}"
                    echo -e "${BLUE}   🔑 Извлечен authToken: $AUTH_TOKEN${NC}"
                fi
                # Извлекаем telegramBotUrl
                if [[ "$body" =~ \"telegramBotUrl\":\"([^\"]+)\" ]]; then
                    BOT_URL="${BASH_REMATCH[1]}"
                    echo -e "${BLUE}   🤖 Bot URL: $BOT_URL${NC}"
                fi
            else
                echo -e "${RED}   ✗ Ошибка инициализации${NC}"
                echo -e "${RED}   📋 $(echo "$body" | jq -r '.message // "Неизвестная ошибка"')${NC}"
            fi
        fi

        if [[ "$description" == *"Webhook"* ]]; then
            if echo "$body" | grep -q '"configured":true'; then
                echo -e "${GREEN}   ✓ Webhook настроен${NC}"
            else
                echo -e "${YELLOW}   ⚠ Webhook не настроен${NC}"
            fi
        fi

    else
        echo -e "${RED}❌ ОШИБКА${NC}"
        echo "📋 Ответ: $(echo "$body" | jq . 2>/dev/null || echo "$body")"

        # Анализ типичных ошибок
        case $status_code in
            404)
                echo -e "${RED}   💡 Возможные причины: неправильный URL эндпоинта${NC}"
                ;;
            500)
                echo -e "${RED}   💡 Возможные причины: ошибка конфигурации Telegram${NC}"
                ;;
            503)
                echo -e "${RED}   💡 Возможные причины: сервис недоступен${NC}"
                ;;
        esac
    fi

    echo ""
}

# 1. Проверка базовой доступности
echo -e "${BLUE}=== 1. БАЗОВАЯ ДИАГНОСТИКА ===${NC}"
diagnose_request "GET" "$API_URL/api/health" "" "Общий health check приложения"

# 2. Telegram auth health check
echo -e "${BLUE}=== 2. TELEGRAM AUTH ДИАГНОСТИКА ===${NC}"
diagnose_request "GET" "$API_URL/api/v1/auth/telegram/test" "" "Health check Telegram аутентификации"

# 3. Проверка webhook info
echo -e "${BLUE}=== 3. WEBHOOK ДИАГНОСТИКА ===${NC}"
diagnose_request "GET" "$API_URL/api/v1/telegram/webhook/info" "" "Информация о Telegram webhook"

# 4. Попытка регистрации webhook
echo -e "${BLUE}=== 4. РЕГИСТРАЦИЯ WEBHOOK ===${NC}"
diagnose_request "POST" "$API_URL/api/v1/telegram/webhook/register" "" "Регистрация Telegram webhook"

# 5. Тест инициализации аутентификации
echo -e "${BLUE}=== 5. ИНИЦИАЛИЗАЦИЯ АУТЕНТИФИКАЦИИ ===${NC}"
diagnose_request "POST" "$API_URL/api/v1/auth/telegram/init" '{
    "deviceId": "diagnosis_test_device"
}' "Инициализация Telegram аутентификации"

# 6. Если токен получен, проверяем статус
if [[ -n "$AUTH_TOKEN" ]]; then
    echo -e "${BLUE}=== 6. ПРОВЕРКА СТАТУСА ТОКЕНА ===${NC}"
    diagnose_request "GET" "$API_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" "" "Проверка статуса auth токена"
fi

# 7. Проверка конфигурации через Telegram Bot API
if [[ -n "$BOT_URL" ]]; then
    echo -e "${BLUE}=== 7. ПРЯМАЯ ПРОВЕРКА TELEGRAM BOT API ===${NC}"

    # Извлекаем токен из URL
    if [[ "$BOT_URL" =~ t\.me/([^?]+) ]]; then
        BOT_USERNAME="${BASH_REMATCH[1]}"
        echo "🤖 Bot Username: @$BOT_USERNAME"

        # Можно попробовать проверить бота напрямую (если известен токен)
        # Но это требует токена, который мы не должны логировать
        echo "💡 Для проверки бота перейдите по ссылке: $BOT_URL"
    fi
fi

echo -e "${BLUE}=== ИТОГОВАЯ ДИАГНОСТИКА ===${NC}"
echo ""
echo -e "${YELLOW}📝 РЕКОМЕНДАЦИИ ПО УСТРАНЕНИЮ ПРОБЛЕМ:${NC}"
echo ""
echo "1. Проверьте переменные окружения в docker-compose.yml:"
echo "   TELEGRAM_AUTH_ENABLED=true"
echo "   TELEGRAM_AUTH_BOT_TOKEN=7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"
echo "   TELEGRAM_AUTH_BOT_USERNAME=MagicCvetovBot"
echo "   TELEGRAM_AUTH_WEBHOOK_URL=https://debaganov-magicvetov-0177.twc1.net/api/v1/telegram/webhook"
echo ""
echo "2. Убедитесь, что бот создан через @BotFather и активен"
echo ""
echo "3. Проверьте, что webhook URL доступен извне:"
echo "   curl -X POST $API_URL/api/v1/telegram/webhook"
echo ""
echo "4. Проверьте логи приложения:"
echo "   docker logs magicvetov-app"
echo ""
echo "5. Убедитесь, что маршруты правильные:"
echo "   /api/v1/auth/telegram/* - для аутентификации"
echo "   /api/v1/telegram/webhook - для webhook"
echo ""

echo -e "${GREEN}🔍 Диагностика завершена!${NC}"