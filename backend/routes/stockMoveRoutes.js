const express = require('express');
const ctrl = require('../controllers/stockMoveController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, ctrl.list);
router.post('/', authRequired, requireRoles('admin', 'manager'), ctrl.create);

module.exports = router;
