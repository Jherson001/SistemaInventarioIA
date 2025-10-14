// backend/models/customerModel.js
const db = require('../config/db');

async function list({ q = '', page = 1, pageSize = 20 }) {
  const off = (page - 1) * pageSize;
  const like = `%${q}%`;

  const rows = await db.query(
    `SELECT id, full_name, document_type, document_number, phone, email, address,
            is_active, updated_at
       FROM customers
      WHERE (? = '' OR full_name LIKE ? OR document_number LIKE ? OR email LIKE ?)
      ORDER BY full_name ASC
      LIMIT ? OFFSET ?`,
    [q, like, like, like, pageSize, off]
  );

  const cnt = await db.query(
    `SELECT COUNT(*) AS total
       FROM customers
      WHERE (? = '' OR full_name LIKE ? OR document_number LIKE ? OR email LIKE ?)`,
    [q, like, like, like]
  );

  const total = cnt[0]?.total ?? 0;
  return { rows, total };
}

async function getById(id) {
  const rows = await db.query(
    `SELECT id, full_name, document_type, document_number, phone, email, address,
            is_active, created_at, updated_at
       FROM customers
      WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ full_name, document_type = 'DNI', document_number = null, phone = null, email = null, address = null, is_active = 1 }) {
  const res = await db.query(
    `INSERT INTO customers (full_name, document_type, document_number, phone, email, address, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [full_name, document_type, document_number, phone, email, address, is_active]
  );
  return getById(res.insertId);
}

async function update(id, { full_name, document_type, document_number, phone, email, address, is_active }) {
  await db.query(
    `UPDATE customers SET
       full_name      = COALESCE(?, full_name),
       document_type  = COALESCE(?, document_type),
       document_number= COALESCE(?, document_number),
       phone          = COALESCE(?, phone),
       email          = COALESCE(?, email),
       address        = COALESCE(?, address),
       is_active      = COALESCE(?, is_active)
     WHERE id = ?`,
    [full_name, document_type, document_number, phone, email, address, is_active, id]
  );
  return getById(id);
}

async function remove(id) {
  await db.query(`DELETE FROM customers WHERE id = ?`, [id]);
}

module.exports = { list, getById, create, update, remove };
