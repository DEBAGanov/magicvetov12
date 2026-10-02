/**
 * @file: UpdateProductRequest.java
 * @description: DTO для обновления продукта
 * @dependencies: Jakarta Validation
 * @created: 2025-05-31
 */
package com.baganov.magicvetov.model.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "Название продукта не может быть пустым")
    @Size(max = 100, message = "Название продукта не может превышать 100 символов")
    private String name;

    @Size(max = 1000, message = "Описание не может превышать 1000 символов")
    private String description;

    @NotNull(message = "Цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть больше 0")
    @Digits(integer = 8, fraction = 2, message = "Неверный формат цены")
    private BigDecimal price;

    @DecimalMin(value = "0.01", message = "Цена со скидкой должна быть больше 0")
    @Digits(integer = 8, fraction = 2, message = "Неверный формат цены со скидкой")
    private BigDecimal discountedPrice;

    @NotNull(message = "ID категории обязателен")
    @Positive(message = "ID категории должен быть положительным")
    private Integer categoryId;

    /**
     * Ключ главной картинки (products/uuid.jpg), НЕ полный URL.
     *
     * Пустая строка означает «снять изображение»: раньше imageUrl применялся
     * только при != null, и очистить картинку через API было невозможно
     * (дефект 3.3 плана). Отличить «не передали поле» от «передали пустое»
     * иначе нельзя, поэтому договорённость такая:
     *   null — поле не меняем;
     *   ""   — очищаем, файл удаляется из бакета;
     *   ключ — ставим новую картинку.
     */
    @Size(max = 500, message = "Ключ изображения не может превышать 500 символов")
    private String imageKey;

    /**
     * Галерея целиком, в нужном порядке. Пришедший список — это состояние
     * «как должно быть»: чего в нём нет, то удаляется и из БД, и из бакета.
     * null означает «галерею не трогать».
     */
    @Valid
    private List<ProductImageDTO> additionalImages;

    @Positive(message = "Вес должен быть положительным")
    private Integer weight;

    private Boolean isAvailable;

    private Boolean isSpecialOffer;

    private Boolean isPreorder;

    @Min(value = 0, message = "Процент скидки не может быть отрицательным")
    @Max(value = 100, message = "Процент скидки не может превышать 100")
    private Integer discountPercent;
}