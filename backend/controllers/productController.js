// backend/controllers/productController.js
const Product = require('../models/productModel');

function toNum(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function toActive(v, fallback = 1) {
  if (v === undefined || v === null || v === '') return fallback;
  const s = String(v).trim().toLowerCase();
  if (['1', 'si', 'sí', 'yes', 'true', 'activo'].includes(s)) return 1;
  if (['0', 'no', 'false', 'inactivo'].includes(s)) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? (n ? 1 : 0) : fallback;
}

function normalizeImportRow(raw) {
  const sku = String(raw.sku ?? raw.SKU ?? '').trim();
  const name = String(raw.name ?? raw.nombre ?? raw.Producto ?? raw.producto ?? '').trim();
  const barcodeRaw = raw.barcode ?? raw['Codigo de barras'] ?? raw.codigo_barras ?? '';
  const barcode = String(barcodeRaw || '').trim() || null;
  const description = String(
    raw.description ?? raw.Descripcion ?? raw.descripcion ?? ''
  ).trim() || null;

  return {
    sku,
    name,
    barcode,
    description,
    cost: toNum(raw.cost ?? raw.Costo, 0),
    price: toNum(raw.price ?? raw.Precio, 0),
    min_stock: toNum(raw.min_stock ?? raw['Stock minimo'] ?? raw.stock_minimo, 0),
    stock: toNum(raw.stock ?? raw.Stock, 0),
    is_active: toActive(raw.is_active ?? raw.Activo, 1),
  };
}

const ProductController = {
  async list(req, res, next) {
    try {
      const includeInactive = String(req.query.include_inactive || '1') !== '0';
      const rows = await Product.findAll({ includeInactive });
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

  async getByBarcode(req, res, next) {
    try {
      const item = await Product.findByBarcode(req.params.code);
      if (!item) return res.status(404).json({ error: 'Producto no encontrado para ese código' });
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

      const payload = {
        sku: req.body.sku ?? item.sku,
        barcode: Object.prototype.hasOwnProperty.call(req.body, 'barcode')
          ? req.body.barcode
          : item.barcode,
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
  },

  /**
   * Importación masiva por SKU.
   * Body: { rows: [...], update_existing?: true, update_stock?: false }
   * - Crea si el SKU no existe
   * - Actualiza datos de catálogo si existe (stock solo si update_stock=true)
   */
  async importBulk(req, res, next) {
    try {
      const rowsIn = Array.isArray(req.body?.rows) ? req.body.rows : null;
      if (!rowsIn || rowsIn.length === 0) {
        return res.status(400).json({ error: 'Envía rows: [] con productos' });
      }
      if (rowsIn.length > 1000) {
        return res.status(400).json({ error: 'Máximo 1000 filas por importación' });
      }

      const updateExisting = req.body.update_existing !== false;
      const updateStock = req.body.update_stock === true;

      const summary = {
        total: rowsIn.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      for (let i = 0; i < rowsIn.length; i++) {
        const line = i + 2; // + header approx
        try {
          const row = normalizeImportRow(rowsIn[i] || {});
          if (!row.sku) {
            summary.skipped += 1;
            summary.errors.push({ line, error: 'Falta SKU' });
            continue;
          }
          if (!row.name && !updateExisting) {
            summary.skipped += 1;
            summary.errors.push({ line, sku: row.sku, error: 'Falta nombre' });
            continue;
          }

          const existing = await Product.findBySku(row.sku);
          if (!existing) {
            if (!row.name) {
              summary.skipped += 1;
              summary.errors.push({ line, sku: row.sku, error: 'Falta nombre para crear' });
              continue;
            }
            await Product.create({
              sku: row.sku,
              barcode: row.barcode,
              name: row.name,
              description: row.description,
              cost: row.cost,
              price: row.price,
              min_stock: row.min_stock,
              is_active: row.is_active,
              stock: row.stock,
            });
            summary.created += 1;
          } else if (updateExisting) {
            await Product.update(existing.id, {
              sku: row.sku || existing.sku,
              barcode: row.barcode !== null ? row.barcode : existing.barcode,
              name: row.name || existing.name,
              description: row.description ?? existing.description,
              category_id: existing.category_id,
              cost: row.cost,
              price: row.price,
              min_stock: row.min_stock,
              is_active: row.is_active,
              stock: updateStock ? row.stock : existing.stock,
            });
            summary.updated += 1;
          } else {
            summary.skipped += 1;
          }
        } catch (e) {
          summary.skipped += 1;
          summary.errors.push({
            line,
            error: e.code === 'ER_DUP_ENTRY' ? 'SKU o barcode duplicado' : (e.message || 'Error'),
          });
        }
      }

      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProductController;
