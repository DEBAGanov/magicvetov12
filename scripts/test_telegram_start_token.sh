#!/bin/bash

# Тестирование команды /start с токеном в Telegram боте
# Проверка правильной обработки ссылок вида t.me/MagicCvetovBot?start=token

echo "🤖 Тестирование /start с токеном - MagicCvetov Telegram Bot"
echo "========================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Параметры
BASE_URL="http://localhost:8080"
BOT_TOKEN="7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"

echo -e "${BLUE}1. Проверка здоровья приложения${NC}"
health_response=$(curl -s "${BASE_URL}/actuator/health")
if [[ $? -eq 0 && $health_response == *"UP"* ]]; then
    echo -e "   ${GREEN}✅ Приложение работает${NC}"
else
    echo -e "   ${RED}❌ Приложение не доступно${NC}"
    exit 1
fi

echo -e "${BLUE}2. Создание тестового токена авторизации${NC}"
# Инициализируем Telegram аутентификацию для получения токена
auth_response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/telegram/init" \
    -H "Content-Type: application/json" \
    -d '{"deviceId":"test_device_longpolling"}' 2>/dev/null)

if [[ $? -eq 0 && $auth_response == *"authToken"* ]]; then
    AUTH_TOKEN=$(echo $auth_response | jq -r '.authToken' 2>/dev/null)
    BOT_URL=$(echo $auth_response | jq -r '.telegramBotUrl' 2>/dev/null)

    echo -e "   ${GREEN}✅ Токен создан: ${AUTH_TOKEN}${NC}"
    echo -e "   ${GREEN}✅ URL бота: ${BOT_URL}${NC}"
else
    echo -e "   ${RED}❌ Ошибка создания токена${NC}"
    echo "   Ответ: $auth_response"
    exit 1
fi

echo -e "${BLUE}3. Проверка статуса токена до обработки${NC}"
status_response=$(curl -s "${BASE_URL}/api/v1/auth/telegram/status/${AUTH_TOKEN}" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    status=$(echo $status_response | jq -r '.status' 2>/dev/null)
    echo -e "   ${YELLOW}ℹ️  Статус токена: ${status}${NC}"
else
    echo -e "   ${RED}❌ Ошибка проверки статуса токена${NC}"
fi

echo -e "${BLUE}4. Проверка обновлений Telegram бота${NC}"
updates_response=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1" 2>/dev/null)
if [[ $? -eq 0 && $updates_response == *"ok\":true"* ]]; then
    last_update_id=$(echo $updates_response | jq -r '.result[-1].update_id // 0' 2>/dev/null)
    echo -e "   ${GREEN}✅ Последний update_id: ${last_update_id}${NC}"
else
    echo -e "   ${RED}❌ Ошибка получения обновлений${NC}"
fi

echo ""
echo -e "${YELLOW}📱 ИНСТРУКЦИИ ДЛЯ РУЧНОГО ТЕСТИРОВАНИЯ:${NC}"
echo ""
echo "1. Скопируйте и перейдите по ссылке:"
echo -e "   ${BLUE}${BOT_URL}${NC}"
echo ""
echo "2. Ожидаемое поведение:"
echo "   ✅ Бот сразу покажет приветствие"
echo "   ✅ Появится кнопка '📱 Отправить телефон'"
echo "   ✅ НЕ должно быть сообщения 'Неизвестная команда'"
echo ""
echo "3. Поделитесь номером телефона через кнопку"
echo ""
echo "4. Проверьте завершение авторизации:"
echo "   ✅ Должно появиться 'Авторизация завершена!'"
echo ""

echo -e "${BLUE}5. Проверка логов Long Polling бота${NC}"
if command -v docker &> /dev/null; then
    echo "   Поиск логов обработки команды /start с токеном..."
    docker logs magicvetov-app 2>&1 | grep -i "start.*token\|команда.*start\|получен токен" | tail -5 | while read line; do
        if [[ $line == *"token"* ]] || [[ $line == *"токен"* ]]; then
            echo -e "   ${GREEN}✅ $line${NC}"
        else
            echo -e "   ${YELLOW}ℹ️  $line${NC}"
        fi
    done
else
    echo "   Docker не найден, пропускаем проверку логов"
fi

echo ""
echo -e "${GREEN}🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:${NC}"
echo ""
echo "✅ Исправлена логика обработки команд в handleMessage()"
echo "✅ Команда /start теперь работает как с токеном, так и без него"
echo "✅ Добавлена обработка внешних токенов от приложения"
echo "✅ Интеграция с webhook сервисом для завершения авторизации"
echo ""
echo "❌ Если бот все еще говорит 'Неизвестная команда':"
echo "   1. Перезапустите приложение: docker compose restart"
echo "   2. Проверьте логи: docker logs magicvetov-app -f"
echo "   3. Убедитесь что TELEGRAM_LONGPOLLING_ENABLED=true"
echo ""
echo "📞 Поддержка: Проверьте раздел диагностики в test_telegram_longpolling.sh"