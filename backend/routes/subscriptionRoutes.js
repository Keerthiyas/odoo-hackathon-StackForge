const express = require("express");
const {
  getSubscriptions,
  getSubscription,
  updateSubscriptionStatus,
} = require("../controllers/SubscriptionController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.param("id", validateObjectId);

router.get("/", getSubscriptions);
router.get("/:id", getSubscription);
router.patch("/:id/status", updateSubscriptionStatus);

module.exports = router;
