-- Insertamos items simulados para las ventas que ya creamos
-- Asumimos que tienes productos con ID 1, 2, 3, etc.
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total, line_tax) VALUES
((SELECT id FROM sales WHERE code = 'V-DEMO-01' LIMIT 1), 1, 10, 10.00, 100.00, 18.00),
((SELECT id FROM sales WHERE code = 'V-DEMO-02' LIMIT 1), 2, 5, 10.00, 50.00, 9.00),
((SELECT id FROM sales WHERE code = 'V-DEMO-03' LIMIT 1), 1, 20, 10.00, 200.00, 36.00),
((SELECT id FROM sales WHERE code = 'V-DEMO-04' LIMIT 1), 3, 8, 10.00, 80.00, 14.40),
((SELECT id FROM sales WHERE code = 'V-DEMO-05' LIMIT 1), 2, 15, 10.00, 150.00, 27.00),
((SELECT id FROM sales WHERE code = 'V-DEMO-06' LIMIT 1), 1, 30, 10.00, 300.00, 54.00),
((SELECT id FROM sales WHERE code = 'V-DEMO-07' LIMIT 1), 4, 50, 10.00, 500.00, 90.00);