/**
 * @file: AdminCategoryServiceTest.java
 * @description: Проверка CRUD категорий.
 *
 * Главное здесь — запрет на удаление непустой категории. Это не придирка к
 * удобству: у Category.products стоит cascade = ALL и orphanRemoval = true,
 * поэтому delete(category) молча унёс бы все товары категории вместе со
 * строками product_images. Регрессия выглядела бы как «админ удалил категорию,
 * и пропал весь каталог», причём файлы остались бы в бакете уже без владельца.
 *
 * Остальное — порядок новой категории и удаление прежнего файла при замене.
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.model.dto.category.AdminCategoryDTO;
import com.baganov.magicvetov.model.dto.category.SaveCategoryRequest;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminCategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private AdminCategoryService service;

    @BeforeEach
    void setUp() {
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));
        when(storageService.resolvePublicUrl(any())).thenAnswer(i -> {
            String v = i.getArgument(0);
            return v == null ? null : "https://cdn.example/" + v;
        });
    }

    // ---------- Удаление ----------

    @Test
    @DisplayName("Непустая категория не удаляется: каскад унёс бы все её товары")
    void refusesToDeleteCategoryWithProducts() {
        Category category = category(5, "Монобукеты", null);
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));
        when(productRepository.countByCategoryId(5)).thenReturn(12L);

        assertThatThrownBy(() -> service.deleteCategory(5))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("12 товаров");

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Пустая категория удаляется вместе с картинкой из бакета")
    void deletesEmptyCategoryAndItsFile() {
        Category category = category(5, "Пустая", "categories/old.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));
        when(productRepository.countByCategoryId(5)).thenReturn(0L);

        service.deleteCategory(5);

        verify(categoryRepository).delete(category);
        verify(storageService).deleteFile("categories/old.jpg");
    }

    // ---------- Создание ----------

    @Test
    @DisplayName("Новая категория без явного порядка встаёт в конец списка")
    void newCategoryGoesLast() {
        when(categoryRepository.existsByName("Пионы")).thenReturn(false);
        when(categoryRepository.findMaxDisplayOrder()).thenReturn(7);

        AdminCategoryDTO created = service.createCategory(
                SaveCategoryRequest.builder().name("Пионы").build());

        // 8, а не 0: иначе новая категория встала бы первой на витрине.
        assertThat(created.getDisplayOrder()).isEqualTo(8);
        assertThat(created.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Первая категория в пустой базе получает порядок 1")
    void firstCategoryGetsOrderOne() {
        when(categoryRepository.findMaxDisplayOrder()).thenReturn(0);

        AdminCategoryDTO created = service.createCategory(
                SaveCategoryRequest.builder().name("Розы").build());

        assertThat(created.getDisplayOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("Повторное название отклоняется")
    void rejectsDuplicateName() {
        when(categoryRepository.existsByName("Розы")).thenReturn(true);

        assertThatThrownBy(() -> service.createCategory(
                SaveCategoryRequest.builder().name("Розы").build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("уже существует");

        verify(categoryRepository, never()).save(any());
    }

    // ---------- Правка ----------

    @Test
    @DisplayName("Замена картинки удаляет прежний файл")
    void replacingImageDeletesOldFile() {
        Category category = category(5, "Розы", "categories/old.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        service.updateCategory(5, SaveCategoryRequest.builder()
                .name("Розы")
                .imageKey("categories/new.jpg")
                .build());

        assertThat(category.getImageUrl()).isEqualTo("categories/new.jpg");
        verify(storageService).deleteFile("categories/old.jpg");
        verify(storageService, never()).deleteFile("categories/new.jpg");
    }

    @Test
    @DisplayName("Пустая строка снимает картинку и удаляет файл")
    void emptyKeyClearsImage() {
        Category category = category(5, "Розы", "categories/old.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        service.updateCategory(5, SaveCategoryRequest.builder()
                .name("Розы")
                .imageKey("")
                .build());

        assertThat(category.getImageUrl()).isNull();
        verify(storageService).deleteFile("categories/old.jpg");
    }

    @Test
    @DisplayName("imageKey = null — картинку не трогаем")
    void nullKeyKeepsImage() {
        Category category = category(5, "Розы", "categories/old.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        service.updateCategory(5, SaveCategoryRequest.builder().name("Розы").build());

        assertThat(category.getImageUrl()).isEqualTo("categories/old.jpg");
        verify(storageService, never()).deleteFile(any());
    }

    @Test
    @DisplayName("Та же картинка при сохранении не удаляется")
    void samePictureSurvivesSave() {
        Category category = category(5, "Розы", "categories/same.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        service.updateCategory(5, SaveCategoryRequest.builder()
                .name("Розы переименованные")
                .imageKey("categories/same.jpg")
                .build());

        verify(storageService, never()).deleteFile(any());
    }

    @Test
    @DisplayName("Отключение категории не удаляет ни товары, ни файлы")
    void deactivatingKeepsEverything() {
        Category category = category(5, "Розы", "categories/x.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        AdminCategoryDTO result = service.updateCategory(5, SaveCategoryRequest.builder()
                .name("Розы")
                .isActive(false)
                .build());

        assertThat(result.getIsActive()).isFalse();
        verify(categoryRepository, never()).delete(any());
        verify(storageService, never()).deleteFile(any());
    }

    // ---------- Порядок ----------

    @Test
    @DisplayName("Перестановка меняет только порядок и не трогает описание")
    void swapChangesOnlyOrder() {
        Category first = category(1, "Розы", "categories/a.jpg");
        first.setDisplayOrder(1);
        first.setDescription("Описание роз");
        Category second = category(2, "Тюльпаны", "categories/b.jpg");
        second.setDisplayOrder(2);
        second.setDescription("Описание тюльпанов");

        when(categoryRepository.findById(1)).thenReturn(Optional.of(first));
        when(categoryRepository.findById(2)).thenReturn(Optional.of(second));

        service.swapDisplayOrder(1, 2);

        assertThat(first.getDisplayOrder()).isEqualTo(2);
        assertThat(second.getDisplayOrder()).isEqualTo(1);
        // Главное: описания и картинки на месте. Ровно поэтому перестановка —
        // отдельная операция, а не два updateCategory.
        assertThat(first.getDescription()).isEqualTo("Описание роз");
        assertThat(second.getDescription()).isEqualTo("Описание тюльпанов");
        verify(storageService, never()).deleteFile(any());
    }

    @Test
    @DisplayName("Перестановка категории с собой отклоняется")
    void swapWithItselfRejected() {
        assertThatThrownBy(() -> service.swapDisplayOrder(1, 1))
                .isInstanceOf(IllegalArgumentException.class);

        verify(categoryRepository, never()).save(any());
    }

    // ---------- Маппинг ----------

    @Test
    @DisplayName("В DTO есть и ключ, и готовый URL, и число товаров")
    void mapsKeyUrlAndCount() {
        Category category = category(5, "Розы", "categories/x.jpg");
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));
        when(productRepository.countByCategoryId(5)).thenReturn(3L);

        AdminCategoryDTO dto = service.getCategoryById(5);

        assertThat(dto.getImageKey()).isEqualTo("categories/x.jpg");
        assertThat(dto.getImageUrl()).isEqualTo("https://cdn.example/categories/x.jpg");
        assertThat(dto.getProductCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("Категория без картинки не даёт ссылку на пустой ключ")
    void nullImageGivesNullUrl() {
        Category category = category(5, "Розы", null);
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        AdminCategoryDTO dto = service.getCategoryById(5);

        assertThat(dto.getImageUrl()).isNull();
        assertThat(dto.getImageKey()).isNull();
    }

    @Test
    @DisplayName("Несуществующая категория — понятная ошибка, а не NPE")
    void missingCategoryThrows() {
        when(categoryRepository.findById(anyInt())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCategoryById(999))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("не найдена");
    }

    private Category category(Integer id, String name, String imageKey) {
        return Category.builder()
                .id(id)
                .name(name)
                .imageUrl(imageKey)
                .displayOrder(1)
                .isActive(true)
                .build();
    }
}
