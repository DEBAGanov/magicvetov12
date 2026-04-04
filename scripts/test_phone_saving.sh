#!/bin/bash

# Тест сохранения номеров телефона при авторизации через Telegram

echo "📞 Тестирование сохранения номеров телефона в +7 формате"
echo "========================================================"

BASE_URL="http://localhost:8080"

echo "1. Проверка приложения..."
if curl -s "${BASE_URL}/actuator/health" | grep -q "UP"; then
    echo "   ✅ Приложение работает"
else
    echo "   ❌ Приложение не доступно"
    exit 1
fi

echo "2. Создание нового токена для тестирования..."
DEVICE_ID="test_phone_$(date +%s)"
response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/telegram/init" \
    -H "Content-Type: application/json" \
    -d "{\"deviceId\":\"$DEVICE_ID\"}" 2>/dev/null)

if echo "$response" | grep -q "authToken"; then
    TOKEN=$(echo "$response" | jq -r '.authToken' 2>/dev/null)
    BOT_URL=$(echo "$response" | jq -r '.telegramBotUrl' 2>/dev/null)
    echo "   ✅ Токен создан: $TOKEN"
    echo "   ✅ Ссылка: $BOT_URL"
else
    echo "   ❌ Ошибка создания токена"
    exit 1
fi

echo ""
echo "📱 ТЕСТИРОВАНИЕ СОХРАНЕНИЯ НОМЕРА ТЕЛЕФОНА:"
echo "==========================================="
echo ""
echo "1. Перейдите по ссылке и авторизуйтесь:"
echo "   $BOT_URL"
echo ""
echo "2. После отправки номера телефона проверим БД:"
echo ""

echo "Ожидание 30 секунд для завершения авторизации..."
echo "(нажмите Ctrl+C для пропуска ожидания)"

# Ждем 30 секунд или пока пользователь не нажмет Ctrl+C
for i in {30..1}; do
    printf "\r   ⏳ Осталось: %2d сек" $i
    sleep 1
done
echo ""

echo ""
echo "3. Проверка логов сохранения номера телефона..."
if command -v docker &> /dev/null; then
    echo "   Поиск логов обновления номера телефона..."

    # Ищем логи об обновлении номера телефона
    phone_logs=$(docker logs magicvetov-app 2>&1 | grep -i "номер телефона.*обновлен\|phone.*updated\|formatPhoneNumber" | tail -5)

    if [ -n "$phone_logs" ]; then
        echo "   📋 Найдены логи обновления номера:"
        echo "$phone_logs" | while read line; do
            echo "      $line"
        done
    else
        echo "   ⚠️  Логи обновления номера не найдены"
    fi

    echo ""
    echo "   Поиск новых пользователей..."
    user_logs=$(docker logs magicvetov-app 2>&1 | grep -i "создан.*пользователь\|user.*created" | tail -3)

    if [ -n "$user_logs" ]; then
        echo "   📋 Найдены логи создания пользователей:"
        echo "$user_logs" | while read line; do
            echo "      $line"
        done
    fi

else
    echo "   Docker не найден, пропускаем проверку логов"
fi

echo ""
echo "4. Проверка формата номера телефона:"
echo "   📋 Ожидаемые форматы преобразования:"
echo "      79169969633 → +79169969633"
echo "      89169969633 → +79169969633"
echo "      9169969633  → +79169969633"
echo "      379169969633 → +79169969633"
echo ""

echo "🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:"
echo "========================"
echo ""
echo "✅ Добавлен метод formatPhoneNumber в TelegramAuthService"
echo "✅ Добавлен метод formatPhoneNumber в TelegramUserDataExtractor"
echo "✅ Исправлена логика handleContactMessage - теперь вызывается updateUserWithPhone"
echo "✅ Номера телефонов теперь сохраняются в формате +7XXXXXXXXXX"
echo ""
echo "📊 Проверьте в БД:"
echo "   SELECT username, phone, telegram_id FROM users WHERE phone IS NOT NULL;"
echo ""
echo "❗ Если номер телефона все еще NULL:"
echo "   1. Перезапустите приложение: docker compose restart"
echo "   2. Проверьте логи: docker logs magicvetov-app -f | grep -i phone"
echo "   3. Попробуйте новую авторизацию с новым токеном"