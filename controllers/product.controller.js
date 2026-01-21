// controllers/product.controller.js
const prisma = require("../config/prisma");
const { sendSuccess, sendFail, sendError } = require("../utils/responseHelper");
const slugify = require("../utils/slugify");
const fs = require("fs");
const path = require("path");

// حذف ملف صورة بأمان
function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

// ====== Helpers: resolve Brand/Category by name or slug ======
const tryFindBrandByNameOrSlug = async (name) => {
  const byName = await prisma.brand.findFirst({ where: { name } });
  if (byName) return byName;
  const bySlugified = await prisma.brand.findUnique({
    where: { slug: slugify(name) },
  });
  return bySlugified;
};

async function resolveBrand({ brand, brandSlug }) {
  const bSlug = typeof brandSlug === "string" ? brandSlug.trim() : undefined;
  const bName = typeof brand === "string" ? brand.trim() : undefined;

  if (bSlug) {
    return prisma.brand.findUnique({ where: { slug: bSlug } });
  }
  if (bName) {
    return tryFindBrandByNameOrSlug(bName);
  }
  return null;
}

const tryFindCategoryByNameOrSlug = async (name) => {
  const byName = await prisma.category.findFirst({ where: { name } });
  if (byName) return byName;
  const bySlugified = await prisma.category.findUnique({
    where: { slug: slugify(name) },
  });
  return bySlugified;
};

async function resolveCategory({ category, categorySlug }) {
  const cSlug =
    typeof categorySlug === "string" ? categorySlug.trim() : undefined;
  const cName = typeof category === "string" ? category.trim() : undefined;

  if (cSlug) {
    return prisma.category.findUnique({ where: { slug: cSlug } });
  }
  if (cName) {
    return tryFindCategoryByNameOrSlug(cName);
  }
  return null;
}

// 🔧 دالة لتحويل القيم إلى Boolean
const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
};

// =================== CREATE ===================
exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      isActive,
      brand,
      brandSlug,
      brandId,
      category,
      categorySlug,
      categoryId,
    } = req.body;

    // 🔧 تحويل isActive إلى Boolean
    isActive = parseBoolean(isActive);

    if (!slug || !slug.trim()) slug = slugify(name);

    // slug فريد
    const slugConflict = await prisma.product.findUnique({ where: { slug } });
    if (slugConflict)
      return sendFail(res, { message: "المنتج مستخدم بالفعل" }, 400);

    // حلّ الماركة/التصنيف
    let brandRow;
    if (brandId) {
      brandRow = await prisma.brand.findUnique({
        where: { id: parseInt(brandId) },
      });
    } else if (brand) {
      brandRow = await resolveBrand({ brand, brandSlug });
    }

    let categoryRow;
    if (categoryId) {
      categoryRow = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });
    } else if (category) {
      categoryRow = await resolveCategory({ category, categorySlug });
    }

    // ✅ التحقق من وجود الصور
    const files = req.files || [];
    console.log("📸 Files uploaded:", files.length, files);

    if (files.length === 0) {
      return sendFail(
        res,
        { message: "يجب رفع صورة واحدة على الأقل للمنتج" },
        422
      );
    }

    // 🔧 استخدام المسار الصحيح للصور
    const imagesData = files.map((f, idx) => ({
      path: f.filename, // استخدام اسم الملف فقط
      isPrimary: idx === 0,
      sortOrder: idx,
    }));

    console.log("📁 Images data to save:", imagesData);
    console.log("🔧 isActive value:", isActive, "Type:", typeof isActive);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        brandId: brandRow.id,
        categoryId: categoryRow.id,
        isActive: isActive, // 🔧 الآن قيمة Boolean صحيحة
        images: { create: imagesData },
      },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }] },
        brand: true,
        category: true,
      },
    });

    return sendSuccess(res, { product }, 201);
  } catch (e) {
    console.error("❌ Error in createProduct:", e);
    return sendError(res, e.message, 500);
  }
};

// =================== LIST ===================
exports.listProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const isActiveParam = req.query.isActive;
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const sortBy = req.query.sortBy || "createdAt";
    const order = (req.query.order || "desc").toLowerCase();

    // فلاتر بالاسم/السلاق
    const brandName = req.query.brand
      ? String(req.query.brand).trim()
      : undefined;
    const brandSlugQ = req.query.brandSlug
      ? String(req.query.brandSlug).trim()
      : undefined;
    const categoryName = req.query.category
      ? String(req.query.category).trim()
      : undefined;
    const categorySlugQ = req.query.categorySlug
      ? String(req.query.categorySlug).trim()
      : undefined;

    let brandIdFilter, categoryIdFilter;

    if (brandSlugQ) {
      const b = await prisma.brand.findUnique({ where: { slug: brandSlugQ } });
      if (b) brandIdFilter = b.id;
      else
        return sendSuccess(res, { total: 0, page, pages: 0, items: [] }, 200);
    } else if (brandName) {
      const b = await prisma.brand.findFirst({ where: { name: brandName } });
      if (b) brandIdFilter = b.id;
      else
        return sendSuccess(res, { total: 0, page, pages: 0, items: [] }, 200);
    }

    if (categorySlugQ) {
      const c = await prisma.category.findUnique({
        where: { slug: categorySlugQ },
      });
      if (c) categoryIdFilter = c.id;
      else
        return sendSuccess(res, { total: 0, page, pages: 0, items: [] }, 200);
    } else if (categoryName) {
      const c = await prisma.category.findFirst({
        where: { name: categoryName },
      });
      if (c) categoryIdFilter = c.id;
      else
        return sendSuccess(res, { total: 0, page, pages: 0, items: [] }, 200);
    }

    const where = {};
    if (q) where.name = { contains: q };
    if (typeof isActiveParam !== "undefined") {
      where.isActive = parseBoolean(isActiveParam); // 🔧 استخدام الدالة المحسنة
    }
    if (brandIdFilter) where.brandId = brandIdFilter;
    if (categoryIdFilter) where.categoryId = categoryIdFilter;

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: [{ [sortBy]: order }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: { orderBy: [{ sortOrder: "asc" }] },
          brand: true,
          category: true,
        },
      }),
    ]);

    return sendSuccess(
      res,
      {
        total,
        page,
        pages: Math.ceil(total / limit),
        items,
      },
      200
    );
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// =================== GET ONE ===================
exports.getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }] },
        brand: true,
        category: true,
      },
    });
    if (!product) return sendFail(res, { message: "المنتج غير موجود" }, 404);
    return sendSuccess(res, { product }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// =================== UPDATE ===================
exports.updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) return sendFail(res, { message: "المنتج غير موجود" }, 404);

    // تطبيع بسيط لقيم form-data
    const norm = (v) => {
      if (typeof v !== "string") return v;
      const s = v.trim();
      if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined")
        return undefined;
      return s;
    };

    let {
      name,
      slug,
      description,
      isActive,
      removeImageIds,
      brandId,
      categoryId,
    } = req.body; // 🔧 إضافة brandId و categoryId

    name = norm(name);
    slug = norm(slug);
    brandId = norm(brandId); // 🔧 معالجة brandId
    categoryId = norm(categoryId); // 🔧 معالجة categoryId
    if (typeof description !== "string") description = undefined;

    // 🔧 تحويل isActive إلى Boolean
    isActive = parseBoolean(isActive);

    // معالجة slug (فريد)
    if (slug) {
      const s = slugify(slug);
      const conflict = await prisma.product.findUnique({ where: { slug: s } });
      if (conflict && conflict.id !== id) {
        return sendFail(res, { message: "السلاق مستخدم بالفعل" }, 400);
      }
      slug = s;
    } else if (name) {
      const s = slugify(name);
      const conflict = await prisma.product.findUnique({ where: { slug: s } });
      if (!conflict || conflict.id === id) slug = s;
    }

    // 🔧 التحقق من وجود الماركة والتصنيف الجديدين
    let brandIdToUpdate = existing.brandId;
    let categoryIdToUpdate = existing.categoryId;

    if (brandId) {
      const brandExists = await prisma.brand.findUnique({
        where: { id: parseInt(brandId) },
      });
      if (!brandExists)
        return sendFail(res, { message: "الماركة غير موجودة" }, 404);
      brandIdToUpdate = parseInt(brandId);
    }

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });
      if (!categoryExists)
        return sendFail(res, { message: "التصنيف غير موجود" }, 404);
      categoryIdToUpdate = parseInt(categoryId);
    }

    // جمع IDs للصور المراد حذفها
    let removeIds = Array.isArray(removeImageIds)
      ? removeImageIds.map(Number)
      : [];
    if (typeof removeImageIds === "string") {
      try {
        removeIds = JSON.parse(removeImageIds);
      } catch {}
      removeIds = Array.isArray(removeIds) ? removeIds.map(Number) : [];
    }
    const toRemove = existing.images.filter((img) =>
      removeIds.includes(img.id)
    );
    // حذف ملفات من القرص
    toRemove.forEach((img) => safeUnlink(path.join("uploads", img.path)));

    // صور جديدة
    const newFiles = req.files || [];
    const startOrder = existing.images.length - toRemove.length;

    const newImagesData = newFiles.map((f, i) => ({
      path: f.filename,
      isPrimary: false,
      sortOrder: startOrder + i,
    }));

    const updated = await prisma.$transaction(async (tx) => {
      if (toRemove.length) {
        await tx.productImage.deleteMany({
          where: { id: { in: toRemove.map((x) => x.id) }, productId: id },
        });
      }

      const up = await tx.product.update({
        where: { id },
        data: {
          name: name ?? existing.name,
          slug: slug ?? existing.slug,
          description:
            typeof description === "string"
              ? description || null
              : existing.description,
          brandId: brandIdToUpdate, // 🔧 استخدام ID الماركة المحدث
          categoryId: categoryIdToUpdate, // 🔧 استخدام ID التصنيف المحدث
          isActive:
            typeof isActive === "boolean" ? isActive : existing.isActive,
          images: newImagesData.length ? { create: newImagesData } : undefined,
        },
        include: {
          images: { orderBy: [{ sortOrder: "asc" }] },
          brand: true,
          category: true,
        },
      });

      // ضمن وجود صورة رئيسية واحدة
      const hasPrimary = up.images.some((i) => i.isPrimary);
      if (!hasPrimary && up.images.length) {
        await tx.productImage.update({
          where: { id: up.images[0].id },
          data: { isPrimary: true },
        });
      }
      return up;
    });

    return sendSuccess(res, { product: updated }, 200);
  } catch (e) {
    console.error("❌ Error in updateProduct:", e);
    return sendError(res, e.message, 500);
  }
};

// =================== DELETE ===================
exports.deleteProduct = async (req, res) => {
  const txn = await prisma.$transaction(async (prisma) => {
    try {
      const id = Number(req.params.id);

      // التحقق من وجود المنتج مع جميع العلاقات
      const existing = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          ProductVariant: { take: 1 },
          WishlistItem: { take: 1 },
          OfferProduct: { take: 1 },
        },
      });

      if (!existing) {
        return sendFail(res, { message: "المنتج غير موجود" }, 404);
      }

      // 1. حذف ملفات الصور من السيرڤر
      existing.images.forEach((img) =>
        safeUnlink(path.join("uploads", img.path))
      );

      // 2. حذف جميع البيانات المرتبطة بالترتيب الصحيح:

      // أ. حذف عناصر السلة المرتبطة بالـ variants
      const variantIds = existing.ProductVariant.map((v) => v.id);
      if (variantIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { variantId: { in: variantIds } },
        });
      }

      // ب. حذف عناصر الطلبات المرتبطة بالـ variants
      if (variantIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { variantId: { in: variantIds } },
        });
      }

      // ج. حذف المتغيرات
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      // د. حذف الصور
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      // هـ. حذف عناصر المفضلة
      await prisma.wishlistItem.deleteMany({
        where: { productId: id },
      });

      // و. حذف العلاقات مع العروض
      await prisma.offerProduct.deleteMany({
        where: { productId: id },
      });

      // ز. حذف العلاقات مع التصنيفات المتعددة
      await prisma.productCategory.deleteMany({
        where: { productId: id },
      });

      // ح. أخيراً حذف المنتج نفسه
      await prisma.product.delete({
        where: { id },
      });

      return sendSuccess(
        res,
        { message: "تم حذف المنتج وجميع بياناته بنجاح" },
        200
      );
    } catch (e) {
      throw e;
    }
  });
};

// =================== COUNT (Dashboard) ===================
exports.countProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const isActiveParam = req.query.isActive;

    const brandName = req.query.brand
      ? String(req.query.brand).trim()
      : undefined;
    const brandSlugQ = req.query.brandSlug
      ? String(req.query.brandSlug).trim()
      : undefined;
    const categoryName = req.query.category
      ? String(req.query.category).trim()
      : undefined;
    const categorySlugQ = req.query.categorySlug
      ? String(req.query.categorySlug).trim()
      : undefined;

    let brandIdFilter, categoryIdFilter;

    if (brandSlugQ) {
      const b = await prisma.brand.findUnique({ where: { slug: brandSlugQ } });
      if (b) brandIdFilter = b.id;
      else return sendSuccess(res, { total: 0 }, 200);
    } else if (brandName) {
      const b = await prisma.brand.findFirst({ where: { name: brandName } });
      if (b) brandIdFilter = b.id;
      else return sendSuccess(res, { total: 0 }, 200);
    }

    if (categorySlugQ) {
      const c = await prisma.category.findUnique({
        where: { slug: categorySlugQ },
      });
      if (c) categoryIdFilter = c.id;
      else return sendSuccess(res, { total: 0 }, 200);
    } else if (categoryName) {
      const c = await prisma.category.findFirst({
        where: { name: categoryName },
      });
      if (c) categoryIdFilter = c.id;
      else return sendSuccess(res, { total: 0 }, 200);
    }

    const where = {};
    if (q) where.name = { contains: q };
    if (typeof isActiveParam !== "undefined") {
      where.isActive = parseBoolean(isActiveParam); // 🔧 استخدام الدالة المحسنة
    }
    if (brandIdFilter) where.brandId = brandIdFilter;
    if (categoryIdFilter) where.categoryId = categoryIdFilter;

    const total = await prisma.product.count({ where });
    return sendSuccess(res, { total }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};
