// backend/routes/insightsRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/insightsController");

router.get("/stock-health", ctrl.stockHealth);
router.get("/reorder-list", ctrl.reorderList);

module.exports = router;
