// backend/models/saleModel.js
const util = require('util');
const { getConnection, query } = require('../config/db');

function genSaleCode() {
  // Ej: S20250905T154512123
  const now = new Date();
  const iso = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  const tail = String(now.getMilliseconds()).padStart(3, '0');
  return `S${iso}${tail}`;
}

const allowedPayment = new Set(['CASH','CARD','YAPE','PLIN','TRANSFER']);

const SaleModel = {
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
    const saleRows = await query(
      `SELECT id, code, user_id, customer_id, subtotal, tax_total, discount_total, grand_total,
              currency, status, paid_amount, payment_method, note, sold_at, created_at, updated_at
       FROM sales WHERE id = ? LIMIT 1`, [id]
    );
    const sale = saleRows[0];
    if (!sale) return null;

    const items = await query(
      `SELECT si.*, p.sku, p.name
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?
       ORDER BY si.id ASC`, [id]
    );
    return { ...sale, items };
  },

  async create({ user_id, customer_id = null, payment_method = 'CASH', note = null, currency = 'PEN', items = [] }) {
    if (!Array.isArray(items) || items.length === 0) {
      const e = new Error('La venta debe incluir al menos un ítem'); e.status = 400; throw e;
    }
    if (!allowedPayment.has(payment_method)) {
      const e = new Error('payment_method inválido'); e.status = 400; throw e;
    }

    const conn = await getConnection();
    const cQuery = util.promisify(conn.query).bind(conn);
    const begin = util.promisify(conn.beginTransaction).bind(conn);
    const commit = util.promisify(conn.commit).bind(conn);
    const rollback = util.promisify(conn.rollback).bind(conn);

    try {
      await begin();

      // 1) Validar stock y preparar líneas
      const prepared = [];
      for (const raw of items) {
        const product_id = Number(raw.product_id);
        const qty = Number(raw.quantity);
        if (!product_id || !Number.isFinite(qty) || qty <= 0) {
          const e = new Error('Ítem inválido: product_id y quantity > 0 son requeridos'); e.status = 400; throw e;
        }

        // Obtener producto (cost/price) + stock actual
        const prodRows = await cQuery(`SELECT id, price, cost FROM products WHERE id = ? LIMIT 1`, [product_id]);
        const product = prodRows[0];
        if (!product) { const e = new Error(`Producto ${product_id} no existe`); e.status = 404; throw e; }

        const stockRows = await cQuery(`SELECT stock FROM vw_stock_current WHERE product_id = ?`, [product_id]);
        const stock = stockRows[0]?.stock ?? 0;
        if (stock < qty) { const e = new Error(`Stock insuficiente para producto ${product_id}`); e.status = 409; throw e; }

        const unit_price = raw.unit_price != null ? Number(raw.unit_price) : Number(product.price);
        const unit_cost  = Number(product.cost);
        const discount   = raw.discount != null ? Number(raw.discount) : 0;
        const tax_rate   = raw.tax_rate_applied != null ? Number(raw.tax_rate_applied) : 0.18;

        if (unit_price < 0 || unit_cost < 0 || discount < 0 || tax_rate < 0) {
          const e = new Error('Montos inválidos en ítem'); e.status = 400; throw e;
        }

        const line_subtotal = +(unit_price * qty - discount).toFixed(2);
        const line_tax      = +(line_subtotal * tax_rate).toFixed(2);
        const line_total    = +(line_subtotal + line_tax).toFixed(2);

        prepared.push({
          product_id, quantity: qty, unit_price, unit_cost, discount,
          tax_rate_applied: tax_rate, line_subtotal, line_tax, line_total
        });
      }

      // 2) Calcular totales de venta
      const subtotal = +prepared.reduce((a, r) => a + r.line_subtotal, 0).toFixed(2);
      const tax_total = +prepared.reduce((a, r) => a + r.line_tax, 0).toFixed(2);
      const discount_total = +prepared.reduce((a, r) => a + (r.discount || 0), 0).toFixed(2);
      const grand_total = +(subtotal + tax_total).toFixed(2);

      const code = genSaleCode();

      // 3) Insert cabecera
      const saleIns = await cQuery(
        `INSERT INTO sales (code, user_id, customer_id, subtotal, tax_total, discount_total, grand_total,
                            currency, status, paid_amount, payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, NOW(), NOW(), NOW())`,
        [code, user_id, customer_id, subtotal, tax_total, discount_total, grand_total, currency, grand_total, payment_method, note]
      );
      const sale_id = saleIns.insertId;

      // 4) Insertar ítems + crear movimientos de stock (OUT)
      for (const it of prepared) {
        await cQuery(
          `INSERT INTO sale_items
            (sale_id, product_id, quantity, unit_price, unit_cost, discount, tax_rate_applied,
             line_subtotal, line_tax, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sale_id, it.product_id, it.quantity, it.unit_price, it.unit_cost, it.discount,
            it.tax_rate_applied, it.line_subtotal, it.line_tax, it.line_total
          ]
        );

        await cQuery(
          `INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, note, moved_at)
           VALUES (?, 'OUT', ?, ?, ?, ?, NOW())`,
          [it.product_id, it.quantity, `SALE:${sale_id}`, user_id, 'Salida por venta']
        );
      }

      await commit();
      // 5) Devolver venta completa
      const full = await this.findById(sale_id);
      return full;
    } catch (err) {
      try { await rollback(); } catch {}
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = SaleModel;
