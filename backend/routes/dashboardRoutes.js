const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); 

router.get('/stats', ctrl.getStats); 
router.get('/low-rotation', ctrl.getLowRotation);

// NUEVA RUTA: Para recibir el feedback (OK / Promo)
router.post('/low-rotation/:id/feedback', ctrl.postFeedback);

module.exports = router;