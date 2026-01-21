const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const { handleValidation } = require("../middlewares/handleValidation");
const {
  wishlistItemValidation,
  wishlistItemIdParamValidation,
} = require("../middlewares/validators");

const {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
  getWishlistCount,
  moveToCart,
} = require("../controllers/wishlist.controller");

// كل مسارات المفضلة تتطلب مستخدم مسجّل
// router.use(verifyToken);

// عرض المفضلة
router.get("/", verifyToken, getWishlist);

// عداد العناصر
router.get("/count", verifyToken, getWishlistCount);

// إضافة منتج
router.post(
  "/items",
  verifyToken,
  wishlistItemValidation,
  handleValidation,
  addItem
);

// إزالة منتج
router.delete(
  "/items/:id",
  verifyToken,
  wishlistItemIdParamValidation,
  handleValidation,
  removeItem
);

// نقل منتج للسلة
router.post(
  "/items/:id/move-to-cart",
  verifyToken,
  wishlistItemIdParamValidation,
  handleValidation,
  moveToCart
);

// إفراغ المفضلة
router.delete("/clear", verifyToken, clearWishlist);

module.exports = router;
