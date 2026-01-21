const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const { handleValidation } = require("../middlewares/handleValidation");

const {
  createBrandValidation,
  updateBrandValidation,
  brandIdParamValidation,
//   brandListQueryValidation
} = require("../middlewares/validators");

const {
  createBrand,
  listBrands,
  getBrand,
  updateBrand,
  deleteBrand,
  countBrands
} = require("../controllers/brand.controller");

// عامة (قائمة/قراءة)
router.get("/", handleValidation, listBrands);
router.get("/count", verifyToken, checkRole("ADMIN"), handleValidation, countBrands);
router.get("/:id", brandIdParamValidation, handleValidation, getBrand);

// أدمن (إنشاء/تحديث/حذف)
router.post("/", verifyToken, checkRole("ADMIN"), createBrandValidation, handleValidation, createBrand);
router.patch("/:id", verifyToken, checkRole("ADMIN"), updateBrandValidation, handleValidation, updateBrand);
router.delete("/:id", verifyToken, checkRole("ADMIN"), brandIdParamValidation, handleValidation, deleteBrand);

module.exports = router;
