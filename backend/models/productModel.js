// backend/models/productModel.js
const { query } = require('../config/db');

const ProductModel = {
  async findAll() {
    // Simplificado: Usamos la columna física 'stock' que ya existe en la tabla
    const sql = `
      SELECT * FROM products 
      WHERE is_active = 1
      ORDER BY created_at DESC;
    `;
    return await query(sql);
  },

  async findById(id) {
    const sql = `SELECT * FROM products WHERE id = ? LIMIT 1;`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      sku, barcode = null, name, description = null,
      category_id = null, cost = 0, price = 0,
      min_stock = 0, is_active = 1, stock = 0 // Agregado stock inicial
    } = data;

    const sql = `
      INSERT INTO products
      (sku, barcode, name, description, category_id, cost, price, min_stock, is_active, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
    `;
    const result = await query(sql, [
      sku, barcode, name, description, category_id, cost, price, min_stock, is_active, stock
    ]);
    return await this.findById(result.insertId);
  },

  async update(id, data) {
    const {
      sku, barcode = null, name, description = null,
      category_id = null, cost = 0, price = 0,
      min_stock = 0, is_active = 1, stock = 0
    } = data;

    const sql = `
      UPDATE products SET
        sku = ?, barcode = ?, name = ?, description = ?, category_id = ?,
        cost = ?, price = ?, min_stock = ?, is_active = ?, stock = ?, updated_at = NOW()
      WHERE id = ?;
    `;
    await query(sql, [
      sku, barcode, name, description, category_id,
      cost, price, min_stock, is_active, stock, id
    ]);
    return await this.findById(id);
  },

  async remove(id) {
    const sql = `UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ?;`;
    await query(sql, [id]);
    return { id, is_active: 0 };
  }
};

module.exports = ProductModel;