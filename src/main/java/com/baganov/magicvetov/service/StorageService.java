package com.baganov.magicvetov.service;

import com.baganov.magicvetov.config.MinioClientConfig.UrlTransformer;
import com.baganov.magicvetov.exception.StorageException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.io.ByteArrayInputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;
    private final UrlTransformer urlTransformer;
    private final Environment environment;

    @Value("${s3.bucket:#{null}}")
    private String devBucket;

    @Value("${timeweb.s3.bucket:#{null}}")
    private String prodBucket;

    @Value("${s3.public-url:#{null}}")
    private String devPublicUrl;

    @Value("${timeweb.s3.public-url:#{null}}")
    private String prodPublicUrl;

    private String getBucket() {
        String bucket = isProd() ? prodBucket : devBucket;
        log.debug("Using bucket: {} (isProd: {})", bucket, isProd());
        return bucket;
    }

    public String getPublicUrl() {
        return isProd() ? prodPublicUrl : devPublicUrl;
    }

    /** @deprecated дублирует getPublicUrl(String); оставлено для совместимости. */
    @Deprecated
    public String getFullPublicUrl(String objectName) {
        return getPublicUrl(objectName);
    }

    private boolean isProd() {
        for (String profile : environment.getActiveProfiles()) {
            if (profile.equals("prod")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Загрузка файла в хранилище S3
     */
    @Retryable(value = { Exception.class }, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public String uploadFile(MultipartFile file, String prefix) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String objectName = prefix + "/" + UUID.randomUUID() + extension;

            log.info("Uploading file to S3. Bucket: {}, Object: {}, Size: {} bytes",
                    getBucket(), objectName, file.getSize());

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(getBucket())
                            .object(objectName)
                            .contentType(file.getContentType())
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .build());

            log.info("File uploaded successfully: {}", objectName);
            return objectName;
        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Cause: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("Error uploading file", e);
        }
    }

    /**
     * Загрузка файла из InputStream в хранилище S3
     */
    @Retryable(value = { Exception.class }, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void uploadFile(InputStream inputStream, String objectName, String contentType, long size) {
        try {
            log.info("Uploading file to S3. Bucket: {}, Object: {}, Size: {} bytes, Content-Type: {}",
                    getBucket(), objectName, size, contentType);

            // Создаем новый InputStream для каждой попытки
            byte[] data = inputStream.readAllBytes();

            PutObjectArgs args = PutObjectArgs.builder()
                    .bucket(getBucket())
                    .object(objectName)
                    .contentType(contentType)
                    .stream(new ByteArrayInputStream(data), size, -1)
                    .build();

            minioClient.putObject(args);
            log.info("File uploaded successfully: {}/{}", getBucket(), objectName);

            // Проверяем, что файл действительно загружен
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(getBucket())
                            .object(objectName)
                            .build());
            log.info("File status check successful. Size: {}, LastModified: {}",
                    stat.size(), stat.lastModified());

        } catch (Exception e) {
            log.error("Error uploading file to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    /**
     * Получение временной ссылки на файл
     */
    public String getPresignedUrl(String objectName, int expiryTime) {
        try {
            // Для изображений продуктов и категорий используем публичные URL
            if (objectName.startsWith("products/") || objectName.startsWith("categories/")) {
                return getPublicUrl(objectName);
            }

            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(getBucket())
                            .object(objectName)
                            .method(Method.GET)
                            .expiry(expiryTime, TimeUnit.SECONDS)
                            .build());

            // Применяем трансформацию URL, если нужно
            String transformedUrl = urlTransformer.transform(presignedUrl);
            log.debug("Generated presigned URL: {} -> {}", presignedUrl, transformedUrl);
            return transformedUrl;
        } catch (Exception e) {
            log.error("Error generating presigned URL for {}: {}", objectName, e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Cause: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("Error generating presigned URL", e);
        }
    }

    /**
     * Получение публичного URL для файла.
     *
     * Имя бакета берётся ТОЛЬКО из bucket, даже если public-url его уже
     * содержит. Иначе два источника расходятся — и это ровно то, что сломало
     * картинки на проде 2026-10-03: TIMEWEB_S3_BUCKET в панели был
     * правильный (f9c8e17a-magicvetov-products, видно в логе старта), а
     * TIMEWEB_S3_PUBLIC_URL указывал на несуществующий бакет
     * magiacvetov12 — и все ссылки отдавали 404 при живых файлах.
     *
     * Теперь из public-url берётся только адрес хранилища: если имя бакета
     * в нём есть, оно отрезается и подставляется актуальное.
     */
    public String getPublicUrl(String objectName) {
        String url = storageBaseUrl() + "/" + getBucket() + "/" + objectName;
        log.debug("Generated public URL (isProd: {}): {}", isProd(), url);
        return url;
    }

    /**
     * Адрес хранилища без имени бакета.
     *
     * Исторически в prod в public-url писали адрес ВМЕСТЕ с бакетом
     * (https://s3.twcstorage.ru/f9c8e17a-magicvetov-products), а в dev — без.
     * Поддерживаем оба вида: если последний сегмент совпадает с именем бакета
     * или просто выглядит как имя бакета (не часть схемы), отрезаем его.
     */
    private String storageBaseUrl() {
        String baseUrl = getPublicUrl();
        if (baseUrl == null) {
            return "";
        }
        baseUrl = baseUrl.replaceAll("/+$", "");

        String bucket = getBucket();
        if (bucket != null && baseUrl.endsWith("/" + bucket)) {
            return baseUrl.substring(0, baseUrl.length() - bucket.length() - 1);
        }

        // Имя бакета в адресе не совпало с настроенным. Это и есть
        // расхождение конфигурации: отрезаем «лишний» последний сегмент, если
        // он не часть схемы (https://host), иначе ссылка указала бы в чужой
        // бакет. Предупреждаем, чтобы причина была видна в логе сразу.
        int lastSlash = baseUrl.lastIndexOf('/');
        if (lastSlash > "https://".length()) {
            String suspect = baseUrl.substring(lastSlash + 1);
            log.warn("public-url содержит бакет «{}», а настроенный бакет — «{}». "
                    + "Использую настроенный; проверьте TIMEWEB_S3_PUBLIC_URL и TIMEWEB_S3_BUCKET",
                    suspect, bucket);
            return baseUrl.substring(0, lastSlash);
        }

        return baseUrl;
    }

    /**
     * Публичный URL для значения, пришедшего из БД.
     *
     * Единственное место, которое решает, нужно ли приклеивать префикс. После
     * миграции V31 в базе лежат только относительные ключи, но проверка
     * оставлена намеренно: внешние ссылки (поставщик, CDN) и строки, которые
     * миграция не распознала, должны отдаваться как есть, а не превращаться в
     * https://s3.../bucket/https://... (дефект 3.1 плана).
     *
     * @return готовый URL, либо null если ссылки нет
     */
    public String resolvePublicUrl(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return null;
        }

        String key = toRelativeKey(storedValue);
        if (key == null) {
            // Не наш объект (внешний поставщик, CDN) — отдаём как есть.
            return storedValue;
        }

        try {
            return getPublicUrl(key);
        } catch (Exception e) {
            // Не роняем выдачу каталога из-за одной ссылки: лучше показать
            // сырое значение, чем отдать 500 на всю страницу.
            log.error("Не удалось собрать публичный URL для {}: {}", storedValue, e.getMessage());
            return storedValue;
        }
    }

    /**
     * Вытаскивает относительный ключ из значения, пришедшего из БД.
     *
     * Зачем не просто «начинается с http — отдать как есть». На проде
     * 2026-10-03 в базе обнаружились абсолютные URL с НЕВЕРНЫМ именем бакета:
     *   https://s3.twcstorage.ru/magiacvetov12/products/<папка>/<файл>.webp
     * при бакете f9c8e17a-magicvetov-products. Файлы в бакете есть, а по
     * ссылке из БД — 404, и витрина показывала товары без картинок.
     *
     * Поэтому абсолютный URL, внутри которого видна НАША папка (products/ или
     * categories/), считаем своим и пересобираем адрес из конфига. Так имя
     * бакета живёт в одном месте, и расхождение данных с конфигом перестаёт
     * ломать выдачу. Миграция V32 чистит сами данные, но код больше не
     * зависит от того, выполнилась ли она.
     *
     * @return относительный ключ, либо null если это не наш объект
     */
    private String toRelativeKey(String storedValue) {
        boolean absolute = storedValue.startsWith("http://") || storedValue.startsWith("https://");
        if (!absolute) {
            return storedValue;
        }

        // Слэши по обе стороны обязательны: имя бакета
        // f9c8e17a-magicvetov-products само кончается на "products", и поиск
        // без слэшей срезал бы URL по середине имени бакета.
        for (String folder : new String[] { "/products/", "/categories/" }) {
            int at = storedValue.indexOf(folder);
            if (at >= 0) {
                return storedValue.substring(at + 1);
            }
        }
        return null;
    }

    /**
     * Удаление файла
     */
    @Retryable(value = { Exception.class }, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void deleteFile(String objectName) {
        try {
            log.info("Deleting file from S3. Bucket: {}, Object: {}", getBucket(), objectName);

            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(getBucket())
                            .object(objectName)
                            .build());

            log.info("File deleted successfully: {}", objectName);
        } catch (Exception e) {
            log.error("Error deleting file {}: {}", objectName, e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Cause: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("Error deleting file", e);
        }
    }

    /**
     * Восстановление после исчерпания попыток — для методов, возвращающих String
     * (uploadFile).
     *
     * Раньше здесь был один метод с типом void, и он подходил под ВСЕ
     * @Retryable-методы класса: после трёх неудачных попыток ошибка гасилась, а
     * вызывающий код считал операцию успешной. Для загрузки это означало
     * «файл загружен», хотя в бакете его не было, и битая ссылка уезжала в БД.
     * Теперь ошибка пробрасывается (дефект 2.13 плана).
     */
    @Recover
    public String recoverUpload(Exception e, MultipartFile file, String prefix) {
        log.error("Загрузка файла в S3 не удалась после всех попыток: {}", e.getMessage(), e);
        throw new StorageException("Не удалось загрузить файл в хранилище", e);
    }

    /** Восстановление для загрузки потоком. */
    @Recover
    public void recoverUploadStream(Exception e, InputStream inputStream, String objectName,
            String contentType, long size) {
        log.error("Загрузка потока в S3 не удалась после всех попыток ({}): {}",
                objectName, e.getMessage(), e);
        throw new StorageException("Не удалось загрузить файл в хранилище", e);
    }

    /**
     * Восстановление для удаления.
     *
     * Здесь ошибку тоже пробрасываем, но вызывающий код должен помнить: при
     * удалении набора файлов исключение на одном не должно прерывать остальные
     * и уж точно не должно откатывать запись в БД — файл в бакете можно
     * дочистить ревизией сирот, а потерянную строку восстановить нечем.
     */
    @Recover
    public void recoverDelete(Exception e, String objectName) {
        log.error("Удаление файла из S3 не удалось после всех попыток ({}): {}",
                objectName, e.getMessage(), e);
        throw new StorageException("Не удалось удалить файл из хранилища: " + objectName, e);
    }
}