-- Удаление товаров из категории "Шаурма"

-- Сначала удаляем связанные изображения
DELETE FROM product_images WHERE product_id IN (
    SELECT id FROM products WHERE category_id = (SELECT id FROM categories WHERE name = 'Шаурма')
);

-- Затем удаляем товары
DELETE FROM products WHERE category_id = (SELECT id FROM categories WHERE name = 'Шаурма');
