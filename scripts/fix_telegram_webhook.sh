#!/bin/bash

# Скрипт для исправления и проверки Telegram webhook
echo "🔧 Исправление Telegram webhook MagicCvetov"
echo "========================================"

API_URL="https://debaganov-magicvetov-0177.twc1.net"
BOT_TOKEN="7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"
WEBHOOK_URL="$API_URL/api/v1/telegram/webhook"

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Настройки:${NC}"
echo "API URL: $API_URL"
echo "Bot Token: ${BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Проверяем, что приложение работает
echo -e "${YELLOW}1. Проверка доступности приложения...${NC}"
if curl -s -f "$API_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Приложение доступно${NC}"
else
    echo -e "${RED}❌ Приложение недоступно. Запустите: docker compose up -d${NC}"
    exit 1
fi

# 2. Проверяем webhook info через наше API
echo -e "${YELLOW}2. Проверка webhook через API приложения...${NC}"
webhook_info=$(curl -s "$API_URL/api/v1/telegram/webhook/info")
echo "Ответ: $webhook_info"

if echo "$webhook_info" | grep -q '"configured":true'; then
    echo -e "${GREEN}✅ Webhook настройки найдены в приложении${NC}"
else
    echo -e "${YELLOW}⚠️ Webhook не настроен в приложении${NC}"
fi

# 3. Регистрируем webhook через наше API
echo -e "${YELLOW}3. Регистрация webhook через API приложения...${NC}"
register_response=$(curl -s -X POST "$API_URL/api/v1/telegram/webhook/register")
echo "Ответ: $register_response"

if echo "$register_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Webhook зарегистрирован через приложение${NC}"
else
    echo -e "${RED}❌ Ошибка регистрации через приложение${NC}"
fi

# 4. Проверяем webhook напрямую через Telegram Bot API
echo -e "${YELLOW}4. Проверка webhook напрямую через Telegram Bot API...${NC}"
telegram_webhook_info=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
echo "Telegram API ответ: $telegram_webhook_info"

if echo "$telegram_webhook_info" | grep -q "\"url\":\"$WEBHOOK_URL\""; then
    echo -e "${GREEN}✅ Webhook правильно зарегистрирован в Telegram${NC}"
elif echo "$telegram_webhook_info" | grep -q '"url":""'; then
    echo -e "${YELLOW}⚠️ Webhook не установлен в Telegram${NC}"
    
    # 5. Пытаемся зарегистрировать напрямую
    echo -e "${YELLOW}5. Регистрация webhook напрямую в Telegram...${NC}"
    set_webhook_response=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$WEBHOOK_URL\"}")
    echo "Ответ: $set_webhook_response"
    
    if echo "$set_webhook_response" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Webhook успешно зарегистрирован напрямую${NC}"
    else
        echo -e "${RED}❌ Ошибка регистрации webhook в Telegram${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Webhook указывает на другой URL${NC}"
fi

# 6. Финальная проверка
echo -e "${YELLOW}6. Финальная проверка...${NC}"
final_check=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
current_url=$(echo "$final_check" | jq -r '.result.url // "empty"')
echo "Текущий webhook URL: $current_url"

if [ "$current_url" = "$WEBHOOK_URL" ]; then
    echo -e "${GREEN}✅ Webhook настроен правильно!${NC}"
    
    # 7. Тест инициализации
    echo -e "${YELLOW}7. Тест инициализации аутентификации...${NC}"
    init_response=$(curl -s -X POST "$API_URL/api/v1/auth/telegram/init" \
        -H "Content-Type: application/json" \
        -d '{"deviceId":"webhook_test"}')
    echo "Ответ: $init_response"
    
    if echo "$init_response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Инициализация работает!${NC}"
        
        # Извлекаем URL бота
        if [[ "$init_response" =~ \"telegramBotUrl\":\"([^\"]+)\" ]]; then
            bot_url="${BASH_REMATCH[1]}"
            echo -e "${BLUE}🤖 Ссылка на бота: $bot_url${NC}"
        fi
    else
        echo -e "${RED}❌ Ошибка инициализации${NC}"
    fi
else
    echo -e "${RED}❌ Webhook настроен неправильно${NC}"
fi

echo ""
echo -e "${BLUE}=== ИНСТРУКЦИИ ====${NC}"
echo "1. Перейдите в бота @MagicCvetovBot"
echo "2. Отправьте команду /start"
echo "3. Или используйте ссылку из инициализации аутентификации"
echo ""
echo -e "${GREEN}🔧 Исправление завершено!${NC}" 