/**
 * @file: AdminCategoryDTO.java
 * @description: Категория в админском API.
 *
 * Отличия от витринной CategoryDTO:
 *   - isActive — админка показывает и отключённые категории, иначе скрытую
 *     нельзя найти, чтобы вернуть;
 *   - imageKey — ключ объекта рядом с готовым URL: по URL сервер не поймёт,
 *     какой файл удалить из бакета;
 *   - productCount — сколько товаров внутри; нужно, чтобы не дать удалить
 *     непустую категорию.
 *
 * @created: 2026-10-02
 */
package com.baganov.magicvetov.model.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCategoryDTO {

    private Integer id;
    private String name;
    private String description;

    /** Готовая публичная ссылка для превью. */
    private String imageUrl;

    /** Ключ объекта (categories/uuid.jpg) — его присылает форма. */
    private String imageKey;

    private Integer displayOrder;
    private Boolean isActive;

    /** Количество товаров в категории. */
    private long productCount;
}
