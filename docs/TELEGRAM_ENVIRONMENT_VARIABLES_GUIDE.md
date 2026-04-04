# 🤖 Руководство по настройке переменных окружения Telegram ботов

## Проблема и решение

**Проблема:** При авторизации происходило перенаправление на бота `@MagicCvetovBot` вместо нужного `@DIMBOpizzaBot` из-за жестко прописанных значений в коде.

**Решение:** Полная централизация всех Telegram настроек через переменные окружения в `docker-compose.yml` и `docker-compose.dev.yml`.

## 📋 Полный список переменных окружения для Telegram

### 🎯 Основной пользовательский бот (для авторизации и команд)

```bash
# Включение/отключение основного бота
TELEGRAM_BOT_ENABLED=true
TELEGRAM_LONGPOLLING_ENABLED=true

# Токен и имя бота
TELEGRAM_BOT_TOKEN=your_main_bot_token_here
TELEGRAM_BOT_USERNAME=DIMBOpizzaBot  # Это ваш основной бот!
```

### 🔐 Настройки аутентификации через Telegram

```bash
# Включение Telegram Auth
TELEGRAM_AUTH_ENABLED=true

# Токен и имя бота для авторизации (может быть тот же что и основной)
TELEGRAM_AUTH_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}  # Ссылается на основной токен
TELEGRAM_AUTH_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}  # Ссылается на основное имя

# Webhook настройки (опционально)
TELEGRAM_AUTH_WEBHOOK_URL=https://your-domain.com/api/v1/telegram/webhook
TELEGRAM_AUTH_WEBHOOK_ENABLED=false  # Отключено для Long Polling
TELEGRAM_AUTH_TOKEN_TTL_MINUTES=10
TELEGRAM_AUTH_RATE_LIMIT_PER_HOUR=5
```

### 🌐 Telegram Gateway (для верификационных кодов)

```bash
# Включение Telegram Gateway
TELEGRAM_GATEWAY_ENABLED=true
TELEGRAM_GATEWAY_ACCESS_TOKEN=your_gateway_access_token
TELEGRAM_GATEWAY_MESSAGE_TTL=300
TELEGRAM_GATEWAY_CALLBACK_URL=https://your-domain.com/api/v1/auth/telegram-gateway/callback
TELEGRAM_GATEWAY_TIMEOUT_SECONDS=10
TELEGRAM_GATEWAY_MAX_RETRY_ATTEMPTS=3
```

### 👥 Админский бот (для уведомлений персонала)

```bash
# Включение админского бота
TELEGRAM_ADMIN_BOT_ENABLED=true
TELEGRAM_ADMIN_BOT_TOKEN=your_admin_bot_token
TELEGRAM_ADMIN_BOT_USERNAME=YourAdminBot
TELEGRAM_ADMIN_BOT_MAX_RETRIES=3
TELEGRAM_ADMIN_BOT_TIMEOUT_SECONDS=30
```

### 🔧 Общие настройки

```bash
# Основные настройки API
TELEGRAM_ENABLED=true
TELEGRAM_API_URL=https://api.telegram.org/bot
```

## 🚀 Настройка в Timeweb Cloud

### Шаг 1: Создание переменных окружения в Timeweb Cloud

В панели управления Timeweb Cloud добавьте следующие переменные:

```bash
# === ОСНОВНОЙ БОТ ===
TELEGRAM_BOT_ENABLED=true
TELEGRAM_LONGPOLLING_ENABLED=true
TELEGRAM_BOT_TOKEN=ваш_токен_DIMBOpizzaBot
TELEGRAM_BOT_USERNAME=DIMBOpizzaBot

# === АУТЕНТИФИКАЦИЯ ===
TELEGRAM_AUTH_ENABLED=true
# Эти переменные будут автоматически ссылаться на основной бот:
# TELEGRAM_AUTH_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
# TELEGRAM_AUTH_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}

# === GATEWAY (если используется) ===
TELEGRAM_GATEWAY_ENABLED=true
TELEGRAM_GATEWAY_ACCESS_TOKEN=ваш_gateway_токен

# === АДМИНСКИЙ БОТ ===
TELEGRAM_ADMIN_BOT_ENABLED=true
TELEGRAM_ADMIN_BOT_TOKEN=8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg
TELEGRAM_ADMIN_BOT_USERNAME=MagicCvetovOrders_bot
```

### Шаг 2: Проверка конфигурации

После настройки переменных окружения:

1. Перезапустите контейнер в Timeweb Cloud
2. Проверьте логи приложения на наличие сообщений:
   ```
   🔍 ДИАГНОСТИКА: Основной бот использует токен: ваш_токен...
   🤖 MagicCvetov Telegram Bot инициализирован для Long Polling
   ```

## 📁 Структура конфигурации

### Production (`docker-compose.yml`)
- Все переменные имеют значения по умолчанию
- Приоритет отдается переменным окружения из Timeweb Cloud
- Формат: `${VARIABLE_NAME:-default_value}`

### Development (`docker-compose.dev.yml`)
- Telegram боты отключены по умолчанию для локальной разработки
- Можно включить через переопределение переменных

## 🔍 Диагностика проблем

### Проблема: Авторизация идет через неправильный бот

**Проверьте:**
1. `TELEGRAM_BOT_USERNAME` установлен в `DIMBOpizzaBot`
2. `TELEGRAM_AUTH_BOT_USERNAME` не переопределен отдельно
3. В логах отображается правильный токен

### Проблема: Бот не отвечает на команды

**Проверьте:**
1. `TELEGRAM_BOT_ENABLED=true`
2. `TELEGRAM_LONGPOLLING_ENABLED=true`
3. Токен бота корректный и имеет необходимые права

## 🎯 Ключевые изменения

1. **Удалены жестко прописанные значения** из `TelegramConfig.java`
2. **Централизованы все настройки** в docker-compose файлах
3. **Добавлены ссылки между переменными** для упрощения управления
4. **Приоритет переменных окружения** над значениями по умолчанию

## 💡 Рекомендации

1. **Используйте один токен** для основного бота и аутентификации
2. **Задавайте только необходимые переменные** в Timeweb Cloud
3. **Тестируйте изменения** на dev окружении перед production
4. **Мониторьте логи** для выявления проблем с ботами

---

**Важно:** После применения этих настроек авторизация будет происходить через бота, указанного в `TELEGRAM_BOT_USERNAME`, а не через жестко прописанный `MagicCvetovBot`.
