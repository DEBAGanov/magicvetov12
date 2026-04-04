# Деплой MagicCvetov в Timeweb Cloud

## Проблема
При деплое в Timeweb Cloud возникает ошибка: `volumes is not allowed in docker-compose.yml`

## Решения

### 🎯 ВАРИАНТ 1: Отдельный docker-compose для prod (РЕКОМЕНДУЕМЫЙ)

1. **Используйте `docker-compose.prod.yml`** для деплоя в Timeweb
2. **Преимущества:**
   - Чистое разделение dev/prod
   - Нет volumes
   - Встроенная nginx конфигурация
   - Простой кэш вместо Redis

**Команда для деплоя:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 🔧 ВАРИАНТ 2: Profiles в основном docker-compose.yml

1. **Используйте profiles** для разделения окружений
2. **Команды:**
   ```bash
   # Для dev
   docker-compose --profile dev up -d

   # Для prod
   docker-compose --profile prod up -d
   ```

### ⚡ ВАРИАНТ 3: Минимальный docker-compose

1. **Используйте `docker-compose.minimal.yml`** - только приложение
2. **Команда:**
   ```bash
   docker-compose -f docker-compose.minimal.yml up -d
   ```

## Изменения в коде

### 1. Отключение Redis в prod
- Добавлена конфигурация `SPRING_CACHE_TYPE: simple`
- Создан `CacheConfig.java` для простого кэша
- Обновлен `application.yml`

### 2. Встроенная nginx конфигурация
- Nginx конфигурация встроена в docker-compose
- Нет зависимости от внешних файлов

### 3. Переменные окружения
Убедитесь, что установлены:
```bash
TIMEWEB_DB_URL=jdbc:postgresql://your-db-host:5432/your-db
TIMEWEB_DB_USER=your-user
TIMEWEB_DB_PASSWORD=your-password
TIMEWEB_S3_ACCESS_KEY=your-s3-key
TIMEWEB_S3_SECRET_KEY=your-s3-secret
```

## Проверка работы

После деплоя проверьте:
```bash
# Health check
curl http://your-domain/api/health

# API endpoints
curl http://your-domain/api/v1/categories
```

## Возможные проблемы

1. **Порты заняты** - измените порты в docker-compose
2. **Нет доступа к БД** - проверьте переменные окружения
3. **Проблемы с S3** - проверьте ключи доступа

4. Проблема с URL изображений
**Проблема**: URL содержали дублирование bucket name и лишние query parameters
```
"imageUrl": "https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/f9c8e17a-magicvetov-products/https%3A/s3.twcstorage.ru/f9c8e17a-magicvetov-products/f9c8e17a-magicvetov-products/categories/pizza.png?X-Amz-Algorithm=..."
```
**Решение**:
- В БД сохраняются только относительные пути (`categories/pizza.png`)
- `StorageService` формирует корректные публичные URL без query parameters
- Результат: `https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/categories/pizza.png`


решена

## Будущие улучшения

1. **Подключение Redis в Timeweb Cloud** - когда будет доступен
2. **SSL сертификаты** - добавить Let's Encrypt
3. **Мониторинг** - добавить Prometheus/Grafana