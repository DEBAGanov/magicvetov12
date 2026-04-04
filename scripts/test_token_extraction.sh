#!/bin/bash

echo "🧪 Тестирование извлечения токена из команды /start"
echo "================================================"

BASE_URL="https://debaganov-magicvetov-0177.twc1.net"
AUTH_TOKEN="tg_auth_OltqBXmRjfwvaA4QU79H"

echo "📊 Проверяем начальный статус токена..."
curl -s -X GET "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" | jq

echo ""
echo "🎯 Тестируем различные варианты команд /start..."

# Тест 1: Корректная команда
echo "1️⃣ Тест корректной команды: '/start $AUTH_TOKEN'"
WEBHOOK_1=$(cat <<EOF
{
  "update_id": 111111111,
  "message": {
    "message_id": 111,
    "from": {
      "id": 111111111,
      "is_bot": false,
      "first_name": "Test1",
      "username": "test1"
    },
    "chat": {
      "id": 111111111,
      "type": "private"
    },
    "date": $(date +%s),
    "text": "/start $AUTH_TOKEN"
  }
}
EOF
)

RESPONSE_1=$(curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_1")

echo "Ответ 1: $RESPONSE_1"

echo ""
echo "⏱️ Пауза 2 секунды..."
sleep 2

echo ""
echo "📊 Проверяем статус после теста 1..."
curl -s -X GET "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" | jq

echo ""
echo "2️⃣ Тест команды без пробела: '/start$AUTH_TOKEN'"
WEBHOOK_2=$(cat <<EOF
{
  "update_id": 222222222,
  "message": {
    "message_id": 222,
    "from": {
      "id": 222222222,
      "is_bot": false,
      "first_name": "Test2",
      "username": "test2"
    },
    "chat": {
      "id": 222222222,
      "type": "private"
    },
    "date": $(date +%s),
    "text": "/start$AUTH_TOKEN"
  }
}
EOF
)

RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_2")

echo "Ответ 2: $RESPONSE_2"

echo ""
echo "3️⃣ Тест просто /start"
WEBHOOK_3=$(cat <<EOF
{
  "update_id": 333333333,
  "message": {
    "message_id": 333,
    "from": {
      "id": 333333333,
      "is_bot": false,
      "first_name": "Test3",
      "username": "test3"
    },
    "chat": {
      "id": 333333333,
      "type": "private"
    },
    "date": $(date +%s),
    "text": "/start"
  }
}
EOF
)

RESPONSE_3=$(curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_3")

echo "Ответ 3: $RESPONSE_3"

echo ""
echo "📊 Финальная проверка статуса токена..."
curl -s -X GET "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" | jq

echo ""
echo "✅ Тестирование завершено"