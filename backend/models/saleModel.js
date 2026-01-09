const util = require('util');
const { getConnection, query } = require('../config/db');

function genSaleCode() {
  const now = new Date();
  const iso = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `S${iso}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

const SaleModel = {
  async list({ limit = 50, offset = 0 }) {
    const sql = `SELECT * FROM sales ORDER BY sold_at DESC LIMIT ? OFFSET ?`;
    return query(sql, [Number(limit), Number(offset)]);
  },

  async findById(id) {
    const saleRows = await query(`SELECT * FROM sales WHERE id = ? LIMIT 1`, [id]);
    if (!saleRows.length) return null;
    const items = await query(`SELECT si.*, p.name FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`, [id]);
    return { ...saleRows[0], items };
  },

  async create({ user_id, items = [] }) {
    if (!items.length) throw new Error('Venta vacía');
    const conn = await getConnection();
    const cQuery = util.promisify(conn.query).bind(conn);
    try {
      await util.promisify(conn.beginTransaction).bind(conn)();
      const code = genSaleCode();
      const saleIns = await cQuery(`INSERT INTO sales (code, user_id, grand_total, status, sold_at) VALUES (?, ?, 0, 'CONFIRMED', NOW())`, [code, user_id]);
      const sale_id = saleIns.insertId;
      let grandTotal = 0;

      for (const it of items) {
        const [prod] = await cQuery(`SELECT price, cost, stock FROM products WHERE id = ?`, [it.product_id]);
        if (!prod || prod.stock < it.quantity) throw new Error('Stock insuficiente');
        const lineTotal = +(prod.price * it.quantity).toFixed(2);
        grandTotal += lineTotal;

        await cQuery(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost, line_total) VALUES (?, ?, ?, ?, ?, ?)`,
          [sale_id, it.product_id, it.quantity, prod.price, prod.cost || 0, lineTotal]);
        await cQuery(`UPDATE products SET stock = stock - ? WHERE id = ?`, [it.quantity, it.product_id]);
        await cQuery(`INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, moved_at) VALUES (?, 'OUT', ?, ?, ?, NOW())`,
          [it.product_id, it.quantity, `SALE:${sale_id}`, user_id]);
      }
      await cQuery(`UPDATE sales SET grand_total = ? WHERE id = ?`, [grandTotal, sale_id]);
      await util.promisify(conn.commit).bind(conn)();
      return { id: sale_id, code };
    } catch (e) { 
      await util.promisify(conn.rollback).bind(conn)(); 
      throw e; 
    } finally { conn.release(); }
  }
};

module.exports = SaleModel;