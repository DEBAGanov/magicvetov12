/**
 * @file: SecurityConfig.java
 * @description: Настройка безопасности приложения
 *
 * Закрытые дефекты (docs/ADMIN_PANEL_PLAN.md §1):
 *   S1 — /api/v1/admin/** был в публичном whitelist. Теперь только ROLE_ADMIN.
 *   S2 — /debug/** был публичен и отдавал количество пользователей и все роли.
 *        Путь убран, DebugController удалён.
 *   S3 — /api/v1/orders/** и /api/v1/cart/** были публичны целиком: любой мог
 *        читать чужие заказы по перебору id. Теперь требуют аутентификации,
 *        кроме создания заказа и гостевой корзины (см. PUBLIC_ENDPOINTS).
 *   S5 — method security работала только в prod: в dev @PreAuthorize молча
 *        не применялась, и админский API был открыт даже без whitelist.
 *        @EnableMethodSecurity перенесена на внешний класс — действует везде.
 *   S7 — frameOptions.disable() снимал защиту от кликджекинга. Теперь
 *        SAMEORIGIN.
 *   Плюс: убран режим app.security.disable-jwt-auth, отключавший
 *   аутентификацию целиком одной переменной окружения.
 *
 * @dependencies: Spring Security
 * @created: 2025-05-24
 */
package com.baganov.magicvetov.config;

import com.baganov.magicvetov.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // действует во всех профилях, включая dev (дефект S5)
@Profile("!test")
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.cors.allowed-origins:https://magiacvetov12.ru,https://www.magiacvetov12.ru,https://magicvetov12.ru,https://www.magicvetov12.ru,https://api.magicvetov.ru,https://api.magiacvetov12.ru,http://localhost:5173,http://localhost:3000,http://localhost:8080,https://api.dimbopizza.ru,https://dimbopizza.ru,https://max.ru,https://m.max.ru,https://web.max.ru,https://app.max.ru}")
    private String[] corsAllowedOrigins;

    @Value("${app.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String[] corsAllowedMethods;

    @Value("${app.cors.allowed-headers:Authorization,Content-Type,X-Requested-With,Accept,Origin,X-Auth-Token,Cache-Control,X-Client-Type,X-Client-Version,X-Session-Id}")
    private String[] corsAllowedHeaders;

    @Value("${app.cors.exposed-headers:Authorization,Content-Type,X-Total-Count,X-Pagination-Page,X-Pagination-Size}")
    private String[] corsExposedHeaders;

    @Value("${app.cors.allow-credentials:true}")
    private boolean corsAllowCredentials;

    @Value("${app.cors.max-age:3600}")
    private long corsMaxAge;

    public SecurityConfig(@Lazy JwtAuthenticationFilter jwtAuthFilter,
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Массив URL-адресов, на которые можно делать запросы без аутентификации
     */
    private static final String[] AUTH_WHITELIST = {
            // Root path
            "/",
            // Auth endpoints (включая новые SMS и Telegram)
            "/api/v1/auth/**",
            "/api/v1/auth/sms/**",
            "/api/v1/auth/telegram/**",
            // Telegram webhook endpoints
            "/api/v1/telegram/**",
            // Telegram WebApp endpoints
            "/api/v1/telegram-webapp/**",
            // MAX WebApp endpoints
            "/api/v1/max-webapp/**",
            // MAX Admin Bot webhook endpoints
            "/max-admin/**",
            // Public API
            "/api/v1/public/**",
            // Actuator
            "/actuator/**",
            // Health check (новые эндпоинты)
            "/health",
            "/api/health",
            "/api/status",
            "/api/v1/health",
            "/api/v1/health/**",
            "/api/v1/ready",
            "/api/v1/live",
            // ЮKassa Health endpoints (для мониторинга)
            "/api/v1/payments/yookassa/health",
            "/api/v1/payments/metrics/health",
            "/api/v1/payments/*/health",
            // ЮKassa webhook endpoints (критически важно для обработки платежей)
            "/api/v1/payments/yookassa/webhook",
            "/api/v1/payments/yookassa/webhook/**",
            // ЮKassa payment creation (для mini apps)
            "/api/v1/payments/yookassa/create",
            // ЮKassa СБП API endpoints (для мобильного приложения)
            "/api/v1/payments/yookassa/sbp/banks",
            "/api/v1/payments/yookassa/sbp/**",
            // Categories (только GET)
            "/api/v1/categories",
            "/api/v1/categories/*",
            // Products (только GET)
            "/api/v1/products",
            "/api/v1/products/*",
            "/api/v1/products/category/*",
            "/api/v1/products/special-offers",
            "/api/v1/products/search",
            // Delivery API (новые эндпоинты для мобильного приложения)
            "/api/delivery/**",
            "/api/v1/delivery/**",
            "/api/delivery/health",
            "/api/delivery/health/**",
            "/api/delivery/ready",
            "/api/delivery/live",
            "/api/v1/delivery/address-suggestions",
            "/api/v1/delivery/validate-address",
            "/api/v1/delivery/estimate",
            "/api/v1/delivery/locations",
            "/api/v1/delivery/locations/*",
            // Address API (автоподсказки адресов)
            "/api/v1/address/**",
            // Delivery Locations (только GET для Android приложения)
            "/api/v1/delivery-locations",
            "/api/v1/delivery-locations/*",
            // Telegram WebApp endpoints
            "/api/v1/telegram-webapp/**",
            // MAX WebApp endpoints
            "/api/v1/max-webapp/**",
            // Mini App static resources (Telegram)
            "/miniapp/**",
            "/miniapp",
            // MAX Mini App static resources
            "/max-miniapp/**",
            "/max-miniapp",
            // Корзина гостя: привязана к cookie CART_SESSION_ID, а не к учётной
            // записи, поэтому работает без токена — иначе нельзя собрать заказ
            // до регистрации.
            "/api/v1/cart",
            "/api/v1/cart/**",
            // YAML Feed для интеграции с внешними сервисами
            "/feed",
            "/feed/**"
    };

    /**
     * Публичные эндпоинты, где важен метод: открыт только он.
     *
     * Оформление заказа и получение ссылки на оплату нужны гостю без
     * регистрации — на этом держится покупка «в один экран». А вот ЧТЕНИЕ
     * заказов (GET /api/v1/orders и /api/v1/orders/{id}) публичным быть не
     * должно: OrderService.findOrder при userId == null возвращает любой заказ
     * по id, то есть перебором открывались имя, телефон и адрес любого
     * покупателя (дефект S3).
     *
     * Оговорка: гость после оплаты не сможет открыть свой заказ по ссылке —
     * для этого нужен одноразовый токен заказа. Отдельная задача, см.
     * docs/ADMIN_PANEL_PLAN.md §7.
     */
    private static final String[] PUBLIC_POST_ENDPOINTS = {
            "/api/v1/orders"
    };

    /** Ссылка на оплату: гость запрашивает её сразу после создания заказа. */
    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/api/v1/orders/*/payment-url"
    };

    /**
     * Swagger: нужен разработчику, но в прод отдавать описание всего API незачем.
     * Поэтому здесь путь открыт, а в application-prod.properties сам springdoc
     * выключен (springdoc.api-docs.enabled=false) — открытый матчер без
     * springdoc просто вернёт 404.
     */
    private static final String[] SWAGGER_ENDPOINTS = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs",
            "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.debug("Configuring security with public URLs: {}", Arrays.toString(AUTH_WHITELIST));

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        // Было disable(): страницу можно было встроить в чужой
                        // iframe и подловить клик администратора (дефект S7).
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(AUTH_WHITELIST).permitAll()
                        .requestMatchers(SWAGGER_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                        // Preflight браузера: до него дело не доходит без CORS,
                        // но без явного разрешения падают запросы с заголовками.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Админка — строго под ролью (дефект S1). Раньше этот
                        // путь лежал в AUTH_WHITELIST, то есть был открыт всем.
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Конкретные домены для production
        configuration.setAllowedOrigins(Arrays.asList(corsAllowedOrigins));

        configuration.setAllowedMethods(Arrays.asList(corsAllowedMethods));
        configuration.setAllowedHeaders(Arrays.asList(corsAllowedHeaders));
        configuration.setExposedHeaders(Arrays.asList(corsExposedHeaders));
        configuration.setAllowCredentials(corsAllowCredentials);
        configuration.setMaxAge(corsMaxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

}

// Классы ProductionSecurityConfig и DevelopmentSecurityConfig удалены:
// первый включал method security только в prod, второй существовал лишь чтобы
// её НЕ включать в dev. Из-за этого все @PreAuthorize("hasRole('ADMIN')") в dev
// молча не работали (дефект S5). Теперь @EnableMethodSecurity стоит на
// SecurityConfig и действует во всех профилях.