/**
 * @file: PaymentPollingController.java
 * @description: REST контроллер для управления системой активного опроса платежей ЮКассы
 * @dependencies: PaymentPollingService
 * @created: 2025-01-23
 */
package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.service.PaymentPollingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Контроллер для управления системой активного опроса платежей ЮКассы
 * Предназначен для отладки и тестирования системы polling
 */
@RestController
@RequestMapping("/api/v1/payments/polling")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Polling", description = "Управление системой активного опроса платежей ЮКассы")
public class PaymentPollingController {

    private final PaymentPollingService paymentPollingService;

    /**
     * Принудительная проверка конкретного платежа
     */
    @PostMapping("/{paymentId}/force-check")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Принудительная проверка платежа", 
        description = "Запускает немедленную проверку статуса платежа в ЮКассе (для отладки)",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, Object>> forceCheckPayment(
            @Parameter(description = "ID платежа для проверки", required = true) 
            @PathVariable Long paymentId) {

        try {
            log.info("🔧 Запрос принудительной проверки платежа #{}", paymentId);
            
            // Запускаем принудительную проверку
            paymentPollingService.forcePollPayment(paymentId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Принудительная проверка платежа #" + paymentId + " запущена",
                "paymentId", paymentId,
                "note", "Результат проверки смотрите в логах сервера и уведомлениях админского бота"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Платеж не найден: {}", paymentId);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "error", "PAYMENT_NOT_FOUND",
                "message", "Платеж #" + paymentId + " не найден",
                "paymentId", paymentId
            );
            
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            log.error("❌ Ошибка принудительной проверки платежа #{}: {}", paymentId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "error", "POLLING_ERROR",
                "message", "Ошибка при проверке платежа: " + e.getMessage(),
                "paymentId", paymentId
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Получение статистики активного опроса
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Статистика активного опроса", 
        description = "Возвращает информацию о текущих активных платежах для опроса",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, Object>> getPollingStatistics() {

        try {
            log.info("📊 Запрос статистики системы активного опроса платежей");
            
            // Логируем статистику (детали в логах)
            paymentPollingService.logPollingStatistics();
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Статистика активного опроса доступна в логах сервера",
                "pollingInterval", "60 секунд",
                "maxPollingDuration", "10 минут",
                "note", "Детальная статистика отображается в логах PaymentPollingService"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Ошибка получения статистики polling: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "error", "STATISTICS_ERROR",
                "message", "Ошибка получения статистики: " + e.getMessage()
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Информация о системе активного опроса
     */
    @GetMapping("/info")
    @Operation(
        summary = "Информация о системе опроса", 
        description = "Возвращает общую информацию о работе системы активного опроса платежей"
    )
    public ResponseEntity<Map<String, Object>> getPollingInfo() {

        Map<String, Object> info = Map.of(
            "system", "PaymentPollingService",
            "description", "Система активного опроса статуса платежей ЮКассы",
            "problem", "Webhook'и от ЮКассы приходят с задержкой до 10 минут",
            "solution", "Опрос ЮКассы каждую минуту для получения актуального статуса",
            "pollingInterval", "60 секунд",
            "maxPollingDuration", "10 минут на платеж",
            "supportedStatuses", Map.of(
                "monitored", "PENDING, WAITING_FOR_CAPTURE",
                "target", "SUCCEEDED, CANCELLED, FAILED"
            ),
            "behavior", Map.of(
                "cashOrders", "Отправляются в админский бот сразу при создании",
                "onlineOrders", "НЕ отправляются при создании, только после подтверждения оплаты",
                "successNotification", "Заказ отправляется в бот с пометкой 'ОПЛАЧЕН СБП/КАРТОЙ'",
                "failureNotification", "Алерт администраторам об отмене или ошибке платежа"
            )
        );
        
        return ResponseEntity.ok(info);
    }
} 