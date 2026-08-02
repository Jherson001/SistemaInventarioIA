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

    const hasName = await columnExists('users', 'name');
    const hasFullName = await columnExists('users', 'full_name');
    const hasIsActive = await columnExists('users', 'is_active');
    const hasLastLogin = await columnExists('users', 'last_login_at');
    const hasPassHash = await columnExists('users', 'password_hash');
    const hasPassword = await columnExists('users', 'password');

    // --- users columnas opcionales ---
    if (!hasFullName) {
      console.log('⚙️  Agregando users.full_name');
      await query(`ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL`);
    }

    if (!hasIsActive) {
      console.log('⚙️  Agregando users.is_active');
      await query(`ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`);
    }

    if (!hasLastLogin) {
      console.log('⚙️  Agregando users.last_login_at');
      await query(`ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL`);
    }

    if (!hasPassHash && !hasPassword) {
      console.log('⚙️  Agregando users.password_hash');
      await query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`);
    }

    // --- categories (Aiven a menudo viene incompleta) ---
    if (await tableExists('categories')) {
      if (!(await columnExists('categories', 'description'))) {
        console.log('⚙️  Agregando categories.description');
        await query(`ALTER TABLE categories ADD COLUMN description VARCHAR(255) NULL`);
      }
      if (!(await columnExists('categories', 'is_active'))) {
        console.log('⚙️  Agregando categories.is_active');
        await query(`ALTER TABLE categories ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`);
      }
      if (!(await columnExists('categories', 'created_at'))) {
        console.log('⚙️  Agregando categories.created_at');
        await query(`ALTER TABLE categories ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`);
      }
      if (!(await columnExists('categories', 'updated_at'))) {
        console.log('⚙️  Agregando categories.updated_at');
        await query(`ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      }
    } else {
      console.log('⚙️  Creando tabla categories');
      await query(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description VARCHAR(255) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `);
    }


    // sincronizar name <-> full_name si ambas existen
    try {
      if (hasName) {
        await query(`
          UPDATE users
          SET full_name = COALESCE(NULLIF(full_name, ''), NULLIF(name, ''), 'Administrador')
          WHERE full_name IS NULL OR full_name = ''
        `);
      } else {
        await query(`
          UPDATE users
          SET full_name = COALESCE(NULLIF(full_name, ''), 'Administrador')
          WHERE full_name IS NULL OR full_name = ''
        `);
      }
    } catch (e) {
      console.warn('sync nombres:', e.message);
    }

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

    // --- admin bootstrap (compatible con columnas name / full_name) ---
    const bcrypt = require('bcryptjs');
    const ADMIN_EMAIL = 'admin@local';
    const ADMIN_PASS = process.env.ADMIN_BOOTSTRAP_PASSWORD || '123456';
    const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASS, 10);
    const resetAdmin = String(process.env.RESET_ADMIN_PASSWORD || 'false').toLowerCase() === 'true';
    const passCol = (await columnExists('users', 'password_hash'))
      ? 'password_hash'
      : (await columnExists('users', 'password') ? 'password' : 'password_hash');

    // refrescar flags tras posibles ALTER
    const colName = await columnExists('users', 'name');
    const colFull = await columnExists('users', 'full_name');
    const colActive = await columnExists('users', 'is_active');

    let adminRow = (
      await query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`, [ADMIN_EMAIL])
    )[0];

    if (!adminRow) {
      console.log(`⚙️  Creando ${ADMIN_EMAIL} (password: ${ADMIN_PASS})`);
      const cols = ['email', passCol];
      const vals = [ADMIN_EMAIL, ADMIN_HASH];

      // Aiven exige `name` NOT NULL
      if (colName) {
        cols.push('name');
        vals.push('Administrador');
      }
      if (colFull) {
        cols.push('full_name');
        vals.push('Administrador');
      }
      if (colActive) {
        cols.push('is_active');
        vals.push(1);
      }

      const placeholders = cols.map(() => '?').join(', ');
      await query(
        `INSERT INTO users (${cols.join(', ')}) VALUES (${placeholders})`,
        vals
      );
      adminRow = (
        await query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`, [ADMIN_EMAIL])
      )[0];
    } else if (resetAdmin) {
      console.log(`⚙️  Reseteando password de ${ADMIN_EMAIL} a: ${ADMIN_PASS}`);
      const sets = [`${passCol} = ?`];
      const vals = [ADMIN_HASH];
      if (colName) {
        sets.push(`name = COALESCE(NULLIF(name, ''), 'Administrador')`);
      }
      if (colFull) {
        sets.push(`full_name = COALESCE(NULLIF(full_name, ''), 'Administrador')`);
      }
      if (colActive) {
        sets.push('is_active = 1');
      }
      vals.push(adminRow.id);
      await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    }

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

    const sample = await query(`SELECT id, email FROM users ORDER BY id ASC LIMIT 5`);
    console.log('ℹ️  Usuarios en BD:', sample.map((u) => u.email).join(', ') || '(ninguno)');
    console.log('✅ ensureSchema OK');
  } catch (err) {
    console.error('⚠️  ensureSchema:', err.message);
  }
}

module.exports = { ensureSchema };
