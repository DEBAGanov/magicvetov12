#!/bin/bash

#
# Тест работы основных API эндпоинтов через простой стандартный Swagger
# Создан: 2025-06-10
#

API_HOST="http://localhost:8080"

echo "🔍 Тестирование простого стандартного Swagger для MagicCvetov API"
echo "=========================================="

# Функция для проверки HTTP статуса
check_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "📋 $description... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ $status_code"
        return 0
    else
        echo "❌ $status_code (ожидался $expected_status)"
        return 1
    fi
}

# Проверка документации и UI
echo "\n🔧 Проверка Swagger Documentation:"
check_endpoint "$API_HOST/v3/api-docs" "200" "OpenAPI JSON Schema"
check_endpoint "$API_HOST/swagger-ui.html" "302" "Swagger UI Redirect"
check_endpoint "$API_HOST/swagger-ui/index.html" "200" "Swagger UI Interface"

# Проверка системных эндпоинтов
echo "\n🏠 Проверка системных эндпоинтов:"
check_endpoint "$API_HOST/" "302" "Root redirect to Swagger"
check_endpoint "$API_HOST/api/health" "200" "Health Check"

# Проверка публичных эндпоинтов (без авторизации)
echo "\n🌐 Проверка публичных эндпоинтов:"
check_endpoint "$API_HOST/api/v1/categories" "200" "Categories List"
check_endpoint "$API_HOST/api/v1/products?page=0&size=10&sort=id,asc" "200" "Products List"
check_endpoint "$API_HOST/api/v1/delivery-locations" "200" "Delivery Locations"

# Проверка эндпоинтов с авторизацией (ожидаем 401/403)
echo "\n🔒 Проверка защищенных эндпоинтов (без токена):"
check_endpoint "$API_HOST/api/v1/cart" "401" "Cart (unauthorized)"
check_endpoint "$API_HOST/api/v1/orders" "401" "Orders (unauthorized)"
check_endpoint "$API_HOST/api/v1/admin/stats" "401" "Admin Stats (unauthorized)"

# Проверка Auth эндпоинтов
echo "\n🔐 Проверка Auth эндпоинтов:"
check_endpoint "$API_HOST/api/v1/auth/test" "200" "Auth Test"
check_endpoint "$API_HOST/api/v1/auth/sms/test" "200" "SMS Auth Test"
check_endpoint "$API_HOST/api/v1/auth/telegram/test" "200" "Telegram Auth Test"

echo "\n📊 Тестирование завершено!"
echo "🌐 Swagger UI доступен по адресу: $API_HOST/swagger-ui.html"
echo "📋 OpenAPI JSON Schema: $API_HOST/v3/api-docs" 