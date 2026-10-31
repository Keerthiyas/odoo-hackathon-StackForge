const express = require("express");
const {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,
} = require("../controllers/PlanController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("id", validateObjectId);
router.use(authMiddleware);

router.route("/").post(authorizeRoles("admin"), createPlan).get(getPlans);
router
  .route("/:id")
  .get(getPlan)
  .put(authorizeRoles("admin"), updatePlan)
  .delete(authorizeRoles("admin"), deletePlan);

module.exports = router;
