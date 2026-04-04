# Руководство по интеграции мобильного приложения MagicCvetov с бэкендом

## Оглавление
1. [Общая информация](#общая-информация)
2. [Полный список API эндпойнтов](#полный-список-api-эндпойнтов)
3. [Авторизация и аутентификация](#авторизация-и-аутентификация)
4. [SMS авторизация](#sms-авторизация)
5. [Telegram авторизация](#telegram-авторизация)
6. [Работа с каталогом](#работа-с-каталогом)
7. [Работа с корзиной](#работа-с-корзиной)
8. [Доставка и адреса](#доставка-и-адреса)
9. [Работа с заказами](#работа-с-заказами)
10. [Платежи ЮКасса](#платежи-юкасса)
11. [Обработка ошибок](#обработка-ошибок)
12. [Примеры кода для Android](#примеры-кода-для-android)

## Общая информация

### Базовые параметры
- **Базовый URL**: `https://api.dimbopizza.ru` или `http://localhost:8080` для разработки
- **Формат данных**: JSON
- **Кодировка**: UTF-8
- **Аутентификация**: JWT Bearer Token
- **Версия API**: v1

### Заголовки запросов
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT_TOKEN> // для защищенных эндпойнтов
```

### Структура ответов
Все ответы имеют следующую структуру:
```json
{
  "success": true/false,
  "data": {...}, // данные ответа
  "message": "Описание результата",
  "error": "Описание ошибки" // только при ошибках
}
```

## Полный список API эндпойнтов

### 🔓 Публичные эндпойнты (не требуют авторизации)

#### Системные
- `GET /` - Перенаправление на Swagger UI
- `GET /api/health` - Проверка состояния сервиса
- `GET /api/v1/health` - Детальная проверка состояния
- `GET /api/v1/health/detailed` - Расширенная диагностика
- `GET /api/v1/ready` - Проверка готовности к работе
- `GET /api/v1/live` - Проверка живости приложения

#### Аутентификация
- `GET /api/v1/auth/test` - Тест доступности API аутентификации
- `POST /api/v1/auth/register` - Регистрация нового пользователя
- `POST /api/v1/auth/login` - Аутентификация пользователя

#### SMS Аутентификация
- `POST /api/v1/auth/sms/send-code` - Отправка SMS кода
- `POST /api/v1/auth/sms/verify-code` - Подтверждение SMS кода
- `GET /api/v1/auth/sms/test` - Тест SMS сервиса

#### Telegram Аутентификация
- `POST /api/v1/auth/telegram/init` - Инициализация Telegram аутентификации
- `GET /api/v1/auth/telegram/status/{authToken}` - Проверка статуса Telegram аутентификации
- `GET /api/v1/auth/telegram/test` - Тест Telegram сервиса

#### Telegram Gateway (альтернативный способ)
- `POST /api/v1/auth/telegram-gateway/send-code` - Отправка кода через Telegram
- `POST /api/v1/auth/telegram-gateway/verify-code` - Подтверждение кода
- `GET /api/v1/auth/telegram-gateway/status/{requestId}` - Проверка статуса
- `DELETE /api/v1/auth/telegram-gateway/revoke/{requestId}` - Отмена запроса

#### Каталог
- `GET /api/v1/categories` - Получение списка активных категорий
- `GET /api/v1/categories/{id}` - Получение категории по ID
- `GET /api/v1/products` - Получение всех продуктов (с пагинацией)
- `GET /api/v1/products/{id}` - Получение продукта по ID
- `GET /api/v1/products/category/{categoryId}` - Получение продуктов по категории
- `GET /api/v1/products/special-offers` - Получение специальных предложений
- `GET /api/v1/products/search` - Поиск продуктов

#### Доставка и пункты выдачи
- `GET /api/v1/delivery-locations` - Получение списка пунктов доставки
- `GET /api/v1/delivery-locations/{id}` - Получение пункта доставки по ID

#### **🆕 Новые эндпойнты доставки**
- `GET /api/v1/delivery/suggestions` - Автоподсказки адресов для Волжска (лимит)
- `POST /api/v1/delivery/validate` - Валидация адреса доставки
- `GET /api/v1/delivery/estimate` - Расчет стоимости доставки с зональной системой

#### **🆕 Подсказки адресов**
- `GET /api/v1/address/suggestions` - Получение автоподсказок адресов
- `GET /api/v1/address/houses` - Получение автоподсказок домов для улицы
- `POST /api/v1/address/validate` - Валидация адреса

#### Корзина (анонимная)
- `GET /api/v1/cart` - Получение корзины
- `POST /api/v1/cart/items` - Добавление товара в корзину
- `PUT /api/v1/cart/items/{productId}` - Обновление количества товара
- `DELETE /api/v1/cart/items/{productId}` - Удаление товара из корзины
- `DELETE /api/v1/cart` - Очистка корзины

### 🔒 Защищенные эндпойнты (требуют JWT токен)

#### Пользователь
- `GET /api/v1/user/profile` - Получение профиля пользователя
- `GET /api/v1/user/me` - Альтернативный endpoint профиля

#### Корзина (авторизованная)
- `POST /api/v1/cart/merge` - Объединение анонимной корзины с пользовательской

#### Заказы
- `POST /api/v1/orders` - Создание нового заказа **[ОБНОВЛЕНО]**
- `GET /api/v1/orders/{orderId}` - Получение заказа по ID
- `GET /api/v1/orders/{orderId}/payment-url` - Получение URL для оплаты
- `GET /api/v1/orders` - Получение заказов пользователя

#### **🆕 Платежи ЮКасса**
- `POST /api/v1/payments/yookassa/create` - Создание платежа (СБП/карта)
- `GET /api/v1/payments/yookassa/sbp-banks` - Список банков для СБП
- `POST /api/v1/payments/yookassa/webhook` - Webhook уведомления (внутренний)
- `GET /api/v1/payments/yookassa/{orderId}` - Получение платежей заказа

#### **🆕 Мобильные платежи (упрощенный API)**
- `POST /api/v1/mobile/payments/create` - Создание платежа для мобильного приложения

#### Старые платежи (Robokassa - устарел)
- `POST /api/v1/payments/robokassa/notify` - Уведомления от Robokassa
- `GET /api/v1/payments/robokassa/success` - Успешная оплата
- `GET /api/v1/payments/robokassa/fail` - Неуспешная оплата

### 👑 Административные эндпойнты (требуют роль ADMIN)

#### Статистика
- `GET /api/v1/admin/stats` - Получение статистики
- `POST /api/v1/admin/upload` - Загрузка изображения

#### Управление продуктами
- `POST /api/v1/admin/products` - Создание продукта
- `PUT /api/v1/admin/products/{productId}` - Обновление продукта
- `DELETE /api/v1/admin/products/{productId}` - Удаление продукта

#### Управление заказами
- `GET /api/v1/admin/orders` - Получение всех заказов (с пагинацией)
- `GET /api/v1/admin/orders/active` - Получение активных заказов
- `GET /api/v1/admin/orders/{orderId}` - Получение заказа по ID
- `PUT /api/v1/admin/orders/{orderId}/status` - Обновление статуса заказа

#### **🆕 Метрики платежей**
- `GET /api/v1/payments/metrics/summary` - Сводка метрик платежей
- `GET /api/v1/payments/metrics/detailed` - Детальные метрики
- `POST /api/v1/payments/metrics/refresh` - Обновление метрик

## Авторизация и аутентификация

### Типы авторизации
MagicCvetov поддерживает несколько способов авторизации:

1. **Традиционная** (email/username + пароль)
2. **SMS авторизация** (номер телефона + SMS код) **[РЕКОМЕНДУЕТСЯ]**
3. **Telegram авторизация** (через Telegram бот)
4. **Telegram Gateway** (альтернативный способ через Telegram)

### JWT токены
После успешной авторизации сервер возвращает JWT токен, который необходимо:
- Сохранить в безопасном хранилище приложения
- Передавать в заголовке `Authorization: Bearer <token>` для защищенных запросов
- Обновлять при истечении срока действия

### Структура ответа авторизации
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 123,
  "username": "user@example.com",
  "email": "user@example.com",
  "firstName": "Иван",
  "lastName": "Иванов"
}
```

## SMS авторизация

### Отправка SMS кода

**Endpoint**: `POST /api/v1/auth/sms/send-code`

**Запрос**:
```json
{
  "phoneNumber": "+79061382868"
}
```

**Ответ при успехе**:
```json
{
  "success": true,
  "message": "SMS код отправлен",
  "expiresAt": "2025-01-15T14:30:00",
  "codeLength": 4,
  "maskedPhoneNumber": "+7 (906) ***-**-68"
}
```

**Ответ при ошибке**:
```json
{
  "success": false,
  "message": "Некорректный формат номера телефона",
  "retryAfterSeconds": 300
}
```

### Подтверждение SMS кода

**Endpoint**: `POST /api/v1/auth/sms/verify-code`

**Запрос**:
```json
{
  "phoneNumber": "+79061382868",
  "code": "1234"
}
```

**Ответ при успехе**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 123,
  "username": "+79061382868",
  "email": null,
  "firstName": null,
  "lastName": null
}
```

### Особенности SMS авторизации
- SMS коды имеют длину 4 символа
- Время жизни кода: 10 минут
- Максимум 3 попытки ввода кода
- Rate limiting: не более 3 SMS в час на номер
- Поддерживается формат номеров: +7XXXXXXXXXX

## Telegram авторизация

### Инициализация авторизации

**Endpoint**: `POST /api/v1/auth/telegram/init`

**Запрос**:
```json
{
  "deviceId": "android_device_123"
}
```

**Ответ при успехе**:
```json
{
  "success": true,
  "authToken": "tg_auth_abc123xyz789",
  "telegramBotUrl": "https://t.me/magicvetov_auth_bot?start=tg_auth_abc123xyz789",
  "expiresAt": "2025-01-15T14:30:00",
  "message": "Перейдите по ссылке для подтверждения аутентификации в Telegram"
}
```

### Проверка статуса авторизации

**Endpoint**: `GET /api/v1/auth/telegram/status/{authToken}`

**Ответ (ожидание)**:
```json
{
  "success": true,
  "status": "PENDING",
  "message": "Ожидание подтверждения в Telegram"
}
```

**Ответ (подтверждено)**:
```json
{
  "success": true,
  "status": "CONFIRMED",
  "message": "Аутентификация подтверждена",
  "authData": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 123,
    "username": "john_doe",
    "email": null,
    "firstName": "Иван",
    "lastName": "Иванов"
  }
}
```

## Работа с каталогом

### Получение категорий

**Endpoint**: `GET /api/v1/categories`

**Ответ**:
```json
[
  {
    "id": 1,
    "name": "Пиццы",
    "description": "Наши фирменные пиццы",
    "imageUrl": "https://example.com/images/pizza.jpg",
    "displayOrder": 1
  },
  {
    "id": 2,
    "name": "Напитки",
    "description": "Прохладительные напитки",
    "imageUrl": "https://example.com/images/drinks.jpg",
    "displayOrder": 2
  }
]
```

### Получение продуктов

**Endpoint**: `GET /api/v1/products?page=0&size=20`

**Ответ**:
```json
{
  "content": [
    {
      "id": 1,
      "name": "Пицца Маргарита",
      "description": "Классическая пицца с моцареллой и томатами",
      "price": 599.00,
      "discountedPrice": 549.00,
      "categoryId": 1,
      "categoryName": "Пиццы",
      "imageUrl": "https://example.com/images/margherita.jpg",
      "weight": 400,
      "isAvailable": true,
      "isSpecialOffer": true,
      "discountPercent": 8
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 25,
  "totalPages": 2
}
```

### Поиск продуктов

**Endpoint**: `GET /api/v1/products/search?query=пицца`

## Работа с корзиной

### Получение корзины

**Endpoint**: `GET /api/v1/cart`

**Ответ**:
```json
{
  "id": 123,
  "sessionId": "cart_session_abc123",
  "totalAmount": 1198.00,
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Пицца Маргарита",
      "productPrice": 599.00,
      "quantity": 2,
      "totalPrice": 1198.00,
      "productImageUrl": "https://example.com/images/pizza1.jpg",
      "selectedOptions": {
        "size": "large",
        "extraCheese": true
      }
    }
  ]
}
```

### Добавление товара в корзину

**Endpoint**: `POST /api/v1/cart/items`

**Запрос** (обновленный):
```json
{
  "productId": 10,
  "quantity": 2,
  "selectedOptions": {
    "size": "large",
    "extraCheese": true,
    "spicyLevel": "medium"
  }
}
```

## Доставка и адреса

### 🆕 Автоподсказки адресов

**Endpoint**: `GET /api/v1/address/suggestions?query=ленина`

**Ответ**:
```json
[
  {
    "address": "улица Ленина",
    "fullAddress": "г. Волжск, улица Ленина",
    "type": "street",
    "confidence": 0.95
  },
  {
    "address": "улица Лермонтова", 
    "fullAddress": "г. Волжск, улица Лермонтова",
    "type": "street",
    "confidence": 0.85
  }
]
```

### 🆕 Автоподсказки домов

**Endpoint**: `GET /api/v1/address/houses?street=ленина&houseQuery=1`

**Ответ**:
```json
[
  {
    "address": "улица Ленина, 1",
    "fullAddress": "г. Волжск, улица Ленина, 1",
    "type": "house",
    "confidence": 1.0
  },
  {
    "address": "улица Ленина, 10",
    "fullAddress": "г. Волжск, улица Ленина, 10", 
    "type": "house",
    "confidence": 0.9
  }
]
```

### 🆕 Валидация адреса

**Endpoint**: `POST /api/v1/address/validate`

**Запрос**:
```json
{
  "address": "г. Волжск, улица Ленина, 1"
}
```

**Ответ**:
```json
{
  "valid": true,
  "message": "Адрес найден",
  "suggestions": [
    {
      "address": "улица Ленина, 1",
      "fullAddress": "г. Волжск, улица Ленина, 1",
      "type": "house",
      "confidence": 1.0
    }
  ]
}
```

### 🆕 Расчет стоимости доставки (зональная система)

**Endpoint**: `GET /api/v1/delivery/estimate?address=улица Ленина, 1&orderAmount=800`

**Ответ**:
```json
{
  "address": "улица Ленина, 1",
  "deliveryAvailable": true,
  "zoneName": "Центральный",
  "zoneDescription": "Центр города с основными улицами",
  "deliveryCost": 0,
  "baseCost": 200,
  "freeDeliveryThreshold": 1000,
  "isDeliveryFree": false,
  "estimatedTime": "25-35 минут",
  "estimatedTimeMin": 25,
  "estimatedTimeMax": 35,
  "message": "Доставка - 0 ₽",
  "currency": "RUB",
  "workingHours": "09:00-22:00",
  "city": "Волжск",
  "region": "Республика Марий Эл"
}
```

### 🆕 Получение подсказок доставки

**Endpoint**: `GET /api/v1/delivery/suggestions?query=волжск&limit=5`

**Ответ**:
```json
[
  {
    "address": "г. Волжск, улица Ленина",
    "fullAddress": "Россия, Республика Марий Эл, г. Волжск, улица Ленина",
    "type": "street",
    "confidence": 0.95
  }
]
```

## Работа с заказами

### 🆕 Создание заказа (обновленный)

**Endpoint**: `POST /api/v1/orders`

**Запрос** (обновленный с поддержкой доставки):
```json
{
  "deliveryLocationId": null,
  "deliveryAddress": "г. Волжск, улица Ленина, 1, кв. 5",
  "deliveryType": "Доставка курьером",
  "comment": "Домофон не работает, звонить по телефону",
  "notes": "Оставить у двери",
  "contactName": "Иван Иванов",
  "contactPhone": "+79061382868",
  "paymentMethod": "CARD_ONLINE"
}
```

**Ответ** (обновленный):
```json
{
  "id": 456,
  "status": "CREATED",
  "statusDescription": "Заказ создан",
  "deliveryLocationId": null,
  "deliveryLocationName": null,
  "deliveryLocationAddress": null,
  "deliveryAddress": "г. Волжск, улица Ленина, 1, кв. 5",
  "deliveryType": "Доставка курьером",
  "deliveryCost": 200.00,
  "totalAmount": 1398.00,
  "comment": "Домофон не работает, звонить по телефону",
  "contactName": "Иван Иванов",
  "contactPhone": "+79061382868",
  "createdAt": "2025-01-15T12:00:00",
  "updatedAt": "2025-01-15T12:00:00",
  "items": [
    {
    "id": 1,
      "productId": 10,
      "productName": "Пицца Маргарита",
      "price": 599.00,
      "quantity": 2,
      "subtotal": 1198.00
    }
  ]
}
```

### Получение URL для оплаты

**Endpoint**: `GET /api/v1/orders/{orderId}/payment-url`

**Ответ**:
```json
{
  "paymentUrl": "https://yoomoney.ru/checkout/payments/v2/contract?orderId=...",
  "orderId": 456
}
```

## Платежи ЮКасса

### 🆕 Создание платежа ЮКасса

**Endpoint**: `POST /api/v1/payments/yookassa/create`

**Запрос**:
```json
{
  "orderId": 456,
  "method": "SBP",
  "bankId": "sberbank",
  "amount": 1398.00,
  "returnUrl": "myapp://payment/success",
  "description": "Оплата заказа #456"
}
```

**Ответ**:
```json
{
  "id": 123,
  "yookassaPaymentId": "26b7b46c-000f-5000-8000-14e4cd5a5b4d",
  "orderId": 456,
  "amount": 1398.00,
  "status": "PENDING",
  "method": "SBP",
  "confirmationUrl": "https://yoomoney.ru/checkout/payments/v2/contract?orderId=26b7b46c-000f-5000-8000-14e4cd5a5b4d",
  "createdAt": "2025-01-15T12:05:00",
  "expiresAt": "2025-01-15T12:20:00"
}
```

### 🆕 Получение списка банков СБП

**Endpoint**: `GET /api/v1/payments/yookassa/sbp-banks`

**Ответ**:
```json
[
  {
    "id": "sberbank",
    "name": "Сбербанк",
    "logoUrl": "https://static.yoomoney.ru/banks-logos/sberbank.svg"
  },
  {
    "id": "tinkoff",
    "name": "Тинькофф Банк",
    "logoUrl": "https://static.yoomoney.ru/banks-logos/tinkoff.svg"
  },
  {
    "id": "vtb",
    "name": "ВТБ",
    "logoUrl": "https://static.yoomoney.ru/banks-logos/vtb.svg"
  }
]
```

### 🆕 Мобильные платежи (упрощенный API)

**Endpoint**: `POST /api/v1/mobile/payments/create`

**Запрос**:
```json
{
  "orderId": 456,
  "method": "SBP",
  "bankId": "sberbank"
}
```

**Ответ**:
```json
{
  "success": true,
  "paymentId": 123,
  "confirmationUrl": "https://yoomoney.ru/checkout/payments/v2/contract?orderId=...",
  "qrCodeUrl": "https://qr.nspk.ru/...",
  "deepLink": "bank100000000111://qr.nspk.ru/...",
  "message": "Платеж создан успешно"
}
```

### Получение платежей заказа

**Endpoint**: `GET /api/v1/payments/yookassa/{orderId}`

**Ответ**:
```json
[
  {
    "id": 123,
    "yookassaPaymentId": "26b7b46c-000f-5000-8000-14e4cd5a5b4d",
    "orderId": 456,
    "amount": 1398.00,
    "status": "SUCCEEDED",
    "method": "SBP",
    "createdAt": "2025-01-15T12:05:00",
    "paidAt": "2025-01-15T12:07:30"
  }
]
```

## Обработка ошибок

### Коды ошибок HTTP
- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Некорректный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Слишком много запросов
- `500` - Внутренняя ошибка сервера

### Структура ошибок
```json
{
  "success": false,
  "message": "Описание ошибки",
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "phoneNumber",
    "message": "Некорректный формат номера телефона"
  }
}
```

### Обработка rate limiting
При превышении лимитов запросов (например, для SMS):
```json
{
  "success": false,
  "message": "Слишком много запросов. Повторите через некоторое время",
  "retryAfterSeconds": 300
}
```

### Ошибки платежей
```json
{
  "success": false,
  "message": "Платеж отклонен",
  "error": "PAYMENT_DECLINED",
  "details": {
    "code": "insufficient_funds",
    "description": "Недостаточно средств на карте"
  }
}
```

## Примеры кода для Android

### Настройка HTTP клиента

```kotlin
// build.gradle.kts (app)
dependencies {
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4")
}
```

```kotlin
// ApiClient.kt
class ApiClient {
    companion object {
        private const val BASE_URL = "https://api.dimbopizza.ru/"

        private val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        private val authInterceptor = Interceptor { chain ->
            val token = TokenManager.getToken()
            val request = if (token != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else {
                chain.request()
            }
            chain.proceed(request)
        }

        private val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        val retrofit: Retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}
```

### API интерфейсы

```kotlin
// AuthApi.kt
interface AuthApi {
    @POST("api/v1/auth/sms/send-code")
    suspend fun sendSmsCode(@Body request: SendSmsCodeRequest): SmsCodeResponse

    @POST("api/v1/auth/sms/verify-code")
    suspend fun verifySmsCode(@Body request: VerifySmsCodeRequest): AuthResponse

    @POST("api/v1/auth/telegram/init")
    suspend fun initTelegramAuth(@Body request: InitTelegramAuthRequest): TelegramAuthResponse

    @GET("api/v1/auth/telegram/status/{authToken}")
    suspend fun getTelegramAuthStatus(@Path("authToken") authToken: String): TelegramStatusResponse
}

// ProductApi.kt
interface ProductApi {
    @GET("api/v1/categories")
    suspend fun getCategories(): List<CategoryDTO>

    @GET("api/v1/products")
    suspend fun getProducts(
        @Query("page") page: Int = 0, 
        @Query("size") size: Int = 20
    ): Page<ProductDTO>

    @GET("api/v1/products/{id}")
    suspend fun getProduct(@Path("id") id: Int): ProductDTO

    @GET("api/v1/products/search")
    suspend fun searchProducts(@Query("query") query: String): List<ProductDTO>
}

// 🆕 DeliveryApi.kt
interface DeliveryApi {
    @GET("api/v1/address/suggestions")
    suspend fun getAddressSuggestions(@Query("query") query: String): List<AddressSuggestion>

    @GET("api/v1/address/houses")
    suspend fun getHouseSuggestions(
        @Query("street") street: String,
        @Query("houseQuery") houseQuery: String?
    ): List<AddressSuggestion>

    @POST("api/v1/address/validate")
    suspend fun validateAddress(@Body request: AddressValidationRequest): AddressValidationResponse

    @GET("api/v1/delivery/estimate")
    suspend fun estimateDelivery(
        @Query("address") address: String,
        @Query("orderAmount") orderAmount: Double?
    ): DeliveryEstimateResponse
}

// CartApi.kt
interface CartApi {
    @GET("api/v1/cart")
    suspend fun getCart(): CartDTO

    @POST("api/v1/cart/items")
    suspend fun addToCart(@Body request: AddToCartRequest): CartDTO

    @PUT("api/v1/cart/items/{productId}")
    suspend fun updateCartItem(
        @Path("productId") productId: Int, 
        @Body request: UpdateCartItemRequest
    ): CartDTO

    @DELETE("api/v1/cart/items/{productId}")
    suspend fun removeFromCart(@Path("productId") productId: Int): CartDTO
}

// OrderApi.kt
interface OrderApi {
    @POST("api/v1/orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): OrderDTO

    @GET("api/v1/orders/{orderId}")
    suspend fun getOrder(@Path("orderId") orderId: Int): OrderDTO

    @GET("api/v1/orders")
    suspend fun getUserOrders(): List<OrderDTO>
}

// 🆕 PaymentApi.kt
interface PaymentApi {
    @GET("api/v1/payments/yookassa/sbp-banks")
    suspend fun getSbpBanks(): List<SbpBankInfo>

    @POST("api/v1/mobile/payments/create")
    suspend fun createMobilePayment(@Body request: CreatePaymentRequest): MobilePaymentResponse

    @GET("api/v1/payments/yookassa/{orderId}")
    suspend fun getOrderPayments(@Path("orderId") orderId: Long): List<PaymentResponse>
}
```

### Модели данных

```kotlin
// Auth models
data class SendSmsCodeRequest(
    val phoneNumber: String
)

data class VerifySmsCodeRequest(
    val phoneNumber: String,
    val code: String
)

data class SmsCodeResponse(
    val success: Boolean,
    val message: String,
    val expiresAt: String?,
    val codeLength: Int?,
    val maskedPhoneNumber: String?,
    val retryAfterSeconds: Long?
)

data class AuthResponse(
    val token: String,
    val userId: Int,
    val username: String,
    val email: String?,
    val firstName: String?,
    val lastName: String?
)

// Product models
data class CategoryDTO(
    val id: Int,
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val displayOrder: Int
)

data class ProductDTO(
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val discountedPrice: Double?,
    val categoryId: Int,
    val categoryName: String,
    val imageUrl: String?,
    val weight: Int?,
    val isAvailable: Boolean,
    val isSpecialOffer: Boolean,
    val discountPercent: Int?
)

// 🆕 Delivery models
data class AddressSuggestion(
    val address: String,
    val fullAddress: String,
    val type: String,
    val confidence: Double
)

data class AddressValidationRequest(
    val address: String
)

data class AddressValidationResponse(
    val valid: Boolean,
    val message: String,
    val suggestions: List<AddressSuggestion>
)

data class DeliveryEstimateResponse(
    val address: String,
    val deliveryAvailable: Boolean,
    val zoneName: String,
    val zoneDescription: String,
    val deliveryCost: Double,
    val baseCost: Double,
    val freeDeliveryThreshold: Double,
    val isDeliveryFree: Boolean,
    val estimatedTime: String,
    val estimatedTimeMin: Int,
    val estimatedTimeMax: Int,
    val message: String,
    val currency: String,
    val workingHours: String,
    val city: String,
    val region: String
)

// Cart models (обновленный)
data class CartDTO(
    val id: Int?,
    val sessionId: String?,
    val totalAmount: Double,
    val items: List<CartItemDTO>
)

data class CartItemDTO(
    val id: Int,
    val productId: Int,
    val productName: String,
    val productPrice: Double,
    val quantity: Int,
    val totalPrice: Double,
    val productImageUrl: String?,
    val selectedOptions: Map<String, Any>? // 🆕 Опции товара
)

data class AddToCartRequest(
    val productId: Int,
    val quantity: Int,
    val selectedOptions: Map<String, Any>? = null // 🆕 Опции товара
)

// Order models (обновленный)
data class CreateOrderRequest(
    val deliveryLocationId: Int? = null,
    val deliveryAddress: String? = null, // 🆕 Адрес доставки
    val deliveryType: String? = null, // 🆕 Способ доставки
    val comment: String? = null,
    val notes: String? = null, // 🆕 Заметки
    val contactName: String,
    val contactPhone: String,
    val paymentMethod: String = "CARD_ONLINE"
)

data class OrderDTO(
    val id: Int,
    val status: String,
    val statusDescription: String,
    val deliveryLocationId: Int?,
    val deliveryLocationName: String?,
    val deliveryLocationAddress: String?,
    val deliveryAddress: String?, // 🆕 Адрес доставки
    val deliveryType: String?, // 🆕 Способ доставки
    val deliveryCost: Double?, // 🆕 Стоимость доставки
    val totalAmount: Double,
    val comment: String?,
    val contactName: String,
    val contactPhone: String,
    val createdAt: String,
    val updatedAt: String,
    val items: List<OrderItemDTO>
) {
    // 🆕 Утилити методы
    fun getItemsAmount(): Double = totalAmount - (deliveryCost ?: 0.0)
    fun isPickup(): Boolean = deliveryType?.lowercase()?.contains("самовывоз") == true
    fun isDeliveryByCourier(): Boolean = deliveryType?.lowercase()?.contains("курьер") == true
}

data class OrderItemDTO(
    val id: Int,
    val productId: Int,
    val productName: String,
    val price: Double,
    val quantity: Int,
    val subtotal: Double
)

// 🆕 Payment models
data class CreatePaymentRequest(
    val orderId: Long,
    val method: String = "SBP", // "SBP" или "CARD_ONLINE"
    val bankId: String? = null, // Для СБП: "sberbank", "tinkoff", "vtb"
    val amount: Double? = null,
    val returnUrl: String? = null,
    val description: String? = null
)

data class MobilePaymentResponse(
    val success: Boolean,
    val paymentId: Long?,
    val confirmationUrl: String?,
    val qrCodeUrl: String?,
    val deepLink: String?,
    val message: String
)

data class PaymentResponse(
    val id: Long,
    val yookassaPaymentId: String,
    val orderId: Long,
    val amount: Double,
    val status: String, // "PENDING", "SUCCEEDED", "CANCELLED"
    val method: String,
    val createdAt: String,
    val paidAt: String?
)

data class SbpBankInfo(
    val id: String,
    val name: String,
    val logoUrl: String
)
```

### Репозитории

```kotlin
// AuthRepository.kt
class AuthRepository {
    private val authApi = ApiClient.retrofit.create(AuthApi::class.java)

    suspend fun sendSmsCode(phoneNumber: String): Result<SmsCodeResponse> {
        return try {
            val response = authApi.sendSmsCode(SendSmsCodeRequest(phoneNumber))
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifySmsCode(phoneNumber: String, code: String): Result<AuthResponse> {
        return try {
            val response = authApi.verifySmsCode(VerifySmsCodeRequest(phoneNumber, code))
            TokenManager.saveToken(response.token)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// 🆕 DeliveryRepository.kt
class DeliveryRepository {
    private val deliveryApi = ApiClient.retrofit.create(DeliveryApi::class.java)

    suspend fun getAddressSuggestions(query: String): Result<List<AddressSuggestion>> {
        return try {
            val response = deliveryApi.getAddressSuggestions(query)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun validateAddress(address: String): Result<AddressValidationResponse> {
        return try {
            val response = deliveryApi.validateAddress(AddressValidationRequest(address))
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun estimateDelivery(address: String, orderAmount: Double?): Result<DeliveryEstimateResponse> {
        return try {
            val response = deliveryApi.estimateDelivery(address, orderAmount)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// 🆕 PaymentRepository.kt
class PaymentRepository {
    private val paymentApi = ApiClient.retrofit.create(PaymentApi::class.java)

    suspend fun getSbpBanks(): Result<List<SbpBankInfo>> {
        return try {
            val response = paymentApi.getSbpBanks()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createMobilePayment(request: CreatePaymentRequest): Result<MobilePaymentResponse> {
        return try {
            val response = paymentApi.createMobilePayment(request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOrderPayments(orderId: Long): Result<List<PaymentResponse>> {
        return try {
            val response = paymentApi.getOrderPayments(orderId)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### Управление токенами

```kotlin
// TokenManager.kt
object TokenManager {
    private const val PREF_NAME = "auth_prefs"
    private const val TOKEN_KEY = "jwt_token"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveToken(context: Context, token: String) {
        getPrefs(context).edit().putString(TOKEN_KEY, token).apply()
    }

    fun getToken(context: Context): String? {
        return getPrefs(context).getString(TOKEN_KEY, null)
    }

    fun clearToken(context: Context) {
        getPrefs(context).edit().remove(TOKEN_KEY).apply()
    }

    fun isLoggedIn(context: Context): Boolean {
        return getToken(context) != null
    }
}
```

### 🆕 Пример работы с доставкой

```kotlin
// DeliveryActivity.kt
class DeliveryActivity : AppCompatActivity() {
    private val deliveryRepository = DeliveryRepository()
    private var addressDebouncer: Job? = null

    private fun setupAddressInput() {
        binding.addressEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                addressDebouncer?.cancel()
                val query = s.toString().trim()
                
                if (query.length >= 2) {
                    addressDebouncer = lifecycleScope.launch {
                        delay(300) // Дебаунс 300мс
                        searchAddresses(query)
                    }
                }
            }
            
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun searchAddresses(query: String) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                val result = deliveryRepository.getAddressSuggestions(query)

                result.onSuccess { suggestions ->
                    showAddressSuggestions(suggestions)
                }.onFailure { exception ->
                    showError("Ошибка поиска адресов: ${exception.message}")
                }
            } finally {
                showLoading(false)
            }
        }
    }

    private fun validateAndEstimateDelivery(address: String, orderAmount: Double) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                // Сначала валидируем адрес
                val validationResult = deliveryRepository.validateAddress(address)
                
                validationResult.onSuccess { validation ->
                    if (validation.valid) {
                        // Затем рассчитываем стоимость доставки
                        val estimateResult = deliveryRepository.estimateDelivery(address, orderAmount)
                        
                        estimateResult.onSuccess { estimate ->
                            showDeliveryInfo(estimate)
                }.onFailure { exception ->
                            showError("Ошибка расчета доставки: ${exception.message}")
                        }
                    } else {
                        showError("Адрес не найден в зоне доставки")
                        if (validation.suggestions.isNotEmpty()) {
                            showAddressSuggestions(validation.suggestions)
                        }
                    }
                }.onFailure { exception ->
                    showError("Ошибка валидации адреса: ${exception.message}")
                }
            } finally {
                showLoading(false)
            }
        }
    }

    private fun showDeliveryInfo(estimate: DeliveryEstimateResponse) {
        binding.apply {
            deliveryZoneText.text = estimate.zoneName
            deliveryCostText.text = if (estimate.isDeliveryFree) {
                "Бесплатно"
            } else {
                "${estimate.deliveryCost} ₽"
            }
            deliveryTimeText.text = estimate.estimatedTime
            
            if (!estimate.isDeliveryFree && estimate.freeDeliveryThreshold > 0) {
                val needMore = estimate.freeDeliveryThreshold - estimate.baseCost
                freeDeliveryHintText.text = "Добавьте товаров на ${needMore} ₽ для бесплатной доставки"
                freeDeliveryHintText.visibility = View.VISIBLE
            } else {
                freeDeliveryHintText.visibility = View.GONE
            }
        }
    }
}
```

### 🆕 Пример работы с платежами

```kotlin
// PaymentActivity.kt
class PaymentActivity : AppCompatActivity() {
    private val paymentRepository = PaymentRepository()

    private fun setupPaymentMethods() {
        lifecycleScope.launch {
            try {
                // Получаем список банков для СБП
                val result = paymentRepository.getSbpBanks()
                
                result.onSuccess { banks ->
                    setupSbpBanks(banks)
                }.onFailure { exception ->
                    Log.e("PaymentActivity", "Ошибка получения банков СБП", exception)
                    // Показываем только базовые методы оплаты
                    setupBasicPaymentMethods()
                }
            } catch (e: Exception) {
                Log.e("PaymentActivity", "Ошибка настройки платежей", e)
                setupBasicPaymentMethods()
            }
        }
    }

    private fun setupSbpBanks(banks: List<SbpBankInfo>) {
        val adapter = SbpBanksAdapter(banks) { bank ->
            createSbpPayment(bank.id)
        }
        binding.sbpBanksRecyclerView.adapter = adapter
        binding.sbpMethodCard.visibility = View.VISIBLE
    }

    private fun createSbpPayment(bankId: String) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                val request = CreatePaymentRequest(
                    orderId = orderId,
                    method = "SBP",
                    bankId = bankId,
                    returnUrl = "myapp://payment/success"
                )
                
                val result = paymentRepository.createMobilePayment(request)

                result.onSuccess { response ->
                    if (response.success && response.confirmationUrl != null) {
                        // Открываем URL оплаты в браузере или WebView
                        openPaymentUrl(response.confirmationUrl)
                        
                        // Запускаем проверку статуса платежа
                        startPaymentStatusPolling(response.paymentId!!)
                    } else {
                        showError(response.message)
                    }
                }.onFailure { exception ->
                    showError("Ошибка создания платежа: ${exception.message}")
                }
            } finally {
                showLoading(false)
            }
        }
    }

    private fun createCardPayment() {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                val request = CreatePaymentRequest(
                    orderId = orderId,
                    method = "CARD_ONLINE",
                    returnUrl = "myapp://payment/success"
                )
                
                val result = paymentRepository.createMobilePayment(request)
                
                result.onSuccess { response ->
                    if (response.success && response.confirmationUrl != null) {
                        openPaymentUrl(response.confirmationUrl)
                        startPaymentStatusPolling(response.paymentId!!)
                    } else {
                        showError(response.message)
                    }
                }.onFailure { exception ->
                    showError("Ошибка создания платежа: ${exception.message}")
                }
            } finally {
                showLoading(false)
            }
        }
    }

    private fun startPaymentStatusPolling(paymentId: Long) {
        lifecycleScope.launch {
            repeat(60) { // Проверяем 60 раз (5 минут)
                delay(5000) // Каждые 5 секунд

                val result = paymentRepository.getOrderPayments(orderId)
                result.onSuccess { payments ->
                    val payment = payments.find { it.id == paymentId }
                    
                    when (payment?.status) {
                        "SUCCEEDED" -> {
                            showPaymentSuccess()
                            return@launch
                        }
                        "CANCELLED" -> {
                            showPaymentCancelled()
                            return@launch
                        }
                        // "PENDING" - продолжаем ждать
                        }
                    }
            }
            
            // Таймаут
            showPaymentTimeout()
        }
    }

    private fun openPaymentUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            // Если не удается открыть в браузере, открываем в WebView
            openInWebView(url)
        }
    }
}
```

## Рекомендации по безопасности

1. **Храните JWT токены в безопасном месте** (Android Keystore или EncryptedSharedPreferences)
2. **Проверяйте SSL сертификаты** при HTTPS соединениях
3. **Не логируйте чувствительные данные** (токены, пароли, коды, номера карт)
4. **Обрабатывайте истечение токенов** и обновляйте их при необходимости
5. **Валидируйте входные данные** на стороне клиента
6. **Используйте ProGuard/R8** для обфускации кода в релизных сборках
7. **Не сохраняйте данные платежей** в приложении
8. **Используйте HTTPS для всех запросов** к платежным API

## Тестирование

### Swagger UI
Для тестирования API используйте Swagger UI: `https://api.dimbopizza.ru/swagger-ui.html`

### Постman коллекция
В проекте есть готовые скрипты для тестирования API в папке `scripts/`

### Тестовые данные
- **SMS**: Используйте номер `+79600948872` для тестирования
- **Telegram**: Настройте тестового бота согласно документации в `docs/TELEGRAM_SETUP.md`
- **Платежи**: В тестовом режиме ЮКассы используйте тестовую карту `5555555555554444`
- **Адреса**: Для тестирования доставки используйте адреса города Волжск

### Особенности интеграции

#### Зональная система доставки
- Система автоматически определяет район Волжска по адресу
- Разные районы имеют разную стоимость доставки (100₽-300₽)
- Бесплатная доставка от определенной суммы (зависит от района)
- Неизвестные адреса получают стандартный тариф 250₽

#### Платежная система
- Поддержка СБП (Система быстрых платежей) и банковских карт
- Автоматическое формирование фискальных чеков согласно 54-ФЗ
- Webhook уведомления о статусе платежей
- Интеграция с админским Telegram ботом

#### Мобильная оптимизация
- Упрощенные API для мобильных приложений
- Поддержка deep links для возврата из платежных приложений
- Оптимизированные автоподсказки адресов
- Кэширование данных каталога

---

**Дата обновления**: 2025-01-23
**Версия**: 2.0
**Автор**: MagicCvetov Development Team

**🆕 Что нового в версии 2.0:**
- Добавлены эндпойнты доставки и адресов
- Интеграция с платежами ЮКасса
- Зональная система доставки для Волжска
- Упрощенные мобильные API
- Расширенные модели данных
- Примеры работы с новыми функциями
