#!/bin/bash

echo "🏥 Проверка состояния сервера"
echo "============================="

BASE_URL="https://debaganov-magicvetov-0177.twc1.net"

echo "1️⃣ Проверка основного URL..."
curl -I -s --connect-timeout 10 "$BASE_URL" | head -n 5

echo ""
echo "2️⃣ Проверка health endpoint..."
curl -s --connect-timeout 10 "$BASE_URL/actuator/health" | jq

echo ""
echo "3️⃣ Проверка info endpoint..."
curl -s --connect-timeout 10 "$BASE_URL/actuator/info" | jq

echo ""
echo "4️⃣ Проверка API status..."
curl -s --connect-timeout 10 "$BASE_URL/api/v1/status" | jq

echo ""
echo "5️⃣ Проверка telegram webhook endpoint..."
curl -s --connect-timeout 10 "$BASE_URL/api/v1/telegram/webhook/info" | jq

echo ""
echo "6️⃣ Попытка инициализации токена..."
curl -s --connect-timeout 10 -X POST "$BASE_URL/api/v1/auth/telegram/init" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"health_check"}' | jq

echo ""
echo "✅ Проверка завершена" 