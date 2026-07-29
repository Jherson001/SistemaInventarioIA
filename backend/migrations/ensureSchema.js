const { query } = require('../config/db');

/**
 * Migraciones ligeras al arrancar (idempotentes).
 * Evita errores como: Unknown column 'full_name' in 'field list'
 */
async function ensureSchema() {
  try {
    const cols = await query(`SHOW COLUMNS FROM users LIKE 'full_name'`);
    if (!cols || cols.length === 0) {
      console.log('⚙️  Migración: agregando users.full_name ...');
      await query(`ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER id`);
      await query(`
        UPDATE users
        SET full_name = COALESCE(NULLIF(full_name, ''), 'Administrador')
        WHERE full_name IS NULL OR full_name = ''
      `);
      console.log('✅ users.full_name listo');
    } else {
      console.log('✅ Schema users.full_name OK');
    }
  } catch (err) {
    console.error('⚠️  ensureSchema:', err.message);
  }
}

module.exports = { ensureSchema };
