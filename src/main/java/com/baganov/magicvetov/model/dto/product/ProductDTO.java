package com.baganov.magicvetov.model.dto.product;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ProductDTO {

    private Integer id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountedPrice;
    private Integer categoryId;
    private String categoryName;

    /** Главная картинка: готовый публичный URL для показа в форме. */
    private String imageUrl;

    /**
     * Ключ главной картинки (products/uuid.jpg).
     *
     * Отдаём вместе с URL, потому что форма присылает обратно именно ключ:
     * по URL сервер не смог бы сопоставить картинку со строкой в бакете.
     */
    private String imageKey;

    /** Галерея в порядке display_order, без главной картинки. */
    private List<ProductImageDTO> additionalImages;

    private Integer weight;

    /**
     * Имена булевых полей закреплены явно.
     *
     * Для `private boolean isAvailable` Lombok генерирует isAvailable(), а
     * Jackson срезает приставку is- и отдаёт свойство как "available".
     * Фронт при этом читал бы undefined, а для булева поля это равно false —
     * то есть все товары молча выглядели бы снятыми с продажи, а флажки в
     * форме — снятыми. Ошибка тихая: ни компилятор, ни типы TypeScript
     * (они в другом проекте) её не поймают.
     *
     * Имена зафиксированы тестом AdminDtoSerializationTest.
     */
    @JsonProperty("isAvailable")
    private boolean isAvailable;

    @JsonProperty("isSpecialOffer")
    private boolean isSpecialOffer;

    @JsonProperty("isPreorder")
    private boolean isPreorder;

    private Integer discountPercent;
}