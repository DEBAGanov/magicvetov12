#!/bin/bash

echo "🎉 АКТИВАЦИЯ ЗОНАЛЬНОЙ СИСТЕМЫ ДОСТАВКИ PIZZANAT"
echo "=================================================="

# Проверка доступности API
echo "1. Проверка API..."
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ API доступен"
else
    echo "❌ API недоступен"
    exit 1
fi

# Проверка базы данных
echo "2. Проверка базы данных..."
ZONES_COUNT=$(docker exec magicvetov-postgres-dev psql -U magicvetov_user -d magicvetov_db -t -c "SELECT COUNT(*) FROM delivery_zones WHERE is_active = true;" 2>/dev/null | xargs)

if [ "$ZONES_COUNT" -gt 0 ]; then
    echo "✅ База данных содержит $ZONES_COUNT активных зон доставки"
else
    echo "❌ Проблема с базой данных или зонами доставки"
    exit 1
fi

# Тестирование зональной системы
echo "3. Тестирование зональной системы..."

# Тест 1: Дружба (100₽)
RESPONSE1=$(curl -s -G "http://localhost:8080/api/v1/delivery/estimate" --data-urlencode "address=улица Дружбы, 5" --data-urlencode "orderAmount=500")
ZONE1=$(echo $RESPONSE1 | jq -r '.zoneName // "Стандартная зона"')
COST1=$(echo $RESPONSE1 | jq -r '.deliveryCost // 200')

# Тест 2: Промузел (300₽)
RESPONSE2=$(curl -s -G "http://localhost:8080/api/v1/delivery/estimate" --data-urlencode "address=Промышленная улица, 10" --data-urlencode "orderAmount=500")
ZONE2=$(echo $RESPONSE2 | jq -r '.zoneName // "Стандартная зона"')
COST2=$(echo $RESPONSE2 | jq -r '.deliveryCost // 200')

# Тест 3: Бесплатная доставка
RESPONSE3=$(curl -s -G "http://localhost:8080/api/v1/delivery/estimate" --data-urlencode "address=улица Дружбы, 5" --data-urlencode "orderAmount=900")
ZONE3=$(echo $RESPONSE3 | jq -r '.zoneName // "Стандартная зона"')
COST3=$(echo $RESPONSE3 | jq -r '.deliveryCost // 200')
FREE3=$(echo $RESPONSE3 | jq -r '.isDeliveryFree // false')

echo ""
echo "📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:"
echo "=========================="

SUCCESS_COUNT=0
TOTAL_TESTS=3

# Проверка тестов
if [ "$ZONE1" = "Дружба" ] && [ "$COST1" = "100.00" ]; then
    echo "✅ Тест 1: Дружба - $COST1₽"
    ((SUCCESS_COUNT++))
else
    echo "❌ Тест 1: $ZONE1 - $COST1₽ (ожидалось: Дружба - 100.00₽)"
fi

if [ "$ZONE2" = "Промузел" ] && [ "$COST2" = "300.00" ]; then
    echo "✅ Тест 2: Промузел - $COST2₽"
    ((SUCCESS_COUNT++))
else
    echo "❌ Тест 2: $ZONE2 - $COST2₽ (ожидалось: Промузел - 300.00₽)"
fi

if [ "$ZONE3" = "Дружба" ] && [ "$COST3" = "0" ] && [ "$FREE3" = "true" ]; then
    echo "✅ Тест 3: Бесплатная доставка - $COST3₽"
    ((SUCCESS_COUNT++))
else
    echo "❌ Тест 3: $ZONE3 - $COST3₽, бесплатная: $FREE3 (ожидалось: Дружба - 0.00₽, true)"
fi

echo ""
echo "📈 ИТОГОВЫЙ РЕЗУЛЬТАТ: $SUCCESS_COUNT/$TOTAL_TESTS тестов пройдено"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo ""
    echo "🎉 ЗОНАЛЬНАЯ СИСТЕМА ДОСТАВКИ УСПЕШНО АКТИВИРОВАНА!"
    echo "=================================================="
    echo ""
    echo "📋 НАСТРОЕННЫЕ ЗОНЫ:"
    echo "• Дружба: 100₽ (бесплатно от 800₽)"
    echo "• Центральный: 200₽ (бесплатно от 1000₽)"
    echo "• Машиностроитель: 200₽ (бесплатно от 1000₽)"
    echo "• ВДК: 200₽ (бесплатно от 1000₽)"
    echo "• Северный: 200₽ (бесплатно от 1000₽)"
    echo "• Горгаз: 200₽ (бесплатно от 1000₽)"
    echo "• Прибрежный: 200₽ (бесплатно от 1000₽)"
    echo "• Заря: 250₽ (бесплатно от 1200₽)"
    echo "• Луговая: 250₽ (бесплатно от 1200₽)"
    echo "• Мамасево: 250₽ (бесплатно от 1200₽)"
    echo "• Промузел: 300₽ (бесплатно от 1500₽)"
    echo ""
    echo "🌍 Покрытие: 210+ улиц города Волжск"
    echo "⏰ Время доставки: 30-60 минут"
    echo "🕘 Часы работы: 09:00-22:00"
    echo ""
    echo "✅ Система готова к работе!"
    exit 0
else
    echo ""
    echo "⚠️  ЧАСТИЧНАЯ АКТИВАЦИЯ"
    echo "Некоторые тесты не прошли. Проверьте логи приложения."
    echo "Команда для проверки логов:"
    echo "docker logs magicvetov-app-dev | grep -E '(ERROR|Exception)'"
    exit 1
fi 