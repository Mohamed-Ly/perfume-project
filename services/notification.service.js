// services/notification.service.js
const prisma = require("../config/prisma");
const { pushToTokens } = require("../utils/push");

// تقسيم مصفوفة لدفعات
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * إرسال إشعار لمستخدم واحد:
 * 1) يحفظ الإشعار في DB
 * 2) يرسل Push لكل التوكنات النشطة للمستخدم
 * 3) يعلّم isPush=true لو تم إرسال أي دفعة بنجاح
 */
async function sendUserNotification({ userId, type, title, body, data = {} }) {
  if (!userId) {
    throw new Error("sendUserNotification: userId مطلوب");
  }

  // خزّن أولاً (يسمح بعرض الإشعار في الواجهة حتى لو فشل Push)
  const notif = await prisma.notification.create({
    data: {
      type,
      title,
      body,
      userId,
      data,
      sentAt: new Date(),
    },
  });

  // جهّز التوكنات
  const tokens = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
    select: { token: true },
  });
  const tokenList = tokens.map((t) => t.token);

  let successCount = 0;
  if (tokenList.length) {
    // نضيف معرف الإشعار ضمن data ليستفيد منه التطبيق
    const { successCount: ok } = await pushToTokens({
      tokens: tokenList,
      title,
      body,
      data: { ...data, type, notificationId: String(notif.id) },
    });
    successCount = ok;
  }

  // علم isPush لو نجاح واحد على الأقل
  if (successCount > 0) {
    await prisma.notification.update({
      where: { id: notif.id },
      data: { isPush: true },
    });
  }

  return { notification: notif, successCount };
}

/**
 * إشعار عام: نسخة لكل مستخدم + Push على دفعات
 * ملاحظة: هذا يحل مشكلة markAsRead للإشعارات العامة.
 */
async function sendBroadcastNotification({ type, title, body, data = {} }) {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (!users.length) return { createdCount: 0, successBatches: 0 };

  // 1) إنشاء نسخة لكل مستخدم
  const rows = users.map((u) => ({
    type,
    title,
    body,
    userId: u.id,
    data,
    sentAt: new Date(),
  }));
  const created = await prisma.notification.createMany({ data: rows });

  // 2) Push لجميع الأجهزة النشطة على دفعات (500 مناسب مع FCM)
  const devices = await prisma.deviceToken.findMany({
    where: { isActive: true },
    select: { token: true },
  });
  const tokenList = devices.map((d) => d.token);

  let successBatches = 0;
  for (const group of chunk(tokenList, 500)) {
    const { successCount } = await pushToTokens({
      tokens: group,
      title,
      body,
      data: { ...data, type },
    });
    if (successCount > 0) successBatches++;
  }

  return { createdCount: created.count, successBatches };
}

module.exports = {
  sendUserNotification,
  sendBroadcastNotification,
};
