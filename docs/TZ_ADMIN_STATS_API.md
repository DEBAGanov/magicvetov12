# 📋 ТЕХНИЧЕСКОЕ ЗАДАНИЕ 1: API эндпоинт статистики админ панели

## 🎯 Общая информация

- **Эндпоинт**: `GET /api/v1/admin/stats`
- **Назначение**: Получение статистики для админ панели мобильного приложения MagicCvetov
- **Текущий статус**: ❌ Возвращает HTTP 500 "Внутренняя ошибка сервера"
- **Приоритет**: 🔥 КРИТИЧЕСКИЙ - админка не работает без этого API
- **Android приложение**: [MagicCvetovApp](https://github.com/DEBAGanov/MagicCvetovApp)

## 🔐 Требования к аутентификации

- **Заголовок**: `Authorization: Bearer <admin_jwt_token>`
- **Роли доступа**: `SUPER_ADMIN`, `MANAGER`
- **Валидация**: Проверка что токен принадлежит пользователю с админскими правами
- **При ошибке аутентификации**: HTTP 401 с сообщением об ошибке

## 📊 Структура ответа

### ✅ Ожидаемый JSON ответ (HTTP 200):

```json
{
  "totalOrders": 6,
  "totalRevenue": 3135.15,
  "totalProducts": 25,
  "totalCategories": 5,
  "ordersToday": 6,
  "revenueToday": 3135.15,
  "popularProducts": [
    {
      "productId": 1,
      "productName": "Пицца Маргарита",
      "ordersCount": 3,
      "revenue": 1497.0
    },
    {
      "productId": 8,
      "productName": "Пицца Карбонара", 
      "ordersCount": 1,
      "revenue": 629.0
    },
    {
      "productId": 12,
      "productName": "Бургер \"Чизбургер\"",
      "ordersCount": 1,
      "revenue": 509.15
    }
  ],
  "orderStatusStats": {
    "CREATED": 6,
    "PENDING": 0,
    "CONFIRMED": 0,
    "PREPARING": 0,
    "READY": 0,
    "DELIVERING": 0,
    "DELIVERED": 0,
    "CANCELLED": 0
  }
}
```

## 🗂️ Описание полей

### 📈 Основная статистика

| Поле | Тип | Описание | Обязательность |
|------|-----|----------|----------------|
| totalOrders | int | Общее количество заказов за все время | ✅ Обязательно |
| totalRevenue | double | Общая выручка за все время (₽) | ✅ Обязательно |
| totalProducts | int | Количество активных продуктов в каталоге | ✅ Обязательно |
| totalCategories | int | Количество категорий продуктов | ✅ Обязательно |
| ordersToday | int | Количество заказов за сегодня | ✅ Обязательно |
| revenueToday | double | Выручка за сегодня (₽) | ✅ Обязательно |

### 🏆 Популярные продукты

Массив `popularProducts` (ТОП-5 по количеству заказов):

| Поле | Тип | Описание |
|------|-----|----------|
| productId | long | ID продукта |
| productName | string | Название продукта |
| ordersCount | int | Количество заказов с этим продуктом |
| revenue | double | Выручка от продукта (₽) |

### 📊 Статистика по статусам заказов

Объект `orderStatusStats` - количество заказов по каждому статусу:
- **CREATED** - созданные заказы
- **PENDING** - ожидают подтверждения
- **CONFIRMED** - подтвержденные
- **PREPARING** - готовятся
- **READY** - готовы к выдаче
- **DELIVERING** - доставляются
- **DELIVERED** - доставлены
- **CANCELLED** - отмененные

## 💾 SQL запросы для расчета

### 🔍 Основная статистика:

```sql
-- Общее количество заказов
SELECT COUNT(*) as totalOrders FROM orders;

-- Общая выручка  
SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders 
WHERE status != 'CANCELLED';

-- Количество продуктов и категорий
SELECT COUNT(*) as totalProducts FROM products WHERE available = true;
SELECT COUNT(*) as totalCategories FROM categories;

-- Статистика за сегодня
SELECT 
    COUNT(*) as ordersToday,
    COALESCE(SUM(total_amount), 0) as revenueToday 
FROM orders 
WHERE DATE(created_at) = CURRENT_DATE AND status != 'CANCELLED';
```

### 🏆 Популярные продукты:

```sql
SELECT 
    p.id as productId,
    p.name as productName,
    COUNT(oi.id) as ordersCount,
    COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id  
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'CANCELLED'
GROUP BY p.id, p.name
ORDER BY ordersCount DESC, revenue DESC
LIMIT 5;
```

### 📊 Статистика по статусам:

```sql
SELECT 
    status,
    COUNT(*) as count
FROM orders 
GROUP BY status;
```

## ⚠️ Обработка ошибок

**HTTP статус коды:**
- **200** - Успешный ответ с данными
- **401** - Неавторизованный пользователь (нет/невалидный токен)
- **403** - Доступ запрещен (не админ)
- **500** - Внутренняя ошибка сервера

**Формат ошибки:**

```json
{
  "status": 401,
  "message": "Требуется авторизация администратора",
  "timestamp": 1672531200000
}
```

## 🧪 Тестирование

### ✅ Тест успешного случая:

```bash
curl -X GET "https://debaganov-magicvetov-0177.twc1.net/api/v1/admin/stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"
```

**Ожидаемый результат**: HTTP 200 + JSON с актуальной статистикой

### ❌ Тест без токена:

```bash
curl -X GET "https://debaganov-magicvetov-0177.twc1.net/api/v1/admin/stats"
```

**Ожидаемый результат**: HTTP 401 + сообщение об ошибке

## 🎯 Критерии готовности

- ✅ API возвращает HTTP 200 для валидного админского токена
- ✅ Все обязательные поля присутствуют в ответе
- ✅ Данные соответствуют реальному состоянию БД
- ✅ Популярные продукты отсортированы по количеству заказов
- ✅ Статистика по статусам включает все возможные значения
- ✅ Корректная обработка ошибок аутентификации
- ✅ Производительность запроса < 2 секунд

## 📞 Контактная информация

- **Android приложение**: Готово к интеграции!
- **Текущие работающие админские эндпоинты**:
  - ✅ `GET /api/v1/admin/orders` - получение заказов
  - ❌ `GET /api/v1/admin/stats` - ТРЕБУЕТ ИСПРАВЛЕНИЯ

**Дата создания ТЗ**: 19 декабря 2024  
**Приоритет**: КРИТИЧЕСКИЙ  
**Исполнитель**: Backend команда MagicCvetov 