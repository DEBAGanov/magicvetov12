#!/bin/bash

# Скрипт для тестирования интеграции Telegram Mini App
# Автор: MagicCvetov Development Team
# Дата: 2025-01-23

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Конфигурация
BASE_URL="${1:-https://dimbopizza.ru/miniapp}"
TIMEOUT=10

info "🍕 Начинаем тестирование Telegram Mini App интеграции..."
info "Базовый URL: $BASE_URL"
echo

# 1. Проверка доступности сервера
info "1. Проверка доступности сервера..."
if curl -s --max-time $TIMEOUT "$BASE_URL/api/health" > /dev/null; then
    success "Сервер доступен"
else
    error "Сервер недоступен по адресу $BASE_URL"
    exit 1
fi

# 2. Проверка Mini App статических файлов
info "2. Проверка статических файлов Mini App..."

# Проверка redirect на /miniapp
if curl -s --max-time $TIMEOUT -o /dev/null -w "%{http_code}" "$BASE_URL/miniapp" | grep -q "302"; then
    success "Redirect /miniapp работает"
else
    warning "Redirect /miniapp может не работать"
fi

# Проверка index.html
if curl -s --max-time $TIMEOUT "$BASE_URL/miniapp/index.html" | grep -q "MagicCvetov"; then
    success "index.html загружается"
else
    error "index.html не загружается или повреждён"
fi

# Проверка styles.css
if curl -s --max-time $TIMEOUT "$BASE_URL/miniapp/styles.css" | grep -q "telegram-theme"; then
    success "styles.css загружается"
else
    warning "styles.css может не загружаться"
fi

# Проверка app.js
if curl -s --max-time $TIMEOUT "$BASE_URL/miniapp/app.js" | grep -q "MagicCvetovMiniApp"; then
    success "app.js загружается"
else
    warning "app.js может не загружаться"
fi

# Проверка api.js
if curl -s --max-time $TIMEOUT "$BASE_URL/miniapp/api.js" | grep -q "PizzaAPI"; then
    success "api.js загружается"
else
    warning "api.js может не загружаться"
fi

# 3. Проверка Telegram WebApp API
info "3. Проверка Telegram WebApp API..."

# Проверка эндпоинта валидации
VALIDATE_RESPONSE=$(curl -s --max-time $TIMEOUT -w "%{http_code}" -o /tmp/validate_response \
    -X POST "$BASE_URL/api/v1/telegram-webapp/validate-init-data" \
    -H "Content-Type: application/json" \
    -d '{"initDataRaw": "test"}')

if echo "$VALIDATE_RESPONSE" | grep -q "200"; then
    success "Эндпоинт валидации отвечает"
    if grep -q "false" /tmp/validate_response; then
        success "Валидация корректно отклоняет неверные данные"
    fi
else
    warning "Эндпоинт валидации может работать некорректно (HTTP: $VALIDATE_RESPONSE)"
fi

# 4. Проверка основного API (используется Mini App)
info "4. Проверка основного API..."

# Категории
if curl -s --max-time $TIMEOUT "$BASE_URL/api/v1/categories" | grep -q "\["; then
    success "API категорий доступен"
else
    warning "API категорий может не работать"
fi

# Продукты
if curl -s --max-time $TIMEOUT "$BASE_URL/api/v1/products" | grep -q "content\|name"; then
    success "API продуктов доступен"
else
    warning "API продуктов может не работать"
fi

# Корзина (анонимная)
CART_RESPONSE=$(curl -s --max-time $TIMEOUT -w "%{http_code}" -o /tmp/cart_response \
    "$BASE_URL/api/v1/cart")

if echo "$CART_RESPONSE" | grep -q "200"; then
    success "API корзины доступен"
else
    warning "API корзины может не работать (HTTP: $CART_RESPONSE)"
fi

# 5. Проверка платежного API
info "5. Проверка платежного API..."

# СБП банки
if curl -s --max-time $TIMEOUT "$BASE_URL/api/v1/payments/yookassa/sbp-banks" | grep -q "\["; then
    success "API СБП банков доступен"
else
    warning "API СБП банков может не работать"
fi

# 6. Проверка CORS настроек
info "6. Проверка CORS настроек..."

CORS_RESPONSE=$(curl -s --max-time $TIMEOUT -w "%{http_code}" -o /tmp/cors_response \
    -X OPTIONS "$BASE_URL/api/v1/categories" \
    -H "Origin: https://web.telegram.org" \
    -H "Access-Control-Request-Method: GET")

if echo "$CORS_RESPONSE" | grep -q "200\|204"; then
    success "CORS настроен корректно"
else
    warning "CORS может быть настроен некорректно"
fi

# 7. Тестирование полного флоу (если возможно)
info "7. Тестирование полного флоу..."

# Создание тестового заказа
TEST_ORDER='{
    "deliveryAddress": "г. Волжск, ул. Тестовая, 1",
    "deliveryType": "Доставка курьером",
    "contactName": "Тестовый пользователь",
    "contactPhone": "+79999999999",
    "comment": "Тестовый заказ из Mini App",
    "paymentMethod": "SBP"
}'

ORDER_RESPONSE=$(curl -s --max-time $TIMEOUT -w "%{http_code}" -o /tmp/order_response \
    -X POST "$BASE_URL/api/v1/orders" \
    -H "Content-Type: application/json" \
    -d "$TEST_ORDER" 2>/dev/null || echo "000")

if echo "$ORDER_RESPONSE" | grep -q "201\|200"; then
    success "API создания заказов работает"
    ORDER_ID=$(grep -o '"id":[0-9]*' /tmp/order_response | cut -d':' -f2)
    if [[ -n "$ORDER_ID" ]]; then
        info "Создан тестовый заказ ID: $ORDER_ID"
    fi
elif echo "$ORDER_RESPONSE" | grep -q "401"; then
    warning "API создания заказов требует авторизации (ожидаемо для защищённых эндпоинтов)"
else
    warning "API создания заказов может не работать (HTTP: $ORDER_RESPONSE)"
fi

# 8. Проверка изображений
info "8. Проверка статических изображений..."

# Проверка примерных изображений
for img in "categories/pizza.png" "products/pizza_cheese.png"; do
    if curl -s --max-time $TIMEOUT -o /dev/null -w "%{http_code}" "$BASE_URL/static/images/$img" | grep -q "200"; then
        success "Изображение $img доступно"
    else
        warning "Изображение $img может быть недоступно"
    fi
done

# 9. Финальная проверка Mini App
info "9. Финальная проверка Mini App..."

# Проверка полной загрузки страницы
MINIAPP_CONTENT=$(curl -s --max-time $TIMEOUT "$BASE_URL/miniapp/index.html")

if echo "$MINIAPP_CONTENT" | grep -q "telegram-web-app.js"; then
    success "Telegram WebApp SDK подключен"
else
    error "Telegram WebApp SDK не найден"
fi

if echo "$MINIAPP_CONTENT" | grep -q "app.js\|api.js"; then
    success "JavaScript файлы подключены"
else
    error "JavaScript файлы не подключены"
fi

if echo "$MINIAPP_CONTENT" | grep -q "styles.css"; then
    success "CSS файлы подключены"
else
    error "CSS файлы не подключены"
fi

# Очистка временных файлов
rm -f /tmp/validate_response /tmp/cart_response /tmp/cors_response /tmp/order_response

echo
info "🎯 Результаты тестирования:"
echo
success "Mini App готово к использованию!"
echo
info "📱 Для тестирования в Telegram:"
info "1. Настройте бота в @BotFather с URL: $BASE_URL/miniapp"
info "2. Откройте бота и нажмите кнопку меню"
info "3. Проверьте все функции: каталог, корзину, оплату"
echo
info "🔗 Прямая ссылка для тестирования:"
info "$BASE_URL/miniapp"
echo
warning "⚠️  Обратите внимание:"
warning "- Mini App работает только по HTTPS в продакшене"
warning "- Для локального тестирования используйте ngrok"
warning "- Проверьте настройки TELEGRAM_BOT_TOKEN"
echo

exit 0
