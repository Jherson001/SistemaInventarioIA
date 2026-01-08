// backend/models/saleModel.js
const util = require('util');
const { getConnection, query } = require('../config/db');

function genSaleCode() {
  const now = new Date();
  const iso = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const tail = String(now.getMilliseconds()).padStart(3, '0');
  return `S${iso}${tail}`;
}

const allowedPayment = new Set(['CASH','CARD','YAPE','PLIN','TRANSFER']);

const SaleModel = {
  // ... (método list y findById se mantienen igual)
  async list({ date_from, date_to, limit = 50, offset = 0 }) {
    const params = [];
    let sql = `SELECT id, code, user_id, customer_id, subtotal, tax_total, discount_total, grand_total,
                      currency, status, paid_amount, payment_method, note, sold_at
               FROM sales WHERE 1=1`;
    if (date_from) { sql += ` AND sold_at >= ?`; params.push(date_from); }
    if (date_to)   { sql += ` AND sold_at < ?`;  params.push(date_to); }
    sql += ` ORDER BY sold_at DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    return await query(sql, params);
  },

  async findById(id) {
    const saleRows = await query(`SELECT * FROM sales WHERE id = ? LIMIT 1`, [id]);
    const sale = saleRows[0];
    if (!sale) return null;
    const items = await query(
      `SELECT si.*, p.sku, p.name FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`, [id]
    );
    return { ...sale, items };
  },

  async create({ user_id, customer_id = null, payment_method = 'CASH', note = null, currency = 'PEN', items = [] }) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('Venta sin ítems');
    
    const conn = await getConnection();
    const cQuery = util.promisify(conn.query).bind(conn);
    const begin = util.promisify(conn.beginTransaction).bind(conn);
    const commit = util.promisify(conn.commit).bind(conn);
    const rollback = util.promisify(conn.rollback).bind(conn);

    try {
      await begin();
      const prepared = [];

      for (const raw of items) {
        const product_id = Number(raw.product_id);
        const qty = Number(raw.quantity);

        // CORRECCIÓN: Buscamos el stock directamente en la tabla products
        const prodRows = await cQuery(`SELECT id, price, cost, stock FROM products WHERE id = ? LIMIT 1`, [product_id]);
        const product = prodRows[0];

        if (!product) throw new Error(`Producto ${product_id} no existe`);
        if (product.stock < qty) throw new Error(`Stock insuficiente para ${product_id}. Disponible: ${product.stock}`);

        const unit_price = raw.unit_price != null ? Number(raw.unit_price) : Number(product.price);
        const line_subtotal = +(unit_price * qty).toFixed(2);
        const line_tax = +(line_subtotal * 0.18).toFixed(2);

        prepared.push({
          product_id, quantity: qty, unit_price, unit_cost: product.cost,
          line_subtotal, line_tax, line_total: +(line_subtotal + line_tax).toFixed(2)
        });
      }

      const grand_total = prepared.reduce((a, r) => a + r.line_total, 0);
      const code = genSaleCode();

      const saleIns = await cQuery(
        `INSERT INTO sales (code, user_id, customer_id, grand_total, payment_method, status, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'CONFIRMED', NOW(), NOW(), NOW())`,
        [code, user_id, customer_id, grand_total, payment_method]
      );
      const sale_id = saleIns.insertId;

      for (const it of prepared) {
        await cQuery(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)`,
          [sale_id, it.product_id, it.quantity, it.unit_price, it.line_total]);

        // CORRECCIÓN CLAVE: Restamos el stock de la tabla products
        await cQuery(`UPDATE products SET stock = stock - ? WHERE id = ?`, [it.quantity, it.product_id]);

        // Registro histórico
        await cQuery(`INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, moved_at) VALUES (?, 'OUT', ?, ?, ?, NOW())`,
          [it.product_id, it.quantity, `SALE:${sale_id}`, user_id]);
      }

      await commit();
      return { id: sale_id, code };
    } catch (err) {
      await rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = SaleModel;