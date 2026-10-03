/**
 * @file: SaveCategoryRequest.java
 * @description: Тело запроса на создание и правку категории.
 *
 * Один DTO на создание и обновление: набор полей у категории совпадает, а две
 * почти одинаковые формы расходятся при первой же правке.
 *
 * @created: 2026-10-02
 */
package com.baganov.magicvetov.model.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveCategoryRequest {

    @NotBlank(message = "Название категории не может быть пустым")
    @Size(max = 100, message = "Название не может превышать 100 символов")
    private String name;

    @Size(max = 1000, message = "Описание не может превышать 1000 символов")
    private String description;

    /**
     * Ключ картинки (categories/uuid.jpg), НЕ полный URL.
     *
     * Как и у товара: null — не менять, "" — снять картинку (файл удалится из
     * бакета), ключ — поставить новую.
     */
    @Size(max = 500, message = "Ключ изображения не может превышать 500 символов")
    private String imageKey;

    /** Порядок в каталоге. Если не задан, новая категория встаёт в конец. */
    @PositiveOrZero(message = "Порядок не может быть отрицательным")
    private Integer displayOrder;

    /** Отключённая категория не показывается на витрине, но остаётся в админке. */
    private Boolean isActive;
}
