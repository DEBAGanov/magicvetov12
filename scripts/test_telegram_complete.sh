#!/bin/bash

# 🤖 ПОЛНЫЙ ТЕСТ TELEGRAM АУТЕНТИФИКАЦИИ MagicCvetov
# Объединяет диагностику, API тесты и тестирование с реальным пользователем

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 MagicCvetov - ПОЛНЫЙ ТЕСТ TELEGRAM АУТЕНТИФИКАЦИИ${NC}"
echo "=============================================================="
echo -e "${BLUE}Данный тест объединяет 3 модуля:${NC}"
echo "1️⃣  Диагностика конфигурации и доступности"
echo "2️⃣  API тестирование всех эндпоинтов"
echo "3️⃣  Тестирование обработки контактов webhook"
echo "4️⃣  Диагностика проблем с ботом"
echo ""

# Настройки
API_URL="https://debaganov-magicvetov-0177.twc1.net"
LOCAL_URL="http://localhost:8080"
WEBHOOK_URL="$API_URL/api/v1/telegram/webhook"

# Реальные данные пользователя (из скриншотов)
REAL_TELEGRAM_USER_ID=7819187384
REAL_CHAT_ID=-4919444764
REAL_PHONE_NUMBER="+79199969633"
REAL_FIRST_NAME="Владимир"
REAL_LAST_NAME="Баганов"

# Счетчики
SUCCESS_COUNT=0
TOTAL_TESTS=0
AUTH_TOKEN=""
BOT_URL=""

# Функция для диагностических запросов
diagnose_request() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4

    echo -e "${CYAN}🔍 $description${NC}"
    echo "📍 $method $url"

    ((TOTAL_TESTS++))

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

    echo "📊 Статус: $status_code (${time_total}s)"

    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ УСПЕШНО${NC}"
        ((SUCCESS_COUNT++))

        # Красивый вывод JSON
        if command -v jq &> /dev/null; then
            echo "📋 Ответ: $(echo "$body" | jq .)"
        else
            echo "📋 Ответ: $body"
        fi

        # Извлечение важных данных
        if [[ "$description" == *"Инициализация"* ]]; then
            if echo "$body" | grep -q '"success":true'; then
                if [[ "$body" =~ \"authToken\":\"([^\"]+)\" ]]; then
                    AUTH_TOKEN="${BASH_REMATCH[1]}"
                    echo -e "${BLUE}   🔑 AUTH TOKEN: $AUTH_TOKEN${NC}"
                fi
                if [[ "$body" =~ \"telegramBotUrl\":\"([^\"]+)\" ]]; then
                    BOT_URL="${BASH_REMATCH[1]}"
                    echo -e "${BLUE}   🤖 BOT URL: $BOT_URL${NC}"
                fi
            fi
        fi
    else
        echo -e "${RED}❌ ОШИБКА${NC}"
        echo "📋 Ответ: $body"
    fi
    echo ""
}

# ==================== ЭТАП 1: ДИАГНОСТИКА ====================
echo -e "${PURPLE}🔧 ЭТАП 1: ДИАГНОСТИКА СИСТЕМЫ${NC}"
echo "=========================================="

diagnose_request "GET" "$API_URL/api/health" "" "1.1 Общий health check приложения"
diagnose_request "GET" "$API_URL/api/v1/auth/telegram/test" "" "1.2 Health check Telegram аутентификации"
diagnose_request "GET" "$API_URL/api/v1/telegram/webhook/info" "" "1.3 Информация о Telegram webhook"
diagnose_request "POST" "$API_URL/api/v1/telegram/webhook/register" "" "1.4 Регистрация Telegram webhook"

# ==================== ЭТАП 2: API ТЕСТИРОВАНИЕ ====================
echo -e "${PURPLE}🔌 ЭТАП 2: ТЕСТИРОВАНИЕ API${NC}"
echo "==================================="

diagnose_request "POST" "$API_URL/api/v1/auth/telegram/init" '{
    "deviceId": "full_test_device_real_user"
}' "2.1 Инициализация Telegram аутентификации"

if [[ -n "$AUTH_TOKEN" ]]; then
    diagnose_request "GET" "$API_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" "" "2.2 Проверка статуса токена"
else
    echo -e "${YELLOW}⚠️  2.2 Тест статуса пропущен - токен не получен${NC}"
    ((TOTAL_TESTS++))
fi

diagnose_request "GET" "$API_URL/api/v1/auth/telegram/status/tg_auth_nonexistent123" "" "2.3 Проверка несуществующего токена"
diagnose_request "POST" "$API_URL/api/v1/auth/telegram/init" '{}' "2.4 Инициализация без deviceId"

# ==================== ЭТАП 3: WEBHOOK ТЕСТИРОВАНИЕ ====================
echo -e "${PURPLE}📡 ЭТАП 3: ТЕСТИРОВАНИЕ WEBHOOK${NC}"
echo "======================================"

# Тест обработки команды /start
start_webhook_data=$(cat <<EOF
{
  "update_id": $(date +%s)001,
  "message": {
    "message_id": 1001,
    "from": {
      "id": $REAL_TELEGRAM_USER_ID,
      "first_name": "$REAL_FIRST_NAME",
      "last_name": "$REAL_LAST_NAME",
      "username": "vladimir_baganov"
    },
    "chat": {
      "id": $REAL_CHAT_ID,
      "type": "private"
    },
    "date": $(date +%s),
    "text": "/start ${AUTH_TOKEN:-tg_auth_test123}"
  }
}
EOF
)

diagnose_request "POST" "$WEBHOOK_URL" "$start_webhook_data" "3.1 Обработка команды /start"

# Тест отправки своего контакта
contact_webhook_data=$(cat <<EOF
{
  "update_id": $(date +%s)002,
  "message": {
    "message_id": 1002,
    "from": {
      "id": $REAL_TELEGRAM_USER_ID,
      "first_name": "$REAL_FIRST_NAME",
      "last_name": "$REAL_LAST_NAME",
      "username": "vladimir_baganov"
    },
    "chat": {
      "id": $REAL_CHAT_ID,
      "type": "private"
    },
    "date": $(date +%s),
    "contact": {
      "phone_number": "$REAL_PHONE_NUMBER",
      "first_name": "$REAL_FIRST_NAME",
      "last_name": "$REAL_LAST_NAME",
      "user_id": $REAL_TELEGRAM_USER_ID
    }
  }
}
EOF
)

diagnose_request "POST" "$WEBHOOK_URL" "$contact_webhook_data" "3.2 Обработка отправки контакта"

# Тест отправки чужого контакта
foreign_contact_data=$(cat <<EOF
{
  "update_id": $(date +%s)003,
  "message": {
    "message_id": 1003,
    "from": {
      "id": $REAL_TELEGRAM_USER_ID,
      "first_name": "$REAL_FIRST_NAME",
      "last_name": "$REAL_LAST_NAME",
      "username": "vladimir_baganov"
    },
    "chat": {
      "id": $REAL_CHAT_ID,
      "type": "private"
    },
    "date": $(date +%s),
    "contact": {
      "phone_number": "+79161234999",
      "first_name": "Иван",
      "last_name": "Петров",
      "user_id": 987654321
    }
  }
}
EOF
)

diagnose_request "POST" "$WEBHOOK_URL" "$foreign_contact_data" "3.3 Обработка чужого контакта (должна быть ошибка)"

# ==================== ЭТАП 4: ДИАГНОСТИКА БОТА ====================
echo -e "${PURPLE}🤖 ЭТАП 4: ДИАГНОСТИКА ПРОБЛЕМ С БОТОМ${NC}"
echo "=============================================="

echo -e "${YELLOW}🔍 Анализируем почему бот не отправляет сообщения...${NC}"
echo ""

# Проверяем конфигурацию
echo -e "${CYAN}📋 Проверка конфигурации:${NC}"
echo "1. Bot Token: нужно проверить в логах или переменных окружения"
echo "2. Webhook URL: $WEBHOOK_URL"
echo "3. Bot Username: @MagicCvetovBot"
echo ""

# Проверяем доступность webhook извне
echo -e "${CYAN}🌐 Тест доступности webhook извне:${NC}"
curl_test=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"test": "external_access"}')

if [[ "$curl_test" == "200" || "$curl_test" == "400" ]]; then
    echo -e "${GREEN}✅ Webhook доступен извне (код: $curl_test)${NC}"
else
    echo -e "${RED}❌ Webhook недоступен извне (код: $curl_test)${NC}"
    echo -e "${YELLOW}💡 Возможные причины:${NC}"
    echo "   - Неправильный URL в настройках бота"
    echo "   - Проблемы с SSL/HTTPS"
    echo "   - Фаервол блокирует запросы"
fi
echo ""

# Если есть bot URL, анализируем его
if [[ -n "$BOT_URL" ]]; then
    echo -e "${CYAN}🔗 Анализ Bot URL: $BOT_URL${NC}"
    if [[ "$BOT_URL" =~ t\.me/([^?]+) ]]; then
        BOT_USERNAME="${BASH_REMATCH[1]}"
        echo "✅ Bot Username извлечен: @$BOT_USERNAME"

        if [[ "$BOT_URL" =~ start=([^&]+) ]]; then
            URL_TOKEN="${BASH_REMATCH[1]}"
            echo "✅ Token в URL: $URL_TOKEN"

            if [[ "$URL_TOKEN" == "$AUTH_TOKEN" ]]; then
                echo -e "${GREEN}✅ Token в URL совпадает с полученным${NC}"
            else
                echo -e "${YELLOW}⚠️ Token в URL отличается от полученного${NC}"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Bot URL не получен - проблема с инициализацией${NC}"
fi
echo ""

# ==================== ЭТАП 5: РЕКОМЕНДАЦИИ ====================
echo -e "${PURPLE}💡 ЭТАП 5: РЕКОМЕНДАЦИИ ПО УСТРАНЕНИЮ ПРОБЛЕМ${NC}"
echo "=================================================="

echo -e "${YELLOW}🔧 ДИАГНОСТИКА ПРОБЛЕМ С БОТОМ:${NC}"
echo ""
echo "1. Проверьте переменные окружения (docker-compose.yml):"
echo "   TELEGRAM_AUTH_ENABLED=true"
echo "   TELEGRAM_AUTH_BOT_TOKEN=7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"
echo "   TELEGRAM_AUTH_BOT_USERNAME=MagicCvetovBot"
echo "   TELEGRAM_AUTH_WEBHOOK_URL=$WEBHOOK_URL"
echo ""

echo "2. Проверьте статус бота в @BotFather:"
echo "   /mybots → @MagicCvetovBot → Bot Settings → проверьте что бот активен"
echo ""

echo "3. Проверьте webhook через Telegram Bot API:"
echo "   curl \"https://api.telegram.org/bot7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4/getWebhookInfo\""
echo ""

echo "4. Установите webhook вручную если нужно:"
echo "   curl -X POST \"https://api.telegram.org/bot7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4/setWebhook\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"url\": \"$WEBHOOK_URL\"}'"
echo ""

echo "5. Проверьте логи приложения:"
echo "   docker logs magicvetov-app --tail 50"
echo ""

echo -e "${YELLOW}🔄 ТЕСТИРОВАНИЕ С РЕАЛЬНЫМ ПОЛЬЗОВАТЕЛЕМ:${NC}"
echo ""
if [[ -n "$BOT_URL" ]]; then
    echo "1. Откройте ссылку в браузере или Telegram:"
    echo -e "${BLUE}   $BOT_URL${NC}"
    echo ""
    echo "2. В боте должно появиться сообщение:"
    echo "   '🍕 Добро пожаловать в MagicCvetov!"
    echo "    Привет, Владимир!"
    echo "    Для завершения авторизации необходимо"
    echo "    поделиться номером телефона через кнопку ниже'"
    echo ""
    echo "3. Должна быть кнопка: [📞 Поделиться номером телефона]"
    echo ""
    echo "4. После нажатия кнопки должен появиться диалог: 'Поделиться номером телефона?'"
    echo ""
    echo "5. После отправки контакта должно прийти подтверждение:"
    echo "   '✅ Номер телефона получен! Спасибо, Владимир!'"
else
    echo -e "${RED}❌ Bot URL не получен - сначала исправьте проблемы с API${NC}"
fi

# ==================== ИТОГИ ====================
echo ""
echo -e "${PURPLE}📊 ИТОГИ ТЕСТИРОВАНИЯ${NC}"
echo "======================="
echo -e "✅ ${GREEN}Успешно: $SUCCESS_COUNT из $TOTAL_TESTS тестов${NC}"
echo -e "📈 ${BLUE}Процент успеха: $((SUCCESS_COUNT * 100 / TOTAL_TESTS))%${NC}"

if [[ $SUCCESS_COUNT -eq $TOTAL_TESTS ]]; then
    echo -e "🎉 ${GREEN}ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!${NC}"
    echo -e "🚀 ${GREEN}Система готова к работе с реальными пользователями${NC}"
elif [[ $SUCCESS_COUNT -ge $((TOTAL_TESTS * 70 / 100)) ]]; then
    echo -e "👍 ${YELLOW}ХОРОШО - большинство тестов прошли${NC}"
    echo -e "🔧 ${YELLOW}Требуется настройка бота для полной функциональности${NC}"
else
    echo -e "⚠️ ${RED}ТРЕБУЕТ ВНИМАНИЯ - много проблем${NC}"
    echo -e "🛠️ ${RED}Необходимо исправить конфигурацию перед использованием${NC}"
fi

echo ""
echo -e "${CYAN}📱 Для тестирования с мобильного приложения:${NC}"
echo "1. Настройте бота согласно рекомендациям выше"
echo "2. В мобильном приложении выберите 'Войти через Telegram'"
echo "3. Следуйте инструкциям в боте"
echo "4. После успешной авторизации вернитесь в приложение"

echo ""
echo -e "${GREEN}🔗 Полезные ссылки:${NC}"
echo "- Swagger UI: $API_URL/swagger-ui/index.html"
echo "- API Health: $API_URL/api/health"
echo "- Telegram Auth: $API_URL/api/v1/auth/telegram"
echo "- Webhook: $WEBHOOK_URL"

exit 0