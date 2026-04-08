package com.baganov.magicvetov.controller;

import com.baganov.magicvetov.service.FeedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API контроллер для генерации YAML фида товаров
 *
 * Используется для интеграции с внешними сервисами (Яндекс.Маркет, Яндекс.Бизнес и др.)
 */
@Slf4j
@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
@Tag(name = "Feed", description = "API для генерации фидов товаров")
public class FeedController {

    private final FeedService feedService;

    /**
     * Получение YML фида товаров в формате Yandex Business
     *
     * URL: /feed/yandex_business.yml
     *
     * @return XML содержимое фида
     */
    @GetMapping(value = "/yandex_business.yml", produces = "application/xml;charset=UTF-8")
    @Operation(
            summary = "Получение YML фида товаров (Yandex Business)",
            description = "Возвращает список всех доступных товаров в формате YML (Yandex Market/Yandex Business)"
    )
    public ResponseEntity<String> getYandexBusinessFeed() {
        log.info("📥 Запрос YML фида товаров (yandex_business.yml)");

        try {
            String ymlContent = feedService.generateYandexMarketFeed();
            log.info("✅ YML фид успешно сгенерирован");
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/xml;charset=UTF-8"))
                    .body(ymlContent);
        } catch (Exception e) {
            log.error("❌ Ошибка генерации YML фида: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Корневой путь /feed/ - редирект на yandex_business.yml
     */
    @GetMapping(value = {"/", ""}, produces = "application/xml;charset=UTF-8")
    @Operation(
            summary = "Получение YML фида (корневой путь)",
            description = "Возвращает список всех доступных товаров в формате YML"
    )
    public ResponseEntity<String> getRootFeed() {
        return getYandexBusinessFeed();
    }

    /**
     * Получение XML фида товаров для Авито
     *
     * URL: /feed/avito.xml
     *
     * @return XML содержимое фида
     */
    @GetMapping(value = "/avito.xml", produces = "application/xml;charset=UTF-8")
    @Operation(
            summary = "Получение XML фида для Авито",
            description = "Возвращает список всех доступных товаров в формате XML для Авито"
    )
    public ResponseEntity<String> getAvitoFeed() {
        log.info("📥 Запрос Avito фида товаров (avito.xml)");

        try {
            String xmlContent = feedService.generateAvitoFeed();
            log.info("✅ Avito фид успешно сгенерирован");
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/xml;charset=UTF-8"))
                    .body(xmlContent);
        } catch (Exception e) {
            log.error("❌ Ошибка генерации Avito фида: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
