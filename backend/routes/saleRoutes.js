// backend/routes/saleRoutes.js
const express = require('express');
const ctrl = require('../controllers/saleController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

// Listar y ver
router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);

// Crear venta: cashier, manager, admin
router.post('/', authRequired, requireRoles('cashier','manager','admin'), ctrl.create);

module.exports = router;