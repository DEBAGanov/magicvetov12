package com.baganov.magicvetov.mapper;

import com.baganov.magicvetov.dto.ProductDto;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.entity.ProductImage;
import com.baganov.magicvetov.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final StorageService storageService;

    public Product toEntity(ProductDto dto) {
        return Product.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .discountedPrice(dto.getDiscountedPrice())
                .imageUrl(dto.getImageUrl())
                .weight(dto.getWeight())
                .isAvailable(dto.isAvailable())
                .isSpecialOffer(dto.isSpecialOffer())
                .discountPercent(dto.getDiscountPercent())
                .build();
    }

    public ProductDto toDto(Product entity) {
        String imageUrl = null;
        if (entity.getImageUrl() != null && !entity.getImageUrl().isEmpty()) {
            try {
                // Для изображений продуктов используем простые публичные URL
                if (entity.getImageUrl().startsWith("products/")) {
                    imageUrl = storageService.getPublicUrl(entity.getImageUrl());
                } else {
                    // Если URL уже полный, используем как есть
                    imageUrl = entity.getImageUrl();
                }
            } catch (Exception e) {
                log.error("Error generating public URL for product image", e);
                imageUrl = entity.getImageUrl();
            }
        }

        // Маппинг дополнительных изображений
        List<String> additionalImages = null;
        if (entity.getAdditionalImages() != null && !entity.getAdditionalImages().isEmpty()) {
            additionalImages = entity.getAdditionalImages().stream()
                    .map(img -> {
                        if (img.getImageUrl() != null && img.getImageUrl().startsWith("products/")) {
                            try {
                                return storageService.getPublicUrl(img.getImageUrl());
                            } catch (Exception e) {
                                log.error("Error generating URL for additional image", e);
                                return img.getImageUrl();
                            }
                        }
                        return img.getImageUrl();
                    })
                    .collect(Collectors.toList());
        }

        return ProductDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .discountedPrice(entity.getDiscountedPrice())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .imageUrl(imageUrl)
                .additionalImages(additionalImages)
                .weight(entity.getWeight())
                .isAvailable(entity.isAvailable())
                .isSpecialOffer(entity.isSpecialOffer())
                .discountPercent(entity.getDiscountPercent())
                .build();
    }
}