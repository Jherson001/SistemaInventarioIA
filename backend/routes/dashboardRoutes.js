const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); // Lo importas como 'ctrl'
const { authRequired } = require('../middlewares/auth');

// Ruta: /api/dashboard/stats
router.get('/stats', authRequired, ctrl.getStats); // USAS 'ctrl', no 'dashboardController'

module.exports = router;