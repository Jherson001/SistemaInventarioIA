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

    // Asignar admin al usuario admin@local si existe y no tiene roles
    const admins = await query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = 'admin@local' LIMIT 1`);
    if (admins[0]?.id) {
      const role = await query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
      if (role[0]?.id) {
        await query(
          `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [admins[0].id, role[0].id]
        );
      }
    }

    console.log('✅ ensureSchema OK');
  } catch (err) {
    console.error('⚠️  ensureSchema:', err.message);
  }
}

module.exports = { ensureSchema };
