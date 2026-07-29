const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authRequired, requireRoles } = require('../middlewares/auth');

router.use(authRequired);

router.get('/stats', ctrl.getStats);
router.get('/low-rotation', ctrl.getLowRotation);
router.post('/low-rotation/:id/feedback', requireRoles('admin', 'manager'), ctrl.postFeedback);

module.exports = router;
