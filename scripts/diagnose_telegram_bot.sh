#!/bin/bash

# 🤖 ДИАГНОСТИКА ПРОБЛЕМ TELEGRAM БОТА
# Специальный скрипт для выявления причин почему бот не отправляет сообщения

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🤖 ДИАГНОСТИКА TELEGRAM БОТА - MagicCvetov${NC}"
echo "============================================="
echo -e "${YELLOW}Анализируем почему @MagicCvetovBot не отправляет сообщения${NC}"
echo ""

# Константы
BOT_TOKEN="7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"
BOT_USERNAME="MagicCvetovBot"
API_URL="https://debaganov-magicvetov-0177.twc1.net"
WEBHOOK_URL="$API_URL/api/v1/telegram/webhook"
TELEGRAM_API_URL="https://api.telegram.org/bot$BOT_TOKEN"

# Функция для проверки HTTP запросов
check_api() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}

    echo -e "${BLUE}🔍 $description${NC}"
    echo "📍 $url"

    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$url")
    status_code="${response##*HTTP_STATUS:}"
    body="${response%HTTP_STATUS:*}"

    echo "📊 Статус: $status_code"

    if [[ "$status_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ OK${NC}"
        if command -v jq &> /dev/null && echo "$body" | jq . &>/dev/null; then
            echo "📋 Ответ: $(echo "$body" | jq .)"
        else
            echo "📋 Ответ: $body"
        fi
        return 0
    else
        echo -e "${RED}❌ ОШИБКА${NC}"
        echo "📋 Ответ: $body"
        return 1
    fi
}

echo -e "${PURPLE}=== 1. ПРОВЕРКА TELEGRAM BOT API ===${NC}"
echo ""

# 1. Проверка getMe
echo -e "${CYAN}1.1 Проверка токена бота (getMe)${NC}"
if check_api "$TELEGRAM_API_URL/getMe" "Получение информации о боте"; then
    echo -e "${GREEN}✅ Токен бота работает${NC}"
else
    echo -e "${RED}❌ КРИТИЧЕСКАЯ ОШИБКА: Токен бота неверен или бот заблокирован${NC}"
    echo "💡 Проверьте токен в @BotFather: /mybots → @MagicCvetovBot"
    exit 1
fi
echo ""

# 2. Проверка webhook
echo -e "${CYAN}1.2 Проверка текущего webhook${NC}"
if check_api "$TELEGRAM_API_URL/getWebhookInfo" "Получение информации о webhook"; then
    webhook_info=$(curl -s "$TELEGRAM_API_URL/getWebhookInfo")
    webhook_url=$(echo "$webhook_info" | jq -r '.result.url // "не установлен"')
    pending_count=$(echo "$webhook_info" | jq -r '.result.pending_update_count // 0')
    last_error=$(echo "$webhook_info" | jq -r '.result.last_error_message // "нет ошибок"')

    echo -e "${BLUE}📋 Текущий webhook: $webhook_url${NC}"
    echo -e "${BLUE}📊 Ожидающие обновления: $pending_count${NC}"
    echo -e "${BLUE}🚨 Последняя ошибка: $last_error${NC}"

    if [[ "$webhook_url" == "$WEBHOOK_URL" ]]; then
        echo -e "${GREEN}✅ Webhook URL корректный${NC}"
    else
        echo -e "${YELLOW}⚠️ Webhook URL не совпадает с ожидаемым${NC}"
        echo "   Ожидается: $WEBHOOK_URL"
        echo "   Установлен: $webhook_url"
    fi

    if [[ "$pending_count" -gt 0 ]]; then
        echo -e "${YELLOW}⚠️ Есть необработанные обновления ($pending_count)${NC}"
    fi

    if [[ "$last_error" != "нет ошибок" && "$last_error" != "null" ]]; then
        echo -e "${RED}❌ Последняя ошибка webhook: $last_error${NC}"
    fi
fi
echo ""

echo -e "${PURPLE}=== 2. ПРОВЕРКА ПРИЛОЖЕНИЯ PIZZANAT ===${NC}"
echo ""

# 3. Проверка доступности webhook
echo -e "${CYAN}2.1 Проверка доступности webhook${NC}"
if check_api "$WEBHOOK_URL" "Доступность webhook MagicCvetov" "200,400,405"; then
    echo -e "${GREEN}✅ Webhook доступен${NC}"
else
    echo -e "${RED}❌ Webhook недоступен${NC}"
    echo "💡 Проверьте что приложение запущено и доступно извне"
fi
echo ""

# 4. Проверка health check
echo -e "${CYAN}2.2 Проверка Telegram auth health${NC}"
check_api "$API_URL/api/v1/auth/telegram/test" "Health check Telegram аутентификации"
echo ""

# 5. Проверка webhook info
echo -e "${CYAN}2.3 Информация о webhook в приложении${NC}"
check_api "$API_URL/api/v1/telegram/webhook/info" "Внутренняя информация о webhook"
echo ""

echo -e "${PURPLE}=== 3. ПОПЫТКА ИСПРАВЛЕНИЯ WEBHOOK ===${NC}"
echo ""

# 6. Попытка установки webhook
echo -e "${CYAN}3.1 Установка webhook через приложение${NC}"
webhook_register_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_URL/api/v1/telegram/webhook/register")
register_status="${webhook_register_response##*HTTP_STATUS:}"
register_body="${webhook_register_response%HTTP_STATUS:*}"

echo "📊 Статус регистрации: $register_status"

if [[ "$register_status" =~ ^2[0-9][0-9]$ ]]; then
    echo -e "${GREEN}✅ Webhook зарегистрирован через приложение${NC}"
    echo "📋 Ответ: $register_body"
else
    echo -e "${YELLOW}⚠️ Проблема с регистрацией через приложение${NC}"
    echo "📋 Ответ: $register_body"

    # 7. Попытка прямой установки webhook
    echo ""
    echo -e "${CYAN}3.2 Прямая установка webhook через Telegram API${NC}"

    direct_webhook_response=$(curl -s -X POST "$TELEGRAM_API_URL/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$WEBHOOK_URL\"}")

    echo "📋 Ответ прямой установки: $direct_webhook_response"

    if echo "$direct_webhook_response" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Webhook установлен напрямую${NC}"
    else
        echo -e "${RED}❌ Не удалось установить webhook напрямую${NC}"
    fi
fi
echo ""

echo -e "${PURPLE}=== 4. ТЕСТИРОВАНИЕ ОТПРАВКИ СООБЩЕНИЙ ===${NC}"
echo ""

# 8. Тест отправки сообщения напрямую через Telegram API
echo -e "${CYAN}4.1 Тест прямой отправки сообщения${NC}"
echo "📍 Попытка отправить тестовое сообщение в чат -4919444764"

test_message_response=$(curl -s -X POST "$TELEGRAM_API_URL/sendMessage" \
    -H "Content-Type: application/json" \
    -d '{
        "chat_id": -4919444764,
        "text": "🧪 Тестовое сообщение от MagicCvetov bot\nВремя: '"$(date)"'\n\nЭто проверка работоспособности бота."
    }')

echo "📋 Ответ: $test_message_response"

if echo "$test_message_response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ ТЕСТОВОЕ СООБЩЕНИЕ ОТПРАВЛЕНО!${NC}"
    echo -e "${GREEN}🎉 Бот работает и может отправлять сообщения${NC}"
else
    echo -e "${RED}❌ Не удалось отправить тестовое сообщение${NC}"

    # Анализ ошибки
    error_description=$(echo "$test_message_response" | jq -r '.description // "неизвестная ошибка"')
    echo -e "${RED}📋 Ошибка: $error_description${NC}"

    case "$error_description" in
        *"chat not found"*)
            echo -e "${YELLOW}💡 Проблема: Chat ID неверен или бот не добавлен в чат${NC}"
            ;;
        *"bot was blocked"*)
            echo -e "${YELLOW}💡 Проблема: Бот заблокирован пользователем${NC}"
            ;;
        *"not enough rights"*)
            echo -e "${YELLOW}💡 Проблема: Недостаточно прав для отправки сообщений${NC}"
            ;;
    esac
fi
echo ""

echo -e "${PURPLE}=== 5. ПРОВЕРКА ОБРАБОТКИ КОМАНД ===${NC}"
echo ""

# 9. Тест обработки команды /start через webhook
echo -e "${CYAN}5.1 Тест обработки команды /start${NC}"

# Сначала получаем auth token
echo "📍 Получение auth token..."
auth_response=$(curl -s -X POST "$API_URL/api/v1/auth/telegram/init" \
    -H "Content-Type: application/json" \
    -d '{"deviceId": "diagnose_test"}')

if echo "$auth_response" | grep -q '"success":true'; then
    auth_token=$(echo "$auth_response" | jq -r '.authToken')
    echo -e "${GREEN}✅ Auth token получен: $auth_token${NC}"

    # Теперь тестируем webhook
    start_webhook_data='{
        "update_id": '$(date +%s)',
        "message": {
            "message_id": 9999,
            "from": {
                "id": 7819187384,
                "first_name": "Владимир",
                "last_name": "Баганов",
                "username": "vladimir_baganov"
            },
            "chat": {
                "id": -4919444764,
                "type": "private"
            },
            "date": '$(date +%s)',
            "text": "/start '"$auth_token"'"
        }
    }'

    webhook_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$start_webhook_data")

    webhook_status="${webhook_response##*HTTP_STATUS:}"
    webhook_body="${webhook_response%HTTP_STATUS:*}"

    echo "📊 Статус webhook: $webhook_status"
    echo "📋 Ответ webhook: $webhook_body"

    if [[ "$webhook_status" == "200" ]]; then
        echo -e "${GREEN}✅ Webhook обработал команду /start${NC}"
        echo -e "${BLUE}💡 Проверьте чат с ботом - должно прийти сообщение с кнопкой${NC}"
    else
        echo -e "${RED}❌ Ошибка обработки webhook${NC}"
    fi
else
    echo -e "${RED}❌ Не удалось получить auth token${NC}"
fi
echo ""

echo -e "${PURPLE}=== 📋 ИТОГОВАЯ ДИАГНОСТИКА ===${NC}"
echo "=============================="
echo ""

echo -e "${YELLOW}🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:${NC}"
echo ""

echo "1. ЕСЛИ БОТ НЕ ОТПРАВЛЯЕТ СООБЩЕНИЯ ВООБЩЕ:"
echo "   - Проверьте токен в @BotFather (/mybots → @MagicCvetovBot)"
echo "   - Убедитесь что бот не заблокирован"
echo "   - Проверьте переменные окружения в docker-compose.yml"
echo ""

echo "2. ЕСЛИ WEBHOOK НЕ РАБОТАЕТ:"
echo "   - Убедитесь что URL $WEBHOOK_URL доступен извне"
echo "   - Проверьте SSL/HTTPS сертификат"
echo "   - Перезапустите приложение: docker-compose restart"
echo ""

echo "3. ЕСЛИ ОБРАБОТКА КОМАНД НЕ РАБОТАЕТ:"
echo "   - Проверьте логи приложения: docker logs magicvetov-app"
echo "   - Убедитесь что Telegram auth включен в конфигурации"
echo "   - Проверьте что пользователь добавлен в базу данных"
echo ""

echo "4. ДЛЯ ТЕСТИРОВАНИЯ С РЕАЛЬНЫМ ПОЛЬЗОВАТЕЛЕМ:"
echo "   - Запустите: ./test_telegram_complete.sh"
echo "   - Получите ссылку на бота"
echo "   - Перейдите по ссылке и следуйте инструкциям"
echo ""

echo -e "${GREEN}🔗 ПОЛЕЗНЫЕ КОМАНДЫ:${NC}"
echo ""
echo "# Проверка webhook Telegram API:"
echo "curl \"$TELEGRAM_API_URL/getWebhookInfo\""
echo ""
echo "# Установка webhook вручную:"
echo "curl -X POST \"$TELEGRAM_API_URL/setWebhook\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"url\": \"$WEBHOOK_URL\"}'"
echo ""
echo "# Удаление webhook:"
echo "curl -X POST \"$TELEGRAM_API_URL/deleteWebhook\""
echo ""
echo "# Проверка логов приложения:"
echo "docker logs magicvetov-app --tail 50"

echo ""
echo -e "${PURPLE}🎯 СЛЕДУЮЩИЕ ШАГИ:${NC}"
echo "1. Исправьте найденные проблемы"
echo "2. Запустите полный тест: ./test_telegram_complete.sh"
echo "3. Протестируйте с реальным пользователем"

exit 0