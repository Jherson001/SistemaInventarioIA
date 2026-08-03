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

      const allowed = ['IN', 'OUT', 'ADJUST'];
      if (!allowed.includes(move_type)) {
        return res.status(400).json({ error: "move_type debe ser 'IN', 'OUT' o 'ADJUST'" });
      }

      if (!(await StockMove.productExists(product_id))) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const roles = req.user?.roles || [];
      const canAdjust = roles.includes('admin') || roles.includes('manager');
      if (move_type === 'ADJUST' && !canAdjust) {
        return res.status(403).json({ error: 'Solo admin/manager pueden hacer ajustes' });
      }

      let qty = Number(quantity);
      if (!Number.isFinite(qty) || qty === 0) {
        return res.status(400).json({ error: 'quantity debe ser un número distinto de 0' });
      }

      // IN/OUT: cantidad siempre positiva; el signo lo define el tipo
      if (move_type === 'IN' || move_type === 'OUT') {
        qty = Math.abs(qty);
      }

      const current = await StockMove.currentStock(product_id);

      // OUT puede quedar negativo al inicio (stock aún no contado); ADJUST no
      if (move_type === 'ADJUST' && current + qty < 0) {
        return res.status(409).json({ error: 'Ajuste inválido: dejaría stock negativo' });
      }

      const created = await StockMove.create({
        product_id,
        move_type,
        quantity: qty,
        reference: reference || null,
        user_id: req.user?.sub || null,
        note: note || null,
        allowNegative: move_type === 'OUT',
      });
      const warning =
        move_type === 'OUT' && current < qty
          ? `Stock quedó bajo/negativo (había ${current})`
          : null;
      res.status(201).json(warning ? { ...created, warning } : created);
    } catch (err) { next(err); }
  }
};

module.exports = StockMoveController;
