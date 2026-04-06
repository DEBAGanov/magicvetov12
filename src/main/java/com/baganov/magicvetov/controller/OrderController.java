package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.model.dto.order.CreateOrderRequest;
import com.baganov.magicvetov.model.dto.order.OrderDTO;
import com.baganov.magicvetov.model.dto.payment.PaymentUrlResponse;
import com.baganov.magicvetov.service.OrderService;
import com.baganov.magicvetov.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "API для работы с заказами")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Создание заказа", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderDTO> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication) {

        // === ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ АВТОРИЗАЦИИ ===
        log.info("🛒 === СОЗДАНИЕ ЗАКАЗА ===");
        log.info("🛒 Authentication object: {}", authentication);
        log.info("🛒 Authentication is null: {}", authentication == null);

        if (authentication != null) {
            log.info("🛒 Authentication.isAuthenticated(): {}", authentication.isAuthenticated());
            log.info("🛒 Authentication.getPrincipal(): {}", authentication.getPrincipal());
            log.info("🛒 Authentication.getPrincipal() class: {}",
                    authentication.getPrincipal() != null ? authentication.getPrincipal().getClass().getName() : "null");
            log.info("🛒 Authentication.getAuthorities(): {}", authentication.getAuthorities());
        }

        // Проверяем заголовки авторизации
        String authHeader = httpRequest.getHeader("Authorization");
        log.info("🛒 Authorization header: {}", authHeader != null ? (authHeader.substring(0, Math.min(20, authHeader.length())) + "...") : "null");

        Integer userId = getUserId(authentication);
        log.info("🛒 Result userId from getUserId(): {}", userId);

        String sessionId = null;
        if (userId == null) {
            log.warn("🛒 ⚠️ userId is NULL! Order will be created WITHOUT user binding!");
            log.warn("🛒 ⚠️ This means NO notifications will be sent to user about order status changes!");

            // Сначала проверяем заголовок X-Session-Id (для MAX mini app)
            sessionId = httpRequest.getHeader("X-Session-Id");
            log.info("🛒 SessionId from X-Session-Id header: {}", sessionId);

            // Если заголовка нет, проверяем cookie
            if (sessionId == null) {
                jakarta.servlet.http.Cookie[] cookies = httpRequest.getCookies();
                if (cookies != null) {
                    log.info("🛒 Cookies count: {}", cookies.length);
                    for (jakarta.servlet.http.Cookie cookie : cookies) {
                        log.debug("🛒 Cookie: {} = {}", cookie.getName(), cookie.getValue());
                        if ("CART_SESSION_ID".equals(cookie.getName())) {
                            sessionId = cookie.getValue();
                            break;
                        }
                    }
                } else {
                    log.info("🛒 No cookies in request");
                }
            }
            log.info("🛒 Final sessionId: {}", sessionId);
        } else {
            log.info("🛒 ✅ User is authenticated, userId: {}", userId);
        }

        OrderDTO order = orderService.createOrder(userId, sessionId, request);
        log.info("🛒 === ЗАКАЗ СОЗДАН #{} === (userId: {}, sessionId: {})", order.getId(), userId, sessionId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Получение заказа по ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderDTO> getOrderById(
            @Parameter(description = "ID заказа", required = true) @PathVariable Integer orderId,
            Authentication authentication) {

        Integer userId = getUserId(authentication);

        OrderDTO order = orderService.getOrderById(orderId, userId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderId}/payment-url")
    @Operation(summary = "Получение URL для оплаты заказа", description = "Создает и возвращает URL для перенаправления на страницу оплаты", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentUrlResponse> getPaymentUrl(
            @Parameter(description = "ID заказа", required = true) @PathVariable Integer orderId,
            Authentication authentication) {

        Integer userId = getUserId(authentication);

        PaymentUrlResponse paymentUrlResponse = orderService.createPaymentUrl(orderId, userId);
        return ResponseEntity.ok(paymentUrlResponse);
    }

    @GetMapping
    @Operation(summary = "Получение списка заказов пользователя", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<OrderDTO>> getUserOrders(
            @Parameter(description = "Номер страницы") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Integer userId = getUserId(authentication);

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderDTO> orders = orderService.getUserOrders(userId, pageRequest);

        return ResponseEntity.ok(orders);
    }

    private Integer getUserId(Authentication authentication) {
        log.debug("getUserId: authentication={}", authentication);
        if (authentication != null) {
            log.debug("getUserId: isAuthenticated={}, principal type={}, principal={}",
                    authentication.isAuthenticated(),
                    authentication.getPrincipal().getClass().getName(),
                    authentication.getPrincipal());
        }

        if (authentication != null && authentication.isAuthenticated()) {
            try {
                log.debug("Authentication principal type: {}", authentication.getPrincipal().getClass().getName());

                // Проверяем, является ли principal User объектом
                if (authentication.getPrincipal() instanceof com.baganov.magicvetov.entity.User) {
                    return ((com.baganov.magicvetov.entity.User) authentication.getPrincipal()).getId();
                }

                // Если это UserDetails, получаем username и ищем пользователя
                if (authentication
                        .getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                    String username = ((org.springframework.security.core.userdetails.UserDetails) authentication
                            .getPrincipal()).getUsername();
                    log.debug("Principal is UserDetails with username: {}", username);

                    // Получаем User по username
                    try {
                        com.baganov.magicvetov.entity.User user = userService.getUserByUsername(username);
                        log.debug("Found user by username: {}, id: {}", username, user.getId());
                        return user.getId();
                    } catch (Exception e) {
                        log.warn("Failed to find user by username: {}", username, e);
                        return null;
                    }
                }

                log.warn("Unknown principal type: {}", authentication.getPrincipal().getClass().getName());
                return null;
            } catch (Exception e) {
                log.warn("Failed to get user ID from authentication", e);
            }
        }
        log.debug("getUserId returning null: authentication={}, isAuthenticated={}",
                authentication != null, authentication != null ? authentication.isAuthenticated() : false);
        return null;
    }
}