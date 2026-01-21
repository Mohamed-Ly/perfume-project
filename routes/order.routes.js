const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const { handleValidation } = require("../middlewares/handleValidation");
const {
  createOrderValidation,
  orderIdParamValidation,
  updateOrderValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
} = require("../middlewares/validators");

const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrder,
  cancelOrderByUser,
  getAllOrders,
  getOrderStats,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/order.controller");

// طلبات المستخدم العادي
// ===================== USER =====================
router.post(
  "/",
  verifyToken,
  createOrderValidation,
  handleValidation,
  createOrder
);
router.get("/", verifyToken, getUserOrders);
router.get(
  "/:id",
  verifyToken,
  orderIdParamValidation,
  handleValidation,
  getOrderById
);
router.put(
  "/:id",
  verifyToken,
  updateOrderValidation,
  handleValidation,
  updateOrder
);
router.post(
  "/:id/cancel",
  verifyToken,
  cancelOrderValidation,
  handleValidation,
  cancelOrderByUser
);

// طلبات الأدمن
// ===================== ADMIN =====================
router.get(
  "/admin/stats",
  verifyToken,
  checkRole("ADMIN"),
  handleValidation,
  getOrderStats
);
router.get("/admin/all", verifyToken, checkRole("ADMIN"), getAllOrders);
router.get(
  "/admin/:id",
  verifyToken,
  checkRole("ADMIN"),
  orderIdParamValidation,
  handleValidation,
  getOrderDetails
);
router.patch(
  "/admin/:id/status",
  verifyToken,
  checkRole("ADMIN"),
  updateOrderStatusValidation,
  handleValidation,
  updateOrderStatus
);
router.delete(
  "/admin/:id",
  verifyToken,
  checkRole("ADMIN"),
  orderIdParamValidation,
  handleValidation,
  deleteOrder
);

module.exports = router;
