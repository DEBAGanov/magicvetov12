package com.baganov.magicvetov.config;

import com.baganov.magicvetov.entity.OrderStatus;
import com.baganov.magicvetov.entity.Role;
import com.baganov.magicvetov.entity.User;
import com.baganov.magicvetov.repository.OrderStatusRepository;
import com.baganov.magicvetov.repository.RoleRepository;
import com.baganov.magicvetov.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

/**
 * Инициализация обязательных данных при старте: роли, статусы заказов и
 * учётная запись администратора.
 *
 * Закрытый дефект S4 (docs/ADMIN_PANEL_PLAN.md §1): здесь жёстко создавались
 * admin/admin123 и user/password — на всех окружениях, включая прод. Теперь:
 *   - тестовый пользователь user не создаётся вовсе;
 *   - пароль администратора берётся из ADMIN_PASSWORD;
 *   - если переменная не задана, генерируется криптостойкий пароль и ОДИН раз
 *     печатается в лог. В коде пароля нет.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🚀 DataInitializer запущен! Начинаю инициализацию данных...");
        try {
            initializeRoles();
            initializeOrderStatuses();
            initializeAdmin();
            log.info("✅ DataInitializer завершен успешно!");
        } catch (Exception e) {
            log.error("❌ Ошибка в DataInitializer: {}", e.getMessage(), e);
        }
    }

    /**
     * Роли создаёт миграция V1; здесь — страховка.
     *
     * Проверяем каждую роль отдельно, а не count() == 0: при непустой таблице
     * без ROLE_ADMIN прежняя версия молча ничего не делала, и вход в админку
     * становился невозможен.
     */
    private void initializeRoles() {
        createRoleIfMissing(ROLE_USER);
        createRoleIfMissing(ROLE_ADMIN);
    }

    private void createRoleIfMissing(String name) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role();
            role.setName(name);
            roleRepository.save(role);
            log.info("Создана роль {}", name);
        }
    }

    private void initializeOrderStatuses() {
        log.info("Инициализация статусов заказов");

        // Создаем все необходимые статусы заказов
        createOrderStatus("CREATED", "Заказ создан");
        createOrderStatus("CONFIRMED", "Заказ подтвержден");
        createOrderStatus("PREPARING", "Заказ готовится");
        createOrderStatus("READY", "Заказ готов");
        createOrderStatus("DELIVERING", "Заказ доставляется");
        createOrderStatus("DELIVERED", "Заказ доставлен");
        createOrderStatus("CANCELLED", "Заказ отменен");

        log.info("Статусы заказов успешно созданы");
    }

    private void createOrderStatus(String name, String description) {
        if (orderStatusRepository.findByName(name).isEmpty()) {
            OrderStatus status = new OrderStatus();
            status.setName(name);
            status.setDescription(description);
            status.setActive(true);
            orderStatusRepository.save(status);
            log.info("Создан статус заказа: {} - {}", name, description);
        }
    }

    /**
     * Создаёт администратора, если его ещё нет.
     *
     * Существующему пользователю пароль НЕ меняем: иначе каждый перезапуск
     * затирал бы пароль, заданный вручную.
     */
    private void initializeAdmin() {
        if (userRepository.findByUsername(adminUsername).isPresent()) {
            return;
        }

        Role adminRole = roleRepository.findByName(ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Роль " + ROLE_ADMIN + " не найдена"));

        boolean generated = adminPassword == null || adminPassword.isBlank();
        String rawPassword = generated ? generatePassword() : adminPassword;

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail != null && !adminEmail.isBlank() ? adminEmail : null);
        admin.setPassword(passwordEncoder.encode(rawPassword));
        admin.setFirstName("Администратор");
        admin.setActive(true);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());

        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        admin.setRoles(roles);

        userRepository.save(admin);

        if (generated) {
            // Единственное место, где пароль виден в открытом виде: в базе
            // лежит только хеш, восстановить пароль оттуда нельзя.
            log.warn("""

                    ============================================================
                     Создан администратор «{}».
                     ADMIN_PASSWORD не задан — сгенерирован временный пароль:

                         {}

                     Смените его при первом входе и задайте ADMIN_PASSWORD.
                     Пароль показан один раз и в логе больше не появится.
                    ============================================================""",
                    adminUsername, rawPassword);
        } else {
            log.info("Создан администратор «{}» с паролем из ADMIN_PASSWORD", adminUsername);
        }
    }

    /** 24 байта энтропии из SecureRandom → 32 символа base64url. */
    private String generatePassword() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}