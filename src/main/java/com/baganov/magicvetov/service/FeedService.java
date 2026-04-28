package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.entity.ProductImage;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Сервис для генерации XML/YML фидов товаров
 *
 * Поддерживает форматы:
 * - Yandex Market YML
 * - Avito XML
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

    @Value("${app.feed.product-url:https://max.ru/id121602873440_bot}")
    private String productFeedUrl;

    @Value("${app.site-url:https://magiacvetov12.ru}")
    private String siteUrl;

    @Value("${app.avito.manager-name:Магия Цветов}")
    private String avitoManagerName;

    @Value("${app.avito.contact-phone:}")
    private String avitoContactPhone;

    @Value("${app.avito.address:Казань}")
    private String avitoAddress;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");
    private static final DateTimeFormatter AVITO_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Генерация YML фида в формате Yandex Market
     */
    @Transactional(readOnly = true)
    public String generateYandexMarketFeed() {
        log.info("🔄 Генерация YML фида...");

        List<Category> categories = categoryRepository.findAll().stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .toList();

        List<Product> products = productRepository.findAllAvailableWithImages();

        log.info("📊 Найдено {} категорий и {} товаров для фида", categories.size(), products.size());

        StringBuilder yml = new StringBuilder();
        yml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");

        String currentDate = OffsetDateTime.now().format(DATE_FORMATTER);
        yml.append("<yml_catalog date=\"").append(currentDate).append("\">\n");

        yml.append("<shop>\n");
        yml.append("<name>").append(escapeXml(shopName)).append("</name>\n");
        yml.append("<url>").append(escapeXml(productFeedUrl)).append("</url>\n");
        yml.append("<company>").append(escapeXml(shopCompany)).append("</company>\n");

        yml.append("<categories>\n");
        for (Category category : categories) {
            yml.append("<category id=\"").append(category.getId()).append("\"");
            yml.append(">").append(escapeXml(category.getName())).append("</category>\n");
        }
        yml.append("</categories>\n");

        yml.append("<currencies>\n");
        yml.append("<currency id=\"RUR\" rate=\"1\"/>\n");
        yml.append("</currencies>\n");

        yml.append("<offers>\n");
        for (Product product : products) {
            yml.append(buildYandexOffer(product));
        }
        yml.append("</offers>\n");

        yml.append("</shop>\n");
        yml.append("</yml_catalog>\n");

        log.info("✅ YML фид успешно сгенерирован: {} символов", yml.length());
        return yml.toString();
    }

    /**
     * Генерация YML фида для Яндекс Вебмастер (дополненное представление в поиске)
     *
     * Ключевые отличия от Business-фида:
     * - URL товаров ведут на сайт, а не на бота
     * - available="true" на каждом оффере
     * - delivery, sales_notes
     * - до 5 картинок на товар
     * - корректное использование элементов по спецификации YML
     */
    @Transactional(readOnly = true)
    public String generateYandexWebmasterFeed() {
        log.info("🔄 Генерация YML фида для Яндекс Вебмастер...");

        List<Category> categories = categoryRepository.findAll().stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .toList();

        List<Product> products = productRepository.findAllAvailableWithImages();

        log.info("📊 Вебмастер фид: {} категорий, {} товаров", categories.size(), products.size());

        StringBuilder yml = new StringBuilder();
        yml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
        yml.append("<!DOCTYPE yml_catalog SYSTEM \"shops.dtd\">\n");

        String currentDate = OffsetDateTime.now().format(DATE_FORMATTER);
        yml.append("<yml_catalog date=\"").append(currentDate).append("\">\n");

        yml.append("<shop>\n");
        yml.append("<name>").append(escapeXml(shopName)).append("</name>\n");
        yml.append("<company>").append(escapeXml(shopCompany)).append("</company>\n");
        yml.append("<url>").append(escapeXml(siteUrl)).append("</url>\n");

        // currencies ДО offers
        yml.append("<currencies>\n");
        yml.append("<currency id=\"RUR\" rate=\"1\"/>\n");
        yml.append("</currencies>\n");

        // categories ДО offers
        yml.append("<categories>\n");
        for (Category category : categories) {
            yml.append("<category id=\"").append(category.getId()).append("\"");
            yml.append(">").append(escapeXml(category.getName())).append("</category>\n");
        }
        yml.append("</categories>\n");

        yml.append("<offers>\n");
        for (Product product : products) {
            yml.append(buildWebmasterOffer(product));
        }
        yml.append("</offers>\n");

        yml.append("</shop>\n");
        yml.append("</yml_catalog>\n");

        log.info("✅ YML фид для Вебмастер сгенерирован: {} символов", yml.length());
        return yml.toString();
    }

    /**
     * Генерация оффера для Яндекс Вебмастер
     */
    private String buildWebmasterOffer(Product product) {
        StringBuilder offer = new StringBuilder();

        BigDecimal price = product.getDiscountedPrice() != null
                ? product.getDiscountedPrice()
                : product.getPrice();

        BigDecimal oldPrice = product.getDiscountedPrice() != null ? product.getPrice() : null;

        offer.append("<offer id=\"").append(product.getId()).append("\" available=\"true\">\n");

        // URL на страницу товара на сайте
        String productUrl = siteUrl;
        if (product.getCategory() != null) {
            productUrl += "/catalog/" + product.getCategory().getId() + "/" + product.getId();
        } else {
            productUrl += "/catalog/" + product.getId();
        }
        offer.append("<url>").append(escapeXml(productUrl)).append("</url>\n");

        offer.append("<price>").append(price.intValue()).append("</price>\n");

        if (oldPrice != null) {
            offer.append("<oldprice>").append(oldPrice.intValue()).append("</oldprice>\n");
        }

        offer.append("<currencyId>RUR</currencyId>\n");

        if (product.getCategory() != null) {
            offer.append("<categoryId>").append(product.getCategory().getId()).append("</categoryId>\n");
        }

        // Картинки — до 5 штук
        List<String> allImages = getAllProductImages(product);
        int imageCount = 0;
        for (String imageUrl : allImages) {
            if (imageCount >= 5) break;
            String fullUrl = getFullImageUrl(imageUrl);
            if (!fullUrl.isEmpty()) {
                offer.append("<picture>").append(escapeXml(fullUrl)).append("</picture>\n");
                imageCount++;
            }
        }

        // Название товара
        offer.append("<name>").append(escapeXml(product.getName())).append("</name>\n");

        // Описание в CDATA
        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            offer.append("<description><![CDATA[");
            offer.append(product.getDescription().replace("]]>", "]]&gt;"));
            offer.append("]]></description>\n");
        }

        // Доставка
        offer.append("<delivery>true</delivery>\n");
        offer.append("<pickup>false</pickup>\n");

        // Заметки о продаже
        offer.append("<sales_notes>Доставка по Казани в день заказа при оформлении до 14:00.</sales_notes>\n");

        // Вес (переводим граммы в кг для спецификации)
        if (product.getWeight() != null) {
            double weightKg = product.getWeight() / 1000.0;
            offer.append("<weight>").append(weightKg).append("</weight>\n");
        }

        offer.append("</offer>\n");

        return offer.toString();
    }

    /**
     * Генерация XML фида для Авито
     *
     * Документация: https://www.avito.ru/autoload/documentation
     */
    @Transactional(readOnly = true)
    public String generateAvitoFeed() {
        log.info("🔄 Генерация Avito фида...");

        List<Product> products = productRepository.findAllAvailableWithImages();

        log.info("📊 Найдено {} товаров для Avito фида", products.size());

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
        xml.append("<Ads formatVersion=\"3\" target=\"Avito.ru\">\n");

        for (Product product : products) {
            xml.append(buildAvitoAd(product));
        }

        xml.append("</Ads>\n");

        log.info("✅ Avito фид успешно сгенерирован: {} символов, {} товаров", xml.length(), products.size());
        return xml.toString();
    }

    /**
     * Генерация объявления для Авито
     */
    private String buildAvitoAd(Product product) {
        StringBuilder ad = new StringBuilder();

        // Определяем цену (со скидкой или обычную)
        BigDecimal price = product.getDiscountedPrice() != null
                ? product.getDiscountedPrice()
                : product.getPrice();

        // Даты: начало сейчас, конец через 30 дней
        LocalDate dateBegin = LocalDate.now();
        LocalDate dateEnd = dateBegin.plusMonths(1);

        ad.append("<Ad>\n");

        // ID - уникальный идентификатор
        ad.append("<Id>").append(product.getId()).append("</Id>\n");

        // Дата начала и окончания
        ad.append("<DateBegin>").append(dateBegin).append("</DateBegin>\n");
        ad.append("<DateEnd>").append(dateEnd).append("</DateEnd>\n");

        // Тип размещения
        ad.append("<ListingFee>Package</ListingFee>\n");

        // Статус объявления
        ad.append("<AdStatus>Free</AdStatus>\n");

        // Разрешить email
        ad.append("<AllowEmail>Да</AllowEmail>\n");

        // Контактная информация
        ad.append("<ManagerName>").append(escapeXml(avitoManagerName)).append("</ManagerName>\n");
        if (avitoContactPhone != null && !avitoContactPhone.isEmpty()) {
            ad.append("<ContactPhone>").append(escapeXml(avitoContactPhone)).append("</ContactPhone>\n");
        }
        ad.append("<Address>").append(escapeXml(avitoAddress)).append("</Address>\n");

        // Категория - для букетов используем "Букеты"
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Букеты";
        ad.append("<Category>").append(escapeXml(categoryName)).append("</Category>\n");

        // Тип операции
        ad.append("<OperationType>Продам</OperationType>\n");

        // Цена
        ad.append("<Price>").append(price.intValue()).append("</Price>\n");

        // Название
        ad.append("<Title>").append(escapeXml(product.getName())).append("</Title>\n");

        // Описание
        String description = buildAvitoDescription(product);
        ad.append("<Description>").append(escapeXml(description)).append("</Description>\n");

        // Изображения
        List<String> allImages = getAllProductImages(product);
        for (String imageUrl : allImages) {
            String fullUrl = getFullImageUrl(imageUrl);
            ad.append("<Image url=\"").append(escapeXml(fullUrl)).append("\"/>\n");
        }

        // Состояние - новое
        ad.append("<Condition>Новое</Condition>\n");

        ad.append("</Ad>\n");

        return ad.toString();
    }

    /**
     * Формирование описания для Авито
     */
    private String buildAvitoDescription(Product product) {
        StringBuilder desc = new StringBuilder();

        desc.append(product.getName()).append("\n\n");

        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            desc.append(product.getDescription()).append("\n\n");
        }

        // Добавляем информацию о скидке
        if (product.getDiscountPercent() != null && product.getDiscountPercent() > 0) {
            desc.append("🔥 СКИДКА ").append(product.getDiscountPercent()).append("%!\n");
        }

        // Добавляем вес если есть
        if (product.getWeight() != null) {
            desc.append("Размер: ").append(product.getWeight()).append(" г\n");
        }

        desc.append("\n📞 Заказать можно через нашего бота в MAX:\n");
        desc.append(productFeedUrl).append("\n\n");

        desc.append("Доставка по Казани. Самовывоз возможен.\n");
        desc.append("Звоните или пишите!");

        return desc.toString();
    }

    /**
     * Генерация YML оффера для Yandex
     */
    private String buildYandexOffer(Product product) {
        StringBuilder offer = new StringBuilder();

        BigDecimal price = product.getDiscountedPrice() != null
                ? product.getDiscountedPrice()
                : product.getPrice();

        BigDecimal oldPrice = product.getDiscountedPrice() != null ? product.getPrice() : null;

        offer.append("<offer id=\"").append(product.getId()).append("\">\n");
        offer.append("<name>").append(escapeXml(product.getName())).append("</name>\n");
        offer.append("<url>").append(escapeXml(productFeedUrl)).append("</url>\n");
        offer.append("<price>").append(price.intValue()).append("</price>\n");

        if (oldPrice != null) {
            offer.append("<oldprice>").append(oldPrice.intValue()).append("</oldprice>\n");
        }

        offer.append("<currencyId>RUR</currencyId>\n");

        if (product.getCategory() != null) {
            offer.append("<categoryId>").append(product.getCategory().getId()).append("</categoryId>\n");
        }

        List<String> allImages = getAllProductImages(product);
        for (String imageUrl : allImages) {
            String fullUrl = getFullImageUrl(imageUrl);
            offer.append("<picture>").append(escapeXml(fullUrl)).append("</picture>\n");
        }

        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            String shortDesc = truncate(product.getDescription(), 150);
            offer.append("<shortDescription>").append(escapeXml(shortDesc)).append("</shortDescription>\n");
            offer.append("<description>").append(escapeXml(product.getDescription())).append("</description>\n");
        }

        if (product.getWeight() != null) {
            offer.append("<weight>").append(product.getWeight()).append("</weight>\n");
        }

        if (product.getDiscountPercent() != null && product.getDiscountPercent() > 0) {
            offer.append("<vendor>Скидка ").append(product.getDiscountPercent()).append("%</vendor>\n");
        }

        offer.append("</offer>\n");

        return offer.toString();
    }

    /**
     * Получение всех изображений товара
     */
    private List<String> getAllProductImages(Product product) {
        List<String> allImages = new ArrayList<>();

        if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
            allImages.add(product.getImageUrl());
        }

        if (product.getAdditionalImages() != null) {
            for (ProductImage img : product.getAdditionalImages()) {
                if (img.getImageUrl() != null && !img.getImageUrl().isEmpty()) {
                    allImages.add(img.getImageUrl());
                }
            }
        }

        return allImages;
    }

    /**
     * Получение полного URL изображения
     */
    private String getFullImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return "";
        }
        if (imageUrl.startsWith("http")) {
            return imageUrl;
        }
        String s3BaseUrl = "https://s3.twcstorage.ru/f9c8e17a-magicvetov-products";
        return s3BaseUrl + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
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
