# Google Sheets API - Быстрый старт

## 🚀 Краткое руководство по запуску

### 1. Настройка Google Cloud Platform

1. **Создайте проект** в [Google Cloud Console](https://console.cloud.google.com)
2. **Включите Google Sheets API**:
   - Библиотеки → Поиск "Google Sheets API" → Включить
3. **Создайте Service Account**:
   - IAM и администрирование → Service Accounts → Создать
   - Скачайте JSON файл с ключами

### 2. Настройка Google Таблицы

1. **Создайте новую таблицу** в [Google Sheets](https://sheets.google.com)
2. **Скопируйте ID таблицы** из URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123def456GHI789jkl/edit
   ↳ ID: 1ABC123def456GHI789jkl
   ```
3. **Поделитесь таблицей** с вашим Service Account email (права: Редактор)

### 3. Настройка проекта

1. **Поместите credentials файл**:
   ```bash
   mkdir -p config/
   cp /path/to/your/credentials.json config/google-credentials.json
   ```

2. **Создайте .env файл**:
   ```bash
   cp .env.google-sheets-template .env.google-sheets
   # Отредактируйте файл и укажите ваш SPREADSHEET_ID
   ```

3. **Запустите с Google Sheets**:
   ```bash
   docker-compose --env-file .env.google-sheets up
   ```

### 4. Тестирование

```bash
# Установите переменные окружения
export GOOGLE_SHEETS_ENABLED=true
export GOOGLE_SHEETS_SPREADSHEET_ID="ваш_id_таблицы"

# Запустите тест
./scripts/test_google_sheets_integration.sh
```

### 5. Проверка результата

1. **Откройте вашу Google таблицу**
2. **Создайте тестовый заказ** через API или веб-интерфейс
3. **Убедитесь, что заказ появился** в таблице

## 📊 Структура данных в таблице

| Колонка | Описание | Пример |
|---------|----------|--------|
| A | ID заказа | 123 |
| B | Дата создания | 28.01.2025 14:30 |
| C | Имя клиента | Иван Петров |
| D | Телефон | +79991234567 |
| E | Email | ivan@example.com |
| F | Состав заказа | Маргарита x2 (1200₽); Кола x1 (150₽) |
| G | Адрес доставки | ул. Ленина, 10 |
| H | Тип доставки | Курьером |
| I | Стоимость товаров | 1350₽ |
| J | Стоимость доставки | 200₽ |
| K | Общая сумма | 1550₽ |
| L | Способ оплаты | СБП |
| M | Статус платежа | Оплачен |
| N | Статус заказа | Подтвержден |
| O | Комментарий | Без лука |
| P | Ссылка на платеж | https://yoomoney.ru/... |

## ⚙️ Переменные окружения

```yaml
# Основные настройки
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=ваш_id_таблицы
GOOGLE_SHEETS_SHEET_NAME=Заказы

# Пути и настройки
GOOGLE_SHEETS_CREDENTIALS_PATH=/app/config/google-credentials.json
GOOGLE_SHEETS_APPLICATION_NAME=MagicCvetov Order Tracker

# Тайм-ауты и повторы (опционально)
GOOGLE_SHEETS_CONNECT_TIMEOUT=10000
GOOGLE_SHEETS_READ_TIMEOUT=30000
GOOGLE_SHEETS_MAX_RETRY_ATTEMPTS=3
GOOGLE_SHEETS_RETRY_DELAY=1000
```

## 🔧 Устранение неполадок

### Ошибка: "403 Forbidden"
- Убедитесь, что Service Account имеет доступ к таблице
- Проверьте права доступа (должны быть "Редактор")

### Ошибка: "404 Not Found"
- Проверьте правильность SPREADSHEET_ID
- Убедитесь, что таблица существует и доступна

### Ошибка: "401 Unauthorized"
- Проверьте корректность credentials.json файла
- Убедитесь, что файл доступен по указанному пути

### Заказы не появляются в таблице
- Проверьте логи приложения: `docker-compose logs app`
- Убедитесь, что GOOGLE_SHEETS_ENABLED=true
- Проверьте, что GoogleSheetsService инициализирован корректно

## 📖 Полная документация

Для подробной информации см. [GOOGLE_SHEETS_INTEGRATION_GUIDE.md](./GOOGLE_SHEETS_INTEGRATION_GUIDE.md)