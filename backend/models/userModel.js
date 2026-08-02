// backend/models/userModel.js
const db = require('../config/db');

function normalizeUser(row) {
  if (!row) return null;
  return {
    ...row,
    full_name: row.full_name || row.name || row.email || 'Usuario',
    password_hash: row.password_hash || row.password || '',
    // Si la columna no existe, SELECT * no la trae → asumimos activo
    is_active: row.is_active === undefined || row.is_active === null ? 1 : Number(row.is_active),
  };
}

async function findByEmail(email) {
  // SELECT * evita romper si faltan columnas (BD cloud incompleta)
  const rows = await db.query(
    `SELECT * FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1`,
    [email]
  );
  return normalizeUser(rows[0]);
}

async function create({ full_name, email, password_hash, is_active = 1 }) {
  const res = await db.query(
    `INSERT INTO users (full_name, email, password_hash, is_active)
     VALUES (?, ?, ?, ?)`,
    [full_name, email, password_hash, is_active]
  );
  return findById(res.insertId);
}

async function findById(id) {
  const rows = await db.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
  return normalizeUser(rows[0]);
}

async function setLastLogin(id) {
  try {
    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
  } catch (err) {
    // Columna puede no existir aún en cloud
    console.warn('[users] setLastLogin omitido:', err.message);
  }
}

async function getRoles(userId) {
  try {
    const rows = await db.query(
      `SELECT DISTINCT r.name
         FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = ?`,
      [userId]
    );
    const roles = [...new Set(rows.map((r) => r.name).filter(Boolean))];
    return roles.length ? roles : ['admin'];
  } catch (err) {
    console.warn('[users] getRoles fallback admin:', err.message);
    return ['admin'];
  }
}

async function assignRoleByName(userId, roleName) {
  let r = await db.query(`SELECT id FROM roles WHERE name = ? LIMIT 1`, [roleName]);
  let roleId = r[0]?.id;
  if (!roleId) {
    const ins = await db.query(`INSERT INTO roles (name) VALUES (?)`, [roleName]);
    roleId = ins.insertId;
  }
  await db.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleId]);
}

const getByEmail = findByEmail;
const touchLogin = setLastLogin;

module.exports = {
  findByEmail, create, assignRoleByName, setLastLogin, findById, getRoles,
  getByEmail, touchLogin,
};
