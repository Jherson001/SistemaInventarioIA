// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); 
const { authRequired } = require('../middlewares/auth');

// Ruta 1: Estadísticas generales (Tarjetas y Gráficos)
router.get('/stats', authRequired, ctrl.getStats); 

// NUEVA RUTA: Baja Rotación (La que daba error 404)
router.get('/low-rotation', authRequired, ctrl.getLowRotation);

module.exports = router;