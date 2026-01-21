const prisma = require("../config/prisma");
const { sendSuccess, sendFail, sendError } = require("../utils/responseHelper");
const { pushToTokens } = require("../utils/push");

// ================= Controllers =================

// GET /api/notifications - قائمة إشعارات المستخدم
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const where = {
      OR: [
        { userId }, // إشعارات خاصة بالمستخدم
        { userId: null }, // إشعارات عامة
      ],
    };

    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
    });

    return sendSuccess(
      res,
      {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// GET /api/notifications/stats - إحصائيات الإشعارات
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.sub;

    const stats = await prisma.notification.aggregate({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    return sendSuccess(
      res,
      {
        stats: {
          totalNotifications: stats._count.id,
          unreadCount,
          lastNotificationAt: stats._max.createdAt,
        },
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PATCH /api/notifications/read - تعليم إشعارات كمقروءة
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { notificationIds } = req.body;

    // التحقق من أن الإشعارات تخص المستخدم أو عامة
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        OR: [{ userId }, { userId: null }],
      },
    });

    if (notifications.length === 0) {
      return sendFail(res, { message: "لم يتم العثور على الإشعارات" }, 404);
    }

    // تحديث الإشعارات
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        OR: [{ userId }, { userId: null }],
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    return sendSuccess(
      res,
      {
        message: "تم تعليم الإشعارات كمقروءة",
        markedCount: notifications.length,
        unreadCount,
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// PATCH /api/notifications/read-all - تعليم جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return sendSuccess(
      res,
      {
        message: "تم تعليم جميع الإشعارات كمقروءة",
        markedCount: result.count,
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// GET /api/notifications/:id - تفاصيل إشعار معين
exports.getNotificationById = async (req, res) => {
  try {
    const userId = req.user.sub;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!notification) {
      return sendFail(res, { message: "الإشعار غير موجود" }, 404);
    }

    // إذا كان غير مقروء، نعلمه كمقروء
    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      notification.isRead = true;
      notification.readAt = new Date();
    }

    return sendSuccess(res, { notification }, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// في الكونترولر - للمستخدم
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.sub;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId }, // إشعاراته الخاصة
          { userId: null }, // أو إشعار عام
        ],
      },
    });

    if (!notification) {
      return sendFail(res, { message: "الإشعار غير موجود" }, 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return sendSuccess(
      res,
      {
        message: "تم حذف الإشعار بنجاح",
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ============ DEVICE TOKEN CONTROLLERS ============
// POST /api/notifications/devices/register
exports.registerDevice = async (req, res) => {
  try {
    const { token, platform, lang } = req.body;

    // لو فيه مستخدم موثّق، اربطه، وإلا خليه null (يتحدّث لاحقًا عند تسجيل الدخول بنفس التوكن)
    const userId = req.user?.sub ?? null;

    const saved = await prisma.deviceToken.upsert({
      where: { token }, // token فريد
      update: {
        userId,
        platform: platform ?? null,
        lang: lang ?? null,
        isActive: true,
      },
      create: {
        token,
        userId,
        platform: platform ?? null,
        lang: lang ?? null,
        isActive: true,
      },
    });

    return sendSuccess(res, { device: saved, message: "تم تسجيل الجهاز" }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// DELETE /api/notifications/devices/:token
exports.unregisterDevice = async (req, res) => {
  try {
    const { token } = req.params;
    // حذف نهائي (بديل: update isActive=false)
    await prisma.deviceToken.delete({ where: { token } }).catch(() => null);
    return sendSuccess(res, { message: "تم إلغاء تسجيل الجهاز" }, 200);
  } catch (e) {
    return sendError(res, e.message, 500);
  }
};

// ================= Admin Controllers =================

// ============ ADMIN: إنشاء إشعار + Push ============
// (عدّل دالتك createNotification لتدعم Push + إشعار عام لكل مستخدم)
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

exports.createNotification = async (req, res) => {
  try {
    const { type, title, body, userId, data } = req.body;

    if (userId) {
      // 1) خزّن الإشعار
      const notif = await prisma.notification.create({
        data: {
          type,
          title,
          body,
          userId: Number(userId),
          data: data ?? {},
          sentAt: new Date(),
        },
      });

      // 2) Push لمستخدم واحد
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: Number(userId), isActive: true },
        select: { token: true },
      });
      const tokenList = tokens.map((t) => t.token);

      if (tokenList.length) {
        await pushToTokens({
          tokens: tokenList,
          title,
          body,
          data: { type, notificationId: String(notif.id) },
        });
        await prisma.notification.update({
          where: { id: notif.id },
          data: { isPush: true },
        });
      }

      return sendSuccess(
        res,
        { notification: notif, message: "تم إرسال الإشعار للمستخدم" },
        201
      );
    }

    // === إشعار عام (حل “القراءة” لكل مستخدم على حدة) ===
    const users = await prisma.user.findMany({ select: { id: true } });
    if (!users.length) {
      return sendSuccess(
        res,
        { message: "لا يوجد مستخدمون لإرسال إشعار عام" },
        200
      );
    }

    // 1) أنشئ نسخة لكل مستخدم
    const rows = users.map((u) => ({
      type,
      title,
      body,
      userId: u.id,
      data: data ?? {},
      sentAt: new Date(),
    }));
    await prisma.notification.createMany({ data: rows });

    // 2) أرسل Push على دفعات
    const devices = await prisma.deviceToken.findMany({
      where: { isActive: true },
      select: { token: true },
    });
    const tokenList = devices.map((d) => d.token);

    for (const group of chunk(tokenList, 500)) {
      await pushToTokens({ tokens: group, title, body, data: { type } });
    }

    return sendSuccess(res, { message: "تم إرسال الإشعار العام" }, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// GET /api/admin/notifications - جميع الإشعارات (للأدمن)
// ✅ جديد: نرجّع آخر 50 إشعار (مع إمكانية فلترة اختيارية على userId/type لكن بدون صفحات)
exports.getAllNotifications = async (req, res) => {
  try {
    const { type, q, limit = 50 } = req.query;

    // اختيارياً: فلترة قبل الـ groupBy لتقليل البيانات
    const where = {};
    if (type) where.type = type;
    if (q) {
      // فلترة أولية بسيطة بالعنوان/النص
      where.OR = [{ title: { contains: q } }, { body: { contains: q } }];
    }

    // نجمع حسب (type, title, body) ونجيب أحدث وقت وعدد المستلمين
    const grouped = await prisma.notification.groupBy({
      by: ["type", "title", "body"],
      where,
      _max: { createdAt: true, sentAt: true },
      _count: { id: true },
      orderBy: { _max: { createdAt: "desc" } }, // رتب بأحدث إنشاء
      take: parseInt(limit),
    });

    const campaigns = grouped.map((g) => ({
      type: g.type,
      title: g.title,
      body: g.body,
      lastSentAt: g._max.sentAt || g._max.createdAt, // آخر إرسال للحملة
      recipients: g._count.id, // كم مستخدم استقبلها
    }));

    return sendSuccess(res, { campaigns, total: campaigns.length }, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
