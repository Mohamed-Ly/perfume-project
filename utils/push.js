const prisma = require("../config/prisma");
const admin = require("../config/firebase");

async function pushToTokens({ tokens, title, body, data = {} }) {
  if (!tokens?.length) return { successCount: 0, failureCount: 0 };

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    tokens,
  };

  const res = await admin.messaging().sendEachForMulticast(message);

  // احذف التوكنات المعطوبة
  const badTokens = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || "";
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        badTokens.push(tokens[i]);
      }
    }
  });
  if (badTokens.length) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: badTokens } },
    });
  }

  return { successCount: res.successCount, failureCount: res.failureCount };
}

module.exports = { pushToTokens };
