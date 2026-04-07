package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Сервис для генерации XML/YML фидов товаров
 *
 * Поддерживает формат Yandex Market YML для интеграции с внешними сервисами
 * Документация: https://yandex.ru/support/marketplace/assortment/guide.html
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.base-url:https://api.magiacvetov12.ru}")
    private String baseUrl;

    @Value("${app.shop-name:Магия Цветов}")
    private String shopName;

    @Value("${app.shop-company:Магия Цветов}")
    private String shopCompany;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    /**
     * Генерация YML фида в формате Yandex Market
     *
     * @return XML содержимое фида
     */
    public String generateYandexMarketFeed() {
        log.info("🔄 Генерация YML фида...");

        // Получаем все активные категории
        List<Category> categories = categoryRepository.findAll().stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .collect(Collectors.toList());

        // Получаем все доступные товары
        List<Product> products = productRepository.findAll().stream()
                .filter(Product::isAvailable)
                .collect(Collectors.toList());

        log.info("📊 Найдено {} категорий и {} товаров для фида", categories.size(), products.size());

        StringBuilder yml = new StringBuilder();

        // XML заголовок
        yml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");

        // Дата генерации в формате ISO 8601 с часовым поясом
        String currentDate = OffsetDateTime.now().format(DATE_FORMATTER);
        yml.append("<yml_catalog date=\"").append(currentDate).append("\">\n");

        // Информация о магазине
        yml.append("<shop>\n");
        yml.append("<name>").append(escapeXml(shopName)).append("</name>\n");
        yml.append("<url>").append(escapeXml(baseUrl)).append("</url>\n");
        yml.append("<company>").append(escapeXml(shopCompany)).append("</company>\n");

        // Категории
        yml.append("<categories>\n");
        for (Category category : categories) {
            yml.append("<category id=\"").append(category.getId()).append("\"");
            yml.append(">").append(escapeXml(category.getName())).append("</category>\n");
        }
        yml.append("</categories>\n");

        // Валюты
        yml.append("<currencies>\n");
        yml.append("<currency id=\"RUR\" rate=\"1\"/>\n");
        yml.append("</currencies>\n");

        // Товары (offers)
        yml.append("<offers>\n");
        for (Product product : products) {
            yml.append(buildOfferYml(product));
        }
        yml.append("</offers>\n");

        yml.append("</shop>\n");
        yml.append("</yml_catalog>\n");

        log.info("✅ YML фид успешно сгенерирован: {} символов", yml.length());
        return yml.toString();
    }

    /**
     * Генерация YML для отдельного товара
     */
    private String buildOfferYml(Product product) {
        StringBuilder offer = new StringBuilder();

        // Определяем цену (со скидкой или обычную)
        BigDecimal price = product.getDiscountedPrice() != null
                ? product.getDiscountedPrice()
                : product.getPrice();

        // Старая цена (если есть скидка)
        BigDecimal oldPrice = product.getDiscountedPrice() != null ? product.getPrice() : null;

        offer.append("<offer id=\"").append(product.getId()).append("\">\n");

        // Название
        offer.append("<name>").append(escapeXml(product.getName())).append("</name>\n");

        // URL товара
        String productUrl = baseUrl + "/product/" + product.getId();
        offer.append("<url>").append(escapeXml(productUrl)).append("</url>\n");

        // Цена
        offer.append("<price>").append(price.intValue()).append("</price>\n");

        // Старая цена (если есть скидка)
        if (oldPrice != null) {
            offer.append("<oldprice>").append(oldPrice.intValue()).append("</oldprice>\n");
        }

        // Валюта
        offer.append("<currencyId>RUR</currencyId>\n");

        // Категория
        if (product.getCategory() != null) {
            offer.append("<categoryId>").append(product.getCategory().getId()).append("</categoryId>\n");
        }

        // Изображение
        if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
            String imageUrl = product.getImageUrl();
            // Если URL относительный, добавляем базовый URL
            if (!imageUrl.startsWith("http")) {
                imageUrl = baseUrl + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
            }
            offer.append("<picture>").append(escapeXml(imageUrl)).append("</picture>\n");
        }

        // Краткое описание
        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            String shortDesc = truncate(product.getDescription(), 150);
            offer.append("<shortDescription>").append(escapeXml(shortDesc)).append("</shortDescription>\n");
        }

        // Полное описание
        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            offer.append("<description>").append(escapeXml(product.getDescription())).append("</description>\n");
        }

        // Вес (если указан) - в граммах для YML
        if (product.getWeight() != null) {
            offer.append("<weight>").append(product.getWeight()).append("</weight>\n");
        }

        // Скидка как vendor (используем поле для хранения процента скидки)
        if (product.getDiscountPercent() != null && product.getDiscountPercent() > 0) {
            offer.append("<vendor>Скидка ").append(product.getDiscountPercent()).append("%</vendor>\n");
        }

        offer.append("</offer>\n");

        return offer.toString();
    }

    /**
     * Экранирование спецсимволов XML
     */
    private String escapeXml(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    /**
     * Обрезка текста до указанной длины
     */
    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}
