#!/bin/bash

# Тест упрощенной авторизации в Telegram боте (без лишнего подтверждения)
# Дата: 2025-01-20

echo "🧪 ТЕСТ: Упрощенная авторизация в @MagicCvetovBot"
echo "============================================="

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

echo -e "${YELLOW}📋 Проверяем состояние приложения...${NC}"

# Проверка здоровья приложения
health_response=$(curl -s "$BASE_URL/actuator/health" || echo "ERROR")
if [[ "$health_response" == *"UP"* ]]; then
    echo -e "${GREEN}✅ Приложение работает${NC}"
else
    echo -e "${RED}❌ Приложение недоступно${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🔐 Инициализируем Telegram авторизацию...${NC}"

# Инициализация Telegram авторизации
auth_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/telegram/init" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_simplified_auth_device"
  }')

echo "Ответ авторизации: $auth_response"

# Извлекаем токен и URL
AUTH_TOKEN=$(echo $auth_response | jq -r '.authToken // empty')
BOT_URL=$(echo $auth_response | jq -r '.telegramBotUrl // empty')
SUCCESS=$(echo $auth_response | jq -r '.success // false')

if [[ "$SUCCESS" != "true" || -z "$AUTH_TOKEN" ]]; then
    echo -e "${RED}❌ Не удалось инициализировать авторизацию${NC}"
    echo "Ответ: $auth_response"
    exit 1
fi

echo -e "${GREEN}✅ Токен авторизации получен: $AUTH_TOKEN${NC}"
echo -e "${BLUE}🔗 Ссылка на бота: $BOT_URL${NC}"

echo -e "\n${YELLOW}📱 Проверяем статус токена...${NC}"

# Проверка начального статуса
status_response=$(curl -s "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN")
echo "Начальный статус: $status_response"

echo -e "\n${YELLOW}🤖 Симулируем взаимодействие с ботом...${NC}"

echo -e "\n1️⃣ Симулируем команду /start с токеном..."
START_WEBHOOK=$(cat <<EOF
{
  "update_id": 100000001,
  "message": {
    "message_id": 1001,
    "date": $(date +%s),
    "chat": {
      "id": 999999999,
      "type": "private"
    },
    "from": {
      "id": 999999999,
      "is_bot": false,
      "first_name": "TestUser",
      "last_name": "Simplified",
      "username": "test_simplified_user"
    },
    "text": "/start $AUTH_TOKEN"
  }
}
EOF
)

echo "Отправляем команду /start:"
curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "$START_WEBHOOK" | jq
echo ""

echo -e "\n2️⃣ Симулируем отправку контакта (номера телефона)..."
CONTACT_WEBHOOK=$(cat <<EOF
{
  "update_id": 100000002,
  "message": {
    "message_id": 1002,
    "date": $(date +%s),
    "chat": {
      "id": 999999999,
      "type": "private"
    },
    "from": {
      "id": 999999999,
      "is_bot": false,
      "first_name": "TestUser",
      "last_name": "Simplified",
      "username": "test_simplified_user"
    },
    "contact": {
      "phone_number": "+79169999999",
      "first_name": "TestUser",
      "last_name": "Simplified",
      "user_id": 999999999
    }
  }
}
EOF
)

echo "Отправляем контакт:"
curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "$CONTACT_WEBHOOK" | jq
echo ""

echo -e "\n3️⃣ Проверяем финальный статус токена..."
final_status=$(curl -s "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN")
echo "Финальный статус: $final_status"

# Проверяем, что авторизация завершена
FINAL_SUCCESS=$(echo $final_status | jq -r '.success // false')
FINAL_STATUS=$(echo $final_status | jq -r '.status // ""')

echo -e "\n${YELLOW}📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:${NC}"
echo "================================="

if [[ "$FINAL_SUCCESS" == "true" && "$FINAL_STATUS" == "CONFIRMED" ]]; then
    echo -e "${GREEN}✅ УСПЕХ: Упрощенная авторизация работает корректно!${NC}"
    echo -e "${GREEN}   - Пользователь отправил номер телефона${NC}"
    echo -e "${GREEN}   - Авторизация завершена автоматически${NC}"
    echo -e "${GREEN}   - Никаких дополнительных подтверждений не требуется${NC}"
else
    echo -e "${RED}❌ ОШИБКА: Авторизация не завершена${NC}"
    echo -e "${RED}   Статус: $FINAL_STATUS${NC}"
fi

echo -e "\n${YELLOW}🔗 ТЕСТИРОВАНИЕ С РЕАЛЬНЫМ ПОЛЬЗОВАТЕЛЕМ:${NC}"
echo ""
if [[ -n "$BOT_URL" ]]; then
    echo "1. Откройте ссылку в браузере или Telegram:"
    echo -e "${BLUE}   $BOT_URL${NC}"
    echo ""
    echo "2. В боте должно появиться упрощенное сообщение:"
    echo "   '🍕 Добро пожаловать в MagicCvetov!"
    echo "    Привет, [Имя]!"
    echo "    Для завершения авторизации нажмите кнопку ниже и поделитесь номером телефона:'"
    echo ""
    echo "3. Должна быть только одна кнопка: [📱 Отправить телефон]"
    echo ""
    echo "4. После отправки контакта должно сразу прийти:"
    echo "   '✅ Номер телефона получен! Спасибо, [Имя]!"
    echo "    Теперь можете вернуться в приложение для завершения авторизации.'"
    echo ""
    echo -e "${GREEN}5. НЕТ дополнительных кнопок подтверждения!${NC}"
else
    echo -e "${RED}❌ Bot URL не получен - сначала исправьте проблемы с API${NC}"
fi

echo -e "\n✅ Тестирование завершено!"