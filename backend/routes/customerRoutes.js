// backend/routes/customerRoutes.js
const express = require('express');
const ctrl = require('../controllers/customerController');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);
router.post('/', authRequired, ctrl.create);
router.put('/:id', authRequired, ctrl.update);
router.delete('/:id', authRequired, ctrl.remove);

module.exports = router;
