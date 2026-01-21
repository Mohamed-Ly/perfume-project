const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// مجلد خاص لعروض الصور
const offerUploadsDir = "uploads/offers";
fs.mkdirSync(offerUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, offerUploadsDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, "offer-" + unique + path.extname(file.originalname).toLowerCase());
  },
});

const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const fileFilter = (req, file, cb) => {
  const extOk = [".jpg", ".jpeg", ".png", ".webp"].includes(
    path.extname(file.originalname).toLowerCase()
  );
  if (allowedTypes.includes(file.mimetype) && extOk) cb(null, true);
  else cb(new Error("Only .jpg, .jpeg, .png and .webp files are allowed"), false);
};

const uploadOffer = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB للعروض
    files: 1, // صورة واحدة للعرض
  },
});

module.exports = uploadOffer;