/**
 * @file: AdminProductServiceTest.java
 * @description: Проверка правки товара: галерея, порядок, удаление файлов из S3.
 *
 * Эти правила нельзя проверить глазами по коду: «какие файлы удалить» —
 * результат сравнения двух наборов ключей, и ошибка здесь тихая и дорогая.
 * Удалить лишнее нельзя отменить, а не удалить — значит платить за мусор в
 * бакете. Поэтому проверяем оба направления: что удаляется ровно убранное и
 * что остальное НЕ удаляется.
 *
 * Транзакции в юнит-тесте нет, поэтому deleteFilesAfterCommit удаляет сразу —
 * это ветка, предусмотренная в сервисе.
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.entity.ProductImage;
import com.baganov.magicvetov.model.dto.product.ProductDTO;
import com.baganov.magicvetov.model.dto.product.ProductImageDTO;
import com.baganov.magicvetov.model.dto.product.UpdateProductRequest;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private AdminProductService service;

    private Category category;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1);
        category.setName("Монобукеты");

        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        // save возвращает тот же объект: сервис работает с управляемой сущностью.
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        when(storageService.resolvePublicUrl(any())).thenAnswer(i -> {
            String v = i.getArgument(0);
            return v == null ? null : "https://cdn.example/" + v;
        });
    }

    // ---------- Галерея ----------

    @Test
    @DisplayName("Галерея сохраняется в переданном порядке")
    void savesGalleryInGivenOrder() {
        Product product = product(10, "products/main.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        ProductDTO result = service.updateProduct(10, request(
                "products/main.jpg",
                List.of(image("products/c.jpg"), image("products/a.jpg"), image("products/b.jpg"))));

        assertThat(product.getAdditionalImages())
                .extracting(ProductImage::getImageUrl)
                .containsExactly("products/c.jpg", "products/a.jpg", "products/b.jpg");
        assertThat(product.getAdditionalImages())
                .extracting(ProductImage::getDisplayOrder)
                .containsExactly(1, 2, 3);

        // В DTO ключи и готовые URL для превью.
        assertThat(result.getAdditionalImages())
                .extracting(ProductImageDTO::getUrl)
                .containsExactly("https://cdn.example/products/c.jpg",
                        "https://cdn.example/products/a.jpg",
                        "https://cdn.example/products/b.jpg");
    }

    @Test
    @DisplayName("Убранные из галереи файлы удаляются из бакета, оставшиеся — нет")
    void deletesOnlyRemovedFiles() {
        Product product = product(10, "products/main.jpg");
        product.getAdditionalImages().addAll(List.of(
                galleryRow(product, "products/keep.jpg", 1),
                galleryRow(product, "products/drop1.jpg", 2),
                galleryRow(product, "products/drop2.jpg", 3)));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request("products/main.jpg", List.of(image("products/keep.jpg"))));

        verify(storageService).deleteFile("products/drop1.jpg");
        verify(storageService).deleteFile("products/drop2.jpg");
        verify(storageService, never()).deleteFile("products/keep.jpg");
        verify(storageService, never()).deleteFile("products/main.jpg");
    }

    @Test
    @DisplayName("Дубликат в галерее отбрасывается: иначе ломается сравнение наборов")
    void dropsDuplicateKeys() {
        Product product = product(10, null);
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request(null,
                List.of(image("products/a.jpg"), image("products/a.jpg"))));

        assertThat(product.getAdditionalImages())
                .extracting(ProductImage::getImageUrl)
                .containsExactly("products/a.jpg");
    }

    @Test
    @DisplayName("additionalImages = null — галерею не трогаем")
    void nullGalleryLeavesItAlone() {
        Product product = product(10, "products/main.jpg");
        product.getAdditionalImages().add(galleryRow(product, "products/a.jpg", 1));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request("products/main.jpg", null));

        assertThat(product.getAdditionalImages()).hasSize(1);
        verify(storageService, never()).deleteFile(any());
    }

    // ---------- Главная картинка ----------

    @Test
    @DisplayName("Пустая строка в imageKey снимает картинку и удаляет файл")
    void emptyImageKeyClearsImage() {
        Product product = product(10, "products/old.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request("", null));

        assertThat(product.getImageUrl()).isNull();
        verify(storageService).deleteFile("products/old.jpg");
    }

    @Test
    @DisplayName("imageKey = null — картинку не меняем и файл не удаляем")
    void nullImageKeyKeepsImage() {
        Product product = product(10, "products/old.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request(null, null));

        assertThat(product.getImageUrl()).isEqualTo("products/old.jpg");
        verify(storageService, never()).deleteFile(any());
    }

    @Test
    @DisplayName("Замена главной картинки удаляет только прежний файл")
    void replacingMainImageDeletesOldFile() {
        Product product = product(10, "products/old.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request("products/new.jpg", null));

        assertThat(product.getImageUrl()).isEqualTo("products/new.jpg");
        verify(storageService).deleteFile("products/old.jpg");
        verify(storageService, never()).deleteFile("products/new.jpg");
    }

    @Test
    @DisplayName("Внешние ссылки из бакета не удаляем: это не наши объекты")
    void doesNotDeleteExternalUrls() {
        Product product = product(10, "https://supplier.example/photo.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.updateProduct(10, request("products/new.jpg", null));

        verify(storageService, never()).deleteFile(any());
    }

    // ---------- Удаление товара ----------

    @Test
    @DisplayName("Удаление товара убирает из бакета все его файлы")
    void deleteProductRemovesAllFiles() {
        Product product = product(10, "products/main.jpg");
        product.getAdditionalImages().addAll(List.of(
                galleryRow(product, "products/a.jpg", 1),
                galleryRow(product, "products/b.jpg", 2)));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));

        service.deleteProduct(10);

        verify(productRepository).delete(product);
        verify(storageService).deleteFile("products/main.jpg");
        verify(storageService).deleteFile("products/a.jpg");
        verify(storageService).deleteFile("products/b.jpg");
    }

    @Test
    @DisplayName("Сбой удаления файла не роняет операцию: запись в БД уже зафиксирована")
    void storageFailureDoesNotBreakUpdate() {
        Product product = product(10, "products/old.jpg");
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        org.mockito.Mockito.doThrow(new RuntimeException("S3 недоступен"))
                .when(storageService).deleteFile("products/old.jpg");

        // Не должно бросить: иначе админ увидит ошибку при сохранённой правке.
        ProductDTO result = service.updateProduct(10, request("products/new.jpg", null));

        assertThat(result.getImageKey()).isEqualTo("products/new.jpg");
    }

    // ---------- Маппинг ----------

    @Test
    @DisplayName("Абсолютный URL из сеяных данных не получает второй префикс")
    void doesNotDoublePrefixAbsoluteUrl() {
        // Тут проверяем именно делегирование в resolvePublicUrl: логика выбора
        // «приклеивать или нет» живёт там и покрыта StorageServiceUrlTest.
        when(storageService.resolvePublicUrl("https://s3.example/bucket/products/x.jpg"))
                .thenReturn("https://s3.example/bucket/products/x.jpg");

        Product product = product(10, "https://s3.example/bucket/products/x.jpg");
        when(productRepository.findByIdWithCategory(10)).thenReturn(Optional.of(product));

        ProductDTO dto = service.getProductById(10);

        assertThat(dto.getImageUrl()).isEqualTo("https://s3.example/bucket/products/x.jpg");
    }

    // ---------- Вспомогательное ----------

    private Product product(Integer id, String imageKey) {
        Product p = Product.builder()
                .id(id)
                .name("Монобукет")
                .price(new BigDecimal("2990.00"))
                .category(category)
                .imageUrl(imageKey)
                .isAvailable(true)
                .build();
        if (p.getAdditionalImages() == null) {
            p.setAdditionalImages(new ArrayList<>());
        }
        return p;
    }

    private ProductImage galleryRow(Product product, String key, int order) {
        return ProductImage.builder()
                .product(product)
                .imageUrl(key)
                .displayOrder(order)
                .build();
    }

    private ProductImageDTO image(String key) {
        return ProductImageDTO.builder().key(key).build();
    }

    private UpdateProductRequest request(String imageKey, List<ProductImageDTO> gallery) {
        return UpdateProductRequest.builder()
                .name("Монобукет")
                .price(new BigDecimal("2990.00"))
                .categoryId(1)
                .imageKey(imageKey)
                .additionalImages(gallery)
                .build();
    }
}
