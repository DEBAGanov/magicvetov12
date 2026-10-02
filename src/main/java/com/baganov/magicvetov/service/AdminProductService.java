/**
 * @file: AdminProductService.java
 * @description: Сервис для административного управления продуктами
 * @dependencies: Spring Data JPA, Spring Transactions
 * @created: 2025-05-31
 *
 * Задачи 2.5-2.10 из docs/ADMIN_PANEL_PLAN.md.
 *
 * Главное правило этого класса: файлы в S3 удаляются ТОЛЬКО после успешного
 * коммита транзакции. Откатить removeObject нельзя, поэтому порядок
 * «сначала БД, потом бакет» — единственный безопасный: при откате транзакции
 * в бакете останется лишний файл (его подчистит ревизия сирот), а при обратном
 * порядке в БД осталась бы ссылка на уже удалённый файл, и карточка показывала
 * бы битую картинку.
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.entity.ProductImage;
import com.baganov.magicvetov.model.dto.product.CreateProductRequest;
import com.baganov.magicvetov.model.dto.product.ProductDTO;
import com.baganov.magicvetov.model.dto.product.ProductImageDTO;
import com.baganov.magicvetov.model.dto.product.UpdateProductRequest;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StorageService storageService;

    /**
     * Список товаров для админки.
     *
     * Отличие от витрины: показываем И недоступные товары (isAvailable=false).
     * Иначе админ не может найти снятый с продажи товар, чтобы вернуть его.
     */
    public Page<ProductDTO> getProducts(Integer categoryId, String query, Pageable pageable) {
        boolean hasQuery = query != null && !query.isBlank();

        Page<Product> page;
        if (categoryId != null && hasQuery) {
            page = productRepository.findByCategoryIdAndNameContainingIgnoreCase(
                    categoryId, query.trim(), pageable);
        } else if (categoryId != null) {
            page = productRepository.findByCategoryId(categoryId, pageable);
        } else if (hasQuery) {
            page = productRepository.findByNameContainingIgnoreCase(query.trim(), pageable);
        } else {
            page = productRepository.findAll(pageable);
        }

        return page.map(this::mapToDTO);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO createProduct(CreateProductRequest request) {
        log.info("Создание продукта: {}", request.getName());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Категория не найдена с ID: " + request.getCategoryId()));

        if (productRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Продукт с таким именем уже существует");
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountedPrice(request.getDiscountedPrice())
                .category(category)
                .imageUrl(blankToNull(request.getImageKey()))
                .weight(request.getWeight())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .isSpecialOffer(request.getIsSpecialOffer() != null ? request.getIsSpecialOffer() : false)
                .isPreorder(request.getIsPreorder() != null ? request.getIsPreorder() : false)
                .discountPercent(request.getDiscountPercent())
                .build();

        replaceGallery(product, request.getAdditionalImages());

        Product savedProduct = productRepository.save(product);
        log.info("Продукт создан с ID: {}", savedProduct.getId());

        return mapToDTO(savedProduct);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO updateProduct(Integer productId, UpdateProductRequest request) {
        log.info("Обновление продукта с ID: {}", productId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Продукт не найден с ID: " + productId));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Категория не найдена с ID: " + request.getCategoryId()));

        if (!product.getName().equals(request.getName()) && productRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Продукт с таким именем уже существует");
        }

        // Набор ключей ДО правки — с ним сравним итоговый, чтобы понять, какие
        // файлы больше не нужны.
        Set<String> keysBefore = collectKeys(product);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountedPrice(request.getDiscountedPrice());
        product.setCategory(category);

        // null — поле не передали, не трогаем. Пустая строка — снять картинку
        // (дефект 3.3: раньше очистить изображение через API было нельзя).
        if (request.getImageKey() != null) {
            product.setImageUrl(blankToNull(request.getImageKey()));
        }

        if (request.getAdditionalImages() != null) {
            replaceGallery(product, request.getAdditionalImages());
        }

        if (request.getWeight() != null) {
            product.setWeight(request.getWeight());
        }

        if (request.getIsAvailable() != null) {
            product.setAvailable(request.getIsAvailable());
        }

        if (request.getIsSpecialOffer() != null) {
            product.setSpecialOffer(request.getIsSpecialOffer());
        }

        if (request.getIsPreorder() != null) {
            product.setPreorder(request.getIsPreorder());
        }

        if (request.getDiscountPercent() != null) {
            product.setDiscountPercent(request.getDiscountPercent());
        }

        Product savedProduct = productRepository.save(product);

        // Что было, но не осталось — удаляем из бакета после коммита.
        Set<String> removed = new LinkedHashSet<>(keysBefore);
        removed.removeAll(collectKeys(savedProduct));
        deleteFilesAfterCommit(removed);

        log.info("Продукт обновлен с ID: {}", savedProduct.getId());
        return mapToDTO(savedProduct);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Integer productId) {
        log.info("Удаление продукта с ID: {}", productId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Продукт не найден с ID: " + productId));

        // Ключи нужно собрать ДО удаления: после delete() коллекция галереи
        // уже недоступна, и файлы остались бы в бакете навсегда (дефект 3.4).
        Set<String> keys = collectKeys(product);

        productRepository.delete(product);
        deleteFilesAfterCommit(keys);

        log.info("Продукт удален с ID: {}", productId);
    }

    public ProductDTO getProductById(Integer productId) {
        log.info("Получение продукта с ID: {}", productId);

        Product product = productRepository.findByIdWithCategory(productId)
                .orElseThrow(() -> new IllegalArgumentException("Продукт не найден с ID: " + productId));

        return mapToDTO(product);
    }

    // ---------- Галерея ----------

    /**
     * Приводит галерею к переданному состоянию, сохраняя порядок.
     *
     * Коллекция у Product помечена orphanRemoval=true, поэтому clear() + добавление
     * корректно удалит исчезнувшие строки. Пересоздаём список целиком, а не
     * вычисляем разницу: порядок всё равно задаётся заново, а строк на товар
     * единицы.
     *
     * Дубликаты убираем: один файл дважды в галерее сломал бы сравнение наборов
     * при следующем сохранении (ключ есть и там и там, а строк две).
     */
    private void replaceGallery(Product product, List<ProductImageDTO> images) {
        product.getAdditionalImages().clear();

        if (images == null || images.isEmpty()) {
            return;
        }

        Set<String> seen = new LinkedHashSet<>();
        int order = 1;
        for (ProductImageDTO image : images) {
            String key = blankToNull(image.getKey());
            if (key == null || !seen.add(key)) {
                continue;
            }
            product.getAdditionalImages().add(ProductImage.builder()
                    .product(product)
                    .imageUrl(key)
                    .displayOrder(order++)
                    .build());
        }
    }

    /** Все ключи товара: главная картинка плюс галерея. */
    private Set<String> collectKeys(Product product) {
        Set<String> keys = new LinkedHashSet<>();
        if (product.getImageUrl() != null) {
            keys.add(product.getImageUrl());
        }
        if (product.getAdditionalImages() != null) {
            product.getAdditionalImages().stream()
                    .map(ProductImage::getImageUrl)
                    .filter(java.util.Objects::nonNull)
                    .forEach(keys::add);
        }
        return keys;
    }

    /**
     * Удаляет файлы из S3 после успешного коммита.
     *
     * Внешние ссылки (http...) пропускаем: это не наши объекты, удалять их мы
     * не можем и не должны. Ошибку на одном файле не пробрасываем: транзакция
     * уже зафиксирована, и падение здесь оставило бы клиента с ошибкой при
     * фактически сохранённой правке. Недоудалённое подчистит ревизия сирот.
     */
    private void deleteFilesAfterCommit(Collection<String> keys) {
        List<String> ownKeys = keys.stream()
                .filter(k -> k != null && !k.startsWith("http://") && !k.startsWith("https://"))
                .collect(Collectors.toList());

        if (ownKeys.isEmpty()) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // Вне транзакции (например, в тесте) удаляем сразу.
            ownKeys.forEach(this::deleteQuietly);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                ownKeys.forEach(AdminProductService.this::deleteQuietly);
            }
        });
    }

    private void deleteQuietly(String key) {
        try {
            storageService.deleteFile(key);
            log.info("Файл удалён из бакета: {}", key);
        } catch (Exception e) {
            log.error("Не удалось удалить файл {} из бакета: {}. "
                    + "Строка в БД уже обновлена; файл подчистит ревизия сирот.",
                    key, e.getMessage());
        }
    }

    // ---------- Маппинг ----------

    /**
     * Маппинг Entity в DTO.
     *
     * Публичный URL собираем через resolvePublicUrl: безусловный
     * getPublicUrl приклеивал префикс и к абсолютным URL из сеяных данных,
     * выдавая https://s3.../bucket/https://s3.../... (дефект 3.1).
     */
    private ProductDTO mapToDTO(Product product) {
        List<ProductImageDTO> gallery = new ArrayList<>();
        if (product.getAdditionalImages() != null) {
            gallery = product.getAdditionalImages().stream()
                    .map(img -> ProductImageDTO.builder()
                            .key(img.getImageUrl())
                            .url(storageService.resolvePublicUrl(img.getImageUrl()))
                            .build())
                    .collect(Collectors.toList());
        }

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountedPrice(product.getDiscountedPrice())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .imageUrl(storageService.resolvePublicUrl(product.getImageUrl()))
                .imageKey(product.getImageUrl())
                .additionalImages(gallery)
                .weight(product.getWeight())
                .isAvailable(product.isAvailable())
                .isSpecialOffer(product.isSpecialOffer())
                .isPreorder(product.isPreorder())
                .discountPercent(product.getDiscountPercent())
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
