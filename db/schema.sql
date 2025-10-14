-- Base de datos: crea si no existe (opcional; también puedes crearla manualmente)
CREATE DATABASE inventorydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- LUEGO DE CREAR, SELECCIONAN LA BASE DE DATOS inventorydb y pegan todo lo que sigue.. y despues ejecuta el archivo seed.sql

-- === Categorías ===
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- === Proveedores (opcional) ===
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  document_number VARCHAR(30) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(120) NULL,
  address VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_suppliers_doc (document_number),
  UNIQUE KEY uq_suppliers_email (email),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- === Productos ===
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(60) NOT NULL,
  barcode VARCHAR(60) NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(255) NULL,
  category_id INT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  min_stock INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_products_sku (sku),
  UNIQUE KEY uq_products_barcode (barcode),
  KEY idx_products_name (name),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE products
  ADD COLUMN reorder_point INT NOT NULL DEFAULT 0 AFTER min_stock,
  ADD COLUMN safety_stock INT NOT NULL DEFAULT 0 AFTER reorder_point,
  ADD COLUMN lead_time_days INT NOT NULL DEFAULT 0 AFTER safety_stock;

-- === Clientes ===
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  document_type ENUM('DNI','RUC','CE','PASSPORT') DEFAULT 'DNI',
  document_number VARCHAR(20) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(120) NULL,
  address VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_customers_doc (document_number),
  UNIQUE KEY uq_customers_email (email),
  KEY idx_customers_name (full_name),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- === Usuarios y Roles ===
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(150) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- === Ventas (cabecera) ===
CREATE TABLE IF NOT EXISTS sales (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,           -- código interno único
  user_id INT NOT NULL,
  customer_id INT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'PEN',
  status ENUM('CONFIRMED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('CASH','CARD','YAPE','PLIN','TRANSFER') DEFAULT 'CASH',
  note VARCHAR(255) NULL,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sales_sold_at (sold_at),
  UNIQUE KEY uq_sales_code (code),
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- === Ventas (detalle) ===
CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,       -- precio de venta al momento
  unit_cost DECIMAL(12,2) NOT NULL,        -- costo registrado al momento
  discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_rate_applied DECIMAL(5,4) NOT NULL DEFAULT 0.18, -- IGV 18%
  line_subtotal DECIMAL(12,2) NOT NULL,    -- (unit_price*quantity)-discount
  line_tax DECIMAL(12,2) NOT NULL,         -- line_subtotal*tax_rate_applied
  line_total DECIMAL(12,2) NOT NULL,       -- line_subtotal+line_tax
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  KEY idx_sale_items_sale (sale_id),
  KEY idx_sale_items_product (product_id)
) ENGINE=InnoDB;

-- === Movimientos de stock ===
CREATE TABLE IF NOT EXISTS stock_moves (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  move_type ENUM('IN','OUT','ADJUST') NOT NULL,
  quantity INT NOT NULL,       -- valor absoluto; el signo lo define move_type
  reference VARCHAR(80) NULL,  -- p.ej. SALE:123, SEED:INIT, AJUSTE
  user_id INT NULL,
  note VARCHAR(255) NULL,
  moved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_moves_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_stock_moves_user FOREIGN KEY (user_id) REFERENCES users(id),
  KEY idx_stock_moves_product (product_id),
  KEY idx_stock_moves_moved_at (moved_at)
) ENGINE=InnoDB;

-- === Vista de stock actual ===
DROP VIEW IF EXISTS vw_stock_current;
CREATE VIEW vw_stock_current AS
SELECT
  p.id AS product_id,
  p.sku,
  p.name,
  COALESCE(SUM(CASE
    WHEN sm.move_type = 'IN' THEN sm.quantity
    WHEN sm.move_type = 'OUT' THEN -sm.quantity
    WHEN sm.move_type = 'ADJUST' THEN sm.quantity   -- define +/- en tus ajustes
    ELSE 0 END), 0) AS stock
FROM products p
LEFT JOIN stock_moves sm ON sm.product_id = p.id
GROUP BY p.id, p.sku, p.name;

-- === Vista: salud de stock (semáforo + días de cobertura) ===
DROP VIEW IF EXISTS vw_stock_health;
CREATE VIEW vw_stock_health AS
WITH demand AS (
  SELECT
    si.product_id,
    COALESCE(SUM(si.quantity) / NULLIF(DATEDIFF(MAX(s.sold_at), MIN(s.sold_at)), 0), 0) AS avg_daily_sales
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id AND s.status = 'CONFIRMED'
  GROUP BY si.product_id
)
SELECT
  p.id AS product_id,
  p.sku,
  p.name,
  COALESCE(v.stock, 0) AS stock,
  p.min_stock,
  p.reorder_point,
  p.safety_stock,
  p.lead_time_days,
  COALESCE(d.avg_daily_sales, 0) AS avg_daily_sales,
  CASE
    WHEN COALESCE(v.stock, 0) <= 0 THEN 'SIN_STOCK'
    WHEN COALESCE(v.stock, 0) <= p.safety_stock THEN 'CRITICO'
    WHEN COALESCE(v.stock, 0) <= GREATEST(p.min_stock, p.reorder_point) THEN 'BAJO'
    ELSE 'OK'
  END AS stock_status,
  CASE
    WHEN COALESCE(d.avg_daily_sales, 0) = 0 THEN NULL
    ELSE CEIL(COALESCE(v.stock, 0) / d.avg_daily_sales)
  END AS days_of_cover
FROM products p
LEFT JOIN vw_stock_current v ON v.product_id = p.id
LEFT JOIN demand d ON d.product_id = p.id;

-- Consulta “lista de reposición”:
SELECT
  p.id, p.sku, p.name,
  COALESCE(v.stock, 0) AS stock,
  p.safety_stock,
  p.lead_time_days,
  COALESCE(d.avg_daily_sales, 0) AS avg_daily_sales,
  GREATEST( CEIL(COALESCE(d.avg_daily_sales,0) * p.lead_time_days) + p.safety_stock - COALESCE(v.stock,0), 0) AS suggested_qty
FROM products p
LEFT JOIN vw_stock_current v ON v.product_id = p.id
LEFT JOIN (
  SELECT si.product_id,
         COALESCE(SUM(si.quantity) / NULLIF(DATEDIFF(MAX(s.sold_at), MIN(s.sold_at)), 0), 0) AS avg_daily_sales
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id AND s.status = 'CONFIRMED'
  GROUP BY si.product_id
) d ON d.product_id = p.id
WHERE COALESCE(v.stock, 0) <= GREATEST(p.reorder_point, p.safety_stock);
