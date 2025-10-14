// backend/controllers/saleController.js
const Sale = require('../models/saleModel');

const SaleController = {
  async list(req, res, next) {
    try {
      const { date_from, date_to, limit, offset } = req.query;
      const rows = await Sale.list({ date_from, date_to, limit, offset });
      res.json(rows);
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      const sale = await Sale.findById(req.params.id);
      if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
      res.json(sale);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { customer_id, payment_method, note, currency, items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items es requerido y no puede estar vacío' });
      }
      const user_id = req.user?.sub || null;
      const sale = await Sale.create({ user_id, customer_id, payment_method, note, currency, items });
      res.status(201).json(sale);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
};

module.exports = SaleController;
