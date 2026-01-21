// routes/cart.routes.js
const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const { handleValidation } = require("../middlewares/handleValidation");
const {
  addCartItemValidation,
  updateCartItemValidation,
  removeCartItemParamValidation
} = require("../middlewares/validators");

const {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
  countCart
} = require("../controllers/cart.controller");

// كل مسارات السلة تتطلب مستخدم مسجّل
router.use(verifyToken);

// عرض السلة
router.get("/", getCart);

// عدّاد (للواجهة)
router.get("/count", countCart);

// إضافة عنصر
router.post("/items", addCartItemValidation, handleValidation, addItem);

// تعديل كمية عنصر
router.patch("/items/:itemId", updateCartItemValidation, handleValidation, updateItemQty);

// حذف عنصر
router.delete("/items/:itemId", removeCartItemParamValidation, handleValidation, removeItem);

// إفراغ السلة
router.delete("/clear", clearCart);

module.exports = router;
