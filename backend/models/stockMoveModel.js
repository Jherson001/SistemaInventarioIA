const { pool, query, getConnection } = require('../config/db');

const StockMoveModel = {
  async list({ product_id } = {}) {
    let sql = `
      SELECT sm.*, p.sku, p.name, p.barcode
      FROM stock_moves sm
      JOIN products p ON p.id = sm.product_id
    `;
    const params = [];
    if (product_id) { sql += ` WHERE sm.product_id = ?`; params.push(product_id); }
    sql += ` ORDER BY sm.moved_at DESC, sm.id DESC LIMIT 500`;
    return await query(sql, params);
  },

  async currentStock(product_id) {
    const rows = await query(`SELECT stock FROM products WHERE id = ?`, [product_id]);
    return Number(rows[0]?.stock ?? 0);
  },

  async productExists(product_id) {
    const rows = await query(`SELECT id FROM products WHERE id = ?`, [product_id]);
    return !!rows[0];
  },

  async create({ product_id, move_type, quantity, reference, user_id, note, allowNegative = false }) {
    const conn = await getConnection();
    const q = (sql, params) =>
      new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
      });

    try {
      await q('START TRANSACTION');

      const insert = await q(
        `INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, note, moved_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [product_id, move_type, quantity, reference, user_id, note || null]
      );

      const locked = await q(`SELECT stock FROM products WHERE id = ? FOR UPDATE`, [product_id]);
      const current = Number(locked[0]?.stock ?? 0);
      let next = current;

      if (move_type === 'IN') next = current + Math.abs(quantity);
      else if (move_type === 'OUT') next = current - Math.abs(quantity);
      else if (move_type === 'ADJUST') next = current + quantity;

      if (next < 0 && !allowNegative) {
        throw Object.assign(new Error('Stock insuficiente / ajuste inválido'), { status: 409 });
      }

      await q(`UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?`, [next, product_id]);
      await q('COMMIT');

      const rows = await query(`SELECT * FROM stock_moves WHERE id = ?`, [insert.insertId]);
      return rows[0] || null;
    } catch (err) {
      try { await q('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = StockMoveModel;
