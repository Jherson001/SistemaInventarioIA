// backend/models/categoryModel.js (versión para 'mysql' con promisify)
const db = require('../config/db');

const list = async ({ q = '', page = 1, pageSize = 20 }) => {
  const off = (page - 1) * pageSize;
  const like = `%${q}%`;

  const rows = await db.query(
    `SELECT id, name, description, is_active, created_at, updated_at
     FROM categories
     WHERE (? = '' OR name LIKE ?)
     ORDER BY name ASC
     LIMIT ? OFFSET ?`,
    [q, like, pageSize, off]
  );

  const countRows = await db.query(
    `SELECT COUNT(*) AS total
       FROM categories
      WHERE (? = '' OR name LIKE ?)`,
    [q, like]
  );

  const total = countRows[0]?.total ?? 0;
  return { rows, total };
};

const getById = async (id) => {
  const rows = await db.query(`SELECT * FROM categories WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async ({ name, description = null, is_active = 1 }) => {
  const result = await db.query(
    `INSERT INTO categories(name, description, is_active) VALUES (?, ?, ?)`,
    [name, description, is_active]
  );
  return getById(result.insertId);
};

const update = async (id, { name, description, is_active }) => {
  await db.query(
    `UPDATE categories SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [
      name ?? null,
      description ?? null,
      (typeof is_active === 'number' ? is_active : null),
      id
    ]
  );
  return getById(id);
};

const remove = async (id) => {
  await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
};

module.exports = { list, getById, create, update, remove };
