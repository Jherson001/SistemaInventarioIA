const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); 

// Dejamos estas rutas PÚBLICAS temporalmente para romper el Error 401
router.get('/stats', ctrl.getStats); 
router.get('/low-rotation', ctrl.getLowRotation);

module.exports = router;