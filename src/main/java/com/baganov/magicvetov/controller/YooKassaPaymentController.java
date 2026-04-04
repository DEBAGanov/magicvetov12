/**
 * @file: YooKassaPaymentController.java
 * @description: REST контроллер для работы с платежами ЮKassa
 * @dependencies: YooKassaPaymentService, Spring Security
 * @created: 2025-01-26
 */
package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.model.dto.payment.CreatePaymentRequest;
import com.baganov.magicvetov.model.dto.payment.PaymentResponse;
import com.baganov.magicvetov.model.dto.payment.SbpBankInfo;
import com.baganov.magicvetov.service.YooKassaPaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST контроллер для работы с платежами ЮKassa
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/yookassa")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "yookassa.enabled", havingValue = "true")
@Tag(name = "ЮKassa Платежи", description = "API для работы с платежами через ЮKassa")
public class YooKassaPaymentController {

    private final YooKassaPaymentService yooKassaPaymentService;

    /**
     * Создание нового платежа
     */
    @PostMapping("/create")
    @Operation(summary = "Создание платежа", description = "Создает новый платеж через ЮKassa API с поддержкой СБП", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            Authentication authentication) {

        log.info("🔄 Создание платежа ЮKassa: заказ={}, метод={}, банк={}",
                request.getOrderId(), request.getMethod(), request.getBankId());

        try {
            PaymentResponse payment = yooKassaPaymentService.createPayment(request);

            log.info("✅ Платеж создан успешно: ID={}, URL={}",
                    payment.getId(), payment.getConfirmationUrl());

            return ResponseEntity.ok(payment);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Некорректный запрос создания платежа: {}", e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (IllegalStateException e) {
            log.warn("⚠️ Некорректное состояние для создания платежа: {}", e.getMessage());
            return ResponseEntity.unprocessableEntity().build();

        } catch (Exception e) {
            log.error("❌ Ошибка создания платежа: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Получение информации о платеже
     */
    @GetMapping("/{paymentId}")
    @Operation(summary = "Получение платежа", description = "Возвращает информацию о платеже по ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentResponse> getPayment(
            @Parameter(description = "ID платежа", required = true) @PathVariable Long paymentId,
            Authentication authentication) {

        try {
            PaymentResponse payment = yooKassaPaymentService.getPayment(paymentId);
            return ResponseEntity.ok(payment);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Платеж не найден: {}", paymentId);
            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            log.error("❌ Ошибка получения платежа {}: {}", paymentId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Получение платежей для заказа
     */
    @GetMapping("/order/{orderId}")
    @Operation(summary = "Платежи заказа", description = "Возвращает все платежи для указанного заказа", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<PaymentResponse>> getPaymentsForOrder(
            @Parameter(description = "ID заказа", required = true) @PathVariable Long orderId,
            Authentication authentication) {

        try {
            List<PaymentResponse> payments = yooKassaPaymentService.getPaymentsForOrder(orderId);
            return ResponseEntity.ok(payments);

        } catch (Exception e) {
            log.error("❌ Ошибка получения платежей для заказа {}: {}", orderId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Проверка статуса платежа
     */
    @PostMapping("/{paymentId}/check-status")
    @Operation(summary = "Проверка статуса", description = "Проверяет актуальный статус платежа в ЮKassa", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentResponse> checkPaymentStatus(
            @Parameter(description = "ID платежа", required = true) @PathVariable Long paymentId,
            Authentication authentication) {

        try {
            PaymentResponse payment = yooKassaPaymentService.checkPaymentStatus(paymentId);
            return ResponseEntity.ok(payment);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Платеж не найден: {}", paymentId);
            return ResponseEntity.notFound().build();

        } catch (IllegalStateException e) {
            log.warn("⚠️ Некорректное состояние платежа {}: {}", paymentId, e.getMessage());
            return ResponseEntity.unprocessableEntity().build();

        } catch (Exception e) {
            log.error("❌ Ошибка проверки статуса платежа {}: {}", paymentId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Отмена платежа
     */
    @PostMapping("/{paymentId}/cancel")
    @Operation(summary = "Отмена платежа", description = "Отменяет платеж в ЮKassa (только для платежей в статусе PENDING или WAITING_FOR_CAPTURE)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentResponse> cancelPayment(
            @Parameter(description = "ID платежа", required = true) @PathVariable Long paymentId,
            Authentication authentication) {

        try {
            PaymentResponse payment = yooKassaPaymentService.cancelPayment(paymentId);

            log.info("🚫 Платеж {} отменен пользователем", paymentId);
            return ResponseEntity.ok(payment);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Платеж не найден: {}", paymentId);
            return ResponseEntity.notFound().build();

        } catch (IllegalStateException e) {
            log.warn("⚠️ Платеж {} нельзя отменить: {}", paymentId, e.getMessage());
            return ResponseEntity.unprocessableEntity().build();

        } catch (Exception e) {
            log.error("❌ Ошибка отмены платежа {}: {}", paymentId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Получение списка банков для СБП
     */
    @GetMapping("/sbp/banks")
    @Operation(summary = "Банки СБП", description = "Возвращает список банков, поддерживающих Систему Быстрых Платежей")
    public ResponseEntity<List<SbpBankInfo>> getSbpBanks() {
        try {
            List<SbpBankInfo> banks = yooKassaPaymentService.getSbpBanks();
            return ResponseEntity.ok(banks);

        } catch (Exception e) {
            log.error("❌ Ошибка получения списка банков СБП: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Webhook для уведомлений от ЮKassa
     */
    @PostMapping("/webhook")
    @Operation(summary = "Webhook ЮKassa", description = "Обрабатывает уведомления о статусе платежей от ЮKassa")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody JsonNode notification,
            @RequestHeader(value = "X-YooKassa-Event-Type", required = false) String eventType) {

        try {
            log.info("🔔 Получен webhook от ЮKassa: тип={}", eventType);

            boolean success = yooKassaPaymentService.processWebhookNotification(notification);

            if (success) {
                log.info("✅ Webhook ЮKassa обработан успешно");
                return ResponseEntity.ok(Map.of("status", "success"));
            } else {
                log.warn("⚠️ Webhook ЮKassa не обработан");
                return ResponseEntity.badRequest()
                        .body(Map.of("status", "error", "message", "Failed to process webhook"));
            }

        } catch (Exception e) {
            log.error("❌ Ошибка обработки webhook ЮKassa: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Получение платежа по ЮKassa ID (для внутренних нужд)
     */
    @GetMapping("/yookassa/{yookassaPaymentId}")
    @Operation(summary = "Платеж по ЮKassa ID", description = "Возвращает информацию о платеже по ID из ЮKassa", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentResponse> getPaymentByYooKassaId(
            @Parameter(description = "ID платежа в ЮKassa", required = true) @PathVariable String yookassaPaymentId,
            Authentication authentication) {

        try {
            PaymentResponse payment = yooKassaPaymentService.getPaymentByYooKassaId(yookassaPaymentId);
            return ResponseEntity.ok(payment);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Платеж ЮKassa не найден: {}", yookassaPaymentId);
            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            log.error("❌ Ошибка получения платежа ЮKassa {}: {}", yookassaPaymentId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Health check для ЮKassa интеграции
     */
    @GetMapping("/health")
    @Operation(summary = "Проверка здоровья", description = "Проверяет состояние интеграции с ЮKassa")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            Map<String, Object> health = Map.of(
                    "status", "ok",
                    "service", "yookassa",
                    "timestamp", System.currentTimeMillis(),
                    "message", "ЮKassa интеграция работает");

            return ResponseEntity.ok(health);

        } catch (Exception e) {
            log.error("❌ Ошибка health check ЮKassa: {}", e.getMessage());

            Map<String, Object> health = Map.of(
                    "status", "error",
                    "service", "yookassa",
                    "timestamp", System.currentTimeMillis(),
                    "message", e.getMessage());

            return ResponseEntity.internalServerError().body(health);
        }
    }
}