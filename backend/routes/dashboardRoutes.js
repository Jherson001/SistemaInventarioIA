const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authRequired } = require('../middlewares/auth');

// Ruta: /api/dashboard/stats
router.get('/stats', authRequired, ctrl.getStats);

module.exports = router;