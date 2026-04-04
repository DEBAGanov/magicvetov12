-- Исправление типа id в таблице product_images (SERIAL -> BIGSERIAL)
-- для соответствия с Entity ProductImage (Long id)

ALTER TABLE product_images ALTER COLUMN id TYPE BIGINT;
