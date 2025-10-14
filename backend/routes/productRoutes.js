const express = require('express');
const ctrl = require('../controllers/productController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

router.post('/', authRequired, requireRoles('admin', 'manager'), ctrl.create);
router.put('/:id', authRequired, requireRoles('admin', 'manager'), ctrl.update);
router.delete('/:id', authRequired, requireRoles('admin', 'manager'), ctrl.remove);

module.exports = router;