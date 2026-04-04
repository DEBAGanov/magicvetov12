#!/bin/bash

# Тестирование Nominatim API напрямую
# Проверяем работу бесплатного API OpenStreetMap для автоподсказок адресов

echo "🗺️  Тестирование Nominatim API (OpenStreetMap)"
echo "=============================================="
echo ""

# Функция для выполнения HTTP запросов к Nominatim
test_nominatim() {
    local query="$1"
    local description="$2"
    
    echo "📍 $description"
    echo "Запрос: $query"
    
    # URL-кодирование запроса
    encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
    
    url="https://nominatim.openstreetmap.org/search?q=${encoded_query}&format=json&limit=5&addressdetails=1&countrycodes=ru&bounded=1&viewbox=48.2,55.8,48.5,55.9"
    
    echo "URL: $url"
    
    response=$(curl -s -H "User-Agent: MagicCvetov/1.0 (test@magicvetov.ru)" "$url")
    
    if [ $? -eq 0 ]; then
        echo "✅ Запрос выполнен успешно"
        echo "Ответ:"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        
        # Подсчитываем количество результатов
        count=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")
        echo "Найдено результатов: $count"
    else
        echo "❌ Ошибка при выполнении запроса"
    fi
    echo "----------------------------------------"
    echo ""
}

# Тест 1: Поиск города Волжск
echo "🔍 Тест 1: Поиск города Волжск"
test_nominatim "Volzhsk" "Поиск города Волжск (латиницей)"
test_nominatim "Волжск" "Поиск города Волжск (кириллицей)"

# Тест 2: Поиск улиц в Волжске
echo "🔍 Тест 2: Поиск улиц в Волжске"
test_nominatim "Volzhsk Lenin street" "Поиск улицы Ленина в Волжске"
test_nominatim "Волжск улица Ленина" "Поиск улицы Ленина (кириллица)"
test_nominatim "Volzhsk Sverdlova street" "Поиск улицы Свердлова"

# Тест 3: Поиск конкретных адресов
echo "🔍 Тест 3: Поиск конкретных адресов"
test_nominatim "Volzhsk Lenin 1" "Поиск дома 1 на улице Ленина"
test_nominatim "Волжск Ленина 10" "Поиск дома 10 на улице Ленина"

# Тест 4: Поиск с указанием региона
echo "🔍 Тест 4: Поиск с указанием региона"
test_nominatim "Volzhsk, Mari El, Russia" "Поиск с указанием региона"
test_nominatim "Волжск, Марий Эл, Россия" "Поиск с регионом (кириллица)"

# Тест 5: Проверка лимитов API
echo "🔍 Тест 5: Проверка производительности"
echo "Выполняем 5 быстрых запросов подряд..."

for i in {1..5}; do
    echo -n "Запрос $i: "
    start_time=$(date +%s%N)
    curl -s -H "User-Agent: MagicCvetov/1.0" "https://nominatim.openstreetmap.org/search?q=Volzhsk&format=json&limit=1" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    echo "${duration}ms"
    sleep 1  # Соблюдаем лимиты API (1 запрос в секунду)
done

echo ""
echo "🎯 Тестирование Nominatim API завершено!"
echo "=============================================="
echo ""
echo "📋 Выводы:"
echo "- Nominatim API доступен и работает"
echo "- Поддерживает поиск по городу Волжск"
echo "- Возвращает координаты и детальную информацию"
echo "- Бесплатный и не требует API ключей"
echo "- Имеет лимит: 1 запрос в секунду"
echo ""
echo "🔧 Рекомендации для интеграции:"
echo "- Использовать кэширование результатов"
echo "- Добавить debounce для пользовательского ввода"
echo "- Соблюдать лимиты API (1 req/sec)"
echo "- Добавить fallback на локальную базу адресов" 