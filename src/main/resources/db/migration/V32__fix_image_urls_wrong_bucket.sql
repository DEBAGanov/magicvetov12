-- V32: починка ссылок на изображения с НЕВЕРНЫМ именем бакета.
--
-- Проблема, обнаруженная на проде 2026-10-03. В products.image_url и
-- product_images.image_url лежали абсолютные URL вида
--   https://s3.twcstorage.ru/magiacvetov12/products/<папка>/<файл>.webp
-- тогда как бакет называется f9c8e17a-magicvetov-products. Файлы в нём есть
-- (прямой GET отдаёт 200), а по ссылке из БД — 404. На витрине это выглядело
-- как «товары есть, картинок нет»: Next.js писал в лог
-- «upstream image response failed ... 404» на каждую карточку.
--
-- Откуда взялся magiacvetov12: НЕ из миграций. V25 сеет правильный бакет
-- (f9c8e17a-magicvetov-products), значит эти строки попали в базу правкой
-- данных вне репозитория. Поэтому чиним данные, а не сеялку.
--
-- Почему V31 не помогла. Она срезает префикс по '/products/' и к таким
-- строкам применима, но на проде следов её работы нет — URL остались
-- абсолютными. Разбираться с историей Flyway задним числом смысла мало:
-- эта миграция написана так, что приводит данные к нужному виду независимо
-- от того, выполнялась V31 или нет.
--
-- Идемпотентность: условие LIKE 'http%' перестаёт выполняться после первого
-- прогона, повторный запуск ничего не меняет.

-- 1. Страховка: на случай, если V31 не выполнилась, выравниваем длину колонки.
--    Без этого UPDATE ниже не упрётся в предел (ключи короче исходных URL),
--    но колонка должна быть 500 для единообразия с product_images.
ALTER TABLE products ALTER COLUMN image_url TYPE VARCHAR(500);

-- 2. Приводим абсолютные URL к относительным ключам.
--
-- Берём подстроку начиная с '/products/' и убираем ведущий слэш. Слэши по
-- обе стороны обязательны: имя правильного бакета
-- f9c8e17a-magicvetov-products само заканчивается на "products", и поиск без
-- слэшей срезал бы URL по середине имени бакета.
--
-- Работает для любого хоста и любого (в том числе неверного) имени бакета —
-- именно поэтому не завязываемся на строку 'magiacvetov12'.
UPDATE products
SET image_url = SUBSTRING(image_url FROM STRPOS(image_url, '/products/') + 1)
WHERE image_url LIKE 'http%'
  AND STRPOS(image_url, '/products/') > 0;

UPDATE product_images
SET image_url = SUBSTRING(image_url FROM STRPOS(image_url, '/products/') + 1)
WHERE image_url LIKE 'http%'
  AND STRPOS(image_url, '/products/') > 0;

-- 3. То же для категорий: там свой префикс.
UPDATE categories
SET image_url = SUBSTRING(image_url FROM STRPOS(image_url, '/categories/') + 1)
WHERE image_url LIKE 'http%'
  AND STRPOS(image_url, '/categories/') > 0;

-- 4. Индекс под выборку галереи — страховка, если V31 не выполнилась.
CREATE INDEX IF NOT EXISTS idx_product_images_product_order
    ON product_images (product_id, display_order);
