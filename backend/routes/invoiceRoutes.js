const express = require("express");
const {
  generateInvoice,
  getInvoices,
  getInvoice,
} = require("../controllers/InvoiceController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.param("subscriptionId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", getInvoices);
router.post("/from-subscription/:subscriptionId", generateInvoice);
router.get("/:id", getInvoice);

module.exports = router;
