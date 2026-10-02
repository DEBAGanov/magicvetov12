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

    @ParameterizedTest(name = "{0} отдаётся как есть")
    @ValueSource(strings = {
            "https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/products/x.webp",
            "http://example.com/photo.jpg"
    })
    @DisplayName("Абсолютный URL не получает второй префикс")
    void keepsAbsoluteUrlAsIs(String absolute) {
        assertThat(service.resolvePublicUrl(absolute)).isEqualTo(absolute);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("Пустое значение даёт null, а не ссылку на пустой ключ")
    void returnsNullForBlank(String blank) {
        assertThat(service.resolvePublicUrl(blank)).isNull();
    }
}
