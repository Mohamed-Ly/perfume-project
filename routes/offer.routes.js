const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const uploadOffer = require("../middlewares/uploadOffer");
const { handleValidation } = require("../middlewares/handleValidation");
const {
  createOfferValidation,
  updateOfferValidation,
  offerIdParamValidation,
} = require("../middlewares/validators");

const {
  getActiveOffers,
  getOfferById,
  createOffer,
  updateOffer,
  getAllOffers,
  deleteOffer,
  toggleOffer,
} = require("../controllers/offer.controller");

// ===================== PUBLIC ROUTES =====================
// هذه المسارات عامة للجميع (للسلايدر في الـ Home)
router.get("/", getActiveOffers);
router.get("/:id", offerIdParamValidation, handleValidation, getOfferById);

// ===================== ADMIN ROUTES =====================

router.post(
  "/",
  verifyToken,
  checkRole("ADMIN"),
  uploadOffer.single("image"),
  createOfferValidation,
  handleValidation,
  createOffer
);
router.get("/admin/all", verifyToken, checkRole("ADMIN"), getAllOffers);
router.put(
  "/:id",
  verifyToken,
  checkRole("ADMIN"),
  uploadOffer.single("image"),
  updateOfferValidation,
  handleValidation,
  updateOffer
);
router.patch(
  "/:id/toggle",
  verifyToken,
  checkRole("ADMIN"),
  offerIdParamValidation,
  handleValidation,
  toggleOffer
);
router.delete(
  "/:id",
  verifyToken,
  checkRole("ADMIN"),
  offerIdParamValidation,
  handleValidation,
  deleteOffer
);

module.exports = router;
