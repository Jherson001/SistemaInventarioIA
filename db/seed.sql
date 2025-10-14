-- Roles
INSERT INTO roles (name, description) VALUES
  ('admin','Administrador del sistema'),
  ('manager','Gerente'),
  ('cashier','Cajero')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Usuario admin (la contraseña real la configuraremos en el backend con bcrypt)
INSERT INTO users (full_name, email, password_hash, is_active)
VALUES ('Administrador', 'admin@local', '$2b$10$8DE7eQZNc43AZqghWasWi.HaVkljd62DjNn0gkeQyMU/C./Rr4D42', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Asignar rol admin
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email='admin@local' AND r.name='admin';

-- Categorías
INSERT INTO categories (name, description) VALUES
  ('Abarrotes', 'Productos de abarrotes'),
  ('Bebidas', 'Bebidas varias'),
  ('Limpieza', 'Artículos de limpieza')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Productos base (ejemplo)
INSERT INTO products (sku, barcode, name, description, category_id, cost, price, min_stock, is_active)
VALUES
  ('ARROZ-1KG', '7750123456789', 'Arroz Costeño 1Kg', 'Arroz superior', (SELECT id FROM categories WHERE name='Abarrotes'), 3.20, 4.50, 10, 1),
  ('AZUCAR-1KG', '7750987654321', 'Azúcar Rubia 1Kg', 'Azúcar rubia', (SELECT id FROM categories WHERE name='Abarrotes'), 2.80, 4.20, 12, 1),
  ('GASEOSA-500', '7750001112223', 'Gaseosa 500ml', 'Sabor cola', (SELECT id FROM categories WHERE name='Bebidas'), 1.80, 3.00, 15, 1),
  ('LEJIA-1L', '7750003334445', 'Lejía 1L', 'Desinfectante', (SELECT id FROM categories WHERE name='Limpieza'), 2.10, 3.50, 8, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), cost=VALUES(cost);

-- Stock inicial (entradas)
INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, note, moved_at)
SELECT id, 'IN', 50, 'SEED:STOCK_INICIAL', (SELECT id FROM users WHERE email='admin@local'), 'Carga inicial', NOW()
FROM products;
