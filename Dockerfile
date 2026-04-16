# Этап 1: Сборка приложения
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Сначала копируем только файлы для кэширования зависимостей
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./

# Загружаем зависимости (кэшируется)
RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon || true

# Копируем исходный код и собираем
COPY src/ src/
RUN ./gradlew build -x test --no-daemon

# Этап 2: Финальный образ
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="baganov"

RUN apk add --no-cache curl
RUN addgroup -S magicvetov && adduser -S magicvetov -G magicvetov

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown magicvetov:magicvetov app.jar

USER magicvetov

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "echo 'Starting MagicCvetov application...' && java $JAVA_OPTS -jar app.jar"]
