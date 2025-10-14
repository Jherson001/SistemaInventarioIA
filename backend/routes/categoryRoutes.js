const express = require('express');
const ctrl = require('../controllers/categoryController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

// todas requieren estar logueado
router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);
router.post('/', authRequired, ctrl.create);          // puedes validar rol admin si quieres
router.put('/:id', authRequired, ctrl.update);
router.delete('/:id', authRequired, ctrl.remove);

module.exports = router;
