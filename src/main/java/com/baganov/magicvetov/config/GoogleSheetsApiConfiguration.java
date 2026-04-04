/**
 * @file: GoogleSheetsApiConfiguration.java
 * @description: Bean конфигурация для Google Sheets API
 * @dependencies: Google Auth, Google Sheets API
 * @created: 2025-01-28
 */
package com.baganov.magicvetov.config;


import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "google.sheets.enabled", havingValue = "true")
public class GoogleSheetsApiConfiguration {

    private final GoogleSheetsConfiguration config;
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

    @Bean
    public Sheets sheetsClient() throws IOException, GeneralSecurityException {
        log.info("🔧 Инициализация Google Sheets API сервиса");
        
        try {
            // HTTP Transport
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            
            // Credentials из локального файла
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new FileInputStream(config.getCredentialsPath()))
                    .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS));
            
            // Создание Sheets сервиса
            Sheets service = new Sheets.Builder(
                    httpTransport, 
                    JSON_FACTORY, 
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName(config.getApplicationName())
                    .build();
                    
            log.info("✅ Google Sheets API сервис успешно инициализирован");
            return service;
            
        } catch (Exception e) {
            log.error("❌ Ошибка инициализации Google Sheets API: {}", e.getMessage(), e);
            throw e;
        }
    }
}