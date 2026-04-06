-- Удаление старых товаров из предыдущего проекта (кроме категории "Монобукеты")

-- Сначала удаляем связанные изображения
DELETE FROM product_images WHERE product_id IN (
    SELECT id FROM products WHERE category_id IN (
        SELECT id FROM categories WHERE name IN ('Цветовы', 'Бургеры', 'Напитки', 'Комбо', 'Закуски', 'Закрытые цветовы')
    )
);

-- Затем удаляем товары
DELETE FROM products WHERE category_id IN (
    SELECT id FROM categories WHERE name IN ('Цветовы', 'Бургеры', 'Напитки', 'Комбо', 'Закуски', 'Закрытые цветовы')
);
