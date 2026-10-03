/**
 * @file: AdminCategoryService.java
 * @description: CRUD категорий для админки.
 *
 * Задача 2.14 из docs/ADMIN_PANEL_PLAN.md.
 *
 * Правила те же, что в AdminProductService:
 *   - в БД лежит относительный ключ, публичный URL собирается на чтении;
 *   - файл из S3 удаляется ТОЛЬКО после успешного коммита — removeObject не
 *     откатить, и при откате транзакции лишний файл в бакете безопаснее
 *     ссылки в БД на удалённый файл;
 *   - @CacheEvict на всех записях: категории кэшируются на 600 с, и без
 *     сброса админ сохранил бы правку и не увидел её на витрине.
 *
 * Отдельно — защита от удаления непустой категории, см. deleteCategory.
 *
 * @created: 2026-10-02
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Category;
import com.baganov.magicvetov.model.dto.category.AdminCategoryDTO;
import com.baganov.magicvetov.model.dto.category.SaveCategoryRequest;
import com.baganov.magicvetov.repository.CategoryRepository;
import com.baganov.magicvetov.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StorageService storageService;

    /** Все категории, включая отключённые, в порядке показа. */
    public List<AdminCategoryDTO> getCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AdminCategoryDTO getCategoryById(Integer id) {
        return mapToDTO(findOrThrow(id));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "categories", allEntries = true),
            // Товары тоже: ProductDTO несёт categoryName, и после
            // переименования категории закэшированные карточки показывали бы
            // старое название.
            @CacheEvict(value = "products", allEntries = true)
    })
    public AdminCategoryDTO createCategory(SaveCategoryRequest request) {
        String name = request.getName().trim();
        if (categoryRepository.existsByName(name)) {
            throw new IllegalArgumentException("Категория с таким названием уже существует");
        }

        Category category = Category.builder()
                .name(name)
                .description(blankToNull(request.getDescription()))
                .imageUrl(blankToNull(request.getImageKey()))
                // Без явного порядка ставим в конец: иначе новая категория
                // встала бы первой (displayOrder = 0) и подвинула витрину.
                .displayOrder(request.getDisplayOrder() != null
                        ? request.getDisplayOrder()
                        : nextDisplayOrder())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Создана категория {} (id={})", saved.getName(), saved.getId());
        return mapToDTO(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "products", allEntries = true)
    })
    public AdminCategoryDTO updateCategory(Integer id, SaveCategoryRequest request) {
        Category category = findOrThrow(id);

        String name = request.getName().trim();
        if (!category.getName().equals(name) && categoryRepository.existsByName(name)) {
            throw new IllegalArgumentException("Категория с таким названием уже существует");
        }

        String previousKey = category.getImageUrl();

        category.setName(name);
        category.setDescription(blankToNull(request.getDescription()));

        if (request.getImageKey() != null) {
            category.setImageUrl(blankToNull(request.getImageKey()));
        }
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category saved = categoryRepository.save(category);

        // Прежний файл удаляем, только если картинку действительно заменили
        // или сняли.
        String newKey = saved.getImageUrl();
        if (previousKey != null && !previousKey.equals(newKey)) {
            deleteFileAfterCommit(previousKey);
        }

        log.info("Обновлена категория {} (id={})", saved.getName(), saved.getId());
        return mapToDTO(saved);
    }

    /**
     * Меняет порядок двух категорий местами.
     *
     * Отдельная операция, а не два вызова updateCategory: тот принимает полное
     * состояние категории и, в частности, перезаписывает описание. Клиент,
     * который хочет только переставить категории, прислал бы запрос без
     * описания — и стёр бы его. Здесь меняется ровно displayOrder.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "products", allEntries = true)
    })
    public void swapDisplayOrder(Integer firstId, Integer secondId) {
        if (firstId.equals(secondId)) {
            throw new IllegalArgumentException("Нельзя поменять категорию местами с собой");
        }

        Category first = findOrThrow(firstId);
        Category second = findOrThrow(secondId);

        Integer firstOrder = first.getDisplayOrder();
        first.setDisplayOrder(second.getDisplayOrder());
        second.setDisplayOrder(firstOrder);

        categoryRepository.save(first);
        categoryRepository.save(second);

        log.info("Категории {} и {} поменяны местами", firstId, secondId);
    }

    /**
     * Удаление категории.
     *
     * Непустую удалять запрещаем. Причина не в удобстве: у Category.products
     * стоит cascade = CascadeType.ALL и orphanRemoval = true, поэтому
     * delete(category) молча унесёт все товары категории — вместе со строками
     * product_images, то есть со ссылками на файлы в бакете. Файлы при этом
     * останутся, а восстановить, какие из них кому принадлежали, будет нечем.
     *
     * Поэтому требуем сначала перенести или удалить товары. Для «спрятать
     * категорию с витрины» есть isActive — он и нужен в большинстве случаев.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "products", allEntries = true)
    })
    public void deleteCategory(Integer id) {
        Category category = findOrThrow(id);

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new IllegalStateException(
                    "В категории " + productCount + " товаров. Сначала перенесите или удалите их, "
                            + "либо отключите категорию вместо удаления");
        }

        String imageKey = category.getImageUrl();
        categoryRepository.delete(category);
        if (imageKey != null) {
            deleteFileAfterCommit(imageKey);
        }

        log.info("Удалена категория {} (id={})", category.getName(), id);
    }

    // ---------- Вспомогательное ----------

    private Category findOrThrow(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Категория не найдена с ID: " + id));
    }

    private int nextDisplayOrder() {
        Integer max = categoryRepository.findMaxDisplayOrder();
        return (max != null ? max : 0) + 1;
    }

    /**
     * Удаляет файл после коммита.
     *
     * Внешние ссылки (http...) не трогаем — это не наши объекты. Ошибку не
     * пробрасываем: транзакция уже зафиксирована, и падение здесь сообщило бы
     * клиенту об ошибке при фактически сохранённой правке.
     */
    private void deleteFileAfterCommit(String key) {
        if (key == null || key.startsWith("http://") || key.startsWith("https://")) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteQuietly(key);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteQuietly(key);
            }
        });
    }

    private void deleteQuietly(String key) {
        try {
            storageService.deleteFile(key);
            log.info("Файл категории удалён из бакета: {}", key);
        } catch (Exception e) {
            log.error("Не удалось удалить файл {} из бакета: {}. "
                    + "Правка в БД сохранена; файл подчистит ревизия сирот.", key, e.getMessage());
        }
    }

    private AdminCategoryDTO mapToDTO(Category category) {
        return AdminCategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(storageService.resolvePublicUrl(category.getImageUrl()))
                .imageKey(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .productCount(productRepository.countByCategoryId(category.getId()))
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
