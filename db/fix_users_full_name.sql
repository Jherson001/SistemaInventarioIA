-- ============================================================
-- FIX LOGIN CLOUD: Unknown column 'full_name' in 'field list'
-- Ejecutar en la MISMA base que usa Render (Aiven / MySQL nube)
-- NO en XAMPP local (esa ya tiene full_name).
-- ============================================================

-- 1) Ver cómo está la tabla ahora
DESCRIBE users;

-- 2) Agregar full_name si no existe
-- Si este comando falla con "Duplicate column", ya estaba bien.
ALTER TABLE users
  ADD COLUMN full_name VARCHAR(150) NULL AFTER id;

-- 3) Rellenar nombres vacíos
UPDATE users
SET full_name = COALESCE(NULLIF(full_name, ''), 'Administrador')
WHERE full_name IS NULL OR full_name = '';

-- 4) (Opcional) dejarla NOT NULL como en el schema del proyecto
ALTER TABLE users
  MODIFY COLUMN full_name VARCHAR(150) NOT NULL;

-- 5) Verificar usuario admin
SELECT id, full_name, email, is_active FROM users WHERE email = 'admin@local';

-- Si no hay admin, créalo (password = 123456, mismo hash del seed):
-- INSERT INTO users (full_name, email, password_hash, is_active)
-- VALUES (
--   'Administrador',
--   'admin@local',
--   '$2b$10$8DE7eQZNc43AZqghWasWi.HaVkljd62DjNn0gkeQyMU/C./Rr4D42',
--   1
-- );
