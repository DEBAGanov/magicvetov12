#!/bin/bash

echo "🔧 Настройка Telegram webhook для продакшена"
echo "============================================"

# Telegram Bot Token
BOT_TOKEN="7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"

# Production URL
WEBHOOK_URL="https://debaganov-magicvetov-0177.twc1.net/api/v1/telegram/webhook"

echo "🔍 Проверка текущего webhook..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | jq

echo ""
echo "🗑️ Удаление старого webhook..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook" | jq

echo ""
echo "📋 Установка нового webhook..."
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }" | jq

echo ""
echo "✅ Проверка установленного webhook..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | jq

echo ""
echo "🧪 Тестирование доступности endpoint..."
curl -s -X GET "https://debaganov-magicvetov-0177.twc1.net/api/v1/telegram/webhook/info" | jq

echo ""
echo "🚀 Настройка завершена!"
echo "Теперь попробуйте отправить /start боту: @MagicCvetovBot"