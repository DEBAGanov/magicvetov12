/**
 * @file: AdminCategoryController.java
 * @description: Административный API для управления категориями.
 *
 * Задача 2.14 из docs/ADMIN_PANEL_PLAN.md.
 *
 * @created: 2026-10-02
 */
package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.model.dto.category.AdminCategoryDTO;
import com.baganov.magicvetov.model.dto.category.SaveCategoryRequest;
import com.baganov.magicvetov.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Categories", description = "API для администрирования категорий")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    @Operation(summary = "Список категорий (админ)", description = "Включает отключённые категории и число товаров в каждой", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<AdminCategoryDTO>> getCategories() {
        return ResponseEntity.ok(adminCategoryService.getCategories());
    }

    @GetMapping("/{categoryId}")
    @Operation(summary = "Категория по ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AdminCategoryDTO> getCategory(
            @Parameter(description = "ID категории", required = true) @PathVariable Integer categoryId) {
        return ResponseEntity.ok(adminCategoryService.getCategoryById(categoryId));
    }

    @PostMapping
    @Operation(summary = "Создание категории", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AdminCategoryDTO> createCategory(
            @Valid @RequestBody SaveCategoryRequest request) {
        log.info("Создание категории: {}", request.getName());
        AdminCategoryDTO created = adminCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{categoryId}")
    @Operation(summary = "Обновление категории", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AdminCategoryDTO> updateCategory(
            @Parameter(description = "ID категории", required = true) @PathVariable Integer categoryId,
            @Valid @RequestBody SaveCategoryRequest request) {
        log.info("Обновление категории с ID: {}", categoryId);
        return ResponseEntity.ok(adminCategoryService.updateCategory(categoryId, request));
    }

    /**
     * Перестановка двух категорий в порядке показа.
     *
     * Отдельно от PUT: тот принимает полное состояние категории и
     * перезаписывает описание, поэтому «только переставить» через него нельзя
     * без пересылки всех полей.
     */
    @PostMapping("/{categoryId}/swap-order/{otherId}")
    @Operation(summary = "Поменять категории местами", description = "Меняет только displayOrder двух категорий", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> swapOrder(
            @Parameter(description = "ID первой категории", required = true) @PathVariable Integer categoryId,
            @Parameter(description = "ID второй категории", required = true) @PathVariable Integer otherId) {
        log.info("Перестановка категорий {} и {}", categoryId, otherId);
        adminCategoryService.swapDisplayOrder(categoryId, otherId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Удаление категории.
     *
     * Непустая категория не удаляется — вернётся 409 с объяснением. Так
     * сделано потому, что у Category.products стоит cascade = ALL и
     * orphanRemoval = true: удаление унесло бы все товары категории вместе со
     * ссылками на их файлы в бакете.
     */
    @DeleteMapping("/{categoryId}")
    @Operation(summary = "Удаление категории", description = "Только пустую: если в категории есть товары, вернётся 409", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteCategory(
            @Parameter(description = "ID категории", required = true) @PathVariable Integer categoryId) {
        log.info("Удаление категории с ID: {}", categoryId);
        adminCategoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
