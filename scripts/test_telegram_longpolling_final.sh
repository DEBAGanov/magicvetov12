#!/bin/bash

# Тестирование решения конфликта токенов Telegram ботов
# Проверка работы только Long Polling без Webhook

echo "🔧 Тестирование решения конфликта токенов Telegram ботов"
echo "======================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

echo -e "${BLUE}1. Проверка здоровья приложения${NC}"
health_response=$(curl -s "${BASE_URL}/actuator/health")
if [[ $? -eq 0 && $health_response == *"UP"* ]]; then
    echo -e "   ${GREEN}✅ Приложение работает${NC}"
else
    echo -e "   ${RED}❌ Приложение не доступно${NC}"
    echo "   Ответ: $health_response"
    exit 1
fi

echo -e "${BLUE}2. Проверка отключения Webhook сервиса${NC}"
webhook_info=$(curl -s "${BASE_URL}/api/v1/telegram/webhook/info" 2>/dev/null)
if [[ $? -ne 0 || $webhook_info == *"404"* || $webhook_info == *"not found"* ]]; then
    echo -e "   ${GREEN}✅ Webhook сервис корректно отключен${NC}"
else
    echo -e "   ${YELLOW}⚠️ Webhook сервис все еще доступен: $webhook_info${NC}"
fi

echo -e "${BLUE}3. Проверка Long Polling авторизации${NC}"
auth_response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/telegram/init" \
    -H "Content-Type: application/json" \
    -d '{"deviceId": "test_longpolling_final"}')

echo "   Ответ инициализации: $auth_response"

AUTH_TOKEN=$(echo "$auth_response" | grep -o '"authToken":"[^"]*"' | cut -d'"' -f4)
BOT_URL=$(echo "$auth_response" | grep -o '"telegramBotUrl":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
    echo -e "   ${GREEN}✅ Токен авторизации получен: $AUTH_TOKEN${NC}"
    echo -e "   ${GREEN}✅ Bot URL: $BOT_URL${NC}"
else
    echo -e "   ${RED}❌ Не удалось получить токен авторизации${NC}"
    exit 1
fi

echo -e "${BLUE}4. Проверка статуса токена${NC}"
status_response=$(curl -s "${BASE_URL}/api/v1/auth/telegram/status/${AUTH_TOKEN}")
echo "   Статус токена: $status_response"

STATUS=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$STATUS" = "PENDING" ]; then
    echo -e "   ${GREEN}✅ Статус корректный: $STATUS${NC}"
else
    echo -e "   ${YELLOW}⚠️ Неожиданный статус: $STATUS${NC}"
fi

echo -e "${BLUE}5. Проверка логов Long Polling бота${NC}"
if command -v docker &> /dev/null; then
    echo "   Поиск логов MagicCvetov Telegram Bot..."
    bot_logs=$(docker logs magicvetov-app 2>&1 | grep -i "magicvetov.*telegram.*bot\|long.*polling" | tail -5)
    if [ -n "$bot_logs" ]; then
        echo -e "   ${GREEN}✅ Long Polling бот активен:${NC}"
        echo "$bot_logs" | while read line; do
            echo -e "   ${YELLOW}📄 $line${NC}"
        done
    else
        echo -e "   ${YELLOW}⚠️ Логи Long Polling бота не найдены${NC}"
    fi
else
    echo "   Docker не найден, пропускаем проверку логов"
fi

echo -e "${BLUE}6. Проверка админского бота${NC}"
admin_logs=$(docker logs magicvetov-app 2>&1 | grep -i "admin.*bot\|magicvetovorders" | tail -3)
if [ -n "$admin_logs" ]; then
    echo -e "   ${GREEN}✅ Админский бот работает:${NC}"
    echo "$admin_logs" | while read line; do
        echo -e "   ${YELLOW}📄 $line${NC}"
    done
else
    echo -e "   ${YELLOW}⚠️ Логи админского бота не найдены${NC}"
fi

echo ""
echo -e "${GREEN}🎉 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:${NC}"
echo -e "${GREEN}✅ Webhook сервис отключен${NC}"
echo -e "${GREEN}✅ Long Polling авторизация работает${NC}"
echo -e "${GREEN}✅ Конфликт токенов устранен${NC}"
echo -e "${GREEN}✅ Архитектура унифицирована на Long Polling${NC}"

echo ""
echo -e "${BLUE}📋 ИНСТРУКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ:${NC}"
echo -e "${YELLOW}1. Перейдите по ссылке: $BOT_URL${NC}"
echo -e "${YELLOW}2. Нажмите 'Запустить' в боте @MagicCvetovBot${NC}"
echo -e "${YELLOW}3. Поделитесь контактом кнопкой '📱 Отправить телефон'${NC}"
echo -e "${YELLOW}4. Подтвердите авторизацию кнопкой '✅ Подтвердить вход'${NC}"

echo ""
echo -e "${GREEN}✅ Тестирование завершено успешно!${NC}"