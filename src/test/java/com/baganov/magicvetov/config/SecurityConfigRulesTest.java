/**
 * @file: SecurityConfigRulesTest.java
 * @description: Проверка правил доступа из SecurityConfig.
 *
 * Зачем отдельный тест, а не curl руками: правила легко сломать обратно одной
 * строкой в AUTH_WHITELIST, и сломанными они выглядят нормально — приложение
 * стартует, витрина работает, а админский API открыт всем. Поэтому дефекты
 * S1/S3 зафиксированы тестом.
 *
 * Поднимается только веб-слой с настоящим SecurityConfig; сервисы заменены
 * заглушками — правила доступа от их поведения не зависят. Профиль намеренно
 * НЕ "test": SecurityConfig помечен @Profile("!test"), под тестовым профилем
 * он бы не загрузился и проверять было бы нечего.
 */
package com.baganov.magicvetov.config;

import com.baganov.magicvetov.security.JwtAuthenticationFilter;
import com.baganov.magicvetov.service.AdminStatsService;
import com.baganov.magicvetov.service.ImageUploadService;
import com.baganov.magicvetov.service.StorageService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = com.baganov.magicvetov.controller.AdminController.class)
@Import({SecurityConfig.class, SecurityConfigRulesTest.PassThroughJwtFilter.class})
@ActiveProfiles("securityrules")
class SecurityConfigRulesTest {

    /**
     * Настоящий фильтр вместо @MockBean.
     *
     * Мок здесь не годится: JwtAuthenticationFilter наследует
     * OncePerRequestFilter, и у мока getAlreadyFilteredAttributeName()
     * возвращает null — запрос падает с «Attribute name must not be null»
     * ещё до проверки правил. Этот фильтр просто пропускает запрос дальше:
     * аутентификацию в тесте задаёт @WithMockUser.
     */
    @TestConfiguration
    static class PassThroughJwtFilter {
        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter() {
            return new JwtAuthenticationFilter(null, null) {
                @Override
                protected void doFilterInternal(HttpServletRequest request,
                        HttpServletResponse response, FilterChain chain)
                        throws ServletException, IOException {
                    chain.doFilter(request, response);
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private StorageService storageService;

    @MockBean
    private ImageUploadService imageUploadService;

    @MockBean
    private AdminStatsService adminStatsService;

    // ---------- Дефект S1: админский API был публичным ----------

    // Анонимный запрос получает 403, а не 401: AuthenticationEntryPoint не
    // настроен, Spring отвечает отказом в доступе. Для проверки правил это
    // равнозначно — важно, что запрос не выполняется.

    @Test
    @DisplayName("S1: админская статистика без токена — отказ")
    void adminStatsIsClosedForAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("S1: загрузка файла без токена — отказ (иначе любой пишет в наш бакет)")
    void uploadIsClosedForAnonymous() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/upload")
                        .file("file", "fake".getBytes()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("S1: обычный покупатель в админку не проходит")
    @WithMockUser(username = "buyer", roles = {"USER"})
    void adminIsClosedForPlainUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Администратор проходит")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void adminIsOpenForAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isOk());
    }

    // ---------- Дефект S3: чужие заказы читались перебором ----------

    @Test
    @DisplayName("S3: чтение заказа по id без токена — отказ")
    void orderReadIsClosedForAnonymous() throws Exception {
        // OrderService.findOrder при userId == null отдавал любой заказ,
        // то есть перебор id открывал имя, телефон и адрес покупателей.
        mockMvc.perform(get("/api/v1/orders/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("S3: список заказов без токена — отказ")
    void orderListIsClosedForAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isForbidden());
    }

    // ---------- Дефект S2: /debug отдавал данные о пользователях ----------

    @Test
    @DisplayName("S2: /debug/status больше не существует")
    void debugEndpointIsGone() throws Exception {
        // Контроллер удалён: он публично отдавал количество пользователей
        // и весь список ролей. Ожидаем отказ, а не 200.
        mockMvc.perform(get("/debug/status"))
                .andExpect(status().is4xxClientError());
    }

    // ---------- Витрина должна остаться открытой ----------

    @Test
    @DisplayName("Каталог остаётся публичным: закрытие админки не ломает витрину")
    void catalogStaysPublic() throws Exception {
        assertNotBlocked("/api/v1/products");
    }

    @Test
    @DisplayName("Корзина гостя остаётся публичной")
    void guestCartStaysPublic() throws Exception {
        assertNotBlocked("/api/v1/cart");
    }

    /**
     * Проверяет, что фильтр безопасности пропустил запрос дальше.
     *
     * Конкретный код здесь проверять нельзя: в этом слайсе поднят только
     * AdminController, поэтому обработчика для публичных путей нет и ответ
     * приходит не от них (@WebMvcTest заворачивает NoResourceFoundException
     * в 500, а не в 404). Значение имеет ровно одно: ответ НЕ 401 и НЕ 403 —
     * то есть правило доступа запрос не отклонило.
     */
    private void assertNotBlocked(String path) throws Exception {
        int status = mockMvc.perform(get(path))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("%s должен остаться публичным, но запрос отклонён правилом доступа", path)
                .isNotIn(HttpStatus.UNAUTHORIZED.value(), HttpStatus.FORBIDDEN.value());
    }
}
