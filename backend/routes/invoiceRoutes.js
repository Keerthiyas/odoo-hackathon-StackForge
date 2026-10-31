const express = require("express");
const {
  generateInvoice,
  getInvoices,
  getInvoice,
} = require("../controllers/InvoiceController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("subscriptionId", validateObjectId);
router.param("id", validateObjectId);
router.use(authMiddleware);

router.get("/", authorizeRoles("admin", "customer"), getInvoices);
router.post(
  "/from-subscription/:subscriptionId",
  authorizeRoles("admin", "staff"),
  generateInvoice,
);
router.get("/:id", authorizeRoles("admin", "customer"), getInvoice);

module.exports = router;
