// config/firebase.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function getServiceAccountFromEnvOrFile() {
  // 1) BASE64 في env (أفضل للنشر)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");
    return JSON.parse(decoded);
  }

  // 2) مسار ملف في env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }

  // 3) الملف المحلي التقليدي
  const localPath = path.resolve(__dirname, "./serviceAccount.json");
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, "utf8"));
  }

  return null;
}

if (!admin.apps.length) {
  const svc = getServiceAccountFromEnvOrFile();
  if (!svc) {
    console.error(
      "❌ Firebase service account not provided. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH, or add config/serviceAccount.json"
    );
    // بإمكانك هنا إما رمي خطأ أو تهيئة بإعتماد إفتراضي (لو كنت على GCP)
    // throw new Error("Missing Firebase credentials");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(svc),
    });
  }
}

module.exports = admin;
