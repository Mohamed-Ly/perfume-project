const prisma = require("../config/prisma");
const { sendSuccess, sendFail, sendError } = require("../utils/responseHelper");

// ================= Helpers =================
async function getOrCreateWishlist(userId) {
  let wishlist = await prisma.wishlist.findUnique({ 
    where: { userId } 
  });
  
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ 
      data: { userId } 
    });
  }
  
  return wishlist;
}

async function loadWishlist(wishlistId) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { id: wishlistId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: { 
                where: { isPrimary: true }, 
                take: 1 
              },
              // 🔥 التصحيح: استخدم ProductVariant بدل variants
              ProductVariant: {
                where: { isActive: true },
                orderBy: { priceCents: 'asc' },
                take: 1
              }
            }
          }
        },
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  if (!wishlist) return null;

  // تنسيق البيانات
  const items = wishlist.items.map(item => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      description: item.product.description,
      isActive: item.product.isActive,
      brand: item.product.brand,
      category: item.product.category,
      image: item.product.images[0]?.path || null,
      // 🔥 التصحيح: استخدم ProductVariant بدل variants
      minPriceCents: item.product.ProductVariant[0]?.priceCents || 0,
      hasActiveVariants: item.product.ProductVariant.length > 0
    },
    addedAt: item.createdAt
  }));

  return {
    id: wishlist.id,
    items,
    totals: {
      totalItems: wishlist.items.length
    }
  };
}

// ================= Controllers =================

// GET /api/wishlist - عرض قائمة المفضلة
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const wishlist = await getOrCreateWishlist(userId);
    const fullWishlist = await loadWishlist(wishlist.id);
    
    return sendSuccess(res, { wishlist: fullWishlist }, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// POST /api/wishlist/items - إضافة منتج للمفضلة
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId } = req.body;

    // التحقق من وجود المنتج
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      // 🔥 التصحيح: استخدم ProductVariant بدل variants
      include: { ProductVariant: { where: { isActive: true }, take: 1 } }
    });

    if (!product) {
      return sendFail(res, { message: "المنتج غير موجود" }, 404);
    }

    // 🔥 التصحيح: استخدم ProductVariant بدل variants
    if (!product.isActive || product.ProductVariant.length === 0) {
      return sendFail(res, { message: "المنتج غير متاح حالياً" }, 400);
    }

    const wishlist = await getOrCreateWishlist(userId);

    // التحقق إذا المنتج موجود مسبقاً
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: product.id
        }
      }
    });

    if (existingItem) {
      return sendFail(res, { message: "المنتج موجود مسبقاً في المفضلة" }, 400);
    }

    // إضافة المنتج
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: product.id
      }
    });

    const fullWishlist = await loadWishlist(wishlist.id);
    return sendSuccess(res, { 
      wishlist: fullWishlist,
      message: "تم إضافة المنتج إلى المفضلة"
    }, 201);

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// DELETE /api/wishlist/items/:id - إزالة منتج من المفضلة
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const itemId = Number(req.params.id);

    const wishlist = await getOrCreateWishlist(userId);
    
    // البحث عن العنصر والتأكد أنه للمستخدم
    const item = await prisma.wishlistItem.findFirst({
      where: { 
        id: itemId,
        wishlistId: wishlist.id 
      }
    });

    if (!item) {
      return sendFail(res, { message: "العنصر غير موجود في المفضلة" }, 404);
    }

    await prisma.wishlistItem.delete({
      where: { id: item.id }
    });

    const fullWishlist = await loadWishlist(wishlist.id);
    return sendSuccess(res, { 
      wishlist: fullWishlist,
      message: "تم إزالة المنتج من المفضلة"
    }, 200);

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// DELETE /api/wishlist/clear - إفراغ المفضلة
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const wishlist = await getOrCreateWishlist(userId);

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id }
    });

    const fullWishlist = await loadWishlist(wishlist.id);
    return sendSuccess(res, { 
      wishlist: fullWishlist,
      message: "تم إفراغ المفضلة"
    }, 200);

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// GET /api/wishlist/count - عداد العناصر
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.sub;
    const wishlist = await getOrCreateWishlist(userId);

    const itemCount = await prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id }
    });

    return sendSuccess(res, { 
      totalItems: itemCount 
    }, 200);

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// POST /api/wishlist/items/:id/move-to-cart - نقل منتج من المفضلة للسلة
exports.moveToCart = async (req, res) => {
  const txn = await prisma.$transaction(async (prisma) => {
    try {
      const userId = req.user.sub;
      const itemId = Number(req.params.id);

      const wishlist = await getOrCreateWishlist(userId);
      
      // البحث عن العنصر في المفضلة
      const wishlistItem = await prisma.wishlistItem.findFirst({
        where: { 
          id: itemId,
          wishlistId: wishlist.id 
        },
        include: {
          product: {
            include: {
              // 🔥 التصحيح: استخدم ProductVariant بدل variants
              ProductVariant: { 
                where: { isActive: true, stockQty: { gt: 0 } },
                orderBy: { priceCents: 'asc' },
                take: 1
              }
            }
          }
        }
      });

      if (!wishlistItem) {
        return sendFail(res, { message: "العنصر غير موجود في المفضلة" }, 404);
      }

      // 🔥 التصحيح: استخدم ProductVariant بدل variants
      if (wishlistItem.product.ProductVariant.length === 0) {
        return sendFail(res, { message: "لا توجد نسخ متاحة لهذا المنتج" }, 400);
      }

      const variant = wishlistItem.product.ProductVariant[0];

      // الحصول على سلة المستخدم أو إنشاؤها
      let cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
      }

      // التحقق إذا المنتج موجود في السلة
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: variant.id
          }
        }
      });

      if (existingCartItem) {
        // زيادة الكمية إذا موجود
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { qty: { increment: 1 } }
        });
      } else {
        // إضافة جديدة
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: variant.id,
            qty: 1
          }
        });
      }

      // حذف العنصر من المفضلة
      await prisma.wishlistItem.delete({
        where: { id: wishlistItem.id }
      });

      const fullWishlist = await loadWishlist(wishlist.id);
      
      return sendSuccess(res, { 
        wishlist: fullWishlist,
        message: "تم نقل المنتج إلى السلة"
      }, 200);

    } catch (error) {
      throw error;
    }
  });
};