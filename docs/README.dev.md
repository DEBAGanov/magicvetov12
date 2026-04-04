# MagicCvetov - Локальная разработка

## Обновления
Файл `docker-compose.dev.yml` обновлен на основе продакшн версии со всеми переменными окружения.

## Быстрый старт

### 1. Подготовка переменных окружения
```bash
# Скопируйте пример переменных окружения
cp env.dev.example .env
```

### 2. Запуск всех сервисов
```bash
# Запуск в режиме разработки
docker-compose -f docker-compose.dev.yml up --build

# Или в фоновом режиме
docker-compose -f docker-compose.dev.yml up -d --build
```

### 3. Проверка состояния сервисов
```bash
# Проверка логов
docker-compose -f docker-compose.dev.yml logs -f

# Статус сервисов
docker-compose -f docker-compose.dev.yml ps
```

## Сервисы

### PostgreSQL (порт 5432)
- **База данных**: `magicvetov_db`
- **Пользователь**: `magicvetov_user`
- **Пароль**: из переменной `DB_PASSWORD`

### MinIO S3 (порты 9000, 9001)
- **API**: http://localhost:9000
- **Консоль**: http://localhost:9001
- **Пользователь**: из переменной `MINIO_ROOT_USER`
- **Пароль**: из переменной `MINIO_ROOT_PASSWORD`

### Приложение (порт 8080)
- **API**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health
- **Swagger**: http://localhost:8080/swagger-ui.html

## Основные изменения

### ✅ Добавлено из продакшн версии:
- **YooKassa**: Полная интеграция с тестовыми ключами
- **Exolve SMS**: API для отправки SMS (тестовый режим)
- **Мониторинг**: Метрики и алерты YooKassa
- **СБП**: Система быстрых платежей
- **CORS**: Настройки для локальной разработки
- **Временная зона**: Europe/Moscow

### 🔧 Настройки разработки:
- **Логирование**: DEBUG уровень для разработки
- **SQL**: `SPRING_JPA_SHOW_SQL=true`
- **DDL**: `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- **Health Check**: `show_details=when_authorized`

## Переменные окружения

Все переменные настроены с значениями по умолчанию в `env.dev.example`:

### 🔐 Безопасность
- JWT_SECRET
- DB_PASSWORD  
- MINIO_ROOT_USER/PASSWORD

### 📱 Telegram
- TELEGRAM_AUTH_BOT_TOKEN
- TELEGRAM_ADMIN_BOT_TOKEN
- TELEGRAM_GATEWAY_ACCESS_TOKEN

### 💳 Платежи
- YOOKASSA_* (тестовые ключи)
- SBP_* настройки

### 📧 SMS
- EXOLVE_API_KEY (тестовый)

### 🌐 CORS
- Локальные порты: 3000, 5173, 5174, 8080

## Команды управления

### Остановка сервисов
```bash
docker-compose -f docker-compose.dev.yml down
```

### Очистка данных
```bash
# Удаление volumes
docker-compose -f docker-compose.dev.yml down -v

# Полная очистка
docker-compose -f docker-compose.dev.yml down -v --rmi all
```

### Пересборка
```bash
# Пересборка только приложения
docker-compose -f docker-compose.dev.yml build app

# Принудительная пересборка
docker-compose -f docker-compose.dev.yml build --no-cache
```

## Тестирование

### API эндпоинты
```bash
# Health check
curl http://localhost:8080/actuator/health

# Swagger UI
open http://localhost:8080/swagger-ui.html

# Проверка YooKassa
curl -X GET http://localhost:8080/api/v1/payments/yookassa/status
```

### MinIO
```bash
# Консоль MinIO
open http://localhost:9001
```

### База данных
```bash
# Подключение к PostgreSQL
docker exec -it magicvetov-postgres-dev psql -U magicvetov_user -d magicvetov_db
```

## Проблемы и решения

### Проблема с портами
```bash
# Проверка занятых портов
lsof -i :8080
lsof -i :5432
lsof -i :9000
```

### Проблема с volumes
```bash
# Очистка volumes
docker volume prune
```

### Проблема с сетью
```bash
# Пересоздание сети
docker network rm magicvetov-network-dev
docker-compose -f docker-compose.dev.yml up
```