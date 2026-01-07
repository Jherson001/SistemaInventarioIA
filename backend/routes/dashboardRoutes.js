const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); // Se importa como 'ctrl'
const { authRequired } = require('../middlewares/auth');

// La ruta final será: /api/dashboard/stats
// Agregamos authRequired para que solo usuarios logueados vean los datos
router.get('/stats', authRequired, ctrl.getStats); 

module.exports = router;