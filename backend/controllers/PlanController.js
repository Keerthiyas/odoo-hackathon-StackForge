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

const validateId = (id, res) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    res.status(400).json({ message: "Invalid plan id" });
    return false;
  }
  return true;
};

const handleError = (res, error, action) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A plan with this value already exists" });
  }

  console.error(`Failed to ${action} plan:`, error);
  return res.status(500).json({ message: `Failed to ${action} plan` });
};

const validateProductReference = async (productId, res) => {
  if (productId === undefined) return true;

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    res.status(404).json({ message: "Referenced product not found" });
    return false;
  }
  return true;
};

const createPlan = async (req, res) => {
  const { plan, errors } = validatePlan(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Invalid plan data", errors });
  }

  try {
    if (!(await validateProductReference(plan.product, res))) return;
    const createdPlan = await Plan.create(plan);
    return res.status(201).json(createdPlan);
  } catch (error) {
    return handleError(res, error, "create");
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    return res.status(200).json(plans);
  } catch (error) {
    return handleError(res, error, "fetch");
  }
};

const getPlan = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    return res.status(200).json(plan);
  } catch (error) {
    return handleError(res, error, "fetch");
  }
};

const updatePlan = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  const { plan, errors } = validatePlan(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Invalid plan data", errors });
  }

  try {
    if (!(await validateProductReference(plan.product, res))) return;
    const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, plan, {
      new: true,
      runValidators: true,
    });
    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    return res.status(200).json(updatedPlan);
  } catch (error) {
    return handleError(res, error, "update");
  }
};

const deletePlan = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);
    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    return res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    return handleError(res, error, "delete");
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,
};
