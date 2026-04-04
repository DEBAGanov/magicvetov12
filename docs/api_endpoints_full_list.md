# Полный список всех API эндпоинтов MagicCvetov

*Обновлено: 2025-01-07*

## 🏠 Системные эндпоинты (HomeController)
- `GET /` - Перенаправление на Swagger UI
- `GET /api/health` - Проверка состояния сервиса

## 🔐 Аутентификация (AuthController)
**Базовый путь**: `/api/v1/auth`
- `GET /test` - Тест доступности API аутентификации
- `POST /register` - Регистрация нового пользователя
- `POST /login` - Аутентификация пользователя

## 📱 SMS Аутентификация (SmsAuthController)
**Базовый путь**: `/api/v1/auth/sms`
- `POST /send-code` - Отправка SMS кода
- `POST /verify-code` - Подтверждение SMS кода
- `GET /test` - Тест SMS сервиса

## 📞 Telegram Аутентификация (TelegramAuthController)
**Базовый путь**: `/api/v1/auth/telegram`
- `POST /init` - Инициализация Telegram аутентификации
- `GET /status/{authToken}` - Проверка статуса Telegram аутентификации
- `GET /test` - Тест Telegram сервиса

## 🤖 Telegram Gateway (TelegramGatewayController)
**Базовый путь**: `/api/v1/auth/telegram-gateway`
- `POST /send-code` - Отправка кода через Telegram
- `POST /verify-code` - Подтверждение кода через Telegram
- `GET /status/{requestId}` - Проверка статуса запроса
- `DELETE /revoke/{requestId}` - Отмена запроса
- `GET /test` - Тест Telegram Gateway

## 🔗 Telegram Webhook (TelegramWebhookController)
**Базовый путь**: `/api/v1/telegram`
- `POST /webhook` - Обработка Telegram webhook
- `GET /webhook/info` - Информация о webhook
- `POST /webhook/register` - Регистрация webhook
- `DELETE /webhook` - Удаление webhook

## 👤 Пользователи (UserController)
**Базовый путь**: `/api/v1/user`
- `GET /profile` - Получение профиля текущего пользователя
- `GET /me` - Получение профиля текущего пользователя (альтернативный endpoint)

## 🍕 Продукты (ProductController)
**Базовый путь**: `/api/v1/products`
- `POST /` - Создать новый продукт (multipart/form-data)
- `GET /` - Получить все продукты (с пагинацией)
- `GET /{id}` - Получить продукт по ID
- `GET /category/{categoryId}` - Получить продукты по категории
- `GET /special-offers` - Получить специальные предложения
- `GET /search` - Поиск продуктов

## 📂 Категории (CategoryController)
**Базовый путь**: `/api/v1/categories`
- `GET /` - Получение списка активных категорий
- `GET /{id}` - Получение категории по ID

## 🛒 Корзина (CartController)
**Базовый путь**: `/api/v1/cart`
- `GET /` - Получение корзины пользователя
- `POST /items` - Добавление товара в корзину
- `PUT /items/{productId}` - Обновление количества товара в корзине
- `DELETE /items/{productId}` - Удаление товара из корзины
- `DELETE /` - Очистка корзины
- `POST /merge` - Объединение корзин (анонимной и пользователя)

## 📋 Заказы (OrderController)
**Базовый путь**: `/api/v1/orders`
- `POST /` - Создание нового заказа
- `GET /{orderId}` - Получение заказа по ID
- `GET /{orderId}/payment-url` - Получение URL для оплаты заказа
- `GET /` - Получение заказов пользователя (с пагинацией)

## 💳 ЮKassa Платежи (YooKassaPaymentController)
**Базовый путь**: `/api/v1/payments/yookassa`
*Доступно только при `yookassa.enabled=true`*
- `POST /create` - Создание платежа
- `GET /{paymentId}` - Получение информации о платеже по ID
- `GET /order/{orderId}` - Получение платежей по ID заказа
- `POST /{paymentId}/check-status` - Проверка статуса платежа
- `POST /{paymentId}/cancel` - Отмена платежа
- `GET /sbp/banks` - Получение списка банков для СБП
- `POST /webhook` - Webhook для обработки уведомлений от ЮKassa
- `GET /yookassa/{yookassaPaymentId}` - Получение платежа по ID ЮKassa
- `GET /health` - Health check ЮKassa сервиса

## 📱 Мобильные платежи (MobilePaymentController)
**Базовый путь**: `/api/v1/mobile/payments`
*Доступно только при `yookassa.enabled=true`*
- `POST /create` - Создание платежа для мобильного приложения
- `GET /{paymentId}/status` - Получение статуса платежа
- `GET /sbp/banks` - Получение списка банков для СБП (мобильная версия)
- `POST /{paymentId}/cancel` - Отмена платежа
- `GET /health` - Health check мобильных платежей

## 💰 Платежи Robokassa (PaymentController)
**Базовый путь**: `/api/v1/payments`
- `POST /robokassa/notify` - Обработка уведомлений от Robokassa
- `GET /robokassa/success` - Обработка успешного платежа
- `GET /robokassa/fail` - Обработка неуспешного платежа

## 📊 Метрики платежей (PaymentMetricsController)
**Базовый путь**: `/api/v1/payments/metrics`
*Доступно только при `yookassa.enabled=true`*
- `GET /summary` - Получение сводки метрик платежей (ADMIN)
- `GET /health` - Health check системы метрик
- `GET /details` - Получение детальных метрик (ADMIN)
- `POST /refresh` - Обновление кэша метрик (ADMIN)
- `GET /config` - Получение конфигурации мониторинга (ADMIN)

## 🚚 Доставка (DeliveryController)
**Базовый путь**: `/api/v1/delivery`
- `GET /address-suggestions` - Получить автоподсказки адресов
- `GET /zones` - Получить зоны доставки
- `GET /zones/{zoneId}` - Получить зону доставки по ID
- `POST /zones/{zoneId}/activate` - Активировать зону доставки (ADMIN)
- `POST /zones/{zoneId}/deactivate` - Деактивировать зону доставки (ADMIN)
- `GET /cost` - Рассчитать стоимость доставки
- `POST /validate-address` - Валидация адреса доставки

## 📍 Пункты доставки (DeliveryLocationController)
**Базовый путь**: `/api/v1/delivery-locations`
- `GET /` - Получение всех пунктов доставки
- `GET /{id}` - Получение пункта доставки по ID

## 🏠 Адресные подсказки (AddressSuggestionController)
**Базовый путь**: `/api/v1/address`
- `GET /suggestions` - Получить автоподсказки адресов
- `GET /houses` - Получить автоподсказки домов для улицы
- `POST /validate` - Проверить валидность адреса

## 👨‍💼 Администрирование (AdminController)
**Базовый путь**: `/api/v1/admin`
*Требует роль ADMIN*
- `GET /stats` - Получение статистики (ADMIN)
- `POST /upload` - Загрузка файлов (ADMIN)

## 📦 Управление заказами админом (AdminOrderController)
**Базовый путь**: `/api/v1/admin/orders`
*Требует роль ADMIN*
- `GET /` - Получение всех заказов (ADMIN)
- `GET /active` - Получение активных заказов (ADMIN)
- `GET /{orderId}` - Получение заказа по ID (ADMIN)
- `PUT /{orderId}/status` - Обновление статуса заказа (ADMIN)

## 🛠️ Управление продуктами админом (AdminProductController)
**Базовый путь**: `/api/v1/admin/products`
*Требует роль ADMIN*
- `POST /` - Создание продукта (ADMIN)
- `PUT /{id}` - Обновление продукта (ADMIN)
- `DELETE /{id}` - Удаление продукта (ADMIN)

## 🔍 Health Check (HealthController)
**Базовый путь**: `/api/v1`
- `GET /health` - Базовая проверка здоровья
- `GET /health/detailed` - Детальная проверка здоровья
- `GET /ready` - Проверка готовности к работе
- `GET /live` - Проверка живости приложения

## 🐛 Отладка (DebugController)
**Базовый путь**: `/debug`
*Только для разработки*
- `GET /status` - Статус приложения
- `GET /auth` - Информация об аутентификации

---

## 📊 Статистика эндпоинтов

- **Всего контроллеров**: 23
- **Всего эндпоинтов**: 120+
- **Публичные эндпоинты**: ~40 (не требуют аутентификации)
- **Пользовательские эндпоинты**: ~60 (требуют роль USER)
- **Административные эндпоинты**: ~20 (требуют роль ADMIN)

## 🔒 Безопасность

### Публичные эндпоинты (без аутентификации):
- Все эндпоинты аутентификации (`/api/v1/auth/**`)
- Webhook эндпоинты (`/api/v1/telegram/webhook`, `/api/v1/payments/yookassa/webhook`)
- Health check эндпоинты (`/health`, `/api/health`, `/api/v1/health/**`)
- Категории и продукты (только GET)
- СБП банки для публичного доступа

### Пользовательские эндпоинты (роль USER):
- Управление корзиной и заказами
- Создание и управление платежами
- Профиль пользователя
- Доставка и адресные подсказки

### Административные эндпоинты (роль ADMIN):
- Управление заказами и продуктами
- Статистика и метрики
- Управление зонами доставки
- Загрузка файлов

## 📝 Примечания

1. **ЮKassa эндпоинты** доступны только при `yookassa.enabled=true`
2. **Telegram Webhook** работает только при `telegram.auth.webhook-enabled=true`
3. **Пагинация** поддерживается для списков заказов и продуктов
4. **Swagger UI** доступен по адресу `/swagger-ui.html`
5. **Actuator** эндпоинты доступны по пути `/actuator/**`