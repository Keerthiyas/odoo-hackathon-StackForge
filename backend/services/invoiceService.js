const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Quotation = require("../models/Quotation");
const Subscription = require("../models/Subscription");

const createError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const validateObjectId = (id, fieldName) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw createError(400, `${fieldName} must be a valid MongoDB ObjectId`);
  }
};

const generateInvoice = async (subscriptionId) => {
  validateObjectId(subscriptionId, "subscription");

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw createError(404, "Subscription not found");
  }
  if (subscription.status !== "active") {
    throw createError(409, "Invoices can only be generated for active subscriptions");
  }

  const quotation = await Quotation.findById(subscription.quotation);
  if (!quotation) {
    throw createError(404, "Subscription quotation not found");
  }

  const dueDate = new Date(subscription.nextBillingDate);
  const existingInvoice = await Invoice.findOne({
    subscription: subscription._id,
    dueDate,
  });
  if (existingInvoice) {
    throw createError(
      409,
      "An invoice already exists for this subscription billing date",
    );
  }

  return Invoice.create({
    customer: subscription.customer,
    subscription: subscription._id,
    amount: quotation.totalAmount,
    dueDate,
  });
};

const getInvoices = async () => Invoice.find().sort({ createdAt: -1 });

const getInvoice = async (id) => {
  validateObjectId(id, "invoice id");
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw createError(404, "Invoice not found");
  }
  return invoice;
};

module.exports = {
  generateInvoice,
  getInvoices,
  getInvoice,
};
