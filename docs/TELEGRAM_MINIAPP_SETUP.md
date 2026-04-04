# Настройка Telegram Mini App

## Проблема
В веб-версии Telegram Mini App не открывается, показывается пустое окно.

## Причины
1. **Неправильная кнопка**: Используется обычная URL-кнопка вместо WebApp кнопки
2. **Настройки BotFather**: Mini App не зарегистрирован или неправильно настроен
3. **HTTPS требования**: Mini App должен работать только по HTTPS

## Решение

### 1. Исправление кода бота ✅
Заменили обычную URL-кнопку на WebApp кнопку в `MagicCvetovTelegramBot.java`:

```java
// Старый код (не работает как Mini App):
InlineKeyboardButton menuButton = InlineKeyboardButton.builder()
    .text("📋 Открыть меню")
    .url("https://api.dimbopizza.ru/miniapp/menu")  // ❌ Обычная URL
    .build();

// Новый код (работает как Mini App):
WebApp webApp = new WebApp("https://api.dimbopizza.ru/miniapp/menu");
InlineKeyboardButton menuButton = InlineKeyboardButton.builder()
    .text("🍕 Открыть меню")
    .webApp(webApp)  // ✅ WebApp кнопка
    .build();
```

### 2. Настройка Mini App в BotFather ⚠️ ОБЯЗАТЕЛЬНО

**Это основное решение проблемы!** Обратитесь к @BotFather и выполните:

```
/setmenubutton
→ Выберите @DIMBOpizzaBot  
→ Введите URL: https://api.dimbopizza.ru/miniapp/menu
→ Введите название: "🍕 Меню"
```

**Альтернативно через интерфейс:**
```
/mybots
→ Выберите @DIMBOpizzaBot
→ Bot Settings  
→ Menu Button
→ Configure Menu Button
→ URL: https://api.dimbopizza.ru/miniapp/menu
→ Text: 🍕 Меню
```

После настройки Menu Button в BotFather, Mini App будет автоматически открываться при нажатии на кнопку меню внизу чата (рядом с полем ввода сообщения).

### 3. Проверка HTTPS

Убедитесь, что:
- ✅ Mini App доступен по HTTPS: `https://api.dimbopizza.ru/miniapp/menu`
- ✅ SSL сертификат валидный
- ✅ Нет смешанного контента (HTTP ресурсы на HTTPS странице)

### 4. Тестирование

После настройки:

1. **В мобильном Telegram:**
   - Перейдите к боту @DIMBOpizzaBot
   - Нажмите кнопку "🍕 Открыть меню"
   - Mini App должен открыться внутри Telegram

2. **В веб-версии Telegram:**
   - Откройте https://web.telegram.org/k/#@DIMBOpizzaBot
   - Нажмите кнопку "🍕 Открыть меню"
   - Mini App должен открыться в модальном окне

### 5. Возможные проблемы

#### Проблема: "Mini App не открывается"
**Решение:**
- Проверьте, что URL доступен в браузере
- Убедитесь, что используется HTTPS
- Проверьте консоль браузера на ошибки

#### Проблема: "Пустое окно в веб-версии"
**Решение:**
- Убедитесь, что настроили WebApp кнопку в BotFather
- Проверьте, что Mini App не использует мобильные API недоступные в веб

#### Проблема: "Ошибка загрузки"
**Решение:**
- Проверьте CORS настройки
- Убедитесь, что все ресурсы загружаются по HTTPS
- Проверьте CSP (Content Security Policy) заголовки

## Архитектура Mini App

```
Telegram Bot (@DIMBOpizzaBot)
    ↓ WebApp кнопка
https://api.dimbopizza.ru/miniapp/menu
    ↓ Загружает
menu.html + menu-app.js + api.js
    ↓ API вызовы
https://api.dimbopizza.ru/api/v1/*
```

## Проверка статуса

Для проверки настроек используйте:

```bash
# Проверка доступности Mini App
curl -I https://api.dimbopizza.ru/miniapp/menu

# Проверка API
curl https://api.dimbopizza.ru/api/v1/products | head -1
```

---

**Важно:** После изменений в коде необходимо пересобрать и задеплоить приложение.