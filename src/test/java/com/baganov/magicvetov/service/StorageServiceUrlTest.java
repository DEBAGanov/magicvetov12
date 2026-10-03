/**
 * @file: StorageServiceUrlTest.java
 * @description: Проверка сборки публичного URL из значения, лежащего в БД.
 *
 * Дефект 3.1 из docs/ADMIN_PANEL_PLAN.md: безусловный getPublicUrl приклеивал
 * префикс и к абсолютным URL из сеяных данных, выдавая
 * https://s3.../bucket/https://s3.../... — в форме редактирования битая
 * картинка. Эта логика теперь в одном месте, и здесь она зафиксирована.
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.config.MinioClientConfig.UrlTransformer;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageServiceUrlTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private UrlTransformer urlTransformer;

    @Mock
    private Environment environment;

    private StorageService service;

    @BeforeEach
    void setUp() {
        service = new StorageService(minioClient, urlTransformer, environment);
        ReflectionTestUtils.setField(service, "devPublicUrl", "https://s3.example");
        ReflectionTestUtils.setField(service, "devBucket", "magicvetov");
    }

    @Test
    @DisplayName("Относительный ключ превращается в публичный URL")
    void buildsUrlForRelativeKey() {
        // Профиль не prod → dev-ветка: baseUrl + bucket + ключ. Профиль нужен
        // только здесь: для абсолютных и пустых значений метод выходит раньше
        // и до окружения не доходит.
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        assertThat(service.resolvePublicUrl("products/uuid.jpg"))
                .isEqualTo("https://s3.example/magicvetov/products/uuid.jpg");
    }

    /**
     * Главная проверка после инцидента 2026-10-03.
     *
     * В прод-БД лежали абсолютные URL с НЕВЕРНЫМ бакетом (magiacvetov12 —
     * такого бакета не существует, проверено: 404; файлы только в
     * f9c8e17a-magicvetov-products). Витрина отдавала их «как есть», и
     * каталог показывал товары без картинок.
     *
     * Теперь адрес пересобирается из конфига, если внутри URL видна наша папка.
     */
    @ParameterizedTest(name = "{0} → пересобирается из конфига")
    @ValueSource(strings = {
            // Неверный бакет — тот самый случай с прода
            "https://s3.twcstorage.ru/magiacvetov12/products/buket/buket_1.webp",
            // Правильный бакет: результат тот же, префикс не дублируется
            "https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/products/buket/buket_1.webp",
            // Другой хост (например, переезд на CDN)
            "https://cdn.example.com/whatever/products/buket/buket_1.webp"
    })
    @DisplayName("Абсолютный URL с нашей папкой пересобирается с актуальным бакетом")
    void rebuildsOurUrlsFromConfig(String stored) {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        assertThat(service.resolvePublicUrl(stored))
                .isEqualTo("https://s3.example/magicvetov/products/buket/buket_1.webp");
    }

    @Test
    @DisplayName("Картинка категории тоже пересобирается")
    void rebuildsCategoryUrl() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        assertThat(service.resolvePublicUrl(
                "https://s3.twcstorage.ru/magiacvetov12/categories/rozy.jpg"))
                .isEqualTo("https://s3.example/magicvetov/categories/rozy.jpg");
    }

    @Test
    @DisplayName("Чужая ссылка без наших папок отдаётся как есть")
    void keepsForeignUrlAsIs() {
        // Внешний поставщик: это не наш объект, подменять адрес нельзя.
        String foreign = "https://supplier.example/media/photo.jpg";
        assertThat(service.resolvePublicUrl(foreign)).isEqualTo(foreign);
    }

    @Test
    @DisplayName("Имя бакета, кончающееся на products, не ломает разбор")
    void bucketNameEndingWithProductsIsNotConfused() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        // Ловушка: без слэшей поиск «products» нашёл бы имя бакета
        // (f9c8e17a-magicvetov-products) и срезал URL по его середине.
        assertThat(service.resolvePublicUrl(
                "https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/products/a/b.jpg"))
                .isEqualTo("https://s3.example/magicvetov/products/a/b.jpg");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("Пустое значение даёт null, а не ссылку на пустой ключ")
    void returnsNullForBlank(String blank) {
        assertThat(service.resolvePublicUrl(blank)).isNull();
    }
}
