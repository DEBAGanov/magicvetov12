# 🤖 Настройка Telegram интеграции MagicCvetov

## Обзор

MagicCvetov автоматически отправляет уведомления в Telegram при:
- Создании нового заказа
- Изменении статуса заказа

## 🚀 Быстрая настройка

### Шаг 1: Создание Telegram бота

1. Найдите бота [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Укажите имя бота (например: `MagicCvetov Notifications`)
4. Укажите username бота (например: `magicvetov_notifications_bot`)
5. Сохраните полученный **токен бота**

### Шаг 2: Получение Chat ID

#### Вариант А: Личные сообщения
1. Найдите своего бота и отправьте ему любое сообщение
2. Перейдите по ссылке: `https://api.telegram.org/bot{ВАШ_ТОКЕН}/getUpdates`
3. Найдите значение `"id"` в секции `"chat"`

#### Вариант Б: Групповой чат
1. Создайте группу в Telegram
2. Добавьте бота в группу
3. Отправьте любое сообщение в группу
4. Перейдите по ссылке: `https://api.telegram.org/bot{ВАШ_ТОКЕН}/getUpdates`
5. Найдите значение `"id"` в секции `"chat"` (будет начинаться с `-`)

### Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Telegram настройки
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
TELEGRAM_CHAT_ID=ваш_chat_id
```

### Шаг 4: Перезапуск приложения

```bash
docker compose down
docker compose up -d
```

## 🧪 Тестирование

Запустите автоматизированный тест:

```bash
./test_telegram.sh
```

Тест создаст заказ и изменит его статус, вы должны получить 3 уведомления в Telegram.

## 📱 Примеры уведомлений

### Новый заказ
```
🍕 НОВЫЙ ЗАКАЗ #123

📅 Дата: 31.05.2025 15:30
👤 Клиент: Иван Иванов
📞 Телефон: +79001234567
📍 Адрес: ул. Пушкина, д. 10
💬 Комментарий: Без лука
📋 Статус: CREATED

🛒 СОСТАВ ЗАКАЗА:
• Маргарита x2 = 800 ₽
• Кока-кола x1 = 100 ₽

💰 ИТОГО: 900 ₽
```

### Изменение статуса
```
🔄 ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА #123

👤 Клиент: Иван Иванов
📞 Телефон: +79001234567
💰 Сумма: 900 ₽

📋 Статус изменен:
❌ Было: CREATED
✅ Стало: CONFIRMED
```

## 🧪 Comprehensive тестирование

Telegram тесты интегрированы в общее comprehensive тестирование:

```bash
# Запуск полного набора тестов (включая Telegram)
./test_comprehensive.sh
```

**Что тестируется:**
- 📋 Все основные API (здоровье, категории, продукты, корзина, заказы)
- 🔐 Аутентификация и авторизация
- ⚙️ Административное API
- **📱 Telegram интеграция** - 3 дополнительных теста:
  1. Создание заказа с Telegram уведомлением
  2. Изменение статуса заказа (CREATED → CONFIRMED)
  3. Изменение статуса заказа (CONFIRMED → DELIVERING)

**Результат:**
- Общая статистика включает результаты Telegram тестов
- Подробная диагностика всех компонентов системы
- Проверка интеграции с Android приложением

### Отдельное тестирование Telegram

Если нужно протестировать только Telegram функциональность:

```bash
# Запуск только Telegram тестов
./test_telegram.sh
```

## 📚 Дополнительные ресурсы

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Getting Chat ID Guide](https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id)

## ⚙️ Конфигурация

### Параметры application.yml

```yaml
telegram:
  enabled: ${TELEGRAM_ENABLED:false}      # Включить/выключить уведомления
  bot-token: ${TELEGRAM_BOT_TOKEN:}       # Токен бота от BotFather
  chat-id: ${TELEGRAM_CHAT_ID:}           # ID чата для уведомлений
  api-url: ${TELEGRAM_API_URL:https://api.telegram.org/bot}  # URL Telegram API
```

### Доступные статусы заказов

- `CREATED` - Создан
- `CONFIRMED` - Подтвержден
- `PREPARING` - Готовится
- `READY` - Готов
- `DELIVERING` - Доставляется
- `DELIVERED` - Доставлен
- `CANCELLED` - Отменен

## 🔧 Административное API

### Изменение статуса заказа

```bash
curl -X PUT http://localhost/api/v1/admin/orders/123/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"statusName": "CONFIRMED"}'
```

### Получение списка заказов

```bash
curl -X GET http://localhost/api/v1/admin/orders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🐛 Диагностика проблем

### Уведомления не приходят

1. **Проверьте переменные окружения:**
   ```bash
   docker compose exec magicvetov env | grep TELEGRAM
   ```

2. **Проверьте логи приложения:**
   ```bash
   docker compose logs magicvetov | grep -i telegram
   ```

3. **Проверьте токен бота:**
   ```bash
   curl https://api.telegram.org/bot{ВАШ_ТОКЕН}/getMe
   ```

4. **Проверьте chat_id:**
   ```bash
   curl https://api.telegram.org/bot{ВАШ_ТОКЕН}/getUpdates
   ```

### Частые ошибки

#### Ошибка: "Unauthorized"
- Неправильный токен бота
- Проверьте переменную `TELEGRAM_BOT_TOKEN`

#### Ошибка: "Bad Request: chat not found"
- Неправильный chat_id
- Проверьте переменную `TELEGRAM_CHAT_ID`
- Убедитесь, что бот добавлен в группу (для групповых чатов)

#### Ошибка: "Forbidden: bot was blocked by the user"
- Пользователь заблокировал бота
- Разблокируйте бота или используйте групповой чат

## 🔒 Безопасность

- Никогда не публикуйте токен бота в репозитории
- Используйте переменные окружения
- Ограничьте доступ к chat_id
- Регулярно ротируйте токены

## 📚 Дополнительные ресурсы