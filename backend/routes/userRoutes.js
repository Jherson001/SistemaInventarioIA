const express = require('express');
const ctrl = require('../controllers/userController');
const { authRequired, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authRequired);
router.use(requireRoles('admin'));

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id/active', ctrl.setActive);

module.exports = router;
