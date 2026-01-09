const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController'); 

router.get('/stats', ctrl.getStats); 
router.get('/low-rotation', ctrl.getLowRotation);
router.post('/low-rotation/:id/feedback', ctrl.postFeedback); // <-- RUTA CLAVE

module.exports = router;