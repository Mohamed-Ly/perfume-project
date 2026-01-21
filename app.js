const express = require("express");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const pool = require("./config/db");
// Helpers
const { sendFail, sendError } = require("./utils/responseHelper");
const app = express();
const port = 5000;

// استخدم express.static لخدمة الصور
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route لاختبار الاتصال
app.get("/testing", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ db: "connected", result: rows[0].result });
  } catch (err) {
    res.status(500).json({ db: "error", message: err.message });
  }
});

// عندما يقوم front end app بتكليم ال api cors الخاص بنا سيظهر له اخطأ لحل هذه المشكلة نستخدم هذه المكتبة
app.use(cors());
// تخص الردود RESPONSES لكي تجعلهم يرجعو على هيئة json
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/brands", require("./routes/brand.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/products/:productId/variants", require("./routes/variant.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/wishlist", require("./routes/wishlist.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/offers", require("./routes/offer.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

// ✅ Middleware لمعالجة أخطاء Multer والرفع
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // خطأ من Multer نفسه (مثلاً الحجم كبير)
    return sendFail(res, { message: err.message }, 400);
  } else if (err) {
    // خطأ عام (مثل صيغة غير مسموحة)
    return sendFail(res, { message: err.message || "File upload error" }, 400);
  }
  next();
});

// هاذا middleware خاص بعمل handle على ال routes اللتي ليست موجودة ضمن الموقع
app.all("*", (req, res) => {
  // console.log("🔍 دخلنا على Route غير موجود:", req.originalUrl);
  return sendError(res, "Route not found", 404);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${port}`);
});
