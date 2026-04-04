#!/bin/bash

# MagicCvetov - Тест интеграции с Telegram ботом
# Автор: Backend Team
# Дата: 2025-05-31

echo "🤖 MagicCvetov - Тестирование Telegram интеграции"
echo "=============================================="

API_URL="http://localhost:8080"
ADMIN_TOKEN=""
TELEGRAM_BOT_TOKEN=7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4
TELEGRAM_CHAT_ID=-4919444764
TELEGRAM_ENABLED=true



# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для проверки статуса
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ УСПЕХ${NC}"
    else
        echo -e "${RED}✗ ОШИБКА${NC}"
    fi
}

echo ""
echo -e "${BLUE}🔍 ДИАГНОСТИКА TELEGRAM НАСТРОЕК${NC}"
echo "================================================"

# Проверка переменных окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN не установлен${NC}"
    echo "Установите: export TELEGRAM_BOT_TOKEN=ваш_токен"
    exit 1
else
    echo -e "${GREEN}✅ TELEGRAM_BOT_TOKEN установлен${NC}"
fi

if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo -e "${RED}❌ TELEGRAM_CHAT_ID не установлен${NC}"
    echo "Установите: export TELEGRAM_CHAT_ID=ваш_chat_id"
    exit 1
else
    echo -e "${GREEN}✅ TELEGRAM_CHAT_ID установлен: ${TELEGRAM_CHAT_ID}${NC}"
fi

# Проверка бота через Telegram API
echo ""
echo -e "${YELLOW}🔍 Проверка бота через Telegram API...${NC}"

BOT_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe")
BOT_OK=$(echo "$BOT_INFO" | grep -o '"ok":true')

if [ -n "$BOT_OK" ]; then
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Бот активен: @${BOT_USERNAME}${NC}"
else
    echo -e "${RED}❌ Бот не отвечает или токен неверный${NC}"
    echo "Ответ API: $BOT_INFO"
    exit 1
fi

# Тестовая отправка сообщения
echo ""
echo -e "Тестовая отправка сообщения...${NC}"

TEST_MESSAGE="Тест соединения с MagicCvetov API $(date '+%H:%M:%S %Y-%m-%d')"
echo "TEST_MESSAGE='$TEST_MESSAGE'"
TEST_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_id\": \"$TELEGRAM_CHAT_ID\",
        \"text\": \"$TEST_MESSAGE\",
        \"parse_mode\": \"HTML\"
    }")


TEST_OK=$(echo "$TEST_RESPONSE" | grep -o '"ok":true')

if [ -n "$TEST_OK" ]; then
    echo -e "${GREEN}✅ Тестовое сообщение отправлено успешно${NC}"
    echo -e "${GREEN}   Проверьте ваш Telegram чат${NC}"
else
    echo -e "${RED}❌ Ошибка отправки тестового сообщения${NC}"
    echo "Ответ Telegram API: $TEST_RESPONSE"

    # Анализ ошибки
    if [[ $TEST_RESPONSE == *"chat not found"* ]]; then
        echo ""
        echo -e "${YELLOW}🔧 РЕШЕНИЕ ПРОБЛЕМЫ 'chat not found':${NC}"
        echo "1. Убедитесь, что бот добавлен в чат/группу"
        echo "2. Для получения правильного chat_id:"
        echo "   - Добавьте бота @userinfobot в ваш чат"
        echo "   - Отправьте команду /start"
        echo "   - Скопируйте Chat ID"
        echo "3. Для группы: chat_id должен начинаться с минуса (например: -1001234567890)"
        echo "4. Для личного чата: используйте положительный ID"
    elif [[ $TEST_RESPONSE == *"bot was blocked"* ]]; then
        echo ""
        echo -e "${YELLOW}🔧 РЕШЕНИЕ: Разблокируйте бота в личных сообщениях${NC}"
    fi

    echo ""
    echo -e "${YELLOW}💡 Для получения chat_id выполните:${NC}"
    echo "1. Отправьте сообщение боту или добавьте в группу"
    echo "2. Выполните: curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"
    echo "3. Найдите 'chat':{'id': в ответе"

    exit 1
fi

echo ""
echo "📝 Предварительные требования:"
echo "1. Создайте Telegram бота через @BotFather"
echo "2. Получите токен бота"
echo "3. Добавьте бота в группу/чат и получите chat_id"
echo "4. Установите переменные окружения:"
echo "   TELEGRAM_ENABLED=true"
echo "   TELEGRAM_BOT_TOKEN=ваш_токен ${TELEGRAM_BOT_TOKEN}"
echo "   TELEGRAM_CHAT_ID=ваш_chat_id ${TELEGRAM_CHAT_ID}"
echo ""

# Шаг 1: Получение токена администратора
echo "🔐 Шаг 1: Авторизация администратора"
echo "Логин: admin"
echo "Пароль: admin123"

AUTH_RESPONSE=$(curl -s -X POST \
  "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "Ответ авторизации: $AUTH_RESPONSE"

ADMIN_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ Не удалось получить токен администратора${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Токен администратора получен${NC}"
echo ""

# Шаг 1.5: Создание тестового пользователя для заказа
echo "👤 Шаг 1.5: Создание тестового пользователя"

TIMESTAMP=$(date +%s)
USERNAME="telegram_test_$TIMESTAMP"
EMAIL="telegram_test_$TIMESTAMP@example.com"

USER_RESPONSE=$(curl -s -X POST \
  "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$USERNAME'",
    "password": "test123456",
    "email": "'$EMAIL'",
    "firstName": "Telegram",
    "lastName": "Test",
    "phone": "+79001234567"
  }')

echo "Ответ регистрации пользователя: $USER_RESPONSE"

USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_TOKEN" ]; then
    echo -e "${RED}✗ Не удалось создать тестового пользователя${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Тестовый пользователь создан${NC}"
echo ""

# Шаг 1.6: Добавление товара в корзину
echo "🛒 Шаг 1.6: Добавление товара в корзину"

CART_RESPONSE=$(curl -s -X POST \
  "$API_URL/api/v1/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": 1,
    "quantity": 1
  }')

echo "Ответ добавления в корзину: $CART_RESPONSE"

if [[ $CART_RESPONSE == *"productId"* ]] || [[ $CART_RESPONSE == *"quantity"* ]]; then
    echo -e "${GREEN}✓ Товар добавлен в корзину${NC}"
else
    echo -e "${RED}✗ Не удалось добавить товар в корзину${NC}"
    exit 1
fi
echo ""

# Шаг 2: Создание тестового заказа (который должен отправить Telegram уведомление)
echo "🍕 Шаг 2: Создание тестового заказа"

ORDER_RESPONSE=$(curl -s -X POST \
  "$API_URL/api/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "deliveryAddress": "ул. Тестовая, д. 123, кв. 45",
    "contactName": "Тест Telegram",
    "contactPhone": "+79001234567",
    "comment": "Тестовый заказ для проверки Telegram уведомлений"
  }')

echo "Ответ создания заказа: $ORDER_RESPONSE"




ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Заказ #$ORDER_ID создан${NC}"
echo ""

TEST_MESSAGE_NEW_ORDER="✓ Заказ #$ORDER_ID создан $(date '+%H:%M:%S %Y-%m-%d')"
echo "TEST_MESSAGE_NEW_ORDER='$TEST_MESSAGE_NEW_ORDER'"
TEST_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_id\": \"$TELEGRAM_CHAT_ID\",
        \"text\": \"$TEST_MESSAGE_NEW_ORDER\",
        \"parse_mode\": \"HTML\"
    }")









# Шаг 3: Изменение статуса заказа (должно отправить второе уведомление)
echo "🔄 Шаг 3: Изменение статуса заказа на CONFIRMED"

STATUS_RESPONSE=$(curl -s -X PUT \
  "$API_URL/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "statusName": "CONFIRMED"
  }')

echo "Ответ изменения статуса: $STATUS_RESPONSE"

if [[ $STATUS_RESPONSE == *"CONFIRMED"* ]]; then
    echo -e "${GREEN}✓ Статус заказа изменен на CONFIRMED${NC}"
else
    echo -e "${RED}✗ Не удалось изменить статус заказа${NC}"
fi
echo ""


TEST_MESSAGE_NEW_STATUS_CONFIRMED="✓ Статус заказа #$ORDER_ID изменен на CONFIRMED $(date '+%H:%M:%S %Y-%m-%d')"
echo "TEST_MESSAGE_NEW_ORDER='$TEST_MESSAGE_NEW_ORDER'"
TEST_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_id\": \"$TELEGRAM_CHAT_ID\",
        \"text\": \"$TEST_MESSAGE_NEW_STATUS_CONFIRMED\",
        \"parse_mode\": \"HTML\"
    }")

# Шаг 4: Еще одно изменение статуса
echo "🚚 Шаг 4: Изменение статуса заказа на DELIVERING"

STATUS_RESPONSE2=$(curl -s -X PUT \
  "$API_URL/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "statusName": "DELIVERING"
  }')

echo "Ответ изменения статуса: $STATUS_RESPONSE2"

if [[ $STATUS_RESPONSE2 == *"DELIVERING"* ]]; then
    echo -e "${GREEN}✓ Статус заказа изменен на DELIVERING${NC}"
else
    echo -e "${RED}✗ Не удалось изменить статус заказа${NC}"
fi
echo ""

echo "📱 Проверьте ваш Telegram чат/группу:"
echo "1. Уведомление о создании заказа #$ORDER_ID"
echo "2. Уведомление об изменении статуса на CONFIRMED"
echo "3. Уведомление об изменении статуса на DELIVERING"
echo ""

echo "🔧 Если уведомления не приходят, проверьте:"
echo "1. Переменные окружения TELEGRAM_ENABLED, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
echo "2. Логи приложения на наличие ошибок отправки"
echo "3. Корректность токена бота и chat_id"
echo ""

echo -e "${YELLOW}Тестирование завершено!${NC}"