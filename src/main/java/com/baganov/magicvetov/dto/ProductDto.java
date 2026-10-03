package com.baganov.magicvetov.dto;

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
public class ProductDto {
    private Integer id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountedPrice;
    private Integer categoryId;
    private String categoryName;
    private String imageUrl;
    private List<String> additionalImages;
    private Integer weight;
    /**
     * Имена булевых полей закреплены явно.
     *
     * Для `private boolean isAvailable` Lombok генерирует isAvailable(), а
     * Jackson срезает приставку is- и отдавал эти поля как "available",
     * "specialOffer", "preorder". Фронт же читает их как isAvailable и
     * остальные (frontend/src/lib/types/index.ts), то есть получал undefined.
     *
     * Последствия были видны на витрине: метки «Хит» и «Под заказ» в
     * ProductCard не показывались никогда, а в JSON-LD карточки товара
     * уходило inStock: undefined — то есть разметка о наличии была пустой.
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