# Google Sheets S3 интеграция - Руководство по настройке

## 📋 Обзор

Это руководство описывает, как настроить автоматическую загрузку `google-credentials.json` из S3 хранилища при запуске приложения MagicCvetov.

### 🎯 Преимущества S3 подхода:
- **Безопасность**: Credentials не хранятся в GitHub репозитории
- **Автоматизация**: Файл загружается автоматически при старте приложения
- **Обновления**: Можно обновить credentials в S3 без пересборки образа
- **Совместимость**: Работает с существующей S3 инфраструктурой Timeweb

---

## 🚀 Пошаговая настройка

### Шаг 1: Подготовка Google Credentials

1. **Создайте Service Account** в Google Cloud Console
2. **Скачайте `credentials.json`** файл
3. **Переименуйте файл** в `google-credentials.json` для единообразия

### Шаг 2: Загрузка в S3

#### Через веб-интерфейс Timeweb:
```
1. Войдите в панель управления Timeweb
2. Перейдите в раздел "Объектное хранилище S3"
3. Выберите ваш bucket (f9c8e17a-magicvetov-products)
4. Создайте папку "config" (если не существует)
5. Загрузите google-credentials.json в папку config/
6. Итоговый путь: config/google-credentials.json
```

#### Через AWS CLI:
```bash
# Установите AWS CLI и настройте credentials для Timeweb
aws configure --profile timeweb
# AWS Access Key ID: AJK63DSBOEBQD3IVTLOT  
# AWS Secret Access Key: eOkZ8nzUkylhcsgPRQVJdr8qmvblxvaq7zoEcNpk
# Default region: us-east-1
# Default output format: json

# Загрузите файл
aws s3 cp google-credentials.json s3://f9c8e17a-magicvetov-products/config/google-credentials.json \
  --endpoint-url https://s3.twcstorage.ru \
  --profile timeweb
```

#### Через curl:
```bash
# Прямая загрузка через S3 API (требует подписи)
# Рекомендуется использовать веб-интерфейс или AWS CLI
```

### Шаг 3: Настройка переменных окружения

В `docker-compose.yml` уже настроены переменные:

```yaml
# Google Sheets S3 интеграция
GOOGLE_SHEETS_DOWNLOAD_FROM_S3: true
GOOGLE_SHEETS_S3_CREDENTIALS_KEY: config/google-credentials.json
```

Для кастомизации создайте `.env` файл:

```bash
# .env.google-sheets-s3
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=ваш_spreadsheet_id
GOOGLE_SHEETS_DOWNLOAD_FROM_S3=true
GOOGLE_SHEETS_S3_CREDENTIALS_KEY=config/google-credentials.json
```

### Шаг 4: Запуск приложения

```bash
# С загрузкой из S3 (по умолчанию)
docker-compose up

# Или с кастомными настройками
docker-compose --env-file .env.google-sheets-s3 up
```

---

## 🔧 Как это работает

### Автоматическая загрузка при старте

1. **При старте приложения** выполняется `@PostConstruct` метод
2. **GoogleCredentialsDownloadService** проверяет настройки S3
3. **Определяется bucket** в зависимости от профиля (dev/prod):
   - **dev**: `${S3_BUCKET}` (MinIO)
   - **prod**: `${TIMEWEB_S3_BUCKET}` (Timeweb S3)
4. **Скачивается файл** из S3 по пути `config/google-credentials.json`
5. **Сохраняется локально** в `/app/config/google-credentials.json`
6. **GoogleSheetsApiConfiguration** использует локальный файл

### Архитектура компонентов

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Docker Compose   │────│   S3 Storage     │────│   Local Container   │
│   Environment      │    │   (Timeweb)      │    │   /app/config/      │
└─────────────────────┘    └──────────────────┘    └─────────────────────┘
          │                          │                         │
          ▼                          ▼                         ▼
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ GOOGLE_SHEETS_S3_   │    │ config/google-   │    │ google-credentials  │
│ CREDENTIALS_KEY     │    │ credentials.json │    │ .json               │
└─────────────────────┘    └──────────────────┘    └─────────────────────┘
```

---

## 🛠️ Административные команды

Приложение предоставляет REST API для управления:

### 1. Проверка статуса credentials
```bash
curl -X GET "http://localhost:8080/api/v1/admin/google-sheets/credentials/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Ручная загрузка из S3
```bash
curl -X POST "http://localhost:8080/api/v1/admin/google-sheets/credentials/download" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Инициализация таблицы
```bash
curl -X POST "http://localhost:8080/api/v1/admin/google-sheets/sheet/initialize" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Получение конфигурации
```bash
curl -X GET "http://localhost:8080/api/v1/admin/google-sheets/config" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `GOOGLE_SHEETS_ENABLED` | Включение Google Sheets | `false` |
| `GOOGLE_SHEETS_DOWNLOAD_FROM_S3` | Загрузка из S3 | `true` |
| `GOOGLE_SHEETS_S3_CREDENTIALS_KEY` | Путь в S3 | `config/google-credentials.json` |
| `GOOGLE_SHEETS_CREDENTIALS_PATH` | Локальный путь | `/app/config/google-credentials.json` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID таблицы | - |
| `GOOGLE_SHEETS_SHEET_NAME` | Название листа | `Заказы` |

---

## 🔍 Диагностика проблем

### Проблема: "Файл не найден в S3"

**Причины:**
- Файл не загружен в S3
- Неправильный путь в S3
- Нет доступа к bucket

**Решение:**
```bash
# Проверьте наличие файла в S3
aws s3 ls s3://f9c8e17a-magicvetov-products/config/ \
  --endpoint-url https://s3.twcstorage.ru \
  --profile timeweb

# Загрузите файл если отсутствует
aws s3 cp google-credentials.json s3://f9c8e17a-magicvetov-products/config/google-credentials.json \
  --endpoint-url https://s3.twcstorage.ru \
  --profile timeweb
```

### Проблема: "S3 bucket не настроен"

**Причины:**
- Неправильные переменные окружения S3
- Отсутствует конфигурация для текущего профиля

**Решение:**
Проверьте переменные в `docker-compose.yml`:
```yaml
# Для prod профиля
TIMEWEB_S3_BUCKET: f9c8e17a-magicvetov-products
TIMEWEB_S3_ACCESS_KEY: AJK63DSBOEBQD3IVTLOT
TIMEWEB_S3_SECRET_KEY: eOkZ8nzUkylhcsgPRQVJdr8qmvblxvaq7zoEcNpk
TIMEWEB_S3_ENDPOINT: https://s3.twcstorage.ru
```

### Проблема: "Credentials файл пуст"

**Причины:**
- Файл был загружен некорректно
- Повреждение при передаче

**Решение:**
```bash
# Перезагрузите файл в S3
aws s3 cp google-credentials.json s3://f9c8e17a-magicvetov-products/config/google-credentials.json \
  --endpoint-url https://s3.twcstorage.ru \
  --profile timeweb

# Принудительно скачайте заново через API
curl -X POST "http://localhost:8080/api/v1/admin/google-sheets/credentials/download" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Проверка логов

```bash
# Логи приложения
docker-compose logs app | grep -i "google\|s3\|credentials"

# Логи загрузки credentials
docker-compose logs app | grep "GoogleCredentialsDownloadService"
```

---

## 🔄 Обновление Credentials

Для обновления Google Sheets credentials:

1. **Загрузите новый файл** в S3 (перезапишите существующий)
2. **Перезапустите приложение** или используйте API:
   ```bash
   curl -X POST "http://localhost:8080/api/v1/admin/google-sheets/credentials/download" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

---

## 📈 Мониторинг

### Логи загрузки

При старте приложения вы увидите:
```
📥 Начинаем загрузку Google Sheets credentials из S3...
📊 Настройки загрузки:
   S3 Bucket: f9c8e17a-magicvetov-products
   S3 Key: config/google-credentials.json
   Local Path: /app/config/google-credentials.json
📥 Файл загружен из S3: config/google-credentials.json → /app/config/google-credentials.json
📊 Размер файла: 2341 байт
✅ Google Sheets credentials успешно загружены из S3
🔧 Инициализация Google Sheets API сервиса
✅ Google Sheets API сервис успешно инициализирован
```

### Проверка через API

```bash
# Проверка статуса всей интеграции
curl -X GET "http://localhost:8080/api/v1/admin/google-sheets/config" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | jq
```

---

## 🎯 Результат

После настройки S3 интеграции:

✅ **Автоматическая загрузка** - credentials скачиваются при каждом запуске  
✅ **Безопасность** - sensitive данные не в Git репозитории  
✅ **Простота обновления** - замена файла в S3 без пересборки  
✅ **Мониторинг** - полное логирование процесса загрузки  
✅ **Fallback** - использование локального файла при недоступности S3  
✅ **API управление** - ручная загрузка и проверка статуса через REST API  

**Google Sheets интеграция готова к работе с S3! 🎉**