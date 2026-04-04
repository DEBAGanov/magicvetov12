/**
 * @file: PaymentMetricsController.java
 * @description: REST контроллер для предоставления метрик мониторинга ЮKassa
 * @dependencies: PaymentMetricsService, Spring Web
 * @created: 2025-01-26
 */
package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.service.PaymentMetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Контроллер для мониторинга метрик платежной системы
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/metrics")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "yookassa.enabled", havingValue = "true")
@Tag(name = "Payment Metrics", description = "API для мониторинга метрик платежной системы")
public class PaymentMetricsController {

    private final PaymentMetricsService paymentMetricsService;

    /**
     * Получение сводки метрик платежей
     */
    @GetMapping("/summary")
    @Operation(summary = "Получить сводку метрик платежей", description = "Возвращает основные метрики платежной системы за последние 24 часа")
    @ApiResponse(responseCode = "200", description = "Сводка метрик получена успешно")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentMetricsService.PaymentMetricsSummary> getMetricsSummary() {
        log.info("📊 Запрос сводки метрик платежей");

        PaymentMetricsService.PaymentMetricsSummary summary = paymentMetricsService.getMetricsSummary();

        log.info("📊 Сводка метрик: всего={}, успешных={}, конверсия={}%",
                summary.totalPayments(), summary.successfulPayments(), summary.conversionRate());

        return ResponseEntity.ok(summary);
    }

    /**
     * Health check для системы метрик
     */
    @GetMapping("/health")
    @Operation(summary = "Проверка работоспособности системы метрик", description = "Возвращает статус работы системы мониторинга метрик")
    @ApiResponse(responseCode = "200", description = "Система метрик работает")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        log.debug("🔍 Проверка работоспособности системы метрик");

        try {
            // Простая проверка доступности сервиса
            Map<String, Object> health = Map.of(
                    "status", "UP",
                    "service", "payment-metrics",
                    "timestamp", LocalDateTime.now(),
                    "version", "1.0.0",
                    "yookassa_enabled", true);

            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            log.error("❌ Ошибка в health check системы метрик: {}", e.getMessage(), e);
            
            Map<String, Object> errorHealth = Map.of(
                    "status", "DOWN",
                    "service", "payment-metrics",
                    "timestamp", LocalDateTime.now(),
                    "error", e.getMessage());
                    
            return ResponseEntity.status(500).body(errorHealth);
        }
    }

    /**
     * Получение детальной информации о метриках
     */
    @GetMapping("/details")
    @Operation(summary = "Получить детальную информацию о метриках", description = "Возвращает расширенную информацию о состоянии платежной системы")
    @ApiResponse(responseCode = "200", description = "Детальная информация получена")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDetailedMetrics() {
        log.info("📊 Запрос детальных метрик платежей");

        try {
            PaymentMetricsService.PaymentMetricsSummary summary = paymentMetricsService.getMetricsSummary();

            Map<String, Object> details = Map.of(
                    "summary", summary,
                    "timestamp", LocalDateTime.now(),
                    "metrics_collection", Map.of(
                            "enabled", true,
                            "update_interval_ms", 60000,
                            "retention_hours", 24),
                    "performance", Map.of(
                            "conversion_rate", summary.conversionRate(),
                            "average_amount",
                            summary.totalAmount().doubleValue() / Math.max(1, summary.successfulPayments()),
                            "failure_rate",
                            (double) summary.failedPayments() / Math.max(1, summary.totalPayments()) * 100.0));

            return ResponseEntity.ok(details);
            
        } catch (Exception e) {
            log.error("❌ Ошибка получения детальных метрик: {}", e.getMessage(), e);

            Map<String, Object> response = Map.of(
                    "status", "error",
                    "message", "Ошибка получения метрик: " + e.getMessage(),
                    "timestamp", LocalDateTime.now());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Ручной запуск обновления метрик
     */
    @PostMapping("/refresh")
    @Operation(summary = "Обновить метрики вручную", description = "Принудительно запускает обновление агрегированных метрик")
    @ApiResponse(responseCode = "200", description = "Метрики обновлены")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> refreshMetrics() {
        log.info("🔄 Ручное обновление метрик платежей");

        try {
            paymentMetricsService.updateAggregatedMetrics();

            Map<String, Object> response = Map.of(
                    "status", "success",
                    "message", "Метрики успешно обновлены",
                    "timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Ошибка обновления метрик: {}", e.getMessage(), e);

            Map<String, Object> response = Map.of(
                    "status", "error",
                    "message", "Ошибка обновления метрик: " + e.getMessage(),
                    "timestamp", LocalDateTime.now());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Получение информации о конфигурации мониторинга
     */
    @GetMapping("/config")
    @Operation(summary = "Получить конфигурацию мониторинга", description = "Возвращает текущие настройки системы мониторинга")
    @ApiResponse(responseCode = "200", description = "Конфигурация получена")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getMonitoringConfig() {
        log.debug("⚙️ Запрос конфигурации мониторинга");

        Map<String, Object> config = Map.of(
                "yookassa_enabled", true,
                "metrics_enabled", true,
                "monitoring", Map.of(
                        "update_interval_seconds", 60,
                        "retention_period_hours", 24,
                        "alert_thresholds", Map.of(
                                "low_conversion_rate", 70.0,
                                "high_failure_rate", 10.0,
                                "max_response_time_ms", 5000)),
                "endpoints", Map.of(
                        "metrics_summary", "/api/v1/payments/metrics/summary",
                        "health_check", "/api/v1/payments/metrics/health",
                        "detailed_metrics", "/api/v1/payments/metrics/details",
                        "prometheus_metrics", "/actuator/prometheus"));

        return ResponseEntity.ok(config);
    }
}