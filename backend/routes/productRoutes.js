const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/ProductController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.param("id", validateObjectId);

router.route("/").post(createProduct).get(getProducts);
router.route("/:id").get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
