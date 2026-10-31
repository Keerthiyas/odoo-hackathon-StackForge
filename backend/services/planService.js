const mongoose = require("mongoose");
const Plan = require("../models/Plan");
const Product = require("../models/Product");

const planFields = [
  "product",
  "name",
  "billingCycle",
  "price",
  "allowPause",
  "allowRenewal",
  "allowEarlyClose",
  "isActive",
];
const booleanFields = [
  "allowPause",
  "allowRenewal",
  "allowEarlyClose",
  "isActive",
];
const billingCycles = ["monthly", "yearly"];

const createError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const validatePlan = (body, partial = false) => {
  const errors = [];
  const plan = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { plan, errors: ["Request body must be a JSON object"] };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !planFields.includes(field),
  );
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }
  if (Object.keys(body).length === 0) {
    errors.push("Request body must include at least one plan field");
  }

  if (!partial && body.product === undefined) {
    errors.push("product is required");
  }
  if (body.product !== undefined) {
    if (!mongoose.isObjectIdOrHexString(body.product)) {
      errors.push("product must be a valid product id");
    } else {
      plan.product = body.product;
    }
  }

  if (!partial && (body.name === undefined || body.name === "")) {
    errors.push("name is required");
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      errors.push("name must be a non-empty string");
    } else {
      plan.name = body.name.trim();
    }
  }

  if (!partial && body.billingCycle === undefined) {
    errors.push("billingCycle is required");
  }
  if (body.billingCycle !== undefined) {
    if (!billingCycles.includes(body.billingCycle)) {
      errors.push(`billingCycle must be one of: ${billingCycles.join(", ")}`);
    } else {
      plan.billingCycle = body.billingCycle;
    }
  }

  if (!partial && body.price === undefined) {
    errors.push("price is required");
  }
  if (body.price !== undefined) {
    if (
      typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0
    ) {
      errors.push("price must be a number greater than or equal to 0");
    } else {
      plan.price = body.price;
    }
  }

  for (const field of booleanFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "boolean") {
        errors.push(`${field} must be a boolean`);
      } else {
        plan[field] = body[field];
      }
    }
  }

  return { plan, errors };
};

const getValidatedPlan = (body, partial = false) => {
  const { plan, errors } = validatePlan(body, partial);
  if (errors.length > 0) {
    throw Object.assign(createError(400, "Invalid plan data"), {
      validationErrors: errors,
    });
  }
  return plan;
};

const validateProductReference = async (productId) => {
  if (productId === undefined) return;

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    throw createError(404, "Referenced product not found");
  }
};

const createPlan = async (body) => {
  const plan = getValidatedPlan(body);
  await validateProductReference(plan.product);
  return Plan.create(plan);
};

const getPlans = async () => Plan.find().sort({ createdAt: -1 });

const getPlan = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw createError(404, "Plan not found");
  }
  return plan;
};

const updatePlan = async (id, body) => {
  const planData = getValidatedPlan(body, true);
  await validateProductReference(planData.product);
  const plan = await Plan.findByIdAndUpdate(id, planData, {
    new: true,
    runValidators: true,
  });
  if (!plan) {
    throw createError(404, "Plan not found");
  }
  return plan;
};

const deletePlan = async (id) => {
  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) {
    throw createError(404, "Plan not found");
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,
};
