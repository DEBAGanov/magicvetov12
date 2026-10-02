package com.baganov.magicvetov.model.dto.product;

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
    private boolean isAvailable;
    private boolean isSpecialOffer;
    private boolean isPreorder;
    private Integer discountPercent;
}