const express = require('express');
const ctrl = require('../controllers/productController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authRequired);

router.get('/', ctrl.list);
router.get('/barcode/:code', ctrl.getByBarcode);
router.get('/:id', ctrl.get);

router.post('/', requireRoles('admin', 'manager'), ctrl.create);
router.put('/:id', requireRoles('admin', 'manager'), ctrl.update);
router.delete('/:id', requireRoles('admin', 'manager'), ctrl.remove);

module.exports = router;
