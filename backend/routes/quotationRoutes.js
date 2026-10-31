const express = require("express");
const {
  acceptQuotation,
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
} = require("../controllers/QuotationController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("id", validateObjectId);
router.use(authMiddleware);

router
  .route("/")
  .post(authorizeRoles("admin", "staff"), createQuotation)
  .get(getQuotations);
router.patch("/:id/accept", acceptQuotation);
router.patch("/:id/status", updateQuotationStatus);
router
  .route("/:id")
  .get(getQuotation)
  .put(authorizeRoles("admin", "staff"), updateQuotation)
  .delete(authorizeRoles("admin", "staff"), deleteQuotation);

module.exports = router;
