/**
 * @file: ImageUploadService.java
 * @description: Проверка и подготовка загружаемых изображений товаров.
 *
 * Задачи 2.2 и 2.2a из docs/ADMIN_PANEL_PLAN.md. Порядок проверок важен:
 * сначала дешёвые (размер, расширение), потом чтение байтов.
 *
 * Отличия от проекта-образца, взятого за основу:
 *   - SVG не принимаем. В образце он был в белом списке И исключён из проверки
 *     сигнатуры (у текста нет магических байт). SVG может содержать <script>,
 *     а отдаётся он с нашего домена — это XSS в админке и на витрине.
 *   - Ресайз реализован (в образце помечен как незаконченный).
 *
 * О формате: сохраняем JPEG, а не WebP. Кодировщика WebP под все наши
 * платформы нет — подробности в build.gradle и docs/Diary.md. Витрине WebP/AVIF
 * раздаёт Next.js через /_next/image, поэтому в бакете достаточно нормального
 * по весу JPEG.
 *
 * @created: 2026-09-30
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.exception.InvalidImageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    /** Куда в бакете складываем картинки товаров. */
    public static final String PRODUCTS_PREFIX = "products";

    /** Куда складываем картинки категорий. */
    public static final String CATEGORIES_PREFIX = "categories";

    /**
     * Допустимые префиксы — закрытый список.
     *
     * Префикс приходит из запроса, и без проверки админ (или тот, кто получил
     * его токен) мог бы записать файл по любому пути в бакете и удалить объект
     * по любому ключу через DELETE /admin/upload.
     */
    private static final Set<String> ALLOWED_PREFIXES = Set.of(PRODUCTS_PREFIX, CATEGORIES_PREFIX);

    /** Проверяет, что ключ лежит в одной из наших папок. */
    public static boolean isAllowedKey(String objectName) {
        if (objectName == null) {
            return false;
        }
        return ALLOWED_PREFIXES.stream().anyMatch(prefix -> objectName.startsWith(prefix + "/"));
    }

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    /**
     * Длинная сторона после ресайза.
     *
     * 1600 px хватает для зума карточки на десктопе и с запасом — для сетки
     * каталога (там картинка около 320 px, Next отдаёт свои размеры через
     * /_next/image). Фото букета с телефона — 3000-4000 px, то есть в бакет
     * уезжало бы в 5-6 раз больше нужного.
     */
    private static final int MAX_DIMENSION = 1600;

    /** Качество JPEG. 0.85 — ниже на лепестках и градиентах видны артефакты. */
    private static final float JPEG_QUALITY = 0.85f;

    private static final String OUTPUT_EXTENSION = ".jpg";
    private static final String OUTPUT_CONTENT_TYPE = "image/jpeg";

    private final StorageService storageService;

    @Value("${app.upload.max-file-size-bytes:5242880}")
    private long maxFileSizeBytes;

    /**
     * Проверяет файл, сжимает и загружает в S3.
     *
     * @return относительный ключ объекта (products/uuid.jpg) — именно он
     *         хранится в БД. Публичный URL собирается на чтении, чтобы переезд
     *         бакета или CDN не требовал UPDATE по всем товарам.
     */
    public String uploadProductImage(MultipartFile file) {
        return uploadImage(file, PRODUCTS_PREFIX);
    }

    /**
     * То же для картинки категории — отличается только папкой в бакете.
     */
    public String uploadCategoryImage(MultipartFile file) {
        return uploadImage(file, CATEGORIES_PREFIX);
    }

    private String uploadImage(MultipartFile file, String prefix) {
        if (!ALLOWED_PREFIXES.contains(prefix)) {
            throw new InvalidImageException("Недопустимый раздел для загрузки");
        }

        validate(file);

        byte[] original = read(file);
        // Сигнатуру проверяем по байтам, а не по имени и не по Content-Type:
        // и то и другое присылает клиент. Переименованный .exe отсеивается здесь.
        String detected = detectFormat(original);
        if (detected == null) {
            throw new InvalidImageException("Содержимое файла не соответствует формату изображения");
        }

        byte[] prepared = resizeAndEncode(original, detected);
        String objectName = prefix + "/" + java.util.UUID.randomUUID() + OUTPUT_EXTENSION;

        storageService.uploadFile(
                new ByteArrayInputStream(prepared), objectName, OUTPUT_CONTENT_TYPE, prepared.length);

        log.info("Загружено изображение {} ({} КБ из {} КБ, исходный формат {})",
                objectName, prepared.length / 1024, original.length / 1024, detected);
        return objectName;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Файл не выбран");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new InvalidImageException(
                    "Файл больше " + (maxFileSizeBytes / 1024 / 1024) + " МБ");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidImageException(
                    "Недопустимый формат. Разрешены: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    private String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private byte[] read(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new InvalidImageException("Не удалось прочитать файл");
        }
    }

    /**
     * Определяет реальный формат по магическим байтам.
     *
     * @return "jpg" / "png" / "webp", либо null если не похоже ни на одно из них.
     */
    private String detectFormat(byte[] bytes) {
        if (bytes.length < 12) {
            return null;
        }
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A
                && (bytes[6] & 0xFF) == 0x1A && (bytes[7] & 0xFF) == 0x0A) {
            return "png";
        }
        // WebP: "RIFF" .... "WEBP" — размер лежит между этими метками
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "webp";
        }
        return null;
    }

    /**
     * Ресайз до MAX_DIMENSION по длинной стороне и перекодирование в JPEG.
     *
     * Мелкие картинки не растягиваем: апскейл добавит вес, не добавив деталей.
     * Поэтому при размере в пределах лимита меняем только формат и качество.
     *
     * Прозрачность из PNG кладём на белый фон: JPEG альфа-канала не имеет, а
     * без явной подложки прозрачные области становятся чёрными.
     */
    private byte[] resizeAndEncode(byte[] original, String detectedFormat) {
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(original));
            if (source == null) {
                // Сигнатура подошла, но декодировать не удалось: битый или
                // обрезанный файл.
                throw new InvalidImageException("Не удалось разобрать изображение");
            }

            BufferedImage flattened = flatten(source);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            var builder = Thumbnails.of(flattened)
                    .outputFormat("jpg")
                    .outputQuality(JPEG_QUALITY);

            if (source.getWidth() > MAX_DIMENSION || source.getHeight() > MAX_DIMENSION) {
                builder.size(MAX_DIMENSION, MAX_DIMENSION).keepAspectRatio(true);
            } else {
                // scale(1.0) — способ сказать «не менять размер»: у
                // thumbnailator размер обязателен, иначе он бросает
                // IllegalStateException.
                builder.scale(1.0);
            }

            builder.toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Ошибка обработки изображения (исходный формат {}): {}",
                    detectedFormat, e.getMessage(), e);
            throw new InvalidImageException("Не удалось обработать изображение");
        }
    }

    /** Убирает альфа-канал, подкладывая белый фон. */
    private BufferedImage flatten(BufferedImage image) {
        if (image.getType() == BufferedImage.TYPE_INT_RGB) {
            return image;
        }
        BufferedImage rgb = new BufferedImage(
                image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        var g = rgb.createGraphics();
        try {
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, image.getWidth(), image.getHeight());
            g.drawImage(image, 0, 0, null);
        } finally {
            g.dispose();
        }
        return rgb;
    }
}
