// backend/models/saleModel.js
const util = require('util');
const { getConnection, query } = require('../config/db');

function genSaleCode() {
  const now = new Date();
  const iso = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const tail = String(now.getMilliseconds()).padStart(3, '0');
  return `S${iso}${tail}`;
}

const allowedPayment = new Set(['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER']);

const SaleModel = {
  async list({ date_from, date_to, limit = 50, offset = 0 }) {
    const params = [];
    let sql = `SELECT id, code, subtotal, tax_total, grand_total, status, payment_method, sold_at FROM sales WHERE 1=1`;
    if (date_from) { sql += ` AND sold_at >= ?`; params.push(date_from); }
    if (date_to)   { sql += ` AND sold_at < ?`;  params.push(date_to); }
    sql += ` ORDER BY sold_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  async findById(id) {
    const saleRows = await query(`SELECT * FROM sales WHERE id = ? LIMIT 1`, [id]);
    if (!saleRows.length) return null;
    const items = await query(`SELECT si.*, p.name FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`, [id]);
    return { ...saleRows[0], items };
  },

  async create({ user_id, customer_id = null, payment_method = 'CASH', note = null, items = [] }) {
    if (!allowedPayment.has(payment_method)) throw new Error('Método de pago no válido');
    if (!items.length) throw new Error('Venta sin productos');

    const conn = await getConnection();
    const cQuery = util.promisify(conn.query).bind(conn);
    const begin = util.promisify(conn.beginTransaction).bind(conn);
    const commit = util.promisify(conn.commit).bind(conn);
    const rollback = util.promisify(conn.rollback).bind(conn);

    try {
      await begin();
      const prepared = [];
      for (const raw of items) {
        const [product] = await cQuery(`SELECT id, price, cost, stock FROM products WHERE id = ? LIMIT 1`, [raw.product_id]);
        if (!product || product.stock < raw.quantity) throw new Error(`Stock insuficiente para ID ${raw.product_id}`);

        const sub = +(product.price * raw.quantity).toFixed(2);
        prepared.push({
          id: product.id, qty: raw.quantity, price: product.price, cost: product.cost || 0,
          sub, tax: +(sub * 0.18).toFixed(2), total: +(sub * 1.18).toFixed(2)
        });
      }

      const grand_total = prepared.reduce((a, i) => a + i.total, 0);
      const code = genSaleCode();
      const saleIns = await cQuery(
        `INSERT INTO sales (code, user_id, grand_total, payment_method, status, sold_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'CONFIRMED', NOW(), NOW(), NOW())`,
        [code, user_id, grand_total, payment_method]
      );

      for (const it of prepared) {
        await cQuery(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost, line_total) VALUES (?, ?, ?, ?, ?, ?)`,
          [saleIns.insertId, it.id, it.qty, it.price, it.cost, it.total]);
        await cQuery(`UPDATE products SET stock = stock - ? WHERE id = ?`, [it.qty, it.id]);
        await cQuery(`INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, moved_at) VALUES (?, 'OUT', ?, ?, ?, NOW())`,
          [it.id, it.qty, `SALE:${saleIns.insertId}`, user_id]);
      }
      await commit();
      return { id: saleIns.insertId, code };
    } catch (e) { await rollback(); throw e; } finally { conn.release(); }
  }
};

module.exports = SaleModel;