const StockMove = require('../models/stockMoveModel');

const StockMoveController = {
  async list(req, res, next) {
    try {
      const { product_id } = req.query;
      const rows = await StockMove.list({ product_id });
      res.json(rows);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { product_id, move_type, quantity, reference, note } = req.body;
      if (!product_id || !move_type || quantity === undefined) {
        return res.status(400).json({ error: 'product_id, move_type y quantity son requeridos' });
      }
      if (!['IN', 'ADJUST'].includes(move_type)) {
        return res.status(400).json({ error: "move_type debe ser 'IN' o 'ADJUST'" });
      }
      if (!(await StockMove.productExists(product_id))) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty === 0) {
        return res.status(400).json({ error: 'quantity debe ser un número distinto de 0' });
      }
      if (move_type === 'IN' && qty < 0) {
        return res.status(400).json({ error: 'quantity debe ser positivo para IN' });
      }
      if (move_type === 'ADJUST' && qty < 0) {
        const current = await StockMove.currentStock(product_id);
        if (current + qty < 0) {
          return res.status(409).json({ error: 'Ajuste inválido: dejaría stock negativo' });
        }
      }

      const created = await StockMove.create({
        product_id,
        move_type,
        quantity: qty,
        reference: reference || null,
        user_id: req.user?.sub || null,
        note: note || null
      });
      res.status(201).json(created);
    } catch (err) { next(err); }
  }
};

module.exports = StockMoveController;
