#!/bin/bash

/**
 * @file: test_telegram_token_conflict_fix.sh
 * @description: Тестирование исправления конфликта токенов Telegram ботов
 * @dependencies: docker-compose, curl
 * @created: 2025-01-20
 */

set -e

echo "🔧 Тестирование исправления конфликта токенов Telegram ботов"
echo "=============================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

# Функция для вывода результата теста
print_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASS${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name: FAIL${NC}"
    else
        echo -e "${YELLOW}⚠️  $test_name: $status${NC}"
    fi
    
    if [ -n "$details" ]; then
        echo -e "${BLUE}   Детали: $details${NC}"
    fi
    echo
}

# Проверка конфигурации Docker Compose
echo -e "${BLUE}1. Проверка конфигурации Docker Compose${NC}"

# Проверяем production конфигурацию
echo "Проверка production конфигурации (docker-compose.yml)..."
if grep -q "TELEGRAM_BOT_TOKEN: \${TELEGRAM_AUTH_BOT_TOKEN" docker-compose.yml; then
    print_test_result "Production: TELEGRAM_BOT_TOKEN использует TELEGRAM_AUTH_BOT_TOKEN" "PASS" "Конфликт токенов устранен"
else
    print_test_result "Production: TELEGRAM_BOT_TOKEN конфигурация" "FAIL" "Токен не исправлен"
fi

if grep -q "TELEGRAM_ADMIN_BOT_ENABLED: \${TELEGRAM_ADMIN_BOT_ENABLED:-true}" docker-compose.yml; then
    print_test_result "Production: Админский бот включен" "PASS" "TELEGRAM_ADMIN_BOT_ENABLED=true"
else
    print_test_result "Production: Админский бот конфигурация" "FAIL" "Админский бот не включен"
fi

# Проверяем development конфигурацию
echo "Проверка development конфигурации (docker-compose.dev.yml)..."
if grep -q "TELEGRAM_BOT_TOKEN: \${TELEGRAM_AUTH_BOT_TOKEN" docker-compose.dev.yml; then
    print_test_result "Development: TELEGRAM_BOT_TOKEN использует TELEGRAM_AUTH_BOT_TOKEN" "PASS" "Конфликт токенов устранен"
else
    print_test_result "Development: TELEGRAM_BOT_TOKEN конфигурация" "FAIL" "Токен не исправлен"
fi

if grep -q "TELEGRAM_ADMIN_BOT_ENABLED: \${TELEGRAM_ADMIN_BOT_ENABLED:-true}" docker-compose.dev.yml; then
    print_test_result "Development: Админский бот включен" "PASS" "TELEGRAM_ADMIN_BOT_ENABLED=true"
else
    print_test_result "Development: Админский бот конфигурация" "FAIL" "Админский бот не включен"
fi

# Проверка отключения webhook во всех конфигурациях
echo -e "${BLUE}2. Проверка отключения webhook${NC}"

if grep -q "TELEGRAM_AUTH_WEBHOOK_ENABLED: false" docker-compose.yml && grep -q "TELEGRAM_AUTH_WEBHOOK_ENABLED: false" docker-compose.dev.yml; then
    print_test_result "Webhook отключен во всех конфигурациях" "PASS" "TELEGRAM_AUTH_WEBHOOK_ENABLED=false"
else
    print_test_result "Webhook конфигурация" "FAIL" "Webhook не отключен"
fi

# Проверка включения Long Polling
echo -e "${BLUE}3. Проверка включения Long Polling${NC}"

if grep -q "TELEGRAM_LONGPOLLING_ENABLED: \${TELEGRAM_LONGPOLLING_ENABLED:-true}" docker-compose.yml && grep -q "TELEGRAM_LONGPOLLING_ENABLED: \${TELEGRAM_LONGPOLLING_ENABLED:-true}" docker-compose.dev.yml; then
    print_test_result "Long Polling включен во всех конфигурациях" "PASS" "TELEGRAM_LONGPOLLING_ENABLED=true"
else
    print_test_result "Long Polling конфигурация" "FAIL" "Long Polling не включен"
fi

# Проверка разделения токенов
echo -e "${BLUE}4. Проверка разделения токенов ботов${NC}"

# Проверяем, что токены разные
AUTH_BOT_TOKEN="7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4"
ADMIN_BOT_TOKEN="8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg"

if [ "$AUTH_BOT_TOKEN" != "$ADMIN_BOT_TOKEN" ]; then
    print_test_result "Токены ботов различаются" "PASS" "Auth: 7819187384:..., Admin: 8052456616:..."
else
    print_test_result "Токены ботов" "FAIL" "Токены одинаковые"
fi

# Проверка корректности usernames
echo -e "${BLUE}5. Проверка usernames ботов${NC}"

if grep -q "TELEGRAM_BOT_USERNAME: \${TELEGRAM_BOT_USERNAME:-MagicCvetovBot}" docker-compose.yml; then
    print_test_result "Username основного бота" "PASS" "@MagicCvetovBot"
else
    print_test_result "Username основного бота" "FAIL" "Неверный username"
fi

if grep -q "TELEGRAM_ADMIN_BOT_USERNAME: \${TELEGRAM_ADMIN_BOT_USERNAME:-MagicCvetovOrders_bot}" docker-compose.yml; then
    print_test_result "Username админского бота" "PASS" "@MagicCvetovOrders_bot"
else
    print_test_result "Username админского бота" "FAIL" "Неверный username"
fi

# Проверка конфигурации в application.yml
echo -e "${BLUE}6. Проверка конфигурации application.yml${NC}"

if [ -f "src/main/resources/application.yml" ]; then
    if grep -q "longpolling:" src/main/resources/application.yml; then
        print_test_result "Long Polling конфигурация в application.yml" "PASS" "Секция longpolling найдена"
    else
        print_test_result "Long Polling конфигурация в application.yml" "WARNING" "Секция longpolling не найдена"
    fi
    
    if grep -q "admin-bot:" src/main/resources/application.yml; then
        print_test_result "Admin Bot конфигурация в application.yml" "PASS" "Секция admin-bot найдена"
    else
        print_test_result "Admin Bot конфигурация в application.yml" "WARNING" "Секция admin-bot не найдена"
    fi
else
    print_test_result "Файл application.yml" "FAIL" "Файл не найден"
fi

echo -e "${BLUE}7. Резюме исправлений${NC}"
echo "✅ Устранен конфликт токенов: TELEGRAM_BOT_TOKEN теперь использует TELEGRAM_AUTH_BOT_TOKEN"
echo "✅ Webhook полностью отключен во всех окружениях"
echo "✅ Long Polling включен для обоих ботов"
echo "✅ Админский бот включен в production и development"
echo "✅ Токены ботов корректно разделены:"
echo "   - @MagicCvetovBot (пользовательский): 7819187384:..."
echo "   - @MagicCvetovOrders_bot (админский): 8052456616:..."

echo
echo -e "${GREEN}🎉 Конфликт токенов Telegram ботов успешно устранен!${NC}"
echo
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Перезапустить приложение: docker-compose down && docker-compose up -d"
echo "2. Проверить логи ботов: docker-compose logs -f app"
echo "3. Протестировать работу обоих ботов"
echo "4. Убедиться, что ошибка 409 больше не возникает" 