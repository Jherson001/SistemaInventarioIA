const { query } = require('../config/db');

async function columnExists(table, column) {
  const rows = await query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return Array.isArray(rows) && rows.length > 0;
}

async function tableExists(table) {
  const rows = await query(`SHOW TABLES LIKE ?`, [table]);
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Alinea la BD cloud (a menudo incompleta) con lo que pide el código.
 * Idempotente: se puede correr en cada arranque.
 */
async function ensureSchema() {
  try {
    if (!(await tableExists('users'))) {
      console.error('⚠️  No existe la tabla users');
      return;
    }

    // --- users ---
    if (!(await columnExists('users', 'full_name'))) {
      console.log('⚙️  Agregando users.full_name');
      await query(`ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER id`);
    }

    if (!(await columnExists('users', 'is_active'))) {
      console.log('⚙️  Agregando users.is_active');
      await query(`ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`);
    }

    if (!(await columnExists('users', 'last_login_at'))) {
      console.log('⚙️  Agregando users.last_login_at');
      await query(`ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL`);
    }

    if (!(await columnExists('users', 'password_hash'))) {
      // Algunas BDs viejas usan "password"
      if (await columnExists('users', 'password')) {
        console.log('⚙️  Renombrando users.password -> password_hash');
        await query(`ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL`);
      } else {
        console.log('⚙️  Agregando users.password_hash');
        await query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`);
      }
    }

    await query(`
      UPDATE users
      SET full_name = COALESCE(NULLIF(full_name, ''), 'Administrador')
      WHERE full_name IS NULL OR full_name = ''
    `);

    // --- roles mínimos ---
    if (!(await tableExists('roles'))) {
      console.log('⚙️  Creando tabla roles');
      await query(`
        CREATE TABLE roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description VARCHAR(150) NULL
        ) ENGINE=InnoDB
      `);
    }

    if (!(await tableExists('user_roles'))) {
      console.log('⚙️  Creando tabla user_roles');
      await query(`
        CREATE TABLE user_roles (
          user_id INT NOT NULL,
          role_id INT NOT NULL,
          PRIMARY KEY (user_id, role_id)
        ) ENGINE=InnoDB
      `);
    }

    await query(`
      INSERT IGNORE INTO roles (name, description) VALUES
        ('admin','Administrador del sistema'),
        ('manager','Gerente'),
        ('cashier','Cajero')
    `);

    // --- admin bootstrap (cloud) ---
    // Por defecto resetea admin@local a 123456 hasta que pongas RESET_ADMIN_PASSWORD=false en Render
    const bcrypt = require('bcryptjs');
    const ADMIN_EMAIL = 'admin@local';
    const ADMIN_PASS = process.env.ADMIN_BOOTSTRAP_PASSWORD || '123456';
    const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASS, 10);
    const resetAdmin = String(process.env.RESET_ADMIN_PASSWORD || 'true').toLowerCase() !== 'false';

    let adminRow = (
      await query(`SELECT id, password_hash FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`, [ADMIN_EMAIL])
    )[0];

    if (!adminRow) {
      console.log(`⚙️  Creando ${ADMIN_EMAIL} (password: ${ADMIN_PASS})`);
      try {
        await query(
          `INSERT INTO users (full_name, email, password_hash, is_active)
           VALUES ('Administrador', ?, ?, 1)`,
          [ADMIN_EMAIL, ADMIN_HASH]
        );
      } catch (e) {
        // Si faltan columnas, intento mínimo
        console.warn('Insert admin con columnas mínimas:', e.message);
        await query(
          `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
          [ADMIN_EMAIL, ADMIN_HASH]
        );
      }
      adminRow = (
        await query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`, [ADMIN_EMAIL])
      )[0];
    } else if (resetAdmin) {
      console.log(`⚙️  Reseteando password de ${ADMIN_EMAIL} a: ${ADMIN_PASS}`);
      try {
        await query(
          `UPDATE users
              SET password_hash = ?,
                  full_name = COALESCE(NULLIF(full_name, ''), 'Administrador'),
                  is_active = 1
            WHERE id = ?`,
          [ADMIN_HASH, adminRow.id]
        );
      } catch (e) {
        await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [ADMIN_HASH, adminRow.id]);
        console.warn('Reset admin (mínimo):', e.message);
      }
    }

    if (adminRow?.id || true) {
      const fresh = (
        await query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`, [ADMIN_EMAIL])
      )[0];
      const role = await query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
      if (fresh?.id && role[0]?.id) {
        await query(
          `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [fresh.id, role[0].id]
        );
      }
    }

    console.log('✅ ensureSchema OK');
  } catch (err) {
    console.error('⚠️  ensureSchema:', err.message);
  }
}

module.exports = { ensureSchema };
