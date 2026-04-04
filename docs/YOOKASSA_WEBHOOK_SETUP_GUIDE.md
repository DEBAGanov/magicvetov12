# Руководство по настройке Webhook в ЮKassa

## Обзор

Webhook ЮKassa позволяет получать уведомления о изменении статуса платежей в реальном времени. Это критически важно для корректной работы системы оплаты в MagicCvetov.

## Предварительные требования

- ✅ Активированный аккаунт в ЮKassa
- ✅ Настроенный магазин с API ключами
- ✅ Развернутое приложение MagicCvetov на сервере
- ✅ Доступный URL webhook endpoint

## Шаг 1: Вход в личный кабинет ЮKassa

1. Перейдите на [yookassa.ru](https://yookassa.ru/)
2. Войдите в личный кабинет с вашими учетными данными
3. Выберите нужный магазин (если у вас несколько)

## Шаг 2: Переход к настройкам API

1. В левом меню выберите **"Настройки"**
2. Перейдите в раздел **"API и webhook"**
3. Найдите секцию **"HTTP-уведомления (webhook)"**

## Шаг 3: Добавление webhook

### URL webhook для MagicCvetov:
```
https://debaganov-magicvetov-0177.twc1.net/api/v1/payments/yookassa/webhook
```

### Настройки webhook:

1. **URL уведомлений**: `https://debaganov-magicvetov-0177.twc1.net/api/v1/payments/yookassa/webhook`

2. **События для уведомлений** (выберите все):
   - ✅ `payment.waiting_for_capture` - Платеж ожидает подтверждения
   - ✅ `payment.succeeded` - Платеж успешно завершен
   - ✅ `payment.canceled` - Платеж отменен
   - ✅ `refund.succeeded` - Возврат успешно выполнен

3. **Формат данных**: `JSON`

4. **Версия API**: `v3` (последняя)

## Шаг 4: Проверка webhook

### Автоматическая проверка ЮKassa
После добавления webhook ЮKassa автоматически отправит тестовое уведомление для проверки доступности endpoint'а.

### Ручная проверка
Вы можете проверить webhook вручную с помощью curl:

```bash
curl -X POST https://debaganov-magicvetov-0177.twc1.net/api/v1/payments/yookassa/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notification",
    "event": "payment.succeeded",
    "object": {
      "id": "test-payment-id",
      "status": "succeeded",
      "amount": {
        "value": "100.00",
        "currency": "RUB"
      }
    }
  }'
```

**Ожидаемый ответ**: `HTTP 200` с JSON `{"status": "success"}`

## Шаг 5: Мониторинг webhook

### Логи приложения
Проверьте логи MagicCvetov для подтверждения получения webhook:

```bash
docker-compose logs app | grep -i webhook
```

### Логи ЮKassa
В личном кабинете ЮKassa вы можете просмотреть:
- Статус отправки уведомлений
- Коды ответов вашего сервера
- Время отправки и получения

## Возможные проблемы и решения

### 1. Webhook не доходит до сервера

**Проблема**: ЮKassa не может доставить уведомление

**Решения**:
- Проверьте доступность URL извне: `curl -I https://debaganov-magicvetov-0177.twc1.net/api/v1/payments/yookassa/webhook`
- Убедитесь, что сервер запущен: `docker-compose ps`
- Проверьте файрвол и настройки безопасности

### 2. Webhook возвращает ошибку 500

**Проблема**: Приложение не может обработать уведомление

**Решения**:
- Проверьте логи приложения: `docker-compose logs app`
- Убедитесь, что база данных доступна
- Проверьте формат входящих данных

### 3. Webhook возвращает ошибку 404

**Проблема**: Endpoint не найден

**Решения**:
- Проверьте URL webhook в настройках ЮKassa
- Убедитесь, что приложение развернуто с правильными routes
- Проверьте конфигурацию nginx (если используется)

### 4. Дублирование уведомлений

**Проблема**: ЮKassa отправляет повторные уведомления

**Решения**:
- Наше приложение использует идемпотентность для обработки дубликатов
- Проверьте логи на предмет корректной обработки
- Убедитесь, что webhook отвечает HTTP 200

## Тестирование webhook

### Создание тестового платежа
```bash
curl -X POST http://localhost:8080/api/v1/payments/yookassa/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": 1,
    "amount": 100.00,
    "currency": "RUB",
    "description": "Тестовый платеж",
    "paymentMethod": "sbp",
    "returnUrl": "magicvetov://payment/result"
  }'
```

### Проверка получения уведомлений
1. Создайте тестовый платеж через API
2. Проведите оплату в тестовом режиме ЮKassa
3. Проверьте логи приложения на получение webhook
4. Убедитесь, что статус заказа обновился

## Безопасность webhook

### Проверка подлинности
Наше приложение проверяет:
- ✅ Структуру JSON уведомления
- ✅ Обязательные поля
- ✅ Корректность данных платежа

### Рекомендации
- Webhook endpoint доступен только по HTTPS
- Логирование всех входящих уведомлений
- Идемпотентная обработка для предотвращения дубликатов

## Мониторинг и алерты

### Ключевые метрики
- Количество полученных webhook за час/день
- Процент успешно обработанных уведомлений
- Время обработки webhook

### Настройка алертов
Рекомендуется настроить уведомления при:
- Отсутствии webhook более 1 часа
- Высоком проценте ошибок обработки (>5%)
- Превышении времени обработки (>5 секунд)

## Полезные команды

### Проверка статуса webhook
```bash
curl -s http://localhost:8080/api/v1/payments/yookassa/health | jq
```

### Просмотр логов webhook
```bash
docker-compose logs app | grep "🔔 Webhook ЮKassa"
```

### Тестирование endpoint
```bash
curl -X POST http://localhost:8080/api/v1/payments/yookassa/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "notification", "event": "payment.succeeded"}'
```

## Контакты для поддержки

При проблемах с настройкой webhook обращайтесь:
- **Техподдержка ЮKassa**: support@yookassa.ru
- **Документация API**: https://yookassa.ru/developers/api
- **Статус сервисов**: https://status.yookassa.ru/

---

**Важно**: После настройки webhook обязательно протестируйте полный цикл оплаты в тестовом режиме перед переходом в продакшен. 