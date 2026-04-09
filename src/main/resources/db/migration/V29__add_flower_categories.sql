-- V29: Оставляем только нужные категории, создаём новые и добавляем по одному товару

-- 1. Деактивируем все категории кроме "Монобукеты"
UPDATE categories SET is_active = false WHERE name NOT IN ('Монобукеты');

-- Деактивируем товары из неактивных категорий
UPDATE products SET is_available = false
WHERE category_id IN (SELECT id FROM categories WHERE is_active = false);

-- 2. Создаём новые категории
INSERT INTO categories (name, description, display_order, is_active)
VALUES
    ('Цветы в коробке', 'Красивые цветочные композиции в коробках', 2, true),
    ('Цветы в горшках', 'Живые цветы в горшках — подарок надолго', 3, true),
    ('Авторские букеты', 'Уникальные авторские букеты от флористов', 4, true),
    ('Мягкие игрушки', 'Мягкие игрушки — милый подарок к цветам', 5, true),
    ('Шары и конфеты', 'Воздушные шары и сладкие наборы', 6, true)
ON CONFLICT (name) DO UPDATE SET
    is_active = true,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 3. Добавляем по одному товару в каждую новую категорию
-- Берём данные первого товара из "Монобукеты"
DO $$
DECLARE
    template_name VARCHAR;
    template_desc TEXT;
    template_price DECIMAL;
    template_image VARCHAR;
BEGIN
    SELECT name, description, price, image_url
    INTO template_name, template_desc, template_price, template_image
    FROM products
    WHERE category_id = (SELECT id FROM categories WHERE name = 'Монобукеты')
      AND is_available = true
    LIMIT 1;

    INSERT INTO products (name, description, price, category_id, image_url, is_available, is_special_offer)
    VALUES
        ('Цветы в коробке «Классика»', 'Стильная цветочная композиция в подарочной коробке', template_price,
         (SELECT id FROM categories WHERE name = 'Цветы в коробке'), template_image, true, false),

        ('Цветы в горшке «Орхидея»', 'Живые цветы в красивом горшке — радуют долго', template_price,
         (SELECT id FROM categories WHERE name = 'Цветы в горшках'), template_image, true, false),

        ('Авторский букет «Нежность»', 'Уникальный авторский букет от наших флористов', template_price,
         (SELECT id FROM categories WHERE name = 'Авторские букеты'), template_image, true, false),

        ('Мягкая игрушка «Мишка»', 'Милая мягкая игрушка — отличный подарок к букету', template_price,
         (SELECT id FROM categories WHERE name = 'Мягкие игрушки'), template_image, true, false),

        ('Набор шаров и конфет «Праздник»', 'Воздушные шары с набором конфет — праздник в коробке', template_price,
         (SELECT id FROM categories WHERE name = 'Шары и конфеты'), template_image, true, false);
END
$$;
