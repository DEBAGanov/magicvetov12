# Гайд по настройке Telegram ботов для деплоя MagicCvetov

## Архитектура ботов

MagicCvetov использует **двухботовую архитектуру** для разделения функциональности:

### 🤖 @MagicCvetovBot (Пользовательский бот)
- **Токен**: `7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4`
- **Назначение**: 
  - Авторизация пользователей через Telegram
  - Персональные уведомления о заказах
  - Обработка команд `/start`, `/help`, `/menu`
- **Сервисы**: 
  - `MagicCvetovTelegramBot` (Long Polling)
  - `TelegramWebhookService` (Webhook)
  - `TelegramUserNotificationService` (персональные уведомления)

### 👨‍💼 @MagicCvetovOrders_bot (Админский бот)
- **Токен**: `8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg`
- **Назначение**:
  - Административные уведомления о новых заказах
  - Уведомления об изменении статуса заказов
  - Управление заказами через команды
- **Сервисы**:
  - `MagicCvetovAdminBot` (Long Polling)
  - `AdminBotService` (уведомления)

## Переменные окружения для docker-compose.yml

### Обязательные переменные для работы обоих ботов

```yaml
# === ОБЩИЕ НАСТРОЙКИ TELEGRAM ===
TELEGRAM_ENABLED: true                    # Общее включение Telegram функциональности

# === ПОЛЬЗОВАТЕЛЬСКИЙ БОТ @MagicCvetovBot ===
# Основной бот для авторизации и персональных уведомлений
TELEGRAM_BOT_ENABLED: true                # Включение основного бота
TELEGRAM_LONGPOLLING_ENABLED: true        # Long Polling для команд (/start, /help)
TELEGRAM_BOT_TOKEN: 7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4

# Telegram Auth настройки (для авторизации пользователей)
TELEGRAM_AUTH_ENABLED: true
TELEGRAM_AUTH_BOT_TOKEN: 7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4
TELEGRAM_AUTH_BOT_USERNAME: MagicCvetovBot
TELEGRAM_AUTH_WEBHOOK_URL: https://debaganov-magicvetov-0177.twc1.net/api/v1/telegram/webhook
TELEGRAM_AUTH_WEBHOOK_ENABLED: true
TELEGRAM_AUTH_TOKEN_TTL_MINUTES: 10
TELEGRAM_AUTH_RATE_LIMIT_PER_HOUR: 5

# === АДМИНСКИЙ БОТ @MagicCvetovOrders_bot ===
# Админский бот для уведомлений сотрудников
TELEGRAM_ADMIN_BOT_ENABLED: true
TELEGRAM_ADMIN_BOT_TOKEN: 8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg
TELEGRAM_ADMIN_BOT_USERNAME: MagicCvetovOrders_bot
TELEGRAM_ADMIN_BOT_MAX_RETRIES: 3
TELEGRAM_ADMIN_BOT_TIMEOUT_SECONDS: 30

# === ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ===
TELEGRAM_API_URL: https://api.telegram.org/bot

# Telegram Gateway настройки (опционально)
TELEGRAM_GATEWAY_ENABLED: true
TELEGRAM_GATEWAY_ACCESS_TOKEN: AAGCGwAAIlEzNcCeEbrV5r-w65s_0edegXThOhJ2nq-eBw
TELEGRAM_GATEWAY_MESSAGE_TTL: 300
TELEGRAM_GATEWAY_CALLBACK_URL: https://debaganov-magicvetov-0177.twc1.net/api/v1/auth/telegram-gateway/callback
TELEGRAM_GATEWAY_TIMEOUT_SECONDS: 10
TELEGRAM_GATEWAY_MAX_RETRY_ATTEMPTS: 3
```

## Конфигурация для разных окружений

### Production (docker-compose.yml)
```yaml
environment:
  # Пользовательский бот - ВКЛЮЧЕН
  TELEGRAM_ENABLED: ${TELEGRAM_ENABLED:-true}
  TELEGRAM_BOT_ENABLED: ${TELEGRAM_BOT_ENABLED:-true}
  TELEGRAM_LONGPOLLING_ENABLED: ${TELEGRAM_LONGPOLLING_ENABLED:-true}
  TELEGRAM_BOT_TOKEN: ${TELEGRAM_AUTH_BOT_TOKEN:-7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4}
  
  # Авторизация через Telegram
  TELEGRAM_AUTH_ENABLED: true
  TELEGRAM_AUTH_BOT_TOKEN: ${TELEGRAM_AUTH_BOT_TOKEN:-7819187384:AAGJNn0cwfJ7Nsv_N25h75eggEmqmD5WZG4}
  TELEGRAM_AUTH_BOT_USERNAME: ${TELEGRAM_AUTH_BOT_USERNAME:-MagicCvetovBot}
  TELEGRAM_AUTH_WEBHOOK_URL: ${TELEGRAM_AUTH_WEBHOOK_URL:-https://debaganov-magicvetov-0177.twc1.net/api/v1/telegram/webhook}
  TELEGRAM_AUTH_WEBHOOK_ENABLED: true
  
  # Админский бот - ВКЛЮЧЕН
  TELEGRAM_ADMIN_BOT_ENABLED: ${TELEGRAM_ADMIN_BOT_ENABLED:-true}
  TELEGRAM_ADMIN_BOT_TOKEN: ${TELEGRAM_ADMIN_BOT_TOKEN:-8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg}
  TELEGRAM_ADMIN_BOT_USERNAME: ${TELEGRAM_ADMIN_BOT_USERNAME:-MagicCvetovOrders_bot}
```

### Development (docker-compose.dev.yml)
```yaml
environment:
  # Пользовательский бот - ОТКЛЮЧЕН (во избежание конфликтов)
  TELEGRAM_ENABLED: ${TELEGRAM_ENABLED:-false}
  TELEGRAM_BOT_ENABLED: ${TELEGRAM_BOT_ENABLED:-false}
  TELEGRAM_LONGPOLLING_ENABLED: ${TELEGRAM_LONGPOLLING_ENABLED:-false}
  
  # Авторизация через Telegram - ОТКЛЮЧЕНА в dev
  TELEGRAM_AUTH_ENABLED: false
  TELEGRAM_AUTH_WEBHOOK_URL: ${TELEGRAM_AUTH_WEBHOOK_URL:-http://localhost:8080/api/v1/telegram/webhook}
  
  # Админский бот - ВКЛЮЧЕН для тестирования
  TELEGRAM_ADMIN_BOT_ENABLED: ${TELEGRAM_ADMIN_BOT_ENABLED:-true}
  TELEGRAM_ADMIN_BOT_TOKEN: ${TELEGRAM_ADMIN_BOT_TOKEN:-8052456616:AAEoAzBfr3jRpylDmxR-azNBSqimthPCHeg}
```

## Проблемы и решения

### ✅ РЕШЕНО: "Conflict: terminated by other getUpdates request" (ошибка 409)

**Проблема**: Конфликт токенов между TelegramWebhookService и MagicCvetovTelegramBot  
**Причина**: Один токен нельзя использовать одновременно для Webhook и Long Polling  
**Решение**: Полный переход на Long Polling архитектуру

#### Архитектурные изменения:
- ❌ **TelegramWebhookService** - полностью отключен
- ✅ **MagicCvetovTelegramBot** - единственный обработчик токена `7819187384:...`
- ✅ **MagicCvetovAdminBot** - работает независимо с токеном `8052456616:...`

#### Конфигурация для решения:
```yaml
# Production конфигурация
TELEGRAM_AUTH_ENABLED: false              # Webhook отключен
TELEGRAM_AUTH_WEBHOOK_ENABLED: false      # Webhook endpoint отключен
TELEGRAM_BOT_ENABLED: true                # Long Polling включен
TELEGRAM_LONGPOLLING_ENABLED: true        # Long Polling сервис активен
TELEGRAM_ADMIN_BOT_ENABLED: true          # Админский бот работает отдельно
```

#### Проверка решения:
```bash
# Тестирование решения
./test_telegram_longpolling_final.sh

# Проверка отсутствия ошибок 409 в логах
docker logs magicvetov-app | grep -i "409\|conflict"
```

### ❌ Проблема: Персональные уведомления не приходят пользователям
**Причина**: Отключен TELEGRAM_BOT_ENABLED или проблемы с TelegramUserNotificationService
**Решение**:
- Включить `TELEGRAM_BOT_ENABLED=true`
- Проверить логи TelegramUserNotificationService
- Убедиться что пользователи имеют telegramId в БД

### ❌ Проблема: Админские уведомления не работают
**Причина**: Отключен TELEGRAM_ADMIN_BOT_ENABLED
**Решение**:
- Включить `TELEGRAM_ADMIN_BOT_ENABLED=true`
- Проверить токен админского бота
- Убедиться что админы добавлены в систему

## Тестирование

### Проверка пользовательского бота @MagicCvetovBot
```bash
# 1. Проверка переменных
docker exec magicvetov-app env | grep TELEGRAM_BOT_ENABLED
docker exec magicvetov-app env | grep TELEGRAM_LONGPOLLING_ENABLED

# 2. Проверка логов
docker logs magicvetov-app | grep "MagicCvetov Telegram Bot"

# 3. Тестирование команд
# Отправить /start в @MagicCvetovBot
# Отправить /help в @MagicCvetovBot
```

### Проверка админского бота @MagicCvetovOrders_bot
```bash
# 1. Проверка переменных
docker exec magicvetov-app env | grep TELEGRAM_ADMIN_BOT_ENABLED

# 2. Проверка логов
docker logs magicvetov-app | grep "Админский Telegram бот"

# 3. Тестирование команд
# Отправить /start в @MagicCvetovOrders_bot
# Отправить /stats в @MagicCvetovOrders_bot
```

### Проверка персональных уведомлений
```bash
# 1. Создать заказ через API
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":1}],"deliveryAddress":"Test Address"}'

# 2. Проверить логи уведомлений
docker logs magicvetov-app | grep "Персональное уведомление"

# 3. Изменить статус заказа
curl -X PUT http://localhost:8080/api/v1/admin/orders/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"READY"}'
```

## Диагностика проблем

### Логи для мониторинга
```bash
# Общие логи Telegram
docker logs magicvetov-app | grep -i telegram

# Персональные уведомления
docker logs magicvetov-app | grep "TelegramUserNotificationService"

# Админские уведомления
docker logs magicvetov-app | grep "AdminBotService"

# Ошибки авторизации
docker logs magicvetov-app | grep "TelegramAuth"

# Конфликты токенов
docker logs magicvetov-app | grep "409"
```

### Частые ошибки
1. **409 Conflict** - конфликт webhook и long polling
2. **Токен не найден** - неправильная настройка переменных
3. **Уведомления не приходят** - отключен соответствующий бот
4. **Команды не работают** - TELEGRAM_LONGPOLLING_ENABLED=false

## Рекомендации

1. **Никогда не отключайте оба бота одновременно** - это сломает функциональность уведомлений
2. **Используйте разные токены** для пользовательского и админского ботов
3. **Мониторьте логи** при изменении конфигурации
4. **Тестируйте в dev** перед применением в prod
5. **Документируйте изменения** в changelog.md и tasktracker.md 