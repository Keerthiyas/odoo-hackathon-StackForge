const express = require("express");
const {
  createPayment,
  getPayments,
  getPayment,
} = require("../controllers/PaymentController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("id", validateObjectId);
router.use(authMiddleware);

router
  .route("/")
  .post(authorizeRoles("admin", "customer"), createPayment)
  .get(authorizeRoles("admin", "customer"), getPayments);
router.get("/:id", authorizeRoles("admin", "customer"), getPayment);

module.exports = router;
