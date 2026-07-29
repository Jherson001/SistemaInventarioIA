// backend/models/categoryModel.js
const db = require('../config/db');

function normalize(row) {
  if (!row) return null;
  return {
    ...row,
    description: row.description ?? '',
    is_active: row.is_active === undefined || row.is_active === null ? 1 : Number(row.is_active),
  };
}

const list = async ({ q = '', page = 1, pageSize = 20 }) => {
  const off = (page - 1) * pageSize;
  const like = `%${q}%`;

  // SELECT * evita romper si faltan columnas en cloud
  const rowsRaw = await db.query(
    `SELECT *
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
  return { rows: (rowsRaw || []).map(normalize), total };
};

const getById = async (id) => {
  const rows = await db.query(`SELECT * FROM categories WHERE id = ?`, [id]);
  return normalize(rows[0]);
};

const create = async ({ name, description = null, is_active = 1 }) => {
  try {
    const result = await db.query(
      `INSERT INTO categories(name, description, is_active) VALUES (?, ?, ?)`,
      [name, description, is_active]
    );
    return getById(result.insertId);
  } catch (err) {
    // Fallback si description / is_active aún no existen
    if (String(err.message || '').includes('Unknown column')) {
      const result = await db.query(`INSERT INTO categories(name) VALUES (?)`, [name]);
      return getById(result.insertId);
    }
    throw err;
  }
};

const update = async (id, { name, description, is_active }) => {
  try {
    await db.query(
      `UPDATE categories SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name ?? null,
        description ?? null,
        typeof is_active === 'number' ? is_active : null,
        id,
      ]
    );
  } catch (err) {
    if (String(err.message || '').includes('Unknown column')) {
      await db.query(`UPDATE categories SET name = COALESCE(?, name) WHERE id = ?`, [
        name ?? null,
        id,
      ]);
    } else {
      throw err;
    }
  }
  return getById(id);
};

const remove = async (id) => {
  await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
};

module.exports = { list, getById, create, update, remove };
