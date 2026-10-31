const mongoose = require("mongoose");
const Quotation = require("../models/Quotation");
const User = require("../models/User");
const Product = require("../models/Product");
const Plan = require("../models/Plan");

const quotationFields = [
  "customer",
  "product",
  "plan",
  "quantity",
  "unitPrice",
  "totalAmount",
  "status",
  "validUntil",
  "createdBy",
];
const referenceModels = {
  customer: User,
  product: Product,
  plan: Plan,
  createdBy: User,
};
const quotationStatuses = ["draft", "sent", "accepted", "rejected"];

const createError = (statusCode, message, validationErrors) =>
  Object.assign(new Error(message), { statusCode, validationErrors });

const validateQuotation = (body, partial = false) => {
  const errors = [];
  const quotation = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      quotation,
      errors: ["Request body must be a JSON object"],
    };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !quotationFields.includes(field),
  );
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }
  if (Object.keys(body).length === 0) {
    errors.push("Request body must include at least one quotation field");
  }

  for (const field of Object.keys(referenceModels)) {
    if (!partial && body[field] === undefined) {
      errors.push(`${field} is required`);
    }
    if (body[field] !== undefined) {
      if (!mongoose.isObjectIdOrHexString(body[field])) {
        errors.push(`${field} must be a valid MongoDB ObjectId`);
      } else {
        quotation[field] = body[field];
      }
    }
  }

  if (!partial && body.unitPrice === undefined) {
    errors.push("unitPrice is required");
  }
  if (body.unitPrice !== undefined) {
    if (
      typeof body.unitPrice !== "number" ||
      !Number.isFinite(body.unitPrice) ||
      body.unitPrice < 0
    ) {
      errors.push("unitPrice must be a number greater than or equal to 0");
    } else {
      quotation.unitPrice = body.unitPrice;
    }
  }

  if (!partial && body.totalAmount === undefined) {
    errors.push("totalAmount is required");
  }
  if (body.totalAmount !== undefined) {
    if (
      typeof body.totalAmount !== "number" ||
      !Number.isFinite(body.totalAmount) ||
      body.totalAmount < 0
    ) {
      errors.push("totalAmount must be a number greater than or equal to 0");
    } else {
      quotation.totalAmount = body.totalAmount;
    }
  }

  if (body.quantity !== undefined) {
    if (
      typeof body.quantity !== "number" ||
      !Number.isFinite(body.quantity) ||
      body.quantity < 1
    ) {
      errors.push("quantity must be a number greater than or equal to 1");
    } else {
      quotation.quantity = body.quantity;
    }
  }

  if (body.status !== undefined) {
    if (!quotationStatuses.includes(body.status)) {
      errors.push(`status must be one of: ${quotationStatuses.join(", ")}`);
    } else {
      quotation.status = body.status;
    }
  }

  if (body.validUntil !== undefined) {
    if (body.validUntil === null) {
      quotation.validUntil = null;
    } else {
      const validUntil = new Date(body.validUntil);
      if (Number.isNaN(validUntil.getTime())) {
        errors.push("validUntil must be a valid date");
      } else {
        quotation.validUntil = validUntil;
      }
    }
  }

  return { quotation, errors };
};

const getValidatedQuotation = (body, partial = false) => {
  const { quotation, errors } = validateQuotation(body, partial);
  if (errors.length > 0) {
    throw createError(400, "Invalid quotation data", errors);
  }
  return quotation;
};

const validateReferences = async (quotation) => {
  for (const [field, Model] of Object.entries(referenceModels)) {
    if (quotation[field] === undefined) continue;

    const referencedDocumentExists = await Model.exists({
      _id: quotation[field],
    });
    if (!referencedDocumentExists) {
      throw createError(404, `Referenced ${field} was not found`);
    }
  }
};

const createQuotation = async (body) => {
  const quotation = getValidatedQuotation(body);
  await validateReferences(quotation);
  return Quotation.create(quotation);
};

const getQuotations = async () =>
  Quotation.find().sort({ createdAt: -1 });

const getQuotation = async (id) => {
  const quotation = await Quotation.findById(id);
  if (!quotation) {
    throw createError(404, "Quotation not found");
  }
  return quotation;
};

const updateQuotation = async (id, body) => {
  const quotationData = getValidatedQuotation(body, true);
  await validateReferences(quotationData);

  const quotation = await Quotation.findByIdAndUpdate(id, quotationData, {
    new: true,
    runValidators: true,
  });
  if (!quotation) {
    throw createError(404, "Quotation not found");
  }
  return quotation;
};

const updateQuotationStatus = async (id, body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createError(400, "Request body must be a JSON object");
  }

  const fields = Object.keys(body);
  if (fields.length !== 1 || fields[0] !== "status") {
    throw createError(400, "Request body must contain only the status field");
  }
  if (!quotationStatuses.includes(body.status)) {
    throw createError(
      400,
      `status must be one of: ${quotationStatuses.join(", ")}`,
    );
  }

  const quotation = await Quotation.findByIdAndUpdate(
    id,
    { status: body.status },
    { new: true, runValidators: true },
  );
  if (!quotation) {
    throw createError(404, "Quotation not found");
  }
  return quotation;
};

const deleteQuotation = async (id) => {
  const quotation = await Quotation.findByIdAndDelete(id);
  if (!quotation) {
    throw createError(404, "Quotation not found");
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
};
