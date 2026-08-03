const express = require('express');
const ctrl = require('../controllers/stockMoveController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, ctrl.list);
// cashier puede registrar entradas/salidas; ajuste queda restringido en el controller
router.post('/', authRequired, requireRoles('admin', 'manager', 'cashier'), ctrl.create);

module.exports = router;
