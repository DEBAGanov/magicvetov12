-- Обновляем статусы заказов для цветочного магазина
-- Заменяем COOKING на PREPARING

UPDATE order_statuses SET name = 'PREPARING', description = 'Букет составляется' WHERE name = 'COOKING';

-- Добавляем дополнительные статусы если нужно
INSERT INTO order_statuses (name, description)
SELECT 'OUT_FOR_DELIVERY', 'Курьер везет заказ'
WHERE NOT EXISTS (SELECT 1 FROM order_statuses WHERE name = 'OUT_FOR_DELIVERY');
