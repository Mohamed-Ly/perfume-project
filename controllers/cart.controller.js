// controllers/cart.controller.js
const prisma = require("../config/prisma");
const { sendSuccess, sendFail, sendError } = require("../utils/responseHelper");

// ================= Helpers =================
async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

async function loadCart(cartId) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      },
    },
  });

  if (!cart) return null;

  // احسب الإجماليات
  let totalQty = 0;
  let subtotalCents = 0;
  const items = cart.items.map((it) => {
    totalQty += it.qty;
    const price = it.variant?.priceCents ?? 0;
    subtotalCents += price * it.qty;

    // 🔧 التغيير: نعيد اسم الملف فقط (مثل الـ products) وليس URL كامل
    const imagePath = it.variant.product.images[0]?.path || null;

    return {
      id: it.id,
      qty: it.qty,
      variant: {
        id: it.variant.id,
        sizeMl: it.variant.sizeMl,
        concentration: it.variant.concentration,
        priceCents: it.variant.priceCents,
        stockQty: it.variant.stockQty,
        isActive: it.variant.isActive,
        product: {
          id: it.variant.product.id,
          name: it.variant.product.name,
          slug: it.variant.product.slug,
          image: imagePath, // 🔧 الآن نعيد path فقط مثل الـ products
        },
      },
    };
  });

  return {
    id: cart.id,
    items,
    totals: {
      distinctItems: cart.items.length,
      totalQty,
      subtotalCents,
    },
  };
}

// ================= Controllers =================

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.sub;
    const cart = await getOrCreateCart(userId);
    const full = await loadCart(cart.id);
    return sendSuccess(res, { cart: full }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// POST /api/cart/items
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { variantId, qty } = req.body;

    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(variantId) },
      include: { product: true },
    });
    if (!variant) return sendFail(res, { message: "المتغير غير موجود" }, 404);
    if (!variant.isActive || !variant.product.isActive) {
      return sendFail(res, { message: "المنتج أو المتغير غير مفعل" }, 400);
    }
    if (qty <= 0)
      return sendFail(res, { message: "الكمية يجب أن تكون أكبر من 0" }, 422);

    const cart = await getOrCreateCart(userId);

    // هل العنصر موجود؟
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    });

    let newQty = qty;
    if (existingItem) newQty = existingItem.qty + qty;

    // تحقق من المخزون
    if (newQty > variant.stockQty) {
      return sendFail(
        res,
        { message: "الكمية المطلوبة تتجاوز المخزون المتاح" },
        400
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variant.id,
          qty,
        },
      });
    }

    const full = await loadCart(cart.id);
    return sendSuccess(res, { cart: full }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// PATCH /api/cart/items/:itemId
exports.updateItemQty = async (req, res) => {
  try {
    const userId = req.user.sub;
    const itemId = Number(req.params.itemId);
    const { qty } = req.body;

    if (qty <= 0)
      return sendFail(res, { message: "الكمية يجب أن تكون أكبر من 0" }, 422);

    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });
    if (!item)
      return sendFail(res, { message: "العنصر غير موجود في السلة" }, 404);

    // تحقق مخزون
    if (qty > item.variant.stockQty) {
      return sendFail(res, { message: "الكمية تتجاوز المخزون المتاح" }, 400);
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { qty },
    });

    const full = await loadCart(cart.id);
    return sendSuccess(res, { cart: full }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// DELETE /api/cart/items/:itemId
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const itemId = Number(req.params.itemId);

    const cart = await getOrCreateCart(userId);
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item)
      return sendFail(res, { message: "العنصر غير موجود في السلة" }, 404);

    await prisma.cartItem.delete({ where: { id: item.id } });

    const full = await loadCart(cart.id);
    return sendSuccess(res, { cart: full }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.sub;
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const full = await loadCart(cart.id);
    return sendSuccess(res, { cart: full, message: "تم إفراغ السلة" }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// GET /api/cart/count
exports.countCart = async (req, res) => {
  try {
    const userId = req.user.sub;
    const cart = await getOrCreateCart(userId);

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { variant: true },
    });

    const distinctItems = items.length;
    const totalQty = items.reduce((sum, it) => sum + it.qty, 0);

    return sendSuccess(res, { distinctItems, totalQty }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};
