# 🌐 Руководство по переменным окружения MagicCvetov

## Обзор

В рамках оптимизации для развертывания на Timeweb Cloud, все настройки в `docker-compose.yml` вынесены в переменные окружения с значениями по умолчанию. Это позволяет легко настраивать приложение через файл `.env` без изменения самого docker-compose.yml.

## 🚀 Быстрый старт

### 1. Создание файла переменных окружения

```bash
# Скопируйте шаблон
cp env-template.txt .env

# Отредактируйте критичные переменные
nano .env  # или любой другой редактор
```

### 2. Обязательные изменения для production

**⚠️ КРИТИЧНО**: Обязательно измените следующие переменные:

```bash
# В файле .env
TIMEWEB_DB_PASSWORD=your_actual_database_password
JWT_SECRET=your_generated_jwt_secret_key
```

### 3. Запуск приложения

```bash
# Запуск с переменными из .env
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f app
```

## 📋 Категории переменных

### 🔒 Критичные переменные безопасности

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| `TIMEWEB_DB_PASSWORD` | Пароль базы данных | ✅ ДА |
| `JWT_SECRET` | Секрет для JWT токенов | ⚠️ Рекомендуется |

### 🌐 Основные настройки приложения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Spring профиль |
| `SERVER_PORT` | `8080` | Порт приложения |
| `CONTAINER_TIMEZONE` | `Europe/Moscow` | Временная зона контейнера |
| `JVM_TIMEZONE` | `Europe/Moscow` | Временная зона JVM |

### 🗄️ База данных

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `TIMEWEB_DB_URL` | `jdbc:postgresql://45.10.41.59:5432/default_db` | URL базы данных |
| `TIMEWEB_DB_USER` | `gen_user` | Пользователь БД |
| `DB_POOL_MAX_SIZE` | `8` | Максимум соединений |
| `DB_POOL_MIN_IDLE` | `2` | Минимум соединений |

### 🗂️ Файловое хранилище (Timeweb S3)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `TIMEWEB_S3_ACCESS_KEY` | `AJK63DSBOEBQD3IVTLOT` | Ключ доступа S3 |
| `TIMEWEB_S3_SECRET_KEY` | `eOkZ8nzUkylhcsgPRQVJdr8qmvblxvaq7zoEcNpk` | Секретный ключ S3 |
| `TIMEWEB_S3_BUCKET` | `f9c8e17a-magicvetov-products` | Имя bucket |

### 📱 SMS авторизация (Exolve)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `EXOLVE_API_KEY` | `eyJhbGciOiJSUzI1NiIs...` | API ключ Exolve |
| `EXOLVE_SENDER_NAME` | `+79304410750` | Номер отправителя |
| `SMS_CODE_LENGTH` | `4` | Длина SMS кода |
| `SMS_CODE_TTL` | `10` | Время жизни кода (мин) |

### 🤖 Telegram боты

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `TELEGRAM_AUTH_BOT_TOKEN` | `7819187384:AAGJNn0c...` | Токен основного бота |
| `TELEGRAM_ADMIN_BOT_TOKEN` | `8052456616:AAEoAzBf...` | Токен админского бота |
| `TELEGRAM_GATEWAY_ACCESS_TOKEN` | `AAGCGwAAIlEzNcCeEbrV...` | Токен Telegram Gateway |

### 📊 Мониторинг и логирование

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `LOG_LEVEL_ROOT` | `WARN` | Общий уровень логов |
| `LOG_LEVEL_APP` | `INFO` | Уровень логов приложения |
| `ACTUATOR_ENDPOINTS` | `health,info,metrics` | Доступные endpoints |

## 🔧 Сценарии использования

### Для production (по умолчанию)

```bash
# Минимальный .env для production
TIMEWEB_DB_PASSWORD=your_secure_password
```

### Для разработки

```bash
# Дополнительно в .env
SPRING_PROFILES_ACTIVE=dev
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=DEBUG
JPA_SHOW_SQL=true
ACTUATOR_HEALTH_DETAILS=when_authorized
```

### Для отладки

```bash
# Дополнительно в .env
LOG_LEVEL_ROOT=DEBUG
LOG_LEVEL_SPRING_WEB=DEBUG
JPA_SHOW_SQL=true
```

### Изменение портов

```bash
# Если порт 8080 занят
SERVER_PORT=8081
ACTUATOR_PORT=8081
```

### Настройка производительности

```bash
# Увеличение пула соединений для высокой нагрузки
DB_POOL_MAX_SIZE=16
DB_POOL_MIN_IDLE=4

# Увеличение памяти JVM
JVM_MAX_RAM_PERCENTAGE=80.0
```

## 🛠️ Команды управления

### Проверка переменных

```bash
# Показать все переменные для сервиса app
docker-compose config | grep -A 100 "environment:"

# Проверить конкретную переменную в контейнере
docker exec magicvetov-app env | grep TIMEWEB_DB_URL
```

### Перезапуск с новыми переменными

```bash
# Остановить
docker-compose down

# Пересоздать с новыми переменными
docker-compose up -d --force-recreate

# Проверить логи
docker-compose logs -f app
```

### Проверка здоровья

```bash
# Health check
curl http://localhost:8080/actuator/health

# Проверка API
curl http://localhost:8080/api/v1/categories
```

## ⚠️ Важные замечания

### Безопасность

1. **Никогда не коммитьте файл `.env`** в git
2. **Используйте сильные пароли** для production
3. **Регулярно ротируйте JWT секреты**

### Совместимость с Timeweb Cloud

1. **Пароль базы данных** - единственная переменная без значения по умолчанию
2. **Все остальные переменные** имеют рабочие значения
3. **Без .env файла** приложение запустится с настройками по умолчанию

### Миграция с предыдущих версий

Если у вас есть старые переменные окружения в Timeweb Cloud:

1. **Удалите их** из панели управления
2. **Установите только** `TIMEWEB_DB_PASSWORD`
3. **Остальные настройки** будут взяты из docker-compose.yml

## 📚 Дополнительные ресурсы

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Spring Boot Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [Timeweb Cloud Documentation](https://timeweb.cloud/help/)

## 🆘 Поиск и устранение неисправностей

### Проблема: Переменные не применяются

```bash
# Проверьте синтаксис .env (без пробелов вокруг =)
cat .env | grep "="

# Пересоздайте контейнеры
docker-compose down && docker-compose up -d --force-recreate
```

### Проблема: Ошибки подключения к БД

```bash
# Проверьте переменные БД
docker exec magicvetov-app env | grep TIMEWEB_DB

# Проверьте доступность БД
docker exec magicvetov-app pg_isready -h 45.10.41.59 -p 5432
```

### Проблема: Порт занят

```bash
# Измените порт в .env
echo "SERVER_PORT=8081" >> .env

# Перезапустите
docker-compose down && docker-compose up -d
``` 