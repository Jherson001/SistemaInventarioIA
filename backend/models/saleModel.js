if (!allowedPayment.has(payment_method)) {
  throw new Error('Método de pago no válido');
}

if (!Array.isArray(items) || items.length === 0) {
  throw new Error('La venta debe tener al menos un ítem');
}

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

    if (!product_id || qty <= 0) {
      throw new Error('Producto o cantidad inválida');
    }

    const [product] = await cQuery(
      `SELECT id, price, cost, stock FROM products WHERE id = ? LIMIT 1`,
      [product_id]
    );

    if (!product) {
      throw new Error(`Producto ${product_id} no existe`);
    }

    if (product.stock < qty) {
      throw new Error(`Stock insuficiente para el producto ${product_id}`);
    }

    const unit_price = raw.unit_price != null
      ? Number(raw.unit_price)
      : Number(product.price);

    const line_subtotal = +(unit_price * qty).toFixed(2);
    const line_tax = +(line_subtotal * 0.18).toFixed(2);
    const line_total = +(line_subtotal + line_tax).toFixed(2);

    prepared.push({
      product_id,
      quantity: qty,
      unit_price,
      unit_cost: Number(product.cost) || 0,
      line_subtotal,
      line_tax,
      line_total
    });
  }

  const subtotal = prepared.reduce((a, i) => a + i.line_subtotal, 0);
  const tax_total = prepared.reduce((a, i) => a + i.line_tax, 0);
  const grand_total = +(subtotal + tax_total).toFixed(2);
  const code = genSaleCode();

  const saleIns = await cQuery(
    `INSERT INTO sales
     (code, user_id, customer_id, subtotal, tax_total, grand_total,
      currency, payment_method, note, status, sold_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', NOW(), NOW(), NOW())`,
    [
      code,
      user_id,
      customer_id,
      subtotal,
      tax_total,
      grand_total,
      currency,
      payment_method,
      note
    ]
  );

  const sale_id = saleIns.insertId;

 for (const it of prepared) {
        // CORREGIDO: Incluimos todas las columnas que pide tu base de datos
        await cQuery(
          `INSERT INTO sale_items 
           (sale_id, product_id, quantity, unit_price, unit_cost, line_subtotal, line_tax, line_total) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sale_id, 
            it.product_id, 
            it.quantity, 
            it.unit_price, 
            it.unit_cost || 0, 
            it.line_subtotal, 
            it.line_tax, 
            it.line_total
          ]
        );

        // Actualizamos stock
        await cQuery(`UPDATE products SET stock = stock - ? WHERE id = ?`, [it.quantity, it.product_id]);

        // Movimiento de stock
        await cQuery(
          `INSERT INTO stock_moves (product_id, move_type, quantity, reference, user_id, moved_at) 
           VALUES (?, 'OUT', ?, ?, ?, NOW())`,
          [it.product_id, it.quantity, `SALE:${sale_id}`, user_id]
        );
      }

  await commit();
  return { id: sale_id, code };

} catch (error) {
  await rollback();
  throw error;
} finally {
  conn.release();
}