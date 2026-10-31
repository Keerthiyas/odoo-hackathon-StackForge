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

const router = express.Router();

router.param("id", validateObjectId);

router.route("/").post(createQuotation).get(getQuotations);
router.patch("/:id/accept", acceptQuotation);
router.patch("/:id/status", updateQuotationStatus);
router
  .route("/:id")
  .get(getQuotation)
  .put(updateQuotation)
  .delete(deleteQuotation);

module.exports = router;
