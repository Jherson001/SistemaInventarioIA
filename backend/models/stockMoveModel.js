const { query } = require('../config/db');

const StockMoveModel = {
  async list({ product_id } = {}) {
    let sql = `
      SELECT sm.*, p.sku, p.name
      FROM stock_moves sm
      JOIN products p ON p.id = sm.product_id
    `;
    const params = [];
    if (product_id) { sql += ` WHERE sm.product_id = ?`; params.push(product_id); }
    sql += ` ORDER BY sm.moved_at DESC, sm.id DESC LIMIT 200`;
    return await query(sql, params);
  },

  async currentStock(product_id) {
    const rows = await query(`SELECT stock FROM vw_stock_current WHERE product_id = ?`, [product_id]);
    return rows[0]?.stock ?? 0;
  },

  async productExists(product_id) {
    const rows = await query(`SELECT id FROM products WHERE id = ?`, [product_id]);
    return !!rows[0];
  },

  async create({ product_id, move_type, quantity, reference, user_id, note }) {
    const sql = `
      INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, note, moved_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await query(sql, [product_id, move_type, quantity, reference, user_id, note || null]);
    const rows = await query(`SELECT * FROM stock_moves WHERE id = ?`, [result.insertId]);
    return rows[0] || null;
  }
};

module.exports = StockMoveModel;
