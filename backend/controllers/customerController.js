// backend/controllers/customerController.js
const Customer = require('../models/customerModel');

exports.list = async (req, res, next) => {
  try {
    const { q = '', page = 1, pageSize = 20 } = req.query;
    const data = await Customer.list({ q, page: Number(page), pageSize: Number(pageSize) });
    res.json(data); // { rows, total }
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const row = await Customer.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(row);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name } = req.body || {};
    if (!full_name) return res.status(400).json({ error: 'full_name es requerido' });
    const row = await Customer.create(req.body);
    res.status(201).json(row);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const row = await Customer.update(req.params.id, req.body);
    if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(row);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await Customer.remove(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};
