/**
 * @file: AdminDtoSerializationTest.java
 * @description: Проверка ИМЁН полей в JSON админских DTO.
 *
 * Зачем отдельный тест. Lombok генерирует геттеры по-разному в зависимости от
 * типа: для `boolean isAvailable` выходит isAvailable(), а для `Boolean
 * isActive` — getIsActive(). Jackson выводит имя свойства из геттера, и
 * ошибиться здесь легко: получилось бы "available" вместо "isAvailable" —
 * фронт читал бы undefined, что для булева поля выглядит как false. То есть
 * товар молча показывался бы снятым с продажи, а категория — скрытой.
 *
 * Компилятор такую рассогласованность не поймает: TypeScript-типы живут в
 * другом проекте. Поэтому фиксируем имена тестом.
 */
package com.baganov.magicvetov.model.dto;

import com.baganov.magicvetov.model.dto.category.AdminCategoryDTO;
import com.baganov.magicvetov.model.dto.category.SaveCategoryRequest;
import com.baganov.magicvetov.model.dto.product.ProductDTO;
import com.baganov.magicvetov.model.dto.product.UpdateProductRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class AdminDtoSerializationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("ProductDTO: булевы поля называются isAvailable / isSpecialOffer / isPreorder")
    void productBooleanNames() throws Exception {
        ProductDTO dto = ProductDTO.builder()
                .id(1)
                .name("Монобукет")
                .price(new BigDecimal("2990.00"))
                .isAvailable(true)
                .isSpecialOffer(true)
                .isPreorder(true)
                .build();

        String json = mapper.writeValueAsString(dto);

        // Имена должны совпадать с frontend/src/lib/admin/types.ts
        assertThat(json).contains("\"isAvailable\":true");
        assertThat(json).contains("\"isSpecialOffer\":true");
        assertThat(json).contains("\"isPreorder\":true");
        // И не должно быть варианта без префикса: именно он получился бы,
        // если поле переименовать в available.
        assertThat(json).doesNotContain("\"available\"");
        assertThat(json).doesNotContain("\"specialOffer\"");
        assertThat(json).doesNotContain("\"preorder\"");
    }

    @Test
    @DisplayName("ProductDTO: ключ картинки отдаётся как imageKey рядом с imageUrl")
    void productImageFields() throws Exception {
        ProductDTO dto = ProductDTO.builder()
                .id(1)
                .name("Монобукет")
                .imageKey("products/uuid.jpg")
                .imageUrl("https://cdn.example/products/uuid.jpg")
                .build();

        String json = mapper.writeValueAsString(dto);

        assertThat(json).contains("\"imageKey\":\"products/uuid.jpg\"");
        assertThat(json).contains("\"imageUrl\":\"https://cdn.example/products/uuid.jpg\"");
    }

    /**
     * Обратное направление: имена, которые фронт ОТПРАВЛЯЕТ.
     *
     * Если бы запрос ожидал "available", а форма присылала "isAvailable",
     * флажок молча не применялся бы: Jackson проигнорировал бы незнакомое
     * поле, и товар сохранялся бы со значением по умолчанию.
     */
    @Test
    @DisplayName("UpdateProductRequest читает isAvailable / isSpecialOffer / isPreorder")
    void updateRequestAcceptsFrontendNames() throws Exception {
        String json = """
                {"name":"Монобукет","price":2990.00,"categoryId":1,
                 "isAvailable":false,"isSpecialOffer":true,"isPreorder":true,
                 "imageKey":"products/x.jpg"}
                """;

        UpdateProductRequest request = mapper.readValue(json, UpdateProductRequest.class);

        assertThat(request.getIsAvailable()).isFalse();
        assertThat(request.getIsSpecialOffer()).isTrue();
        assertThat(request.getIsPreorder()).isTrue();
        assertThat(request.getImageKey()).isEqualTo("products/x.jpg");
    }

    @Test
    @DisplayName("SaveCategoryRequest читает isActive")
    void categoryRequestAcceptsIsActive() throws Exception {
        String json = """
                {"name":"Монобукеты","isActive":false,"imageKey":"categories/x.jpg"}
                """;

        SaveCategoryRequest request = mapper.readValue(json, SaveCategoryRequest.class);

        assertThat(request.getIsActive()).isFalse();
        assertThat(request.getImageKey()).isEqualTo("categories/x.jpg");
    }

    /**
     * Витринный ProductDto — другой класс с той же ловушкой.
     *
     * Из-за неё метки «Хит» и «Под заказ» в ProductCard не показывались
     * никогда, а в JSON-LD карточки уходило inStock: undefined. Чиним и
     * закрепляем, раз всё равно разбираемся с этими именами.
     */
    @Test
    @DisplayName("Витринный ProductDto тоже отдаёт isAvailable, а не available")
    void storefrontProductBooleanNames() throws Exception {
        com.baganov.magicvetov.dto.ProductDto dto = com.baganov.magicvetov.dto.ProductDto.builder()
                .id(1)
                .name("Монобукет")
                .isAvailable(true)
                .isSpecialOffer(true)
                .isPreorder(true)
                .build();

        String json = mapper.writeValueAsString(dto);

        assertThat(json).contains("\"isAvailable\":true");
        assertThat(json).contains("\"isSpecialOffer\":true");
        assertThat(json).contains("\"isPreorder\":true");
        assertThat(json).doesNotContain("\"available\"");
        assertThat(json).doesNotContain("\"specialOffer\"");
        assertThat(json).doesNotContain("\"preorder\"");
    }

    @Test
    @DisplayName("AdminCategoryDTO: поле называется isActive, а не active")
    void categoryBooleanName() throws Exception {
        AdminCategoryDTO dto = AdminCategoryDTO.builder()
                .id(1)
                .name("Монобукеты")
                .isActive(false)
                .displayOrder(3)
                .productCount(7)
                .build();

        String json = mapper.writeValueAsString(dto);

        assertThat(json).contains("\"isActive\":false");
        assertThat(json).doesNotContain("\"active\"");
        assertThat(json).contains("\"productCount\":7");
        assertThat(json).contains("\"displayOrder\":3");
    }
}
