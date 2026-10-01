package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.exception.InvalidImageException;
import com.baganov.magicvetov.model.dto.AdminStatsResponse;
import com.baganov.magicvetov.service.AdminStatsService;
import com.baganov.magicvetov.service.ImageUploadService;
import com.baganov.magicvetov.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Административный API")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final StorageService storageService;
    private final ImageUploadService imageUploadService;
    private final AdminStatsService adminStatsService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получение статистики для админ панели", description = "Возвращает общую статистику: заказы, выручка, популярные товары, статусы заказов")
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        log.info("Запрос статистики админ панели");
        AdminStatsResponse stats = adminStatsService.getAdminStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Загрузка изображения товара.
     *
     * Возвращает и ключ, и постоянный публичный URL:
     *   objectName — то, что фронт отправит обратно в PUT /products/{id};
     *                именно ключ хранится в БД;
     *   url        — для превью в форме прямо сейчас.
     *
     * Раньше здесь отдавался getPresignedUrl(objectName, 3600) — ссылка на час.
     * Если фронт записывал её в imageUrl, картинка отваливалась через час
     * (дефект 3.2 плана).
     *
     * Параметр type убран: единственный принимаемый тип — изображение товара.
     * Он позволял админу задать произвольный префикс в бакете, то есть писать
     * куда угодно, а проверки на допустимые значения не было.
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Загрузка изображения товара", description = "Проверяет формат и сигнатуру, сжимает до 1600 px и конвертирует в WebP. Возвращает ключ объекта и постоянный публичный URL.")
    public ResponseEntity<Map<String, String>> uploadImage(
            @Parameter(description = "Файл изображения (jpg, png, webp), до 5 МБ", required = true) @RequestParam("file") MultipartFile file) {

        log.info("Загрузка изображения товара, исходное имя: {}", file.getOriginalFilename());
        String objectName = imageUploadService.uploadProductImage(file);

        Map<String, String> response = new HashMap<>();
        response.put("objectName", objectName);
        response.put("url", storageService.getPublicUrl(objectName));

        return ResponseEntity.ok(response);
    }

    /**
     * Удаление только что загруженного файла, ещё не привязанного к товару.
     *
     * Нужен ровно для одного случая: админ загрузил картинку, передумал и убрал
     * её до сохранения карточки. Иначе файл остался бы в бакете навсегда.
     *
     * Картинки УЖЕ сохранённого товара этой ручкой удалять не нужно — за них
     * отвечает PUT/DELETE /admin/products/{id}: сервер сам знает все ключи
     * товара из product_images и чистит бакет после коммита. Если бы удаление
     * шло по кресту в форме, админ, закрывший форму без сохранения, потерял бы
     * файл при живой ссылке в БД (§4 плана).
     *
     * Префикс ключа проверяем: без проверки сюда можно передать любой путь и
     * удалить произвольный объект бакета.
     */
    @DeleteMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удаление незакреплённого файла", description = "Только для отмены загрузки до сохранения товара")
    public ResponseEntity<Void> deleteUploadedImage(
            @Parameter(description = "Ключ объекта, полученный при загрузке", required = true) @RequestParam("objectName") String objectName) {

        if (objectName == null || !objectName.startsWith(ImageUploadService.PRODUCTS_PREFIX + "/")) {
            throw new InvalidImageException("Недопустимый ключ объекта");
        }

        log.info("Удаление незакреплённого изображения {}", objectName);
        storageService.deleteFile(objectName);
        return ResponseEntity.noContent().build();
    }
}
