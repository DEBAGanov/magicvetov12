-- Добавляем UNIQUE ограничения для поля name в таблицах
ALTER TABLE categories
ADD CONSTRAINT categories_name_unique UNIQUE (name);

ALTER TABLE products
ADD CONSTRAINT products_name_unique UNIQUE (name);

ALTER TABLE delivery_locations
ADD CONSTRAINT delivery_locations_name_unique UNIQUE (name);

-- Создание категории "Цветовы"
INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Цветовы',
        'Вкусные и ароматные цветовы',
        'categories/pizza.png',
        1,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Создание категории "<Бургеры>"
INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Бургеры',
        'Свежие и аппетитные бургеры',
        'categories/burghers.png',
        2,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Создание категории "Напитки"
INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Напитки',
        'Вкусные и ароматные напитки',
        'categories/drinks.png',
        3,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Создание категории "Десерты"

INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Комбо',
        'Вкусные и ароматные комбо',
        'categories/salads.png',
        4,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Создание категории "Закуски"

INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Закуски',
        'Вкусные и ароматные закуски',
        'categories/snacks.png',
        5,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Создание категории "Салаты"

INSERT INTO
    categories (
        name,
        description,
        image_url,
        display_order,
        is_active
    )
VALUES (
        'Закрытые цветовы',
        'Вкусные и ароматные закрытые цветовы',
        'categories/closed_pizza.png',
        6,
        true
    ) ON CONFLICT (name) DO NOTHING;

-- Определяем ID категории "Цветовы"
DO $$
DECLARE
    pizza_category_id INTEGER;
BEGIN
    SELECT id INTO pizza_category_id FROM categories WHERE name = 'Цветовы';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Цветова Маргарита', 'Классическая итальянская цветова с томатным соусом и сыром "Моцарелла" и помидорами. Вес 580 гр.', 400.00, 450, pizza_category_id, 'products/pizza_margarita.png', true, false, null),
        ('Грибная цветова', 'Цветова с шампиньонами и томатным соусом, с сыром "Моцарелла" и ветчиной. Вес 600 гр.', 490.00, 470, pizza_category_id, 'products/pizza_gribnaya.png', true, false, null),
        ('Сырная цветова', 'Цветова с четырьмя видами сыра (соус томатный, "Моцарелла", "Голландский", "Пармезан", "Масдам". Вес 450 гр.)', 500.00, 460, pizza_category_id, 'products/pizza_4_chees.png', true, false, null),
        ('Цветова Салями', 'Цветова с салями и сыром (соус томатный, сыр "Моцарелла", колбаса, помидоры. Вес 580 гр.)', 520.00, 480, pizza_category_id, 'products/pizza_peperoni.png', true, false, null),
        ('Цветова Пепперони', 'Цветова с пепперони и сыром (соус томатный, сыр "Моцарелла", пеперони. Вес 600 гр.)', 490.00, 480, pizza_category_id, 'products/pizza_peperoni.png', true, false, null),
        ('Цветова Цезарь', 'Фирменная цветова с соусом Цезарь (соус Цезарь, сыр, курица, помидоры, салат. Вес 690 гр.)', 500.00, 500, pizza_category_id, 'products/pizza_mario.png', true, false, null),
        ('Гавайская цветова', 'Цветова с курицей и ананасами (соус сливочный, сыр "Моцарелла", курица, ананасы. Вес 600 гр.)', 510.00, 470, pizza_category_id, 'products/pizza_gavaiyaskay.png', true, false, null),
        ('Мясная цветова', 'Цветова с ассорти из мясных ингредиентов (соус томатный, сыр "Моцарелла", курица, колбаски, салями, ветчина. Вес 650 гр.)', 540.00, 520, pizza_category_id, 'products/pizza_mzysnay.png', true, false, null),
        ('Домашняя цветова', 'Цветова домашняя (соус томатный, сыр "Моцарелла", колбсалями, ветчина, помидоры, огурец маринованный, лук. Вес 610 гр. )', 510.00, 490, pizza_category_id, 'products/pizza_5_chees.png', true, false, null),
        ('Цветова Морская', 'Цветова Морская (соус томатный, сыр "Моцарелла", морской коктель, маслины. Вес 650 гр.)', 510.00, 490, pizza_category_id, 'products/pizza_karbonara.png', true, false, null),
        ('Груша с горогонзолой', 'Цветова груша с Горогонзолой (соус сливочный, сыр "Моцарелла", груша, сыр Горгонзола. Вес 570 гр.)', 470.00, 490, pizza_category_id, 'products/pizza_tom_yam.png', true, false, null),
        ('Цветова конструктор', 'Цветова из двух видов цветов на выбор. Вес 570 гр.', 550.00, 490, pizza_category_id, 'products/pizza_tom_yam.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Определяем ID категории "Бургеры"
DO $$
DECLARE
    burgers_category_id INTEGER;
BEGIN
    SELECT id INTO burgers_category_id FROM categories WHERE name = 'Бургеры';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Бургер "Димбургер"', 'Бургер с жареным луком и сыром (куриная котлета, лук, помидоры, салат, двойной сыр, маринованные орурцы, соус)', 230.00, 450, burgers_category_id, 'products/burger_classic.png', true, false, null),
        ('Бургер "Чизбургер"', 'Бургер с сыром и салатом (куриная котлета, лук, помидоры, салат, сыр, соус)', 210.00, 480, burgers_category_id, 'products/burger_cheeseburger.png', true, false, null),
        ('Бургер "Чикенбургер"', 'Чикенбургер (куриная котлета, лук, помидоры, салат, соус)', 190.00, 470, burgers_category_id, 'products/burger_hawaiian.png', true, false, null),
        ('Бургер "Джуниор"', 'Джуниор (куриная котлета, лук, помидоры, соус)', 170.00, 490, burgers_category_id, 'products/burger_tom_yam.png', true, false, null),
        ('Комбо 1', 'Фри 100 гр. + Нагецы 5 штук + соус + напиток 300 мл. ', 320.00, 490, burgers_category_id, 'products/burger_tom_yam.png', true, false, null),
        ('Комбо 2', 'Фри 100 гр. + Чикенбургер + соус + напиток 300 мл. ', 370.00, 490, burgers_category_id, 'products/burger_tom_yam.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Определяем ID категории "Напитки"
DO $$
DECLARE
    drinks_category_id INTEGER;
BEGIN
    SELECT id INTO drinks_category_id FROM categories WHERE name = 'Напитки';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Молочный коктейль', 'Молочный коктейль с мороженным.', 180.00, 450, drinks_category_id, 'products/drink_cola.png', true, false, null),
        ('Шоколадный коктейль', 'Молочный коктейль с шоколадным мороженным.', 180.00, 450, drinks_category_id, 'products/drink_cola.png', true, false, null),
        ('Клубничный коктейль', 'Молочный коктейль с клубничным мороженным.', 180.00, 450, drinks_category_id, 'products/drink_cola.png', true, false, null),
        ('Лимонад "Мохито"', 'Освежающий лимонад Мохито.', 180.00, 450, drinks_category_id, 'products/lemonade.png', true, false, null),
        ('Лимонад "Тропический манго"', 'Освежающий мановый лимонад.', 180.00, 450, drinks_category_id, 'products/lemonade.png', true, false, null),
        ('Лимонад "Сочная малина"', 'Освежающий малиновый лимонад.', 180.00, 450, drinks_category_id, 'products/lemonade.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Определяем ID категории "Десерты"
DO $$
DECLARE
    desserts_category_id INTEGER;
BEGIN
    SELECT id INTO desserts_category_id FROM categories WHERE name = 'Комбо';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Комбо 3', 'Фри 100 гр.  + Нагецы 5 штук + соус + напиток 300 мл.', 320.00, 450, desserts_category_id, 'products/salads.png', true, false, null),
        ('Комбо 4', 'Фри 100 гр.  + Чикенбургер + соус + напиток 300 мл', 370.00, 450, desserts_category_id, 'products/salads.png', true, false, null),
        ('Комбо 5', 'Фри 100 гр.  + Нагецы 5 штук + соус + напиток 300 мл.', 320.00, 450, desserts_category_id, 'products/salads.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Определяем ID категории "Закуски"
DO $$
DECLARE
    snacks_category_id INTEGER;
BEGIN
    SELECT id INTO snacks_category_id FROM categories WHERE name = 'Закуски';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Картофель Фри 100 гр.', 'Картофель Фри 100 гр.', 120.00, 450, snacks_category_id, 'products/free.png', true, false, null),
        ('Картофель Фри 150 гр.', 'Картофель Фри 150 гр.', 160.00, 450, snacks_category_id, 'products/free.png', true, false, null),
        ('Нагецы 6 штук', 'Нагецы 6 штук', 150.00, 480, snacks_category_id, 'products/nagets.png', true, false, null),
        ('Нагецы 9 штук', 'Нагецы 9 штук', 190.00, 480, snacks_category_id, 'products/nagets.png', true, false, null),
        ('Нагецы 12 штук', 'Нагецы 12 штук', 250.00, 480, snacks_category_id, 'products/nagets.png', true, false, null),
        ('Стрипсы 6 штук', 'Стрипсы 6 штук', 200.00, 470, snacks_category_id, 'products/strips.png', true, false, null),
        ('Стрипсы 9 штук', 'Стрипсы 9 штук', 270.00, 470, snacks_category_id, 'products/strips.png', true, false, null),
        ('Крылья 6 штук', 'Крылья 6 штук', 210.00, 490, snacks_category_id, 'products/chiken.png', true, false, null),
        ('Крылья 9 штук', 'Крылья 9 штук', 280.00, 490, snacks_category_id, 'products/chiken.png', true, false, null),
        ('Соус Кисло-сладкий', 'Соус Кисло-сладкий', 40.00, 490, snacks_category_id, 'products/soyse_kislo.png', true, false, null),
        ('Соус Сырный', 'Соус Сырный', 40.00, 490, snacks_category_id, 'products/soyse_chees.png', true, false, null),
        ('Соус барбекю', 'Соус барбекю', 40.00, 490, snacks_category_id, 'products/soyse_barbeq.png', true, false, null),
        ('Кетчуп', 'Кетчуп', 40.00, 490, snacks_category_id, 'products/soyse_ketchyp.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Определяем ID категории "Салаты"

DO $$
DECLARE
    salads_category_id INTEGER;
BEGIN
    SELECT id INTO salads_category_id FROM categories WHERE name = 'Закрытые цветовы';

    -- Вставка данных о продуктах с указанием BigDecimal для цены
    INSERT INTO products (name, description, price, weight, category_id, image_url, is_available, is_special_offer, discount_percent)
    VALUES
        ('Закрытая цветова "Классическая"', 'курица, огурцы, помидоры, капуста', 170.00, 170, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Куриная"', 'курица, сыр, помидоры', 170.00, 170, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Охотничья"', 'колбаски, маринованные огурцы, сыр', 170.00, 470, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Сырная"', 'сыр, помидоры', 170.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Гавайская"', 'курица, сыр, ананасы', 180.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Грибы/курица"', 'курица, сыр, грибы, помидоры', 180.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Грибы/ветчина"', 'грибы, ветчина, сыр, помидоры', 180.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Курица/фри"', 'курица, сыр, помидоры, фри, лук, морковь', 190.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null),
        ('Закрытая цветова "Цезарь"', 'курица, сыр, помидоры, салат', 190.00, 490, salads_category_id, 'products/closed_pizza.png', true, false, null)
    ON CONFLICT (name) DO NOTHING;

    -- Обновляем скидочные цены для акционных товаров
    UPDATE products
    SET discounted_price = ROUND(price * (1 - discount_percent / 100.0), 2)
    WHERE is_special_offer = true AND discounted_price IS NULL;
END
$$;

-- Добавление пунктов выдачи
INSERT INTO
    delivery_locations (
        name,
        address,
        latitude,
        longitude,
        is_active
    )
VALUES (
        'Пункт выдачи #1',
        'ул. Шестакова 1Б',
        55.7558,
        37.6173,
        true
    ),
    (
        'Пункт выдачи #2',
        'ул. Шестакова, 1Б',
        55.7539,
        37.6208,
        true
    ) ON CONFLICT (name) DO NOTHING;