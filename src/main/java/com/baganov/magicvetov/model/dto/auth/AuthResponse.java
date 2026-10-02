package com.baganov.magicvetov.model.dto.auth;

import com.baganov.magicvetov.entity.Role;
import com.baganov.magicvetov.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Integer userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;

    /**
     * Роли пользователя в виде ROLE_ADMIN / ROLE_USER.
     *
     * Задача 2.15 из docs/ADMIN_PANEL_PLAN.md. Без этого поля фронт не может
     * отличить администратора от покупателя и закрыть раздел /admin до первого
     * запроса к API — пришлось бы либо показывать меню админки всем, либо
     * дёргать защищённую ручку и смотреть на 403.
     *
     * Это удобство интерфейса, а НЕ защита: доступ всё равно проверяет бэкенд
     * (SecurityConfig + @PreAuthorize). Подделанный на клиенте список ролей
     * нарисует меню, но ни одного запроса не выполнит.
     */
    private List<String> roles;

    /**
     * Собирает ответ из пользователя и токена.
     *
     * Вынесено сюда, потому что AuthResponse.builder() вызывается в семи местах
     * (обычный вход, регистрация, SMS, Telegram, MAX), и при добавлении поля
     * каждое из них легко забыть — ровно так роли и не появились бы в части
     * способов входа.
     */
    public static AuthResponse of(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(rolesOf(user))
                .build();
    }

    /** Имена ролей; пустой список, если роли не загружены. */
    public static List<String> rolesOf(User user) {
        Set<Role> roles = user.getRoles();
        if (roles == null) {
            return List.of();
        }
        return roles.stream()
                .map(Role::getName)
                .filter(java.util.Objects::nonNull)
                .sorted()
                .collect(Collectors.toList());
    }
}