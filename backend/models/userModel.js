// backend/models/userModel.js
const db = require('../config/db');

function normalizeUser(row) {
  if (!row) return null;
  const { password_hash, password, ...safe } = row;
  return {
    ...safe,
    full_name: row.full_name || row.name || row.email || 'Usuario',
    password_hash: row.password_hash || row.password || '',
    is_active: row.is_active === undefined || row.is_active === null ? 1 : Number(row.is_active),
  };
}

function publicUser(row) {
  if (!row) return null;
  const n = normalizeUser(row);
  delete n.password_hash;
  delete n.password;
  return n;
}

async function findByEmail(email) {
  const rows = await db.query(
    `SELECT * FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1`,
    [email]
  );
  return normalizeUser(rows[0]);
}

async function create({ full_name, email, password_hash, is_active = 1 }) {
  const name = full_name || email;
  // Intento compatible con Aiven (name NOT NULL) y esquema local (full_name)
  try {
    const res = await db.query(
      `INSERT INTO users (full_name, email, password_hash, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, email, password_hash, is_active]
    );
    return findById(res.insertId);
  } catch (err) {
    if (!String(err.message || '').includes('Unknown column') && err.code !== 'ER_NO_DEFAULT_FOR_FIELD') {
      // probar con name
    }
    try {
      const res = await db.query(
        `INSERT INTO users (name, full_name, email, password_hash, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [name, name, email, password_hash, is_active]
      );
      return findById(res.insertId);
    } catch (err2) {
      const res = await db.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES (?, ?, ?)`,
        [name, email, password_hash]
      );
      return findById(res.insertId);
    }
  }
}

async function findById(id) {
  const rows = await db.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
  return normalizeUser(rows[0]);
}

async function listAll() {
  const rows = await db.query(`SELECT * FROM users ORDER BY id ASC`);
  const out = [];
  for (const row of rows || []) {
    const u = publicUser(row);
    u.roles = await getRoles(u.id);
    out.push(u);
  }
  return out;
}

async function setLastLogin(id) {
  try {
    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
  } catch (err) {
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
    return [...new Set(rows.map((r) => r.name).filter(Boolean))];
  } catch (err) {
    console.warn('[users] getRoles:', err.message);
    return [];
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

async function setActive(id, is_active) {
  try {
    await db.query(`UPDATE users SET is_active = ? WHERE id = ?`, [is_active ? 1 : 0, id]);
  } catch (err) {
    throw err;
  }
  return findById(id);
}

const getByEmail = findByEmail;
const touchLogin = setLastLogin;

module.exports = {
  findByEmail,
  create,
  assignRoleByName,
  setLastLogin,
  findById,
  getRoles,
  listAll,
  setActive,
  publicUser,
  getByEmail,
  touchLogin,
};
