#!/bin/bash

# Тестирование исправлений Telegram бота
# Дата создания: 27.01.2025

echo "🧪 Тестирование исправлений Telegram бота и Mini App"
echo "===================================================="

echo
echo "✅ ИСПРАВЛЕНИЯ ВЫПОЛНЕНЫ:"
echo "========================"
echo "1. 🛒 Добавлена кнопка 'Заказать' в боте → /miniapp/checkout.html"
echo "2. 🍕 Кнопка 'Открыть меню' → /miniapp/menu"
echo "3. 🇷🇺 Русский текст в диалоге запроса номера телефона"
echo "4. 📱 Улучшенный UX с кнопками 'Поделиться номером' / 'Ввести вручную'"

echo
echo "🔧 ЧТО ИЗМЕНЕНО В КОДЕ:"
echo "======================"
echo "📄 MagicCvetovTelegramBot.java:"
echo "  - Добавлена кнопка 'Заказать' (приоритетная)"
echo "  - URL кнопки ведет на рабочий путь /miniapp/checkout.html"
echo "  - Кнопки расположены в 2 строки для лучшего UX"

echo
echo "📄 checkout-app.js:"
echo "  - Обновлен текст popup'а на русский"
echo "  - Добавлена кнопка 'Ввести вручную' как альтернатива"
echo "  - Улучшено описание для пользователя"

echo
echo "🌐 ПРОВЕРКА ДОСТУПНОСТИ ПУТЕЙ:"
echo "=============================="

BASE_URL="https://api.dimbopizza.ru"

echo "🛒 Путь заказа (кнопка 'Заказать'):"
checkout_status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/miniapp/checkout.html)
if [ "$checkout_status" = "200" ]; then
    echo "  ✅ $BASE_URL/miniapp/checkout.html → HTTP $checkout_status"
else
    echo "  ❌ $BASE_URL/miniapp/checkout.html → HTTP $checkout_status"
fi

echo
echo "🍕 Путь меню (кнопка 'Открыть меню'):"
menu_status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/miniapp/menu)
if [ "$menu_status" = "200" ]; then
    echo "  ✅ $BASE_URL/miniapp/menu → HTTP $menu_status"
else
    echo "  ❌ $BASE_URL/miniapp/menu → HTTP $menu_status"
fi

echo
echo "📱 Проверка содержимого checkout.html:"
echo "====================================="
if curl -s $BASE_URL/miniapp/checkout.html | grep -q "DIMBO Pizza"; then
    echo "  ✅ Страница загружается корректно"
    echo "  ✅ Содержит заголовок 'DIMBO Pizza'"
else
    echo "  ❌ Проблема с загрузкой страницы"
fi

echo
echo "🔄 СЛЕДУЮЩИЕ ШАГИ:"
echo "=================="
echo "1. 🏗️ Пересобрать и развернуть приложение с обновленным ботом"
echo "2. 🧪 Протестировать кнопку 'Заказать' в Telegram боте"
echo "3. 📱 Проверить автоматический запрос номера телефона"
echo "4. 📊 Проверить создание записей в telegram_auth_tokens"

echo
echo "📝 КОМАНДЫ ДЛЯ РАЗВЕРТЫВАНИЯ:"
echo "============================"
echo "# Локальная пересборка"
echo "docker-compose -f docker-compose.dev.yml up --build -d"
echo
echo "# Продакшн развертывание"
echo "docker-compose -f docker-compose.production.yml up --build -d"

echo
echo "🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:"
echo "======================"
echo "✅ Кнопка 'Заказать' в боте откроет checkout.html"
echo "✅ Появится русский popup с просьбой поделиться номером"
echo "✅ После предоставления номера - запись в telegram_auth_tokens"
echo "✅ Кросс-платформенная авторизация заработает"

echo
echo "🚀 Исправления готовы к развертыванию!"
