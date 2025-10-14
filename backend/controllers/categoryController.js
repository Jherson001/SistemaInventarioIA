// backend/controllers/categoryController.js
const Category = require('../models/categoryModel');

exports.list = async (req, res, next) => {
  try {
    const { q = '', page = 1, pageSize = 20 } = req.query;
    const data = await Category.list({ q, page: Number(page), pageSize: Number(pageSize) });
    res.json(data);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const row = await Category.getById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(row);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;
    if (!name) return res.status(400).json({ message: 'name es requerido' });
    const row = await Category.create({ name, description, is_active });
    res.status(201).json(row);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const row = await Category.update(req.params.id, req.body);
    if (!row) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(row);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await Category.remove(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};
