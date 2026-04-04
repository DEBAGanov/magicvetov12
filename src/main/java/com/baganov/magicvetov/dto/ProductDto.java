package com.baganov.magicvetov.dto;

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
    private boolean isAvailable;
    private boolean isSpecialOffer;
    private Integer discountPercent;
}