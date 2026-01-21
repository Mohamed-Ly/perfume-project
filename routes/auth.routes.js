// routes/auth.routes.js
const router = require("express").Router();
const { registerValidation, loginValidation } = require("../middlewares/validators");
const { handleValidation } = require("../middlewares/handleValidation");
const { register, login, refresh, logoutAll } = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");

// تسجيل
router.post("/register", registerValidation, handleValidation, register);

// دخول (identifier = email أو phone)
router.post("/login", loginValidation, handleValidation, login);

// إصدار Access جديد من Refresh
router.post("/refresh", refresh);

// إلغاء/خروج (يبطّل الـ refresh في DB)
// router.post("/logout", logout);

router.post("/logout-all", verifyToken, logoutAll);

module.exports = router;
