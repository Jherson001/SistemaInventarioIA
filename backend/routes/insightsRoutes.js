const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/insightsController");
const { authRequired } = require("../middlewares/auth");

router.use(authRequired);
router.get("/stock-health", ctrl.stockHealth);
router.get("/reorder-list", ctrl.reorderList);

module.exports = router;
