/**
 * @file: GoogleCredentialsDownloadService.java
 * @description: Сервис для загрузки Google Sheets credentials из S3 хранилища
 * @dependencies: S3Client, Google Sheets Configuration
 * @created: 2025-01-28
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.config.GoogleSheetsConfiguration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "google.sheets.enabled", havingValue = "true")
public class GoogleCredentialsDownloadService {

    private final S3Client s3Client;
    private final GoogleSheetsConfiguration googleSheetsConfig;
    private final Environment environment;

    // S3 настройки для dev и prod
    @Value("${s3.bucket:#{null}}")
    private String devBucket;

    @Value("${timeweb.s3.bucket:#{null}}")
    private String prodBucket;

    // Путь к файлу credentials в S3
    @Value("${google.sheets.s3-credentials-key:config/google-credentials.json}")
    private String s3CredentialsKey;

    // Включение/отключение загрузки из S3
    @Value("${google.sheets.download-from-s3:true}")
    private boolean downloadFromS3;

    /**
     * Автоматическая загрузка credentials при старте приложения
     */
    @PostConstruct
    public void downloadCredentialsOnStartup() {
        if (!downloadFromS3) {
            log.info("🔧 Загрузка Google Sheets credentials из S3 отключена");
            return;
        }

        try {
            log.info("📥 Начинаем загрузку Google Sheets credentials из S3...");
            
            String bucket = getBucket();
            String localPath = googleSheetsConfig.getCredentialsPath();
            
            log.info("📊 Настройки загрузки:");
            log.info("   S3 Bucket: {}", bucket);
            log.info("   S3 Key: {}", s3CredentialsKey);
            log.info("   Local Path: {}", localPath);
            
            downloadCredentialsFromS3(bucket, s3CredentialsKey, localPath);
            
            log.info("✅ Google Sheets credentials успешно загружены из S3");
            
        } catch (Exception e) {
            log.error("❌ Ошибка загрузки Google Sheets credentials из S3: {}", e.getMessage(), e);
            
            // Проверяем, существует ли файл локально
            Path localFile = Paths.get(googleSheetsConfig.getCredentialsPath());
            if (Files.exists(localFile)) {
                log.warn("⚠️ Используем существующий локальный файл credentials");
            } else {
                log.warn("⚠️ Локальный файл credentials не найден. Google Sheets интеграция будет отключена.");
                // Не выбрасываем исключение - позволяем приложению запуститься без Google Sheets
            }
        }
    }

    /**
     * Ручная загрузка credentials из S3
     */
    public boolean downloadCredentials() {
        try {
            String bucket = getBucket();
            String localPath = googleSheetsConfig.getCredentialsPath();
            
            downloadCredentialsFromS3(bucket, s3CredentialsKey, localPath);
            
            log.info("✅ Google Sheets credentials успешно загружены из S3 (ручная загрузка)");
            return true;
            
        } catch (Exception e) {
            log.error("❌ Ошибка ручной загрузки Google Sheets credentials из S3: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Загрузка файла из S3
     */
    private void downloadCredentialsFromS3(String bucket, String s3Key, String localPath) throws IOException {
        // Создаем директорию если не существует
        Path localFile = Paths.get(localPath);
        Path parentDir = localFile.getParent();
        if (parentDir != null && !Files.exists(parentDir)) {
            Files.createDirectories(parentDir);
            log.info("📁 Создана директория: {}", parentDir);
        }

        // Скачиваем файл из S3
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();

        try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(request)) {
            
            // Сохраняем во временный файл, затем перемещаем
            Path tempFile = Paths.get(localPath + ".tmp");
            Files.copy(s3Object, tempFile, StandardCopyOption.REPLACE_EXISTING);
            Files.move(tempFile, localFile, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("📥 Файл загружен из S3: {} → {}", s3Key, localPath);
            
            // Проверяем размер файла
            long fileSize = Files.size(localFile);
            log.info("📊 Размер файла: {} байт", fileSize);
            
            if (fileSize == 0) {
                throw new IOException("Загруженный файл credentials пуст");
            }
            
        } catch (NoSuchKeyException e) {
            throw new IOException("Файл " + s3Key + " не найден в S3 bucket " + bucket, e);
        }
    }

    /**
     * Проверка существования credentials файла
     */
    public boolean credentialsExist() {
        Path credentialsFile = Paths.get(googleSheetsConfig.getCredentialsPath());
        boolean exists = Files.exists(credentialsFile);
        
        if (exists) {
            try {
                long size = Files.size(credentialsFile);
                log.debug("📊 Google Sheets credentials файл существует: {} байт", size);
                return size > 0;
            } catch (IOException e) {
                log.warn("⚠️ Ошибка проверки размера credentials файла: {}", e.getMessage());
                return false;
            }
        } else {
            log.debug("📊 Google Sheets credentials файл не найден: {}", credentialsFile);
            return false;
        }
    }

    /**
     * Получение имени bucket в зависимости от профиля
     */
    private String getBucket() {
        boolean isProd = isProdProfile();
        String bucket = isProd ? prodBucket : devBucket;
        
        if (bucket == null) {
            throw new IllegalStateException("S3 bucket не настроен для профиля " + (isProd ? "prod" : "dev"));
        }
        
        log.debug("🪣 Используем S3 bucket: {} (профиль: {})", bucket, isProd ? "prod" : "dev");
        return bucket;
    }

    /**
     * Проверка, является ли текущий профиль production
     */
    private boolean isProdProfile() {
        for (String profile : environment.getActiveProfiles()) {
            if (profile.equals("prod")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Получение информации о настройках
     */
    public String getDownloadInfo() {
        return String.format(
            "Google Sheets Credentials Download Info:\n" +
            "  Enabled: %s\n" +
            "  S3 Bucket: %s\n" +
            "  S3 Key: %s\n" +
            "  Local Path: %s\n" +
            "  File Exists: %s\n" +
            "  Profile: %s",
            downloadFromS3,
            getBucket(),
            s3CredentialsKey,
            googleSheetsConfig.getCredentialsPath(),
            credentialsExist(),
            isProdProfile() ? "prod" : "dev"
        );
    }
}