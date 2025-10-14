// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

function signToken(user, roles) {
  return jwt.sign(
    { sub: user.id, email: user.email, roles },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

const AuthController = {
  async register(req, res, next) {
    try {
      const { full_name, email, password, role = 'cashier' } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'full_name, email y password son requeridos' });
      }
      const exists = await User.findByEmail(email);
      if (exists) return res.status(409).json({ error: 'El email ya está registrado' });

      const password_hash = bcrypt.hashSync(password, 10);
      const created = await User.create({ full_name, email, password_hash });
      await User.assignRoleByName(created.id, role);

      const roles = await User.getRoles(created.id);
      const token = signToken(created, roles);
      res.status(201).json({ token, user: { ...created, roles } });
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
      }

      console.log('[auth] login attempt:', email);

      const user = await User.findByEmail(email);
      if (!user) {
        console.warn('[auth] user_not_found:', email);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (!user.is_active) {
        console.warn('[auth] user_inactive:', email);
        return res.status(403).json({ error: 'Credenciales inválidas' });
      }

      const ok = bcrypt.compareSync(password, user.password_hash || '');
      if (!ok) {
        console.warn('[auth] bad_password:', email);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      await User.setLastLogin(user.id);
      const roles = await User.getRoles(user.id);
      const token = signToken(user, roles);

      return res.json({
        token,
        user: { id: user.id, full_name: user.full_name, email: user.email, roles }
      });
    } catch (err) {
      console.error('[auth] login_error:', err);
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const me = await User.findById(req.user.sub);
      const roles = await User.getRoles(req.user.sub);
      res.json({ user: { ...me, roles } });
    } catch (err) { next(err); }
  }
};

module.exports = AuthController;
