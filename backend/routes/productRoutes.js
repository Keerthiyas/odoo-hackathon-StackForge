const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/ProductController");
const validateObjectId = require("../middleware/validateObjectId");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.param("id", validateObjectId);
router.use(authMiddleware);

router
  .route("/")
  .post(authorizeRoles("admin"), createProduct)
  .get(getProducts);
router
  .route("/:id")
  .get(getProduct)
  .put(authorizeRoles("admin"), updateProduct)
  .delete(authorizeRoles("admin"), deleteProduct);

module.exports = router;
