# MagicCvetov Environment Configuration Guide

## Настройка переменных окружения

### Быстрый старт

1. **Создайте .env файл из шаблона:**
```bash
cp env-template.txt .env
```

2. **Отредактируйте переменные под ваши потребности:**
```bash
# Для macOS/Linux
nano .env

# Или для Windows
notepad .env
```

3. **Запустите проект:**
```bash
docker compose up -d
```

## Описание основных переменных

### 🔒 Безопасность (обязательно изменить!)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DB_PASSWORD` | Пароль для PostgreSQL | `my_secure_db_password_2025` |
| `REDIS_PASSWORD` | Пароль для Redis | `my_secure_redis_password_2025` |
| `JWT_SECRET` | Секретный ключ для JWT токенов | `base64_encoded_secret_key` |

### 🌐 Конфигурация приложения

| Переменная | Описание | Значения |
|------------|----------|----------|
| `SPRING_PROFILES_ACTIVE` | Профиль Spring Boot | `dev`, `prod`, `test` |
| `S3_PUBLIC_URL` | Публичный URL для изображений | `http://localhost` (для разработки) |
| `SERVER_PORT` | Порт приложения | `8080` (по умолчанию) |

### 📧 Настройки почты

| Переменная | Описание | Пример |
|------------|----------|--------|
| `MAIL_HOST` | SMTP сервер | `smtp.gmail.com` |
| `MAIL_USERNAME` | Email для отправки | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Пароль приложения | `your-app-password` |
| `NOTIFICATION_ENABLED` | Включить уведомления | `true`/`false` |

### 💳 Платежная система Robokassa

| Переменная | Описание | Режим |
|------------|----------|-------|
| `ROBOKASSA_MERCHANT_LOGIN` | Логин мерчанта | Тестовый/Продакшн |
| `ROBOKASSA_PASSWORD1` | Пароль #1 | Тестовый/Продакшн |
| `ROBOKASSA_PASSWORD2` | Пароль #2 | Тестовый/Продакшн |
| `ROBOKASSA_TEST_MODE` | Тестовый режим | `true`/`false` |

### 🐳 Docker конфигурация

| Переменная | Описание | Значение по умолчанию |
|------------|----------|-----------------------|
| `POSTGRES_VERSION` | Версия PostgreSQL | `15-alpine` |
| `REDIS_VERSION` | Версия Redis | `7-alpine` |
| `MINIO_VERSION` | Версия MinIO | `latest` |
| `NGINX_VERSION` | Версия Nginx | `alpine` |

## Примеры конфигураций

### Конфигурация для разработки
```env
SPRING_PROFILES_ACTIVE=dev
S3_PUBLIC_URL=http://localhost
NOTIFICATION_ENABLED=false
ROBOKASSA_TEST_MODE=true
DEBUG_MODE=true
```

### Конфигурация для продакшена
```env
SPRING_PROFILES_ACTIVE=prod
S3_PUBLIC_URL=https://yourdomain.com
NOTIFICATION_ENABLED=true
ROBOKASSA_TEST_MODE=false
DEBUG_MODE=false
```

## Безопасность

### ⚠️ Важные рекомендации:

1. **Никогда не коммитьте .env файл в git!**
   - Файл .env уже добавлен в .gitignore
   
2. **Используйте сильные пароли:**
   ```bash
   # Генерация случайного пароля (Linux/macOS)
   openssl rand -base64 32
   ```

3. **Для продакшена используйте отдельные значения:**
   - Не используйте тестовые пароли в продакшене
   - Создайте отдельный .env.prod файл

### 🔐 Генерация JWT секрета:

```bash
# Генерация нового JWT секрета
echo -n "my-super-secret-jwt-key-2025" | base64
```

## Команды Docker Compose

### Запуск с .env файлом:
```bash
# Запуск всех сервисов
docker compose up -d

# Запуск только базы данных
docker compose up -d postgres redis

# Просмотр логов
docker compose logs -f app

# Остановка всех сервисов
docker compose down
```

### Проверка переменных окружения:
```bash
# Показать все переменные для сервиса app
docker compose config | grep -A 20 "app:"
```

## Проблемы и решения

### Проблема: Переменные не применяются
**Решение:**
```bash
# Пересоздать контейнеры
docker compose down
docker compose up -d --force-recreate
```

### Проблема: Ошибки с паролями
**Решение:**
1. Проверьте, что в .env нет пробелов вокруг знака `=`
2. Используйте кавычки для паролей со специальными символами:
   ```env
   DB_PASSWORD="password_with_special!@#characters"
   ```

### Проблема: Порт уже занят
**Решение:**
```bash
# Изменить порт в .env
SERVER_PORT=8081
```

## Мониторинг

### Проверка здоровья сервисов:
```bash
# Статус всех сервисов
docker compose ps

# Здоровье конкретного сервиса
docker compose exec app curl http://localhost:8080/api/health
```

## Дополнительные ресурсы

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Spring Boot Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [MinIO Configuration](https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-single-node-single-drive.html) 