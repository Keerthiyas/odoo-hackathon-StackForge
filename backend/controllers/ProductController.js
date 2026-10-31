const mongoose = require("mongoose");
const Product = require("../models/Product");
const Plan = require("../models/Plan");

const productFields = ["name", "description", "basePrice", "isActive"];

const validateProduct = (body, partial = false) => {
  const errors = [];
  const product = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { product, errors: ["Request body must be a JSON object"] };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !productFields.includes(field),
  );
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }
  if (Object.keys(body).length === 0) {
    errors.push("Request body must include at least one product field");
  }

  if (!partial && (body.name === undefined || body.name === "")) {
    errors.push("name is required");
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      errors.push("name must be a non-empty string");
    } else {
      product.name = body.name.trim();
    }
  }

  if (!partial && body.basePrice === undefined) {
    errors.push("basePrice is required");
  }
  if (body.basePrice !== undefined) {
    if (
      typeof body.basePrice !== "number" ||
      !Number.isFinite(body.basePrice) ||
      body.basePrice < 0
    ) {
      errors.push("basePrice must be a number greater than or equal to 0");
    } else {
      product.basePrice = body.basePrice;
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push("description must be a string");
    } else {
      product.description = body.description;
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      errors.push("isActive must be a boolean");
    } else {
      product.isActive = body.isActive;
    }
  }

  return { product, errors };
};

const validateId = (id, res) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    res.status(400).json({ message: "Invalid product id" });
    return false;
  }
  return true;
};

const handleError = (res, error, action) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A product with this value already exists" });
  }

  console.error(`Failed to ${action} product:`, error);
  return res.status(500).json({ message: `Failed to ${action} product` });
};

const createProduct = async (req, res) => {
  const { product, errors } = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Invalid product data", errors });
  }

  try {
    const createdProduct = await Product.create(product);
    return res.status(201).json(createdProduct);
  } catch (error) {
    return handleError(res, error, "create");
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return handleError(res, error, "fetch");
  }
};

const getProduct = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return handleError(res, error, "fetch");
  }
};

const updateProduct = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  const { product, errors } = validateProduct(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Invalid product data", errors });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      product,
      { new: true, runValidators: true },
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(updatedProduct);
  } catch (error) {
    return handleError(res, error, "update");
  }
};

const deleteProduct = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const hasPlans = await Plan.exists({ product: product._id });
    if (hasPlans) {
      return res.status(409).json({
        message: "Cannot delete a product that has associated plans",
      });
    }

    await product.deleteOne();
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return handleError(res, error, "delete");
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
