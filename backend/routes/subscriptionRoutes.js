const express = require("express");
const {
  getSubscriptions,
  getSubscription,
  updateSubscriptionStatus,
} = require("../controllers/SubscriptionController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("id", validateObjectId);
router.use(authMiddleware);

router.get("/", getSubscriptions);
router.get("/:id", getSubscription);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "staff"),
  updateSubscriptionStatus,
);

module.exports = router;
