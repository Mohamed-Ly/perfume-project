// controllers/dashboard.controller.js
const prisma = require("../config/prisma");

// احسب تواريخ المدى
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

// مفاتيح تجميع
const ymKey = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // مثال: 2025-10
};

exports.getDashboardCharts = async (req, res) => {
  try {
    const today = new Date();

    // التصحيح: استخدام التاريخ المحلي بدلاً من ISO لتجنب مشاكل المنطقة الزمنية
    const getLocalDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // آخر 6 شهور
    const sixMonthsAgo = addMonths(startOfDay(today), -5); // يشمل الشهر الحالي + 5 قبله
    const monthKeys = [];
    for (let i = 0; i < 6; i++)
      monthKeys.push(ymKey(addMonths(sixMonthsAgo, i)));

    // **التصحيح: آخر 7 أيام تشمل اليوم الحالي**
    const sevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // استخدام startOfDay لضمان تضمين الطلبات الكاملة لكل يوم
      sevenDays.push(startOfDay(d));
    }

    // console.log("📅 Generated Date Range:", {
    //   today: getLocalDateKey(today),
    //   sevenDays: sevenDays.map((d) => ({
    //     date: getLocalDateKey(d),
    //     day: d.getDay(),
    //     dayName: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"][
    //       d.getDay()
    //     ],
    //   })),
    // });

    // 1) جلب الطلبات لآخر 6 شهور + 7 أيام في كول واحد كبير
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay(addMonths(today, -6)),
        },
      },
      select: { createdAt: true, totalCents: true, status: true },
    });

    // 2) جلب المستخدمين لآخر 6 شهور
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startOfDay(addMonths(today, -6)) } },
      select: { createdAt: true },
    });

    // === تجميع شهري للطلبات/الإيراد (نستبعد الملغاة من الإيراد) ===
    const monthlyMap = new Map(
      monthKeys.map((k) => [k, { orders: 0, revenueCents: 0 }])
    );

    for (const o of orders) {
      const key = ymKey(o.createdAt);
      if (!monthlyMap.has(key)) continue;
      monthlyMap.get(key).orders += 1;
      if (o.status !== "CANCELLED") {
        monthlyMap.get(key).revenueCents += o.totalCents || 0;
      }
    }

    const ordersMonthly = monthKeys.map((k) => ({
      ym: k,
      orders: monthlyMap.get(k).orders,
      revenueCents: monthlyMap.get(k).revenueCents,
    }));

    // === تجميع يومي (آخر 7 أيام تشمل اليوم الحالي) ===
    const daysMap = new Map();
    sevenDays.forEach((d) => {
      const key = getLocalDateKey(d);
      daysMap.set(key, {
        orders: 0,
        date: d,
        dayName: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"][
          d.getDay()
        ],
      });
    });

    // تجميع الطلبات حسب اليوم
    for (const o of orders) {
      const orderDate = new Date(o.createdAt);
      const key = getLocalDateKey(orderDate);
      if (daysMap.has(key)) {
        daysMap.get(key).orders += 1;
      }
    }

    // تحويل الخريطة إلى مصفوفة مرتبة
    const ordersWeekly = Array.from(daysMap.entries())
      .sort((a, b) => a[1].date - b[1].date) // ترتيب تصاعدي حسب التاريخ
      .map(([dateKey, data]) => ({
        d: dateKey,
        orders: data.orders,
        dayName: data.dayName, // إضافة اسم اليوم للمساعدة في الفرونت-إند
      }));

    // console.log("📊 Backend - Fixed Weekly Data:", {
    //   dateRange: ordersWeekly.map((d) => ({
    //     date: d.d,
    //     orders: d.orders,
    //     dayName: d.dayName,
    //   })),
    //   today: getLocalDateKey(today),
    //   todayDayName: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"][
    //     today.getDay()
    //   ],
    //   generatedDays: sevenDays.map((d) => ({
    //     date: getLocalDateKey(d),
    //     day: d.getDay(),
    //     dayName: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"][
    //       d.getDay()
    //     ],
    //   })),
    // });

    // === تجميع شهري للمستخدمين الجدد ===
    const usersMonthlyMap = new Map(monthKeys.map((k) => [k, { newUsers: 0 }]));
    for (const u of users) {
      const key = ymKey(u.createdAt);
      if (usersMonthlyMap.has(key)) usersMonthlyMap.get(key).newUsers += 1;
    }

    const usersMonthly = monthKeys.map((k) => ({
      ym: k,
      newUsers: usersMonthlyMap.get(k).newUsers,
    }));

    return res.json({
      status: "success",
      data: {
        ordersMonthly,
        ordersWeekly,
        usersMonthly,
      },
    });
  } catch (e) {
    return res.status(500).json({
      status: "fail",
      message: e.message,
    });
  }
};
