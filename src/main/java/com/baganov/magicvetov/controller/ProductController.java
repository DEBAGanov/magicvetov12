package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.dto.ProductDto;
import com.baganov.magicvetov.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Продукты", description = "API для работы с продуктами")
public class ProductController {

    private final ProductService productService;

    // Создание товара убрано отсюда намеренно.
    //
    // Здесь висел POST /api/v1/products без @PreAuthorize и без валидации
    // файла, а путь лежал в AUTH_WHITELIST — то есть товар и загрузку в наш
    // S3-бакет мог сделать любой анонимный запрос. Это второй вход в ту же
    // дыру, что дефект S1.
    //
    // Создание товаров живёт в админском API: POST /api/v1/admin/products
    // (под ROLE_ADMIN), файлы — через POST /api/v1/admin/upload с проверкой
    // формата, сигнатуры и размера. Дублировать это здесь незачем.
    // См. docs/ADMIN_PANEL_PLAN.md §3.8.

    @GetMapping
    @Operation(summary = "Получить все продукты")
    public Page<ProductDto> getAllProducts(@PageableDefault Pageable pageable) {
        return productService.getAllProducts(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить продукт по ID")
    public ProductDto getProductById(@PathVariable Integer id) {
        return productService.getProductById(id);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Получить продукты по категории")
    public Page<ProductDto> getProductsByCategory(@PathVariable Integer categoryId,
            @PageableDefault Pageable pageable) {
        return productService.getProductsByCategory(categoryId, pageable);
    }

    @GetMapping("/special-offers")
    @Operation(summary = "Получить специальные предложения")
    public List<ProductDto> getSpecialOffers() {
        return productService.getSpecialOffers();
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск продуктов")
    public Page<ProductDto> searchProducts(@RequestParam String query,
            @RequestParam(required = false) Integer categoryId,
            @PageableDefault Pageable pageable) {
        return productService.searchProducts(query, categoryId, pageable);
    }
}