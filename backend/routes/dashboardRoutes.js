const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); // IMPORTANTE: Se llama 'ctrl'
const { authRequired } = require('../middlewares/auth');

// Ruta final: /api/dashboard/stats
router.get('/stats', authRequired, ctrl.getStats); // USAR 'ctrl.getStats'

module.exports = router;