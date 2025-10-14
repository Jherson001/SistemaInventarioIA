// backend/controllers/productController.js
const Product = require('../models/productModel');

const ProductController = {
  async list(req, res, next) {
    try {
      const rows = await Product.findAll();
      res.json(rows);
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      const item = await Product.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(item);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const required = ['sku', 'name', 'price'];
      for (const f of required) {
        if (req.body[f] === undefined || req.body[f] === null || req.body[f] === '')
          return res.status(400).json({ error: `Falta el campo requerido: ${f}` });
      }
      const created = await Product.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      // manejo de duplicados de índice único (sku/barcode)
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU o barcode duplicado' });
      }
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const item = await Product.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

      // permitimos actualizar campos clave; si no vienen, usa los existentes
      const payload = {
        sku: req.body.sku ?? item.sku,
        barcode: req.body.barcode ?? item.barcode,
        name: req.body.name ?? item.name,
        description: req.body.description ?? item.description,
        category_id: req.body.category_id ?? item.category_id,
        cost: req.body.cost ?? item.cost,
        price: req.body.price ?? item.price,
        min_stock: req.body.min_stock ?? item.min_stock,
        is_active: req.body.is_active ?? item.is_active
      };

      const updated = await Product.update(req.params.id, payload);
      res.json(updated);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU o barcode duplicado' });
      }
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const item = await Product.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
      const resp = await Product.remove(req.params.id);
      res.json(resp);
    } catch (err) { next(err); }
  }
};

module.exports = ProductController;