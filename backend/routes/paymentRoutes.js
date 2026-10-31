const express = require("express");
const {
  createPayment,
  getPayments,
  getPayment,
} = require("../controllers/PaymentController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.param("id", validateObjectId);

router.route("/").post(createPayment).get(getPayments);
router.get("/:id", getPayment);

module.exports = router;
