# 📱 Инструкция по интеграции способов оплаты в Android приложении MagicCvetov

## 🎯 Цель

Настроить передачу `paymentMethod` из Android приложения в бэкенд для корректной работы СБП флоу.

**Проблема**: Сейчас все заказы приходят в админский Telegram бот сразу, независимо от способа оплаты.

**Решение**: Android приложение должно передавать `paymentMethod` в API, чтобы СБП заказы попадали в бот только после успешной оплаты.

---

## 📋 Что нужно изменить

### 1. Обновить модель данных

**Файл**: `app/src/main/java/com/baganov/magicvetov/model/CreateOrderRequest.kt`

```kotlin
data class CreateOrderRequest(
    val deliveryLocationId: Int? = null,
    val deliveryAddress: String? = null,
    val contactName: String,
    val contactPhone: String,
    val comment: String? = null,
    val notes: String? = null,
    // ✅ ДОБАВИТЬ ЭТО ПОЛЕ
    val paymentMethod: String = "CASH"
)
```

### 2. Создать enum для способов оплаты

**Файл**: `app/src/main/java/com/baganov/magicvetov/model/PaymentMethod.kt`

```kotlin
/**
 * Способы оплаты в приложении MagicCvetov
 */
enum class PaymentMethod(
    val value: String,
    val displayName: String,
    val description: String
) {
    /**
     * Наличные при получении
     */
    CASH("CASH", "Наличными", "Оплата наличными при получении"),
    
    /**
     * Система быстрых платежей
     */
    SBP("SBP", "СБП", "Система быстрых платежей"),
    
    /**
     * Банковская карта
     */
    BANK_CARD("BANK_CARD", "Картой", "Оплата банковской картой");
    
    companion object {
        /**
         * Получить способ оплаты по строковому значению
         */
        fun fromString(value: String): PaymentMethod {
            return values().find { it.value == value } ?: CASH
        }
        
        /**
         * Получить все доступные способы оплаты
         */
        fun getAvailableMethods(): List<PaymentMethod> {
            return listOf(CASH, SBP, BANK_CARD)
        }
    }
}
```

### 3. Обновить экран оформления заказа

**Файл**: `app/src/main/java/com/baganov/magicvetov/ui/checkout/CheckoutActivity.kt`

```kotlin
class CheckoutActivity : AppCompatActivity() {
    
    // Текущий выбранный способ оплаты
    private var selectedPaymentMethod = PaymentMethod.CASH
    
    // UI элементы (найдите ваши реальные ID)
    private lateinit var radioCardCash: RadioButton
    private lateinit var radioSBP: RadioButton
    private lateinit var buttonCreateOrder: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_checkout)
        
        initViews()
        setupPaymentMethodSelection()
        setupOrderCreation()
    }
    
    private fun initViews() {
        // Инициализация UI элементов
        radioCardCash = findViewById(R.id.radio_card_cash) // Ваш ID
        radioSBP = findViewById(R.id.radio_sbp) // Ваш ID  
        buttonCreateOrder = findViewById(R.id.button_create_order) // Ваш ID
    }
    
    private fun setupPaymentMethodSelection() {
        // Обработчик для "Картой/наличными при получении"
        radioCardCash.setOnClickListener {
            selectedPaymentMethod = PaymentMethod.CASH
            updatePaymentMethodUI()
            logPaymentSelection("CASH выбран")
        }
        
        // Обработчик для "СБП"
        radioSBP.setOnClickListener {
            selectedPaymentMethod = PaymentMethod.SBP
            updatePaymentMethodUI()
            logPaymentSelection("СБП выбран")
        }
        
        // Устанавливаем начальное состояние
        updatePaymentMethodUI()
    }
    
    private fun updatePaymentMethodUI() {
        radioCardCash.isChecked = (selectedPaymentMethod == PaymentMethod.CASH)
        radioSBP.isChecked = (selectedPaymentMethod == PaymentMethod.SBP)
        
        // Обновляем текст кнопки в зависимости от способа оплаты
        updateOrderButtonText()
    }
    
    private fun updateOrderButtonText() {
        val buttonText = when (selectedPaymentMethod) {
            PaymentMethod.CASH -> "Оформить заказ • Наличными"
            PaymentMethod.SBP -> "Оформить заказ • СБП"
            PaymentMethod.BANK_CARD -> "Оформить заказ • Картой"
        }
        buttonCreateOrder.text = buttonText
    }
    
    private fun setupOrderCreation() {
        buttonCreateOrder.setOnClickListener {
            createOrder()
        }
    }
    
    private fun createOrder() {
        // Создаем запрос с выбранным способом оплаты
        val orderRequest = CreateOrderRequest(
            deliveryLocationId = getSelectedLocationId(), // Ваша логика
            contactName = getContactName(), // Ваша логика
            contactPhone = getContactPhone(), // Ваша логика
            comment = getComment(), // Ваша логика
            paymentMethod = selectedPaymentMethod.value // ✅ ГЛАВНОЕ ИЗМЕНЕНИЕ
        )
        
        // Логируем для отладки
        logOrderCreation(orderRequest)
        
        // Отправляем через ваш API сервис
        sendOrderToBackend(orderRequest)
    }
    
    private fun sendOrderToBackend(orderRequest: CreateOrderRequest) {
        // Ваш существующий код отправки заказа
        // Пример с Retrofit:
        
        orderService.createOrder(orderRequest)
            .enqueue(object : Callback<OrderResponse> {
                override fun onResponse(call: Call<OrderResponse>, response: Response<OrderResponse>) {
                    if (response.isSuccessful) {
                        onOrderCreated(response.body(), selectedPaymentMethod)
                    } else {
                        onOrderError("Ошибка создания заказа: ${response.code()}")
                    }
                }
                
                override fun onFailure(call: Call<OrderResponse>, t: Throwable) {
                    onOrderError("Ошибка сети: ${t.message}")
                }
            })
    }
    
    private fun onOrderCreated(order: OrderResponse?, paymentMethod: PaymentMethod) {
        when (paymentMethod) {
            PaymentMethod.SBP -> {
                // Переход к оплате СБП
                showSBPPayment(order)
                showMessage("Заказ создан! Переходите к оплате через СБП")
            }
            PaymentMethod.CASH -> {
                // Заказ с наличными
                showOrderSuccess(order)
                showMessage("Заказ принят! Ожидайте курьера")
            }
            PaymentMethod.BANK_CARD -> {
                // Переход к оплате картой
                showCardPayment(order)
                showMessage("Заказ создан! Переходите к оплате")
            }
        }
    }
    
    // Вспомогательные методы для логирования
    private fun logPaymentSelection(message: String) {
        Log.d("PaymentMethod", message)
    }
    
    private fun logOrderCreation(request: CreateOrderRequest) {
        Log.d("OrderCreation", "Создаем заказ с paymentMethod: ${request.paymentMethod}")
        Log.d("OrderCreation", "Полный запрос: $request")
    }
    
    private fun showMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    // Заглушки для ваших методов - замените на реальную логику
    private fun getSelectedLocationId(): Int = 1
    private fun getContactName(): String = "Тестовый пользователь"
    private fun getContactPhone(): String = "+79001234567"
    private fun getComment(): String = ""
    private fun showSBPPayment(order: OrderResponse?) { /* Ваша логика */ }
    private fun showCardPayment(order: OrderResponse?) { /* Ваша логика */ }
    private fun showOrderSuccess(order: OrderResponse?) { /* Ваша логика */ }
    private fun onOrderError(error: String) { 
        Log.e("OrderError", error)
        showMessage(error)
    }
}
```

### 4. Обновить API интерфейс (если используете Retrofit)

**Файл**: `app/src/main/java/com/baganov/magicvetov/api/OrderApi.kt`

```kotlin
interface OrderApi {
    
    @POST("api/v1/orders")
    suspend fun createOrder(
        @Body request: CreateOrderRequest,
        @Header("Authorization") token: String
    ): Response<OrderResponse>
    
    // Остальные методы...
}
```

---

## 🧪 Тестирование интеграции

### 1. Тестовые сценарии

**Сценарий 1: Заказ с СБП**
1. Выберите СБП в приложении
2. Создайте заказ
3. ✅ Заказ НЕ должен появиться в админском боте сразу
4. ✅ После успешной оплаты заказ появится в боте

**Сценарий 2: Заказ с наличными**
1. Выберите "Картой/наличными при получении"
2. Создайте заказ  
3. ✅ Заказ должен появиться в админском боте сразу

### 2. Логирование для отладки

Добавьте в `onCreate()` метод:

```kotlin
// Включаем детальное логирование для отладки
if (BuildConfig.DEBUG) {
    Log.d("PaymentDebug", "Checkout экран запущен")
    Log.d("PaymentDebug", "Доступные способы оплаты: ${PaymentMethod.getAvailableMethods()}")
}
```

### 3. Проверка JSON запроса

В логах вы должны увидеть:

```json
{
  "deliveryLocationId": 1,
  "contactName": "Тестовый пользователь",
  "contactPhone": "+79001234567",
  "comment": "Тест",
  "paymentMethod": "SBP"  // ✅ Это поле должно присутствовать
}
```

---

## 🐛 Частые проблемы и решения

### Проблема 1: PaymentMethod не передается
**Решение**: Убедитесь что поле `paymentMethod` добавлено в `CreateOrderRequest`

### Проблема 2: Все заказы идут как CASH
**Решение**: Проверьте что `selectedPaymentMethod.value` корректно устанавливается

### Проблема 3: СБП заказы все равно попадают в бот сразу
**Решение**: Проверьте логи бэкенда - должно быть сообщение "способом оплаты SBP будет отправлен в бот после оплаты"

### Проблема 4: UI не обновляется при выборе способа оплаты
**Решение**: Убедитесь что `updatePaymentMethodUI()` вызывается в обработчиках кликов

---

## 📚 Дополнительные ресурсы

### Документация API
- Endpoint: `POST /api/v1/orders`
- Доступные `paymentMethod`: `"CASH"`, `"SBP"`, `"BANK_CARD"`

### Структура проекта
```
app/src/main/java/com/baganov/magicvetov/
├── model/
│   ├── CreateOrderRequest.kt     # ✅ Обновить
│   ├── PaymentMethod.kt          # ✅ Создать
│   └── OrderResponse.kt
├── ui/checkout/
│   └── CheckoutActivity.kt       # ✅ Обновить
├── api/
│   └── OrderApi.kt              # ✅ Проверить
└── service/
    └── OrderService.kt
```

---

## ✅ Чек-лист для разработчика

- [ ] Добавлено поле `paymentMethod` в `CreateOrderRequest`
- [ ] Создан enum `PaymentMethod` с нужными значениями
- [ ] Обновлен экран checkout для работы с выбором оплаты
- [ ] Добавлено логирование для отладки
- [ ] Протестирован сценарий с СБП (заказ не попадает в бот сразу)
- [ ] Протестирован сценарий с наличными (заказ попадает в бот сразу)
- [ ] Проверены логи бэкенда на корректную обработку `paymentMethod`

---

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи Android**: `adb logcat | grep -E "(PaymentMethod|OrderCreation)"`
2. **Проверьте логи бэкенда**: Должны быть сообщения о способе оплаты
3. **Проверьте сетевые запросы**: Используйте Charles Proxy или встроенный Network Inspector

**🎯 Цель**: После внедрения этих изменений СБП заказы будут корректно обрабатываться - попадать в админский бот только после успешной оплаты, а наличные заказы будут приходить сразу. 