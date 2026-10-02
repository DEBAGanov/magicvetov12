/**
 * @file: ProductImageDTO.java
 * @description: Одна картинка галереи товара в админском API.
 *
 * Пара «ключ + URL» нужна в обе стороны:
 *   key — что хранится в БД и по чему удаляется файл в бакете; его форма
 *         присылает обратно при сохранении;
 *   url — готовая ссылка для превью, собирается на чтении.
 *
 * Если бы отдавали только URL, сервер при сохранении не смог бы понять, какая
 * картинка осталась, а какая удалена: разбирать ключ обратно из URL — значит
 * размазать знание про адреса бакета по всему коду.
 *
 * @created: 2026-10-01
 */
package com.baganov.magicvetov.model.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageDTO {

    @NotBlank(message = "Ключ изображения обязателен")
    @Size(max = 500, message = "Ключ изображения не может превышать 500 символов")
    private String key;

    /** Только для чтения: на входе сервер его игнорирует и собирает сам. */
    private String url;
}
