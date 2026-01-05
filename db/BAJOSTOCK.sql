SELECT 
    name AS Producto, 
    min_stock AS Minimo_Configurado, -- <--- ESTA ES LA CLAVE
    (SELECT current_stock FROM vw_stock_current WHERE product_id = products.id) AS Stock_Real
FROM products 
WHERE name IN ('Cerveza', 'LIMON', 'Arroz Costeño 1Kg', 'Lejía 1L');