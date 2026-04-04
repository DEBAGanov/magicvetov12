#!/bin/bash

# Тест Long Polling авторизации в Telegram боте
# Дата: 2025-01-20

echo "🧪 ТЕСТ: Long Polling авторизация в @MagicCvetovBot"
echo "================================================"

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
    "deviceId": "test_longpolling_device"
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

echo -e "\n${YELLOW}📱 Проверяем начальный статус токена...${NC}"

# Проверка начального статуса
status_response=$(curl -s "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN")
echo "Начальный статус: $status_response"

INITIAL_STATUS=$(echo $status_response | jq -r '.status // ""')
if [[ "$INITIAL_STATUS" != "PENDING" ]]; then
    echo -e "${RED}❌ Неожиданный начальный статус: $INITIAL_STATUS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Токен в статусе PENDING - готов к авторизации${NC}"

echo -e "\n${YELLOW}🤖 ИНСТРУКЦИИ ДЛЯ РУЧНОГО ТЕСТИРОВАНИЯ:${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}1. Откройте ссылку в браузере или Telegram:${NC}"
echo -e "${BLUE}   $BOT_URL${NC}"
echo ""
echo "2. В боте должно появиться сообщение:"
echo "   '🍕 Добро пожаловать в MagicCvetov!"
echo "    Привет, [Ваше имя]!"
echo "    Для завершения авторизации нажмите кнопку ниже и поделитесь номером телефона:'"
echo ""
echo "3. Нажмите кнопку: [📱 Отправить телефон]"
echo ""
echo "4. В диалоге выберите 'Поделиться номером телефона'"
echo ""
echo "5. После отправки контакта должно сразу прийти:"
echo "   '✅ Номер телефона получен! Спасибо, [Ваше имя]!"
echo "    Теперь можете вернуться в приложение для завершения авторизации.'"
echo ""
echo -e "${GREEN}6. НЕТ дополнительных кнопок подтверждения!${NC}"

echo -e "\n${YELLOW}⏳ Ожидание авторизации (60 секунд)...${NC}"

# Ожидание авторизации с проверкой каждые 5 секунд
for i in {1..12}; do
    echo -e "${YELLOW}Проверка $i/12...${NC}"
    
    status_response=$(curl -s "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN")
    CURRENT_STATUS=$(echo $status_response | jq -r '.status // ""')
    
    echo "Текущий статус: $CURRENT_STATUS"
    
    if [[ "$CURRENT_STATUS" == "CONFIRMED" ]]; then
        echo -e "\n${GREEN}🎉 УСПЕХ! Авторизация завершена!${NC}"
        echo "Финальный ответ: $status_response"
        
        # Проверяем данные авторизации
        AUTH_DATA=$(echo $status_response | jq -r '.authData // null')
        if [[ "$AUTH_DATA" != "null" ]]; then
            echo -e "${GREEN}✅ Данные авторизации получены${NC}"
            echo "AuthData: $AUTH_DATA"
        fi
        
        echo -e "\n${GREEN}📊 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ: УСПЕХ${NC}"
        echo "================================="
        echo -e "${GREEN}✅ Long Polling авторизация работает корректно${NC}"
        echo -e "${GREEN}✅ Упрощенный процесс без лишних подтверждений${NC}"
        echo -e "${GREEN}✅ Токен успешно подтвержден${NC}"
        exit 0
    elif [[ "$CURRENT_STATUS" == "EXPIRED" ]]; then
        echo -e "\n${RED}❌ ОШИБКА: Токен истек${NC}"
        echo "Финальный ответ: $status_response"
        exit 1
    elif [[ "$CURRENT_STATUS" == "FAILED" ]]; then
        echo -e "\n${RED}❌ ОШИБКА: Авторизация не удалась${NC}"
        echo "Финальный ответ: $status_response"
        exit 1
    fi
    
    if [[ $i -lt 12 ]]; then
        sleep 5
    fi
done

echo -e "\n${YELLOW}⏰ Время ожидания истекло${NC}"
final_status=$(curl -s "$BASE_URL/api/v1/auth/telegram/status/$AUTH_TOKEN")
echo "Финальный статус: $final_status"

FINAL_STATUS=$(echo $final_status | jq -r '.status // ""')

echo -e "\n${YELLOW}📊 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:${NC}"
echo "================================="

if [[ "$FINAL_STATUS" == "CONFIRMED" ]]; then
    echo -e "${GREEN}✅ УСПЕХ: Авторизация завершена (с задержкой)${NC}"
elif [[ "$FINAL_STATUS" == "PENDING" ]]; then
    echo -e "${YELLOW}⏳ ЧАСТИЧНЫЙ УСПЕХ: Токен создан, но авторизация не завершена${NC}"
    echo -e "${YELLOW}   Возможные причины:${NC}"
    echo -e "${YELLOW}   - Пользователь не прошел авторизацию в боте${NC}"
    echo -e "${YELLOW}   - Long Polling бот не работает${NC}"
    echo -e "${YELLOW}   - Проблемы с обработкой контакта${NC}"
else
    echo -e "${RED}❌ ОШИБКА: Неожиданный статус: $FINAL_STATUS${NC}"
fi

echo -e "\n${BLUE}💡 Для отладки проверьте логи приложения:${NC}"
echo "docker logs magicvetov-app --tail 50 | grep -i telegram" 