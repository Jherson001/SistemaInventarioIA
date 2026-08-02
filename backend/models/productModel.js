// backend/models/productModel.js
const { query } = require('../config/db');

const ProductModel = {
  async findAll({ includeInactive = true } = {}) {
    const sql = includeInactive
      ? `SELECT * FROM products ORDER BY name ASC`
      : `SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC`;
    return await query(sql);
  },

  async findById(id) {
    const sql = `SELECT * FROM products WHERE id = ? LIMIT 1;`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findBySku(sku) {
    const code = String(sku || '').trim();
    if (!code) return null;
    const rows = await query(
      `SELECT * FROM products WHERE sku = ? LIMIT 1`,
      [code]
    );
    return rows[0] || null;
  },

  async findByBarcode(barcode) {
    const code = String(barcode || "").trim();
    if (!code) return null;
    const sql = `
      SELECT * FROM products
      WHERE is_active = 1
        AND (barcode = ? OR sku = ?)
      LIMIT 1;
    `;
    const rows = await query(sql, [code, code]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      sku, barcode = null, name, description = null,
      category_id = null, cost = 0, price = 0,
      min_stock = 0, is_active = 1, stock = 0
    } = data;

    const cleanBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : null;

    const sql = `
      INSERT INTO products
      (sku, barcode, name, description, category_id, cost, price, min_stock, is_active, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
    `;
    const result = await query(sql, [
      sku, cleanBarcode, name, description, category_id, cost, price, min_stock, is_active, stock
    ]);
    return await this.findById(result.insertId);
  },

  async update(id, data) {
    const {
      sku, barcode = null, name, description = null,
      category_id = null, cost = 0, price = 0,
      min_stock = 0, is_active = 1, stock
    } = data;

    const cleanBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : null;
    const current = await this.findById(id);
    const nextStock = stock === undefined || stock === null ? (current?.stock ?? 0) : stock;

    const sql = `
      UPDATE products SET
        sku = ?, barcode = ?, name = ?, description = ?, category_id = ?,
        cost = ?, price = ?, min_stock = ?, is_active = ?, stock = ?, updated_at = NOW()
      WHERE id = ?;
    `;
    await query(sql, [
      sku, cleanBarcode, name, description, category_id,
      cost, price, min_stock, is_active, nextStock, id
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
