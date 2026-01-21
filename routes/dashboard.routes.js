const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const { getDashboardCharts } = require("../controllers/dashboard.controller");

// لوحتك إدارية → ADMIN
router.get("/charts", verifyToken, checkRole("ADMIN"), getDashboardCharts);

module.exports = router;
