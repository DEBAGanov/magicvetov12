-- V31: приведение ссылок на изображения к единому виду.
--
-- Задача 2.1 из docs/ADMIN_PANEL_PLAN.md.
--
-- Проблема (§3.1 плана). В products.image_url и product_images.image_url лежат
-- значения двух разных видов:
--   относительный ключ:  products/uuid.jpg
--   абсолютный URL:      https://s3.twcstorage.ru/f9c8e17a-magicvetov-products/products/...
-- Второй вид приехал из сеяных данных V25/V30. При этом
-- AdminProductService.mapToDTO безусловно вызывает getPublicUrl(imageUrl),
-- который приклеивает префикс ещё раз, и получается
-- https://s3.twcstorage.ru/bucket/https://s3.twcstorage.ru/... — в форме
-- редактирования битая картинка.
--
-- Решение: в БД храним ТОЛЬКО относительный ключ, публичный URL собираем на
-- чтении. Тогда переезд бакета или подключение CDN не потребуют UPDATE по всем
-- товарам, а getPublicUrl остаётся единственным местом, которое знает адреса.
--
-- Идемпотентность: условие LIKE 'http%' означает, что повторный прогон (или
-- прогон на уже чистой базе) ничего не изменит.

-- 1. Выравниваем длину колонки.
-- products.image_url был VARCHAR(255), а product_images.image_url — VARCHAR(500),
-- и DTO разрешает 500. Ключи короткие, но с длинными именами из сеяных данных
-- 255 символов упирается в предел (§3.10 плана).
ALTER TABLE products ALTER COLUMN image_url TYPE VARCHAR(500);

-- 2. Срезаем префикс публичного URL.
--
-- Берём подстроку начиная с '/products/' и убираем ведущий слэш: так работает
-- для любого хоста и любого имени бакета, не завязываясь на конкретные
-- значения из конфига. Строки, где '/products/' не встречается, не трогаем —
-- для них STRPOS вернёт 0 и условие не выполнится.
--
-- Слэши по обе стороны обязательны. Имя бакета —
-- f9c8e17a-magicvetov-products — само заканчивается на "products", и поиск
-- без слэшей нашёл бы его (позиция 45 вместо 53), срезав URL по середине
-- имени бакета. С '/products/' совпадает именно сегмент пути.
UPDATE products
SET image_url = SUBSTRING(image_url FROM STRPOS(image_url, '/products/') + 1)
WHERE image_url LIKE 'http%'
  AND STRPOS(image_url, '/products/') > 0;

UPDATE product_images
SET image_url = SUBSTRING(image_url FROM STRPOS(image_url, '/products/') + 1)
WHERE image_url LIKE 'http%'
  AND STRPOS(image_url, '/products/') > 0;

-- 3. Индекс под выборку галереи.
--
-- Product.additionalImages помечен @OrderBy по display_order, то есть галерея
-- читается с сортировкой при каждом открытии карточки и формы.
CREATE INDEX IF NOT EXISTS idx_product_images_product_order
    ON product_images (product_id, display_order);
