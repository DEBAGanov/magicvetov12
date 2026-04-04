# Исправление авторизации через контакты в Telegram Mini App

## Проблемы

### 1. Ошибка "Токен авторизации не найден"
**Симптомы:**
- При попытке поделиться номером телефона через системный диалог Telegram WebApp появлялась ошибка "❌ Токен авторизации не найден. Пожалуйста, начните заново с команды /start"
- Номер телефона не сохранялся в таблицу `users`
- Пользователь не появлялся в базе данных при использовании системного диалога

**Причина:**
- Система авторизации использовала два разных подхода: стандартную и расширенную авторизацию
- При использовании системного диалога контактов система пыталась найти токен в `telegram_auth_tokens`, который создавался только при расширенной авторизации
- Стандартная авторизация не создавала записи в `telegram_auth_tokens`, что приводило к ошибке

### 2. Кнопка "Поделиться контактом еще раз" не работала
**Симптомы:**
- Синяя кнопка "Поделиться контактом еще раз" была неактивна
- Повторные запросы контакта блокировались

**Причина:**
- Флаг `contactRequested` блокировал повторные вызовы `requestContact()`
- Система не сбрасывала флаг при явном запросе пользователя

### 3. Отсутствие автоматического форматирования номера телефона
**Симптомы:**
- Пользователь мог ввести некорректный номер телефона
- Не было автоматической подстановки "+7"
- Не было ограничения на количество цифр

## Решения

### 1. Исправление процесса авторизации

#### Frontend (checkout-app.js)
```javascript
// Изменили логику авторизации для всегда создания кросс-платформенного токена
async authenticate() {
    // Сразу пробуем расширенную авторизацию без номера телефона
    try {
        const response = await this.api.enhancedAuthenticateWebApp(this.tg.initData, null);
        this.authToken = response.token;
        this.api.setAuthToken(this.authToken);
        
        // Запрашиваем номер телефона для дополнения данных
        this.requestPhoneForEnhancedAuth();
        return;
    } catch (error) {
        // Fallback на стандартную авторизацию
        // ...
    }
}
```

#### API (api.js)
```javascript
// Обновили метод для поддержки опционального номера телефона
async enhancedAuthenticateWebApp(initDataRaw, phoneNumber) {
    const hasPhone = phoneNumber && phoneNumber.trim();
    
    const requestBody = {
        initDataRaw: initDataRaw,
        deviceId: this.getDeviceId(),
        platform: 'telegram-miniapp'
    };
    
    // Добавляем номер телефона только если он предоставлен
    if (hasPhone) {
        requestBody.phoneNumber = phoneNumber.trim();
    }
    
    // ...
}
```

#### Backend (Java)
```java
// Обновили модель запроса для поддержки опционального номера телефона
@Pattern(regexp = "^\\+7\\d{10}$", message = "Номер телефона должен быть в формате +7XXXXXXXXXX", 
         groups = {PhoneValidation.class})
@Schema(description = "Номер телефона пользователя (опциональный)")
private String phoneNumber;

// Обновили контроллер для валидации только предоставленных номеров
boolean hasPhone = phoneNumber != null && !phoneNumber.trim().isEmpty();
if (hasPhone && !phoneNumber.matches("^\\+7\\d{10}$")) {
    return ResponseEntity.badRequest().build();
}
```

### 2. Исправление кнопки повторного запроса контакта

```javascript
requestContactAgain() {
    // Сбрасываем флаг для повторного запроса
    if (this.contactRequested) {
        console.log('⚠️ requestContact уже был вызван ранее, но пользователь просит повторно - сбрасываем флаг');
        this.contactRequested = false;
    }
    
    // Выполняем запрос контакта
    this.tg.requestContact();
    this.contactRequested = true;
}
```

### 3. Автоматическое форматирование номера телефона

```javascript
setupPhoneInputFormatting(phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value;
        const digits = value.replace(/[^\d+]/g, '');
        
        // Автоматическое добавление +7
        if (!digits.startsWith('+7')) {
            if (digits.startsWith('8')) {
                value = '+7' + digits.substring(1);
            } else if (!digits.startsWith('7')) {
                value = '+7' + digits;
            } else {
                value = '+' + digits;
            }
        }
        
        // Ограничение до 10 цифр после +7
        const withoutPrefix = value.substring(2);
        if (withoutPrefix.length > 10) {
            value = '+7' + withoutPrefix.substring(0, 10);
        }
        
        // Форматирование: +7 XXX XXX XX XX
        if (value.length > 2) {
            let formatted = '+7';
            const phoneDigits = value.substring(2);
            
            if (phoneDigits.length > 0) formatted += ' ' + phoneDigits.substring(0, 3);
            if (phoneDigits.length > 3) formatted += ' ' + phoneDigits.substring(3, 6);
            if (phoneDigits.length > 6) formatted += ' ' + phoneDigits.substring(6, 8);
            if (phoneDigits.length > 8) formatted += ' ' + phoneDigits.substring(8, 10);
            
            e.target.value = formatted;
        }
    });
    
    // Предотвращение удаления +7
    phoneInput.addEventListener('keydown', (e) => {
        const cursorPosition = e.target.selectionStart;
        if ((e.key === 'Backspace' || e.key === 'Delete') && 
            cursorPosition <= 3 && e.target.value.startsWith('+7 ')) {
            e.preventDefault();
        }
    });
}
```

## Результаты

### ✅ Исправлено
1. **Авторизация через контакт работает корректно**
   - Система создает токен в `telegram_auth_tokens` сразу при инициализации
   - Номер телефона сохраняется в базу данных при получении контакта
   - Пользователи появляются в таблице `users` автоматически

2. **Кнопка "Поделиться контактом еще раз" функциональна**
   - Пользователь может повторно запросить системный диалог
   - Флаг `contactRequested` корректно сбрасывается при явном запросе

3. **Автоматическое форматирование номера телефона**
   - Автоматическая подстановка "+7" при вводе
   - Ограничение на 10 цифр после кода страны
   - Красивое форматирование в реальном времени
   - Защита от случайного удаления префикса "+7"

### 🔄 Поток работы
1. Пользователь открывает страницу оформления заказа
2. Система автоматически выполняет расширенную авторизацию без номера телефона
3. Создается токен в `telegram_auth_tokens` для кросс-платформенного доступа
4. При запросе контакта:
   - Если пользователь предоставляет контакт через системный диалог → номер автоматически сохраняется
   - Если пользователь отменяет → показывается поле для ручного ввода с автоформатированием
5. При ручном вводе:
   - Автоматическое добавление "+7"
   - Форматирование в реальном времени
   - Валидация и сохранение в базу данных

## Файлы изменены

### Frontend
- `src/main/resources/static/miniapp/checkout-app.js` - основная логика авторизации и обработки контактов
- `src/main/resources/static/miniapp/api.js` - API для расширенной авторизации
- `src/main/resources/static/miniapp/styles.css` - исправление темного фона заголовка
- `src/main/resources/static/miniapp/checkout-styles.css` - цвета текста заголовка

### Backend
- `src/main/java/com/baganov/magicvetov/model/dto/telegram/TelegramWebAppEnhancedAuthRequest.java` - опциональный номер телефона
- `src/main/java/com/baganov/magicvetov/controller/TelegramWebAppController.java` - валидация опционального номера
- `src/main/java/com/baganov/magicvetov/service/TelegramWebAppService.java` - логика работы с опциональным номером

## Тестирование

### Сценарии тестирования
1. **Успешное получение контакта через системный диалог**
   - Пользователь нажимает "Share" в диалоге → номер сохраняется в БД

2. **Отмена системного диалога с последующим ручным вводом**
   - Пользователь нажимает "Cancel" → появляется поле ввода → вводит номер → номер сохраняется

3. **Повторный запрос контакта**
   - Кнопка "Поделиться контактом еще раз" открывает системный диалог повторно

4. **Автоматическое форматирование**
   - Ввод "9161234567" → автоматически становится "+7 916 123 45 67"
   - Ввод "89161234567" → автоматически становится "+7 916 123 45 67"

---

**Дата исправления:** 2025-01-27  
**Версия:** v1.0  
**Статус:** ✅ Исправлено и протестировано
