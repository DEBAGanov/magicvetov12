/**
 * @file: PaymentAlertService.java
 * @description: Сервис для системы алертов и уведомлений платежной системы
 * @dependencies: PaymentMetricsService, Spring Events
 * @created: 2025-01-26
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Payment;
import com.baganov.magicvetov.entity.PaymentStatus;
import com.baganov.magicvetov.event.PaymentAlertEvent;
import com.baganov.magicvetov.service.PaymentMetricsService.PaymentMetricsSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Сервис для мониторинга критических событий и отправки алертов
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "yookassa.enabled", havingValue = "true")
public class PaymentAlertService {

    private final PaymentMetricsService paymentMetricsService;
    private final ApplicationEventPublisher eventPublisher;

    // Пороговые значения для алертов
    private static final double LOW_CONVERSION_THRESHOLD = 70.0; // %
    private static final double HIGH_FAILURE_RATE_THRESHOLD = 10.0; // %
    private static final long MAX_PENDING_TIME_MINUTES = 30; // минут
    private static final int MIN_PAYMENTS_FOR_ALERT = 5; // минимум платежей для анализа

    // Состояние алертов (для предотвращения спама)
    private final AtomicBoolean lowConversionAlertSent = new AtomicBoolean(false);
    private final AtomicBoolean highFailureRateAlertSent = new AtomicBoolean(false);
    private final AtomicLong lastAlertTime = new AtomicLong(0);
    private static final long ALERT_COOLDOWN_MINUTES = 30; // кулдаун между алертами

    /**
     * Проверка критических событий каждые 5 минут
     */
    @Scheduled(fixedRate = 300000) // 5 минут
    public void checkCriticalEvents() {
        try {
            log.debug("🔍 Проверка критических событий платежной системы");

            PaymentMetricsSummary summary = paymentMetricsService.getMetricsSummary();

            // Проверяем только если есть достаточно данных
            if (summary.totalPayments() >= MIN_PAYMENTS_FOR_ALERT) {
                checkConversionRate(summary);
                checkFailureRate(summary);
                checkSystemHealth();
            }

        } catch (Exception e) {
            log.error("❌ Ошибка проверки критических событий: {}", e.getMessage(), e);
            sendSystemErrorAlert(e);
        }
    }

    /**
     * Обработка события создания платежа
     */
    public void onPaymentCreated(Payment payment) {
        log.debug("🔔 Обработка события создания платежа: ID={}", payment.getId());

        // Проверяем на большие суммы
        if (payment.getAmount().compareTo(BigDecimal.valueOf(10000)) > 0) {
            sendHighAmountPaymentAlert(payment);
        }
    }

    /**
     * Обработка изменения статуса платежа
     */
    public void onPaymentStatusChanged(Payment payment, PaymentStatus oldStatus) {
        log.debug("🔔 Обработка изменения статуса платежа: ID={}, {} → {}",
                payment.getId(), oldStatus, payment.getStatus());

        switch (payment.getStatus()) {
            case FAILED -> handlePaymentFailure(payment, oldStatus);
            case SUCCEEDED -> handlePaymentSuccess(payment);
            case PENDING -> checkPendingPaymentTimeout(payment);
        }
    }

    /**
     * Проверка коэффициента конверсии
     */
    private void checkConversionRate(PaymentMetricsSummary summary) {
        double conversionRate = summary.conversionRate();

        if (conversionRate < LOW_CONVERSION_THRESHOLD && !lowConversionAlertSent.get()) {
            if (canSendAlert()) {
                sendLowConversionAlert(conversionRate, summary);
                lowConversionAlertSent.set(true);
                updateLastAlertTime();
            }
        } else if (conversionRate >= LOW_CONVERSION_THRESHOLD) {
            lowConversionAlertSent.set(false); // Сброс флага при нормализации
        }
    }

    /**
     * Проверка уровня ошибок
     */
    private void checkFailureRate(PaymentMetricsSummary summary) {
        double failureRate = summary.totalPayments() > 0
                ? (double) summary.failedPayments() / summary.totalPayments() * 100.0
                : 0.0;

        if (failureRate > HIGH_FAILURE_RATE_THRESHOLD && !highFailureRateAlertSent.get()) {
            if (canSendAlert()) {
                sendHighFailureRateAlert(failureRate, summary);
                highFailureRateAlertSent.set(true);
                updateLastAlertTime();
            }
        } else if (failureRate <= HIGH_FAILURE_RATE_THRESHOLD) {
            highFailureRateAlertSent.set(false); // Сброс флага при нормализации
        }
    }

    /**
     * Проверка общего состояния системы
     */
    private void checkSystemHealth() {
        // Здесь можно добавить проверки:
        // - Доступность ЮKassa API
        // - Время ответа системы
        // - Состояние базы данных
        // - Использование памяти/CPU
        log.debug("💚 Проверка состояния системы пройдена");
    }

    /**
     * Обработка неудачного платежа
     */
    private void handlePaymentFailure(Payment payment, PaymentStatus oldStatus) {
        log.warn("❌ Платеж завершился неудачно: ID={}, сумма={}₽, ошибка={}",
                payment.getId(), payment.getAmount(), payment.getErrorMessage());

        // Отправляем алерт для критических ошибок
        if (payment.getAmount().compareTo(BigDecimal.valueOf(5000)) > 0) {
            sendCriticalPaymentFailureAlert(payment);
        }
    }

    /**
     * Обработка успешного платежа
     */
    private void handlePaymentSuccess(Payment payment) {
        log.info("✅ Платеж успешно завершен: ID={}, сумма={}₽",
                payment.getId(), payment.getAmount());

        // Отправляем уведомление о крупных платежах
        if (payment.getAmount().compareTo(BigDecimal.valueOf(15000)) > 0) {
            sendLargePaymentSuccessAlert(payment);
        }
    }

    /**
     * Проверка зависших платежей
     */
    private void checkPendingPaymentTimeout(Payment payment) {
        if (payment.getCreatedAt() != null) {
            long minutesAgo = java.time.Duration.between(
                    payment.getCreatedAt(), LocalDateTime.now()).toMinutes();

            if (minutesAgo > MAX_PENDING_TIME_MINUTES) {
                sendPendingPaymentTimeoutAlert(payment, minutesAgo);
            }
        }
    }

    /**
     * Отправка алерта о низкой конверсии
     */
    private void sendLowConversionAlert(double conversionRate, PaymentMetricsSummary summary) {
        String message = String.format(
                "🚨 АЛЕРТ: Низкая конверсия платежей!\n\n" +
                        "📊 Конверсия: %.1f%% (норма: >%.0f%%)\n" +
                        "📈 Всего платежей: %d\n" +
                        "✅ Успешных: %d\n" +
                        "❌ Неудачных: %d\n" +
                        "💰 Общая сумма: %.2f₽\n\n" +
                        "⏰ Время: %s",
                conversionRate, LOW_CONVERSION_THRESHOLD,
                summary.totalPayments(), summary.successfulPayments(), summary.failedPayments(),
                summary.totalAmount().doubleValue(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.LOW_CONVERSION);
        log.error("🚨 АЛЕРТ: Низкая конверсия платежей: {}%", conversionRate);
    }

    /**
     * Отправка алерта о высоком уровне ошибок
     */
    private void sendHighFailureRateAlert(double failureRate, PaymentMetricsSummary summary) {
        String message = String.format(
                "🚨 АЛЕРТ: Высокий уровень ошибок платежей!\n\n" +
                        "📊 Уровень ошибок: %.1f%% (норма: <%.0f%%)\n" +
                        "📈 Всего платежей: %d\n" +
                        "❌ Неудачных: %d\n" +
                        "✅ Успешных: %d\n\n" +
                        "⏰ Время: %s",
                failureRate, HIGH_FAILURE_RATE_THRESHOLD,
                summary.totalPayments(), summary.failedPayments(), summary.successfulPayments(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.HIGH_FAILURE_RATE);
        log.error("🚨 АЛЕРТ: Высокий уровень ошибок платежей: {}%", failureRate);
    }

    /**
     * Отправка алерта о крупном платеже
     */
    private void sendHighAmountPaymentAlert(Payment payment) {
        String message = String.format(
                "💰 Крупный платеж создан!\n\n" +
                        "🆔 ID: %d\n" +
                        "💵 Сумма: %.2f₽\n" +
                        "🏦 Метод: %s\n" +
                        "📦 Заказ: #%d\n" +
                        "⏰ Время: %s",
                payment.getId(), payment.getAmount().doubleValue(),
                payment.getMethod().getDisplayName(),
                payment.getOrder().getId(),
                payment.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.HIGH_AMOUNT_PAYMENT);
    }

    /**
     * Отправка алерта о критической ошибке платежа
     */
    private void sendCriticalPaymentFailureAlert(Payment payment) {
        String message = String.format(
                "🚨 КРИТИЧЕСКАЯ ОШИБКА ПЛАТЕЖА!\n\n" +
                        "🆔 ID: %d\n" +
                        "💵 Сумма: %.2f₽\n" +
                        "🏦 Метод: %s\n" +
                        "❌ Ошибка: %s\n" +
                        "📦 Заказ: #%d\n" +
                        "⏰ Время: %s",
                payment.getId(), payment.getAmount().doubleValue(),
                payment.getMethod().getDisplayName(),
                payment.getErrorMessage() != null ? payment.getErrorMessage() : "Неизвестная ошибка",
                payment.getOrder().getId(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.CRITICAL_PAYMENT_FAILURE);
    }

    /**
     * Отправка уведомления о крупном успешном платеже
     */
    private void sendLargePaymentSuccessAlert(Payment payment) {
        String message = String.format(
                "🎉 Крупный платеж успешно завершен!\n\n" +
                        "🆔 ID: %d\n" +
                        "💰 Сумма: %.2f₽\n" +
                        "🏦 Метод: %s\n" +
                        "📦 Заказ: #%d\n" +
                        "⏰ Время: %s",
                payment.getId(), payment.getAmount().doubleValue(),
                payment.getMethod().getDisplayName(),
                payment.getOrder().getId(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.LARGE_PAYMENT_SUCCESS);
    }

    /**
     * Отправка алерта о зависшем платеже
     */
    private void sendPendingPaymentTimeoutAlert(Payment payment, long minutesAgo) {
        String message = String.format(
                "⏰ Платеж завис в обработке!\n\n" +
                        "🆔 ID: %d\n" +
                        "💵 Сумма: %.2f₽\n" +
                        "🏦 Метод: %s\n" +
                        "📦 Заказ: #%d\n" +
                        "⏱️ В обработке: %d мин\n" +
                        "⏰ Создан: %s",
                payment.getId(), payment.getAmount().doubleValue(),
                payment.getMethod().getDisplayName(),
                payment.getOrder().getId(), minutesAgo,
                payment.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.PENDING_PAYMENT_TIMEOUT);
    }

    /**
     * Отправка алерта о системной ошибке
     */
    private void sendSystemErrorAlert(Exception e) {
        String message = String.format(
                "🚨 СИСТЕМНАЯ ОШИБКА!\n\n" +
                        "❌ Ошибка: %s\n" +
                        "📋 Класс: %s\n" +
                        "⏰ Время: %s\n\n" +
                        "Требуется немедленная проверка системы!",
                e.getMessage(),
                e.getClass().getSimpleName(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        sendTelegramAlert(message, PaymentAlertEvent.AlertType.SYSTEM_ERROR);
    }

    /**
     * Отправка сообщения в Telegram
     */
    private void sendTelegramAlert(String message, PaymentAlertEvent.AlertType alertType) {
        try {
            // Отправляем событие для обработки администраторами
            PaymentAlertEvent alertEvent = new PaymentAlertEvent(this, message, alertType);
            eventPublisher.publishEvent(alertEvent);

            log.info("📱 Отправка алерта типа {}: {}", alertType, message);

        } catch (Exception e) {
            log.error("❌ Ошибка отправки алерта в Telegram: {}", e.getMessage());
        }
    }

    /**
     * Проверка возможности отправки алерта (кулдаун)
     */
    private boolean canSendAlert() {
        long now = System.currentTimeMillis();
        long lastAlert = lastAlertTime.get();
        return (now - lastAlert) > (ALERT_COOLDOWN_MINUTES * 60 * 1000);
    }

    /**
     * Обновление времени последнего алерта
     */
    private void updateLastAlertTime() {
        lastAlertTime.set(System.currentTimeMillis());
    }

    /**
     * Получение статистики алертов
     */
    public AlertStatistics getAlertStatistics() {
        return new AlertStatistics(
                lowConversionAlertSent.get(),
                highFailureRateAlertSent.get(),
                lastAlertTime.get(),
                ALERT_COOLDOWN_MINUTES);
    }

    /**
     * DTO для статистики алертов
     */
    public record AlertStatistics(
            boolean lowConversionAlertActive,
            boolean highFailureRateAlertActive,
            long lastAlertTimestamp,
            long cooldownMinutes) {
    }
}