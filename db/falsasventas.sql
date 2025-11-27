-- 1. Activar todos los productos (para que el contador de productos deje de dar 0)
UPDATE products SET is_active = 1;

-- 2. Borrar las ventas de prueba anteriores para no confundirnos
DELETE FROM sales WHERE code LIKE 'V-DEMO%';

-- 3. Insertar ventas con FECHA FIJA DE HOY (25 Nov 2025) y de este mes
INSERT INTO sales (code, user_id, subtotal, tax_total, grand_total, status, sold_at) VALUES
-- Ventas de HOY (25 Noviembre)
('V-DEMO-01', 1, 100.00, 18.00, 118.00, 'CONFIRMED', '2025-11-25 10:00:00'),
('V-DEMO-02', 1, 50.00, 9.00, 59.00, 'CONFIRMED', '2025-11-25 14:30:00'),

-- Ventas de AYER (24 Noviembre)
('V-DEMO-03', 1, 200.00, 36.00, 236.00, 'CONFIRMED', '2025-11-24 11:00:00'),

-- Ventas de hace unos días (para que el gráfico se mueva)
('V-DEMO-04', 1, 80.00, 14.40, 94.40, 'CONFIRMED', '2025-11-23 09:00:00'),
('V-DEMO-05', 1, 300.00, 54.00, 354.00, 'CONFIRMED', '2025-11-22 16:20:00'),
('V-DEMO-06', 1, 500.00, 90.00, 590.00, 'CONFIRMED', '2025-11-20 10:00:00');