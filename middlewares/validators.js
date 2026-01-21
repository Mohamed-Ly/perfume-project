// middlewares/validation.js
const { body, param } = require("express-validator");

// يسمح بأرقام تبدأ بـ + أو رقم، مع فراغات وشرطات
const phoneRegex = /^[+\d][\d\s-]{5,}$/;

// ======================= Auth =======================

exports.registerValidation = [
  body("name")
    .isLength({ min: 2, max: 50 })
    .withMessage("الاسم يجب أن يكون بين 2 و 50 حرفًا")
    .trim()
    .notEmpty()
    .withMessage("الاسم مطلوب"),
  body("email")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب"),
  body("phone")
    .matches(phoneRegex)
    .withMessage("صيغة رقم الهاتف غير صحيحة")
    .trim()
    .notEmpty()
    .withMessage("رقم الهاتف مطلوب"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب ألا تقل عن 8 أحرف"),
];

exports.loginValidation = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("يرجى إدخال البريد الإلكتروني أو رقم الهاتف"),
  body("password").notEmpty().withMessage("يرجى إدخال كلمة المرور"),
];

// ======================= Categories =======================

exports.createCategoryValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("اسم التصنيف يجب أن يكون بين 2 و 60 حرفًا")
    .notEmpty()
    .withMessage("اسم التصنيف مطلوب"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

exports.updateCategoryValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("اسم التصنيف يجب أن يكون بين 2 و 60 حرفًا"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

exports.categoryIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
];

// ======================= Brand =======================
exports.createBrandValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("اسم الماركة يجب أن يكون بين 2 و 80 حرفًا")
    .notEmpty()
    .withMessage("اسم الماركة مطلوب"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("اسم الدولة غير صالح"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

exports.updateBrandValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("اسم الماركة يجب أن يكون بين 2 و 80 حرفًا"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("اسم الدولة غير صالح"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

exports.brandIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
];

// ======================= Products =======================
exports.createProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("اسم المنتج يجب أن يكون بين 2 و 120 حرفًا")
    .notEmpty()
    .withMessage("اسم المنتج مطلوب"),
  body("brand").optional().isString().withMessage("اسم الماركة غير صالح"),
  body("brandSlug").optional().isString().withMessage("سلاق الماركة غير صالح"),
  body("brandId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرّف الماركة غير صالح"),
  body("category").optional().isString().withMessage("اسم التصنيف غير صالح"),
  body("categoryId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرّف التصنيف غير صالح"),
  body("categorySlug")
    .optional()
    .isString()
    .withMessage("سلاق التصنيف غير صالح"),
  body().custom((value) => {
    // 🔽 تحديث: قبول brandId أو brand أو brandSlug
    if (!value.brand && !value.brandSlug && !value.brandId)
      throw new Error("يرجى تحديد الماركة بالاسم أو السلاق أو المعرّف");
    if (!value.category && !value.categorySlug && !value.categoryId)
      throw new Error("يرجى تحديد التصنيف بالاسم أو السلاق أو المعرّف");
    return true;
  }),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("الوصف طويل جدًا"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

// تحديث منتج
exports.updateProductValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("اسم المنتج يجب أن يكون بين 2 و 120 حرفًا"),
  body("brand").optional().isString().withMessage("اسم الماركة غير صالح"),
  body("brandSlug").optional().isString().withMessage("سلاق الماركة غير صالح"),
  body("brandId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرّف الماركة غير صالح"),
  body("category").optional().isString().withMessage("اسم التصنيف غير صالح"),
  body("categoryId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرّف التصنيف غير صالح"),
  body("categorySlug")
    .optional()
    .isString()
    .withMessage("سلاق التصنيف غير صالح"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("السلاق يجب ألا يقل عن 2 أحرف"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("الوصف طويل جدًا"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
  body("removeImageIds")
    .optional()
    .isArray()
    .withMessage("قائمة الصور المراد حذفها يجب أن تكون مصفوفة"),
];

exports.productIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف غير صالح"),
];

// الاستعلام عن القائمة
// exports.productListQueryValidation = [
//   query("q").optional().isString().withMessage("قيمة البحث غير صالحة"),
//   query("brand").optional().isString().withMessage("اسم الماركة غير صالح"),
//   query("brandSlug").optional().isString().withMessage("سلاق الماركة غير صالح"),
//   query("category").optional().isString().withMessage("اسم التصنيف غير صالح"),
//   query("categorySlug").optional().isString().withMessage("سلاق التصنيف غير صالح"),
//   query("isActive").optional().isBoolean().withMessage("قيمة isActive غير صحيحة"),
//   query("page").optional().isInt({ gt: 0 }).withMessage("رقم الصفحة غير صالح"),
//   query("limit").optional().isInt({ gt: 0, lt: 101 }).withMessage("الحد يجب أن يكون بين 1 و 100"),
//   query("sortBy").optional().isIn(["createdAt","name"]).withMessage("حقل الترتيب غير مدعوم"),
//   query("order").optional().isIn(["asc","desc"]).withMessage("اتجاه الترتيب غير صالح"),
// ];

// ======================= Variants =======================

// :variantId في المسار
exports.variantIdParamValidation = [
  param("variantId").isInt({ gt: 0 }).withMessage("معرّف المتغير غير صالح"),
];

// إنشاء Variant
exports.createVariantValidation = [
  body("priceCents")
    .notEmpty()
    .withMessage("السعر مطلوب")
    .isInt({ min: 0 })
    .withMessage("السعر يجب أن يكون رقمًا موجبًا"),
  body("stockQty")
    .optional()
    .isInt({ min: 0 })
    .withMessage("المخزون يجب أن يكون 0 أو أكبر"),
  body("sizeMl")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("الحجم غير صالح"),
  body("concentration")
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage("التركيز غير صالح"),
  body("sku")
    .optional()
    .isLength({ min: 1, max: 180 })
    .withMessage("SKU غير صالح"),
  body("barcode")
    .optional()
    .isLength({ min: 1, max: 120 })
    .withMessage("الباركود غير صالح"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

// تحديث Variant
exports.updateVariantValidation = [
  body("priceCents")
    .optional()
    .isInt({ min: 0 })
    .withMessage("السعر يجب أن يكون رقمًا موجبًا"),
  body("stockQty")
    .optional()
    .isInt({ min: 0 })
    .withMessage("المخزون يجب أن يكون 0 أو أكبر"),
  body("sizeMl")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("الحجم غير صالح"),
  body("concentration")
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage("التركيز غير صالح"),
  body("sku")
    .optional()
    .isLength({ min: 1, max: 180 })
    .withMessage("SKU غير صالح"),
  body("barcode")
    .optional()
    .isLength({ min: 1, max: 120 })
    .withMessage("الباركود غير صالح"),
  body("isActive").optional().isBoolean().withMessage("قيمة التفعيل غير صحيحة"),
];

// ضبط مخزون (زيادة/نقصان)
exports.adjustStockValidation = [
  body("delta")
    .isInt()
    .withMessage("قيمة التعديل يجب أن تكون رقمًا صحيحًا (موجب أو سالب)")
    .notEmpty()
    .withMessage("قيمة التعديل مطلوبة"),
];

// :productId في المسار
// exports.productIdParamValidation = [
//   param("productId").isInt({ gt: 0 }).withMessage("معرّف المنتج غير صالح"),
// ];

// لائحة Variants لمنتج معيّن
// exports.variantListQueryValidation = [
//   query("isActive")
//     .optional()
//     .isBoolean()
//     .withMessage("قيمة isActive غير صحيحة"),
//   query("page").optional().isInt({ gt: 0 }).withMessage("رقم الصفحة غير صالح"),
//   query("limit")
//     .optional()
//     .isInt({ gt: 0, lt: 101 })
//     .withMessage("الحد يجب أن يكون بين 1 و 100"),
//   query("sortBy")
//     .optional()
//     .isIn(["createdAt", "priceCents", "stockQty"])
//     .withMessage("حقل الترتيب غير مدعوم"),
//   query("order")
//     .optional()
//     .isIn(["asc", "desc"])
//     .withMessage("اتجاه الترتيب غير صالح"),
// ];

// ======================= Cart =======================

exports.addCartItemValidation = [
  body("variantId").isInt({ gt: 0 }).withMessage("معرّف المتغير غير صالح"),
  body("qty").isInt({ gt: 0 }).withMessage("الكمية يجب أن تكون عددًا موجبًا"),
];

exports.updateCartItemValidation = [
  param("itemId").isInt({ gt: 0 }).withMessage("معرّف العنصر غير صالح"),
  body("qty").isInt({ gt: 0 }).withMessage("الكمية يجب أن تكون عددًا موجبًا"),
];

exports.removeCartItemParamValidation = [
  param("itemId").isInt({ gt: 0 }).withMessage("معرّف العنصر غير صالح"),
];

// ======================= Order =======================

exports.createOrderValidation = [
  body("shippingName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم المستلم يجب أن يكون بين 2 و 100 حرف")
    .notEmpty()
    .withMessage("اسم المستلم مطلوب"),
  body("shippingPhone")
    .matches(phoneRegex)
    .withMessage("صيغة رقم الهاتف غير صحيحة")
    .trim()
    .notEmpty()
    .withMessage("رقم الهاتف مطلوب"),
  body("shippingAddress")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("العنوان يجب أن يكون بين 2 و 500 حرف")
    .notEmpty()
    .withMessage("العنوان مطلوب"),
];

exports.orderIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الطلب غير صالح"),
];

exports.deleteOrderValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الطلب غير صالح"),
];

// تحديث الطلب من قبل المستخدم
exports.updateOrderValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الطلب غير صالح"),
  body("shippingName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم المستلم يجب أن يكون بين 2 و 100 حرف"),
  body("shippingPhone")
    .optional()
    .matches(phoneRegex)
    .withMessage("صيغة رقم الهاتف غير صحيحة"),
  body("shippingAddress")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("العنوان يجب أن يكون بين 10 و 500 حرف"),
];

// تحديث الطلب من قبل الأدمن
exports.updateOrderStatusValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الطلب غير صالح"),
  body("status")
    .isIn(["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"])
    .withMessage("حالة الطلب غير صالحة"),
  body("cancelledReason")
    .optional()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("سبب الإلغاء يجب أن يكون بين 2 و 500 حرف"),
];

// إلغاء الطلب من قبل المستخدم
exports.cancelOrderValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الطلب غير صالح"),
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("سبب الإلغاء يجب أن يكون بين 2 و 500 حرف"),
];

// تصفية الطلبات للأدمن
// exports.adminOrdersQueryValidation = [
//   query("status")
//     .optional()
//     .isIn(["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"])
//     .withMessage("حالة الطلب غير صالحة"),
//   query("page").optional().isInt({ gt: 0 }).withMessage("رقم الصفحة غير صالح"),
//   query("limit").optional().isInt({ gt: 0, lt: 101 }).withMessage("الحد يجب أن يكون بين 1 و 100"),
//   query("search").optional().isString().withMessage("نص البحث غير صالح"),
//   query("startDate").optional().isISO8601().withMessage("تاريخ البداية غير صالح"),
//   query("endDate").optional().isISO8601().withMessage("تاريخ النهاية غير صالح")
// ];

// ======================= Wishlist =======================
exports.wishlistItemValidation = [
  body("productId")
    .isInt({ gt: 0 })
    .withMessage("معرّف المنتج غير صالح")
    .notEmpty()
    .withMessage("معرّف المنتج مطلوب"),
];

exports.wishlistItemIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف العنصر غير صالح"),
];

// ======================= Notifications =======================
exports.createNotificationValidation = [
  body("type")
    .isIn([
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "ORDER_SHIPPED",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
      "LOW_STOCK",
      "PROMOTIONAL",
      "SYSTEM",
    ])
    .withMessage("نوع الإشعار غير صالح"),
  body("title")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("عنوان الإشعار يجب أن يكون بين 2 و 100 حرف")
    .notEmpty()
    .withMessage("عنوان الإشعار مطلوب"),
  body("body")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("محتوى الإشعار يجب أن يكون بين 2 و 500 حرف")
    .notEmpty()
    .withMessage("محتوى الإشعار مطلوب"),
  body("userId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرّف المستخدم غير صالح"),
  body("data")
    .optional()
    .isObject()
    .withMessage("البيانات الإضافية يجب أن تكون كائن"),
];

exports.notificationIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف الإشعار غير صالح"),
];

exports.markAsReadValidation = [
  body("notificationIds")
    .isArray()
    .withMessage("قائمة معرّفات الإشعارات يجب أن تكون مصفوفة")
    .notEmpty()
    .withMessage("معرّفات الإشعارات مطلوبة"),
  body("notificationIds.*")
    .isInt({ gt: 0 })
    .withMessage("معرّف الإشعار غير صالح"),
];

// تسجيل/إلغاء تسجيل توكن جهاز
exports.registerDeviceValidation = [
  body("token").isString().trim().notEmpty().withMessage("token مطلوب"),
  body("platform")
    .optional()
    .isIn(["android", "ios", "web"])
    .withMessage("منصة غير صالحة"),
  // body("lang")
  //   .optional()
  //   .isString()
  //   .isLength({ min: 2, max: 5 })
  //   .withMessage("لغة غير صالحة"),
];

exports.deviceTokenParamValidation = [
  param("token").isString().trim().notEmpty().withMessage("token غير صالح"),
];

// ======================= Offers =======================

exports.createOfferValidation = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("عنوان العرض يجب أن يكون بين 2 و 100 حرف")
    .notEmpty()
    .withMessage("عنوان العرض مطلوب"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("الوصف يجب ألا يتجاوز 500 حرف"),
  body("offerType")
    .isIn([
      "DISCOUNT_PERCENTAGE",
      "DISCOUNT_AMOUNT",
      "BUY_ONE_GET_ONE",
      "FREE_SHIPPING",
      "SPECIAL_OFFER",
    ])
    .withMessage("نوع العرض غير صالح"),
  body("target")
    .isIn([
      "ALL_PRODUCTS",
      "SPECIFIC_PRODUCTS",
      "SPECIFIC_CATEGORIES",
      "SPECIFIC_BRANDS",
    ])
    .withMessage("هدف العرض غير صالح"),
  body("discountPercentage")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("نسبة الخصم يجب أن تكون بين 1 و 100"),
  body("discountAmount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("مبلغ الخصم يجب أن يكون رقم موجب"),
  // body("minPurchaseAmount")
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage("الحد الأدنى للشراء غير صالح"),
  // body("maxDiscountAmount")
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage("الحد الأقصى للخصم غير صالح"),
  body("startDate").isISO8601().withMessage("تاريخ البداية غير صالح"),
  body("endDate").isISO8601().withMessage("تاريخ النهاية غير صالح"),
  body("image").optional().isURL().withMessage("رابط الصورة غير صالح"),
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ترتيب العرض يجب أن يكون رقم موجب"),
  body("productIds")
    .optional()
    .isArray()
    .withMessage("قائمة المنتجات يجب أن تكون مصفوفة"),
  body("categoryIds")
    .optional()
    .isArray()
    .withMessage("قائمة التصنيفات يجب أن تكون مصفوفة"),
  body("brandIds")
    .optional()
    .isArray()
    .withMessage("قائمة الماركات يجب أن تكون مصفوفة"),
  body().custom((value, { req }) => {
    // التحقق من أن الخصم مناسب لنوع العرض
    if (
      value.offerType === "DISCOUNT_PERCENTAGE" &&
      !value.discountPercentage
    ) {
      throw new Error("نسبة الخصم مطلوبة لعروض النسبة المئوية");
    }
    if (value.offerType === "DISCOUNT_AMOUNT" && !value.discountAmount) {
      throw new Error("مبلغ الخصم مطلوب لعروض المبلغ الثابت");
    }

    // التحقق من أن التواريخ منطقية
    if (
      value.startDate &&
      value.endDate &&
      new Date(value.startDate) >= new Date(value.endDate)
    ) {
      throw new Error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
    }

    return true;
  }),
];

exports.updateOfferValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف العرض غير صالح"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("عنوان العرض يجب أن يكون بين 2 و 100 حرف"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("الوصف يجب ألا يتجاوز 500 حرف"),
  body("offerType")
    .optional()
    .isIn([
      "DISCOUNT_PERCENTAGE",
      "DISCOUNT_AMOUNT",
      "BUY_ONE_GET_ONE",
      "FREE_SHIPPING",
      "SPECIAL_OFFER",
    ])
    .withMessage("نوع العرض غير صالح"),
  body("discountPercentage")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("نسبة الخصم يجب أن تكون بين 1 و 100"),
  body("discountAmount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("مبلغ الخصم يجب أن يكون رقم موجب"),
  // body("minPurchaseAmount")
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage("الحد الأدنى للشراء غير صالح"),
  // body("maxDiscountAmount")
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage("الحد الأقصى للخصم غير صالح"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("تاريخ البداية غير صالح"),
  body("endDate").optional().isISO8601().withMessage("تاريخ النهاية غير صالح"),
  body("image").optional().isURL().withMessage("رابط الصورة غير صالح"),
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ترتيب العرض يجب أن يكون رقم موجب"),
];

exports.offerIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف العرض غير صالح"),
];

// ======================= Users =======================

exports.userIdParamValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف المستخدم غير صالح"),
];

exports.updateUserValidation = [
  param("id").isInt({ gt: 0 }).withMessage("معرّف المستخدم غير صالح"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("الاسم يجب أن يكون بين 2 و 50 حرفًا"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة"),
  body("phone")
    .optional()
    .matches(phoneRegex)
    .withMessage("صيغة رقم الهاتف غير صحيحة"),
  // body("role")
  //   .optional()
  //   .isIn(["ADMIN", "CUSTOMER"])
  //   .withMessage("الدور غير صالح"),
];

// exports.adminUsersQueryValidation = [
//   query("page").optional().isInt({ gt: 0 }).withMessage("رقم الصفحة غير صالح"),
//   query("limit").optional().isInt({ gt: 0, lt: 101 }).withMessage("الحد يجب أن يكون بين 1 و 100"),
//   query("role").optional().isIn(["ADMIN", "CUSTOMER"]).withMessage("الدور غير صالح"),
//   query("search").optional().isString().withMessage("نص البحث غير صالح"),
// ];
