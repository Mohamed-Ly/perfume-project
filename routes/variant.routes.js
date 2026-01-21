const router = require("express").Router({ mergeParams: true });
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const { handleValidation } = require("../middlewares/handleValidation");

const {
  //   productIdParamValidation,
  variantIdParamValidation,
  createVariantValidation,
  updateVariantValidation,
  //   variantListQueryValidation,
  adjustStockValidation,
} = require("../middlewares/validators");

const {
  createVariant,
  listVariants,
  getVariant,
  updateVariant,
  deleteVariant,
  countVariants,
  adjustStock,
} = require("../controllers/variant.controller");

// لائحة + عدّاد
router.get(
  "/",
  handleValidation,
  listVariants
);

router.get(
  "/count",
  verifyToken,
  checkRole("ADMIN"),
  handleValidation,
  countVariants
);

// تفاصيل
router.get(
  "/:variantId",
  variantIdParamValidation,
  handleValidation,
  getVariant
);

// CRUD أدمن
router.post(
  "/",
  verifyToken,
  checkRole("ADMIN"),
  createVariantValidation,
  handleValidation,
  createVariant
);

router.patch(
  "/:variantId",
  verifyToken,
  checkRole("ADMIN"),
  variantIdParamValidation,
  updateVariantValidation,
  handleValidation,
  updateVariant
);

router.delete(
  "/:variantId",
  verifyToken,
  checkRole("ADMIN"),
  variantIdParamValidation,
  handleValidation,
  deleteVariant
);

// تعديل مخزون (زيادة/نقصان)
router.post(
  "/:variantId/adjust-stock",
  verifyToken,
  checkRole("ADMIN"),
  variantIdParamValidation,
  adjustStockValidation,
  handleValidation,
  adjustStock
);

module.exports = router;
