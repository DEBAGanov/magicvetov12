#!/bin/bash

# Тестирование SMS авторизации через Exolve API
# Проверяет отправку SMS кода и верификацию для номера +7 906 138-28-68

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
#BASE_URL="https://debaganov-magicvetov-0177.twc1.net"
BASE_URL="http://localhost:8080"
TEST_PHONE="+79061382868"  # Ваш тестовый номер
EXOLVE_SENDER="+79304410750"  # Номер отправителя
EXOLVE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRV05sMENiTXY1SHZSV29CVUpkWjVNQURXSFVDS0NWODRlNGMzbEQtVHA0In0.eyJleHAiOjIwNjU1MTM0MTMsImlhdCI6MTc1MDE1MzQxMywianRpIjoiMzIyNDBhZTAtNzU2Ni00NDhkLWEzZGUtYjFjZDBjODlkNTU0IiwiaXNzIjoiaHR0cHM6Ly9zc28uZXhvbHZlLnJ1L3JlYWxtcy9FeG9sdmUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiZDZkYjE4ZDEtOWRhNS00NjRmLWI0ODYtMjI5NGQzMDk2ODI5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY2IxNGFjMTQtODU4OS00MjkzLWJkZjktNGE3M2VkYTRmMzQxIiwic2Vzc2lvbl9zdGF0ZSI6ImUzM2EwYzY1LWFkYTctNGU1My1iYmRmLTQzNDJhNTk0OTE1OCIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1leG9sdmUiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJleG9sdmVfYXBwIHByb2ZpbGUgZW1haWwiLCJzaWQiOiJlMzNhMGM2NS1hZGE3LTRlNTMtYmJkZi00MzQyYTU5NDkxNTgiLCJ1c2VyX3V1aWQiOiI4NDY2MzRkNy0zYTNlLTRiMzMtODdkNy01MDgzZGRlNmYxOWIiLCJjbGllbnRJZCI6ImNiMTRhYzE0LTg1ODktNDI5My1iZGY5LTRhNzNlZGE0ZjM0MSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiY2xpZW50SG9zdCI6IjE3Mi4xNi4xNjEuMTkiLCJhcGlfa2V5Ijp0cnVlLCJhcGlmb25pY2Ffc2lkIjoiY2IxNGFjMTQtODU4OS00MjkzLWJkZjktNGE3M2VkYTRmMzQxIiwiYmlsbGluZ19udW1iZXIiOiIxMzMyNTgzIiwiYXBpZm9uaWNhX3Rva2VuIjoiYXV0ZDJlYTgxNGItMWM4Zi00ODRkLWE0MjgtMjY5YTZjOWM2NmY2IiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LWNiMTRhYzE0LTg1ODktNDI5My1iZGY5LTRhNzNlZGE0ZjM0MSIsImN1c3RvbWVyX2lkIjoiMTM1ODk5IiwiY2xpZW50QWRkcmVzcyI6IjE3Mi4xNi4xNjEuMTkifQ.AFj1waE8M77SL26g9poSbRYEWeiV9Wy2ZonUnI4JJDF4uBP1D90YjTUOayHCPRbryBp6gU-cszAndQMlQsT5JLNhs88X7uo08XTY52Q9ghfdpEH22uG5AFxtWTr5450TfgLyl38goA76Xpd88xu3SHUJFEaScSGUjLaoZ1TKmvDnzdG1ZExtiARhUNRQ0eqlfkkfmYDiq_injddMk1Qub6TfC4zH4O2C0o4rUr9hIruXZe9ciKZAzZ_2hdys52vV8dN99OY5ghVRyysPAo05lScPDDMEpT2F6BwfZEQSH8r7WqOU3acxSI64gqmOFTczGZlsE7o09b_NlehqXIuHDg"

echo -e "${BLUE}🧪 ТЕСТИРОВАНИЕ SMS АВТОРИЗАЦИИ ЧЕРЕЗ EXOLVE API${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "${YELLOW}📱 Тестовые данные:${NC}"
echo -e "   📞 Номер получателя: ${TEST_PHONE}"
echo -e "   📤 Номер отправителя: ${EXOLVE_SENDER}"
echo -e "   🔗 Сервер: ${BASE_URL}"
echo ""

# Проверка доступности сервера
echo -e "${BLUE}1️⃣ Проверяем доступность сервера...${NC}"
if curl -s --max-time 10 "${BASE_URL}/actuator/health" > /dev/null; then
    echo -e "${GREEN}✅ Сервер доступен${NC}"
else
    echo -e "${RED}❌ Сервер недоступен${NC}"
    exit 1
fi

# Тест доступности SMS API эндпоинта
echo -e "${BLUE}2️⃣ Проверяем SMS API эндпоинт...${NC}"
test_response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/auth/sms/test")
if [ "$test_response" = "200" ]; then
    echo -e "${GREEN}✅ SMS API эндпоинт доступен${NC}"
else
    echo -e "${YELLOW}⚠️ SMS API эндпоинт вернул код: $test_response${NC}"
fi

# Шаг 1: Отправка SMS кода
echo ""
echo -e "${BLUE}3️⃣ ЭТАП 1: Отправка SMS кода на номер ${TEST_PHONE}...${NC}"

send_code_response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/sms/send-code" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -w "\n%{http_code}" \
  -d "{
    \"phoneNumber\": \"${TEST_PHONE}\"
  }")

# Разделяем тело ответа и HTTP код
send_code_status=$(echo "$send_code_response" | tail -n 1)
send_code_body=$(echo "$send_code_response" | sed '$d')

echo -e "${YELLOW}📤 Статус отправки: HTTP $send_code_status${NC}"
echo -e "${YELLOW}📝 Ответ сервера:${NC}"
echo "$send_code_body" | jq '.' 2>/dev/null || echo "$send_code_body"

if [ "$send_code_status" = "200" ]; then
    success=$(echo "$send_code_body" | jq -r '.success // false' 2>/dev/null)
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ SMS код успешно отправлен!${NC}"
        expires_at=$(echo "$send_code_body" | jq -r '.expiresAt // ""' 2>/dev/null)
        code_length=$(echo "$send_code_body" | jq -r '.codeLength // ""' 2>/dev/null)
        masked_phone=$(echo "$send_code_body" | jq -r '.maskedPhoneNumber // ""' 2>/dev/null)

        echo -e "${BLUE}📋 Детали отправки:${NC}"
        echo -e "   📱 Маскированный номер: $masked_phone"
        echo -e "   🔢 Длина кода: $code_length символов"
        echo -e "   ⏰ Код действителен до: $expires_at"

        # Интерактивный ввод кода
        echo ""
        echo -e "${YELLOW}📱 Проверьте SMS на номере ${TEST_PHONE}${NC}"
        echo -e "${BLUE}4️⃣ ЭТАП 2: Введите полученный 4-значный код для верификации...${NC}"

        while true; do
            echo -n "Введите SMS код: "
            read -r sms_code

            # Проверка формата кода
            if [[ "$sms_code" =~ ^[0-9]{4}$ ]]; then
                break
            else
                echo -e "${RED}❌ Неверный формат! Код должен состоять из 4 цифр${NC}"
            fi
        done

        # Верификация SMS кода
        echo -e "${BLUE}🔐 Проверяем SMS код: $sms_code...${NC}"

        verify_code_response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/sms/verify-code" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -w "\n%{http_code}" \
          -d "{
            \"phoneNumber\": \"${TEST_PHONE}\",
            \"code\": \"${sms_code}\"
          }")

        # Разделяем тело ответа и HTTP код
        verify_code_status=$(echo "$verify_code_response" | tail -n 1)
        verify_code_body=$(echo "$verify_code_response" | sed '$d')

        echo -e "${YELLOW}🔐 Статус верификации: HTTP $verify_code_status${NC}"
        echo -e "${YELLOW}📝 Ответ сервера:${NC}"
        echo "$verify_code_body" | jq '.' 2>/dev/null || echo "$verify_code_body"

        if [ "$verify_code_status" = "200" ]; then
            token=$(echo "$verify_code_body" | jq -r '.token // ""' 2>/dev/null)
            user_id=$(echo "$verify_code_body" | jq -r '.userId // ""' 2>/dev/null)
            username=$(echo "$verify_code_body" | jq -r '.username // ""' 2>/dev/null)

            if [ "$token" != "null" ] && [ "$token" != "" ]; then
                echo -e "${GREEN}🎉 SMS АВТОРИЗАЦИЯ УСПЕШНА!${NC}"
                echo -e "${BLUE}👤 Пользователь:${NC}"
                echo -e "   🆔 ID: $user_id"
                echo -e "   👤 Username: $username"
                echo -e "   🔑 JWT Token: ${token:0:50}..."

                # Тест авторизованного запроса
                echo ""
                echo -e "${BLUE}5️⃣ ЭТАП 3: Тестируем авторизованный запрос...${NC}"

                profile_response=$(curl -s -X GET "${BASE_URL}/api/v1/user/profile" \
                  -H "Authorization: Bearer $token" \
                  -H "Accept: application/json" \
                  -w "\n%{http_code}")

                profile_status=$(echo "$profile_response" | tail -n 1)
                profile_body=$(echo "$profile_response" | sed '$d')

                if [ "$profile_status" = "200" ]; then
                    echo -e "${GREEN}✅ Авторизованный запрос успешен!${NC}"
                    echo -e "${YELLOW}👤 Профиль пользователя:${NC}"
                    echo "$profile_body" | jq '.' 2>/dev/null || echo "$profile_body"
                else
                    echo -e "${YELLOW}⚠️ Авторизованный запрос вернул код: $profile_status${NC}"
                    echo "$profile_body"
                fi

            else
                echo -e "${RED}❌ Верификация не удалась - токен не получен${NC}"
            fi
        else
            echo -e "${RED}❌ Ошибка верификации SMS кода${NC}"
        fi

    else
        error_message=$(echo "$send_code_body" | jq -r '.message // "Неизвестная ошибка"' 2>/dev/null)
        echo -e "${RED}❌ Ошибка отправки SMS: $error_message${NC}"
    fi
else
    echo -e "${RED}❌ Ошибка запроса отправки SMS (HTTP $send_code_status)${NC}"
fi

# Прямой тест Exolve API (опционально)
echo ""
echo -e "${BLUE}6️⃣ БОНУС: Прямой тест Exolve API...${NC}"
echo -e "${YELLOW}🔧 Тестируем прямое подключение к Exolve API...${NC}"

exolve_test_response=$(curl -s -X POST "https://api.exolve.ru/messaging/v1/SendSMS" \
  -H "Authorization: Bearer $EXOLVE_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -w "\n%{http_code}" \
  -d "{
    \"number\": \"${EXOLVE_SENDER}\",
    \"destination\": \"${TEST_PHONE}\",
    \"text\": \"MagicCvetov TEST: Прямой тест Exolve API в $(date '+%H:%M:%S')\"
  }")

exolve_test_status=$(echo "$exolve_test_response" | tail -n 1)
exolve_test_body=$(echo "$exolve_test_response" | sed '$d')

echo -e "${YELLOW}📡 Статус прямого запроса к Exolve: HTTP $exolve_test_status${NC}"
echo -e "${YELLOW}📝 Ответ Exolve API:${NC}"
echo "$exolve_test_body" | jq '.' 2>/dev/null || echo "$exolve_test_body"

if [ "$exolve_test_status" = "200" ]; then
    echo -e "${GREEN}✅ Прямое подключение к Exolve API работает!${NC}"
else
    echo -e "${RED}❌ Проблема с прямым подключением к Exolve API${NC}"
fi

echo ""
echo -e "${BLUE}📋 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ SMS АВТОРИЗАЦИИ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "📱 Номер: ${TEST_PHONE}"
echo -e "📤 Отправитель: ${EXOLVE_SENDER}"
echo -e "🌐 Сервер: ${BASE_URL}"
echo -e "🕒 Время тестирования: $(date)"
echo ""