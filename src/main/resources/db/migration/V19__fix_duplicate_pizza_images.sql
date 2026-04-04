-- V27__fix_duplicate_pizza_images.sql
-- Исправление проблемы с дублирующимися изображениями цветов
-- Проблема: "Цветова 4 сыра" и "Сырная цветова" используют одно изображение pizza_4_chees.png

-- Обновляем "Сырную цветову" чтобы использовать отдельное изображение
UPDATE products
SET
    image_url = 'products/pizza_cheese.png'
WHERE
    name = 'Сырная цветова'
    AND image_url = 'products/pizza_4_chees.png';

-- Проверяем результат (для логов)
SELECT
    name,
    image_url,
    CASE
        WHEN name = 'Цветова 4 сыра'
        AND image_url = 'products/pizza_4_chees.png' THEN '✅ Правильно'
        WHEN name = 'Сырная цветова'
        AND image_url = 'products/pizza_cheese.png' THEN '✅ Исправлено'
        ELSE '❌ Проблема'
    END as status
FROM products
WHERE
    name IN (
        'Цветова 4 сыра',
        'Сырная цветова'
    )
ORDER BY name;