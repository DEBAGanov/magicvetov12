# 📋 ТЕХНИЧЕСКОЕ ЗАДАНИЕ 2: API обновления статуса заказа в админ панели

## 🎯 Общая информация

- **Эндпоинт**: `PUT /api/v1/admin/orders/{orderId}/status`
- **Назначение**: Обновление статуса заказа администратором в мобильном приложении MagicCvetov
- **Текущий статус**: ❌ Возвращает HTTP 500 "Внутренняя ошибка сервера"
- **Приоритет**: 🔥 КРИТИЧЕСКИЙ - админы не могут управлять заказами
- **Android приложение**: [MagicCvetovApp](https://github.com/DEBAGanov/MagicCvetovApp)

## 🔐 Требования к аутентификации

- **Заголовок**: `Authorization: Bearer <admin_jwt_token>`
- **Роли доступа**: `SUPER_ADMIN`, `MANAGER`, `OPERATOR` (с разрешением MANAGE_ORDERS)
- **Валидация**: Проверка что токен принадлежит пользователю с правами управления заказами
- **При ошибке аутентификации**: HTTP 401 с сообщением об ошибке

## 📥 Структура запроса

### ✅ HTTP запрос от Android приложения:

```http
PUT /api/v1/admin/orders/2/status
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json; charset=UTF-8
Content-Length: 22

{
  "status": "DELIVERED"
}
```

### 📋 Параметры:

| Параметр | Местоположение | Тип | Описание | Обязательность |
|----------|----------------|-----|----------|----------------|
| orderId | Path parameter | long | ID заказа для изменения статуса | ✅ Обязательно |
| status | Request Body | string | Новый статус заказа | ✅ Обязательно |

## 🏷️ Допустимые значения статуса

**Enum значения (СТРОГО соблюдать регистр):**

| Статус | Описание | Отображаемое название |
|--------|----------|----------------------|
| PENDING | Ожидает подтверждения | "Ожидает" |
| CONFIRMED | Подтвержден администратором | "Подтвержден" |
| PREPARING | Готовится на кухне | "Готовится" |
| READY | Готов к выдаче/доставке | "Готов" |
| DELIVERING | Передан курьеру | "Доставляется" |
| DELIVERED | Доставлен клиенту | "Доставлен" |
| CANCELLED | Отменен | "Отменен" |

⚠️ **ВАЖНО**: Статусы должны передаваться ТОЧНО в таком виде (uppercase)

## 📤 Структура ответа

### ✅ Успешный ответ (HTTP 200):

```json
{
  "id": 2,
  "userId": 123,
  "status": "DELIVERED",
  "statusDescription": "Заказ доставлен",
  "totalAmount": 499.0,
  "deliveryAddress": "ул. Примерная, д. 123",
  "contactPhone": "89199871223",
  "contactName": "Иван Иванов",
  "notes": "Комментарий к заказу",
  "createdAt": "2025-06-01T18:43:20",
  "updatedAt": "2025-06-01T21:30:57",
  "estimatedDeliveryTime": "2025-06-01T19:15:00",
  "deliveryFee": 200.0,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Пицца Маргарита",
      "price": 499.0,
      "quantity": 1,
      "subtotal": 499.0
    }
  ]
}
```

## 💾 Бизнес-логика backend

### 🔍 Алгоритм обработки:

1. **Валидация токена и прав доступа**
   - Проверить что токен валидный
   - Проверить что пользователь имеет роль администратора
   - Проверить право MANAGE_ORDERS

2. **Валидация параметров**
   - Проверить что orderId существует в БД
   - Проверить что status является валидным enum значением
   - Проверить что заказ не в финальном состоянии (если нужно)

3. **Обновление заказа**
   - Обновить поле status в таблице orders
   - Обновить поле updated_at на текущее время
   - Возможно обновить status_description

4. **Возврат обновленного заказа**
   - Получить полную информацию о заказе
   - Включить items массив со всеми позициями
   - Вернуть JSON ответ

### 📊 SQL запросы:

```sql
-- Валидация заказа
SELECT id, status FROM orders WHERE id = :orderId;

-- Обновление статуса
UPDATE orders 
SET status = :status, 
    updated_at = NOW(),
    status_description = :statusDescription
WHERE id = :orderId;

-- Получение обновленного заказа
SELECT o.*, u.username as customer_name 
FROM orders o 
LEFT JOIN users u ON o.user_id = u.id 
WHERE o.id = :orderId;

-- Получение позиций заказа
SELECT oi.*, p.name as product_name, p.image_url as product_image_url
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = :orderId;
```

## ⚠️ Обработка ошибок

### HTTP статус коды:

| Код | Описание | Когда возвращать |
|-----|----------|------------------|
| 200 | Успешное обновление | Статус успешно изменен |
| 400 | Неверный запрос | Невалидный status или orderId |
| 401 | Неавторизован | Нет/невалидный токен |
| 403 | Доступ запрещен | Нет прав MANAGE_ORDERS |
| 404 | Заказ не найден | orderId не существует |
| 422 | Неверные данные | Попытка изменить финальный статус |
| 500 | Ошибка сервера | Внутренняя ошибка БД |

### Формат ошибок:

```json
{
  "status": 404,
  "message": "Заказ с ID 999 не найден",
  "timestamp": 1748813458063
}
```

### Специфичные ошибки:

```json
// Невалидный статус
{
  "status": 400,
  "message": "Недопустимый статус: 'INVALID_STATUS'. Допустимые значения: PENDING, CONFIRMED, PREPARING, READY, DELIVERING, DELIVERED, CANCELLED",
  "timestamp": 1748813458063
}

// Нет прав доступа
{
  "status": 403,
  "message": "Недостаточно прав для управления заказами",
  "timestamp": 1748813458063
}

// Заказ не найден
{
  "status": 404,
  "message": "Заказ с ID 2 не найден",
  "timestamp": 1748813458063
}
```

## 🧪 Тестирование

### ✅ Тест успешного изменения статуса:

```bash
curl -X PUT "https://debaganov-magicvetov-0177.twc1.net/api/v1/admin/orders/2/status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"status":"DELIVERED"}'
```

**Ожидаемый результат**: HTTP 200 + полная информация о заказе

### ❌ Тест с невалидным статусом:

```bash
curl -X PUT "https://debaganov-magicvetov-0177.twc1.net/api/v1/admin/orders/2/status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"status":"INVALID_STATUS"}'
```

**Ожидаемый результат**: HTTP 400 + сообщение об ошибке

### ❌ Тест без токена:

```bash
curl -X PUT "https://debaganov-magicvetov-0177.twc1.net/api/v1/admin/orders/2/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"DELIVERED"}'
```

**Ожидаемый результат**: HTTP 401 + сообщение об ошибке

## 🔍 Диагностика текущей проблемы

### 📋 Из логов Android приложения:

- **Время ошибки**: 2025-06-01 21:30:58 GMT
- **Запрос**: PUT /api/v1/admin/orders/2/status
- **Тело**: {"status":"DELIVERED"}
- **Токен**: Передается корректно (eyJhbGciOiJIUzI1NiJ9...)
- **Ответ сервера**: HTTP 500 "Внутренняя ошибка сервера"

### 🔧 Возможные причины ошибки на backend:

1. **Проблема с базой данных:**
   - Заказ с ID=2 не существует
   - Ошибка SQL запроса обновления
   - Проблемы с connection pool

2. **Проблема с enum статусом:**
   - Backend не распознает статус "DELIVERED"
   - Проблема с mapping enum values
   - Ошибка валидации статуса

3. **Проблема с JWT токеном:**
   - Ошибка при декодировании токена
   - User ID из токена не найден в БД
   - Проблема с проверкой прав доступа

4. **Проблема с JSON:**
   - Ошибка десериализации request body
   - Конфликт имен полей DTO
   - Проблема с ContentType

## 🎯 Критерии готовности

- ✅ API принимает PUT запрос с JSON телом
- ✅ Все 7 статусов корректно обрабатываются
- ✅ Токен администратора проверяется
- ✅ Заказ обновляется в БД
- ✅ Возвращается полная информация о заказе
- ✅ Корректная обработка ошибок (400, 401, 403, 404)
- ✅ Логирование для диагностики
- ✅ Время ответа < 1 секунды

## 📞 Контактная информация

- **Приоритет**: КРИТИЧЕСКИЙ - админы не могут выполнять основную работу
- **Затронутая функциональность**: Управление заказами в админ панели
- **Текущий workaround**: Fallback на mock данные (статус не сохраняется)

**Работающие админские эндпоинты:**
- ✅ `GET /api/v1/admin/orders` - получение списка заказов
- ❌ `PUT /api/v1/admin/orders/{orderId}/status` - ТРЕБУЕТ ИСПРАВЛЕНИЯ
- ❌ `GET /api/v1/admin/stats` - статистика (также HTTP 500)

**Дата создания ТЗ**: 2 июня 2025  
**Исполнитель**: Backend команда MagicCvetov  
**Android приложение**: Готово к интеграции после исправления API 