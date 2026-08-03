// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const ALLOWED_ROLES = ['cashier', 'manager', 'admin'];

const UserController = {
  async list(req, res, next) {
    try {
      const rows = await User.listAll();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { full_name, email, password, role = 'cashier' } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }
      if (String(password).length < 4) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
      }
      const roleName = ALLOWED_ROLES.includes(role) ? role : 'cashier';

      const exists = await User.findByEmail(email);
      if (exists) return res.status(409).json({ error: 'Ese email ya está registrado' });

      const password_hash = bcrypt.hashSync(password, 10);
      const created = await User.create({ full_name, email, password_hash, is_active: 1 });
      await User.assignRoleByName(created.id, roleName);
      const roles = await User.getRoles(created.id);

      res.status(201).json({
        user: {
          id: created.id,
          full_name: created.full_name,
          email: created.email,
          is_active: created.is_active,
          roles,
        },
        temp_password_hint: 'Guarda la contraseña; no se vuelve a mostrar.',
      });
    } catch (err) {
      next(err);
    }
  },

  async setActive(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { is_active } = req.body;
      if (!id) return res.status(400).json({ error: 'ID inválido' });
      if (Number(id) === Number(req.user?.sub)) {
        return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
      }
      const updated = await User.setActive(id, !!is_active);
      const roles = await User.getRoles(id);
      res.json({ ...User.publicUser(updated), roles });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
