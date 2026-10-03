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
        // resolvePublicUrl вместо проверки startsWith("products/") вручную.
        //
        // Прежняя логика отдавала любой абсолютный URL «как есть», и на проде
        // 2026-10-03 это означало отдачу ссылок с НЕВЕРНЫМ бакетом
        // (magiacvetov12 вместо f9c8e17a-magicvetov-products): файлы в бакете
        // есть, а по ссылке 404 — товары на витрине были без картинок.
        // resolvePublicUrl распознаёт нашу папку внутри URL и пересобирает
        // адрес из конфига, поэтому имя бакета живёт в одном месте.
        String imageUrl = storageService.resolvePublicUrl(entity.getImageUrl());

        // Маппинг дополнительных изображений
        List<String> additionalImages = null;
        if (entity.getAdditionalImages() != null && !entity.getAdditionalImages().isEmpty()) {
            additionalImages = entity.getAdditionalImages().stream()
                    .map(img -> storageService.resolvePublicUrl(img.getImageUrl()))
                    .filter(java.util.Objects::nonNull)
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
                .isPreorder(entity.isPreorder())
                .discountPercent(entity.getDiscountPercent())
                .build();
    }
}