#!/bin/bash

echo "🔍 Детальная диагностика Telegram webhook"
echo "========================================"

BASE_URL="https://debaganov-magicvetov-0177.twc1.net"
AUTH_TOKEN="tg_auth_wT3PiHNNyx0BeyzroIAE"

echo "📊 Проверяем начальный статус токена..."
curl -s -X GET "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" | jq

echo ""
echo "🎯 Отправляем детальный webhook запрос..."

# Создаем максимально похожий на реальный webhook запрос
WEBHOOK_DATA=$(cat <<EOF
{
  "update_id": 777888999,
  "message": {
    "message_id": 12345,
    "from": {
      "id": 555555555,
      "is_bot": false,
      "first_name": "Test",
      "last_name": "User",
      "username": "test_user",
      "language_code": "en"
    },
        "chat": {
      "id": 555555555,
      "type": "private"
    },
    "date": $(date +%s),
    "text": "/start $AUTH_TOKEN"
  }
}
EOF
)

echo "📤 Webhook данные:"
echo $WEBHOOK_DATA | jq

echo ""
echo "🚀 Отправляем webhook..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/telegram/webhook" \
  -H "Content-Type: application/json" \
  -H "User-Agent: TelegramBot (like TwitterBot)" \
  -d "$WEBHOOK_DATA")

echo "📥 Ответ webhook:"
echo $RESPONSE | jq

echo ""
echo "⏱️ Ждем 2 секунды для обработки..."
sleep 2

echo ""
echo "📊 Проверяем статус токена после webhook..."
curl -s -X GET "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN" | jq

echo ""
echo "🔍 Проверяем информацию о webhook..."
curl -s -X GET "$BASE_URL/api/v1/telegram/webhook/info" | jq

echo ""
echo "✅ Диагностика завершена"