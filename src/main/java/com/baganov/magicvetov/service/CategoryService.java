package com.baganov.magicvetov.service;

import com.baganov.magicvetov.model.dto.product.CategoryDTO;
import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final StorageService storageService;

    @Cacheable(value = "categories", key = "'category:' + #id")
    public CategoryDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Категория не найдена с ID: " + id));
        return mapToDTO(category);
    }

    @Cacheable(value = "categories", key = "'categories:all'")
    public List<CategoryDTO> getAllActiveCategories() {
        return categoryRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                // resolvePublicUrl вместо ручной проверки префикса: он чинит и
                // абсолютные URL с неверным именем бакета (см. StorageService
                // и миграцию V32).
                .imageUrl(storageService.resolvePublicUrl(category.getImageUrl()))
                .displayOrder(category.getDisplayOrder())
                .build();
    }
}