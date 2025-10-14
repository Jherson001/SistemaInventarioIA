const express = require('express');
const ctrl = require('../controllers/authController');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authRequired, ctrl.me);

module.exports = router;
