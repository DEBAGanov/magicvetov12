# 🕐 Руководство по исправлению проблемы с временными зонами

## Проблема

При развертывании MagicCvetov на удаленном сервере с подключением к удаленной базе данных PostgreSQL возникает несоответствие временных зон:

- **База данных PostgreSQL**: работает в московском времени (`Europe/Moscow`)
- **Docker контейнер**: работает в UTC
- **Java приложение**: использует системную временную зону (UTC)
- **Результат**: заказы отображаются с отставанием -3:00 часа

## Диагностика проблемы

### 1. Проверка времени в базе данных
```sql
-- Подключиться к PostgreSQL
psql -h 45.10.41.59 -U gen_user -d default_db -p 5432

-- Проверить текущее время
SELECT NOW() as db_time, CURRENT_TIMESTAMP as current_timestamp;

-- Проверить настройки временной зоны
SHOW timezone;
```

### 2. Проверка времени в контейнере
```bash
# Проверить время в контейнере
docker exec magicvetov-app date

# Проверить переменную окружения TZ
docker exec magicvetov-app echo $TZ

# Проверить временную зону Java
docker exec magicvetov-app java -XshowSettings:properties -version 2>&1 | grep timezone
```

### 3. Использование диагностического скрипта
```bash
# Запустить полную диагностику
./test_timezone_diagnosis.sh
```

## Решение

### 1. Обновление Docker Compose

В `docker-compose.yml` добавлены настройки временной зоны:

```yaml
environment:
  # Временная зона для контейнера
  TZ: Europe/Moscow
  
  # JVM оптимизация для Timeweb Cloud
  JAVA_OPTS: >-
    -XX:+UseContainerSupport
    -XX:MaxRAMPercentage=70.0
    -XX:+ExitOnOutOfMemoryError
    -XX:+UseG1GC
    -Djava.security.egd=file:/dev/./urandom
    -Dspring.jmx.enabled=false
    -Duser.timezone=Europe/Moscow
```

### 2. Настройка Spring Boot

В `application.properties` добавлены:

```properties
# Настройки временной зоны для Hibernate и PostgreSQL
spring.jpa.properties.hibernate.jdbc.time_zone=Europe/Moscow

# Настройки Jackson для корректной сериализации времени
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss
spring.jackson.time-zone=Europe/Moscow
```

### 3. Программные изменения

#### TimeZoneUtils - утилитный класс
```java
@UtilityClass
public class TimeZoneUtils {
    public static final ZoneId MOSCOW_ZONE = ZoneId.of("Europe/Moscow");
    
    public static LocalDateTime nowInMoscow() {
        return ZonedDateTime.now(MOSCOW_ZONE).toLocalDateTime();
    }
}
```

#### TimeZoneConfig - конфигурация
```java
@Configuration
public class TimeZoneConfig {
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Moscow"));
    }
}
```

#### Обновление Entity
```java
@PrePersist
protected void onCreate() {
    createdAt = TimeZoneUtils.nowInMoscow();  // Вместо LocalDateTime.now()
    updatedAt = TimeZoneUtils.nowInMoscow();
}
```

## Развертывание исправления

### 1. Обновление кода
```bash
# Получить последние изменения
git pull origin master

# Проверить изменения в конфигурации
git log --oneline -10
```

### 2. Пересборка и перезапуск
```bash
# Остановить текущие контейнеры
docker-compose down

# Пересобрать образ с новыми настройками
docker-compose build --no-cache

# Запустить с новой конфигурацией
docker-compose up -d

# Проверить логи запуска
docker-compose logs -f app
```

### 3. Проверка исправления

#### Проверка временной зоны в контейнере
```bash
docker exec magicvetov-app sh -c "date && echo 'TZ=' && echo \$TZ"
```

Ожидаемый результат:
```
Mon Jun 23 14:30:00 MSK 2025
TZ=
Europe/Moscow
```

#### Проверка в логах приложения
В логах должны появиться записи:
```
🕐 Временная зона приложения установлена: Europe/Moscow
🕐 Системная временная зона: Europe/Moscow
Системная временная зона: Europe/Moscow
Московское время: 2025-06-23T14:30:00
```

#### Тест создания заказа
```bash
# Создать тестовый заказ
curl -X POST "http://localhost:8080/api/v1/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryLocationId": 1,
    "contactName": "Тест Времени",
    "contactPhone": "+79818279564"
  }'

# Проверить время создания в ответе
# Должно соответствовать московскому времени
```

## Проверка в production

### 1. Подключение к серверу
```bash
# SSH подключение к серверу Timeweb
ssh root@your-server-ip
```

### 2. Проверка на сервере
```bash
# Проверить время сервера
date

# Проверить время в контейнере
docker exec magicvetov-app date

# Проверить логи приложения
docker logs magicvetov-app | grep -i timezone
```

### 3. Тестирование API
```bash
# Создать заказ и проверить время
curl -X POST "https://your-domain.com/api/v1/orders" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryLocationId": 1, "contactName": "Test", "contactPhone": "+79999999999"}'
```

## Откат изменений (если необходимо)

Если возникли проблемы, можно откатиться к предыдущей версии:

```bash
# Откат к предыдущему коммиту
git revert HEAD

# Пересборка и перезапуск
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Мониторинг

После развертывания рекомендуется мониторить:

1. **Логи приложения** - проверить отсутствие ошибок временных зон
2. **Время создания заказов** - должно соответствовать московскому времени
3. **API ответы** - корректное отображение времени в JSON

## Заключение

После применения всех исправлений:
- ✅ Время в приложении соответствует московской временной зоне
- ✅ Заказы создаются с корректным временем
- ✅ API возвращает время в правильном формате
- ✅ Синхронизация с базой данных работает корректно 