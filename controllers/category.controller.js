const prisma = require("../config/prisma");
const { sendSuccess, sendFail, sendError } = require("../utils/responseHelper");
const slugify = require("../utils/slugify");

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    let { name, slug, isActive } = req.body;
    if (!slug || !slug.trim()) slug = slugify(name);

    // slug فريد
    const conflict = await prisma.category.findUnique({ where: { slug } });
    if (conflict)
      return sendFail(res, { message: "السلاق مستخدم بالفعل" }, 400);

    const category = await prisma.category.create({
      data: { name, slug, isActive: isActive ?? true },
    });

    return sendSuccess(res, { category }, 201);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// GET /api/categories (قائمة كاملة، مع فلترة اختيارية بالاسم)
exports.listCategories = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const sortBy = req.query.sortBy || "name";
    const order = (req.query.order || "asc").toLowerCase();

    const where = {};
    if (q) where.name = { contains: q };

    const [total, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        orderBy: [{ [sortBy]: order }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return sendSuccess(
      res,
      {
        total,
        page,
        pages: Math.ceil(total / limit),
        items: categories,
      },
      200
    );
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// GET /api/categories/:id
exports.getCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return sendFail(res, { message: "التصنيف غير موجود" }, 404);
    return sendSuccess(res, { category }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// GET /api/categories/count
exports.countCategories = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const isActiveParam = req.query.isActive; // اختياري: "true" | "false"

    const where = {};
    if (q) where.name = { contains: q };
    if (typeof isActiveParam !== "undefined") {
      where.isActive = String(isActiveParam).toLowerCase() === "true";
    }

    const total = await prisma.category.count({ where });
    return sendSuccess(res, { total }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// PATCH /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return sendFail(res, { message: "التصنيف غير موجود" }, 404);

    let { name, slug, isActive } = req.body;

    if (slug && slug.trim()) {
      // تأكد عدم وجود تعارض
      const s = slugify(slug);
      const conflict = await prisma.category.findUnique({ where: { slug: s } });
      if (conflict && conflict.id !== id) {
        return sendFail(res, { message: "السلاق مستخدم بالفعل" }, 400);
      }
      slug = s;
    } else if (name) {
      const s = slugify(name);
      const conflict = await prisma.category.findUnique({ where: { slug: s } });
      if (!conflict || conflict.id === id) slug = s; // حدّثه لو لا يوجد تعارض
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    return sendSuccess(res, { category: updated }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // التحقق من وجود التصنيف والمنتجات المرتبطة
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        products: { take: 1 }, // نتحقق من وجود منتجات
        ProductCategory: { take: 1 }, // والعلاقات المتعددة
      },
    });

    if (!existing) {
      return sendFail(res, { message: "التصنيف غير موجود" }, 404);
    }

    // 🔥 منع الحذف إذا كان هناك منتجات مرتبطة
    if (existing.products.length > 0 || existing.ProductCategory.length > 0) {
      return sendFail(
        res,
        {
          message:
            "لا يمكن حذف التصنيف لأنه يحتوي على منتجات. يرجى نقل المنتجات أولاً أو حذفها.",
        },
        400
      );
    }

    // حذف العلاقات مع العروض أولاً
    await prisma.offerCategory.deleteMany({
      where: { categoryId: id },
    });

    // ثم حذف التصنيف
    await prisma.category.delete({ where: { id } });

    return sendSuccess(res, { message: "تم حذف التصنيف بنجاح" }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};
