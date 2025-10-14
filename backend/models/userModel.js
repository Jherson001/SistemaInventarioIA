// backend/models/userModel.js
const db = require('../config/db');

// Busca por email (case/espacios tolerantes)
async function findByEmail(email) {
  const rows = await db.query(
    `SELECT id, full_name, email, password_hash, is_active, last_login_at
       FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1`,
    [email]
  );
  return rows[0] || null;
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
  const rows = await db.query(
    `SELECT id, full_name, email, is_active, last_login_at
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function setLastLogin(id) {
  await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
}

async function getRoles(userId) {
  const rows = await db.query(
    `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?`,
    [userId]
  );
  return rows.map(r => r.name);
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
