const Product = require("../models/Product");
const Plan = require("../models/Plan");

const productFields = ["name", "description", "basePrice", "isActive"];

const createError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

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

const getValidatedProduct = (body, partial = false) => {
  const { product, errors } = validateProduct(body, partial);
  if (errors.length > 0) {
    throw Object.assign(createError(400, "Invalid product data"), {
      validationErrors: errors,
    });
  }
  return product;
};

const createProduct = async (body) => {
  const product = getValidatedProduct(body);
  return Product.create(product);
};

const getProducts = async () => Product.find().sort({ createdAt: -1 });

const getProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw createError(404, "Product not found");
  }
  return product;
};

const updateProduct = async (id, body) => {
  const productData = getValidatedProduct(body, true);
  const product = await Product.findByIdAndUpdate(id, productData, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    throw createError(404, "Product not found");
  }
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw createError(404, "Product not found");
  }

  const hasPlans = await Plan.exists({ product: product._id });
  if (hasPlans) {
    throw createError(409, "Cannot delete a product that has associated plans");
  }

  await product.deleteOne();
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
