package com.baganov.magicvetov.model.dto.max;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Запрос для авторизации через MAX ID (контакт)
 *
 * Используется как fallback когда WebApp авторизация через initData не работает
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaxContactAuthRequest {

    @NotNull(message = "MAX User ID обязателен")
    private Long maxUserId;

    private String username;

    private String firstName;

    private String lastName;

    private String phoneNumber;
}
