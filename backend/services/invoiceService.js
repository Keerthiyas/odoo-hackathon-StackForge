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

const generateInvoice = async (subscriptionId, user) => {
  validateObjectId(subscriptionId, "subscription");

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw createError(404, "Subscription not found");
  }
  if (subscription.status !== "active") {
    throw createError(409, "Invoices can only be generated for active subscriptions");
  }
  if (user.role === "staff") {
    const managedQuotation = await Quotation.exists({
      _id: subscription.quotation,
      createdBy: user._id,
    });
    if (!managedQuotation) {
      throw createError(404, "Subscription not found");
    }
  } else if (user.role !== "admin") {
    throw createError(403, "Only admins and staff can generate invoices");
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

const getInvoices = async (user) => {
  if (user.role === "admin") {
    return Invoice.find().sort({ createdAt: -1 });
  }
  if (user.role === "customer") {
    return Invoice.find({ customer: user._id }).sort({ createdAt: -1 });
  }
  throw createError(403, "You do not have permission to view invoices");
};

const getInvoice = async (id, user) => {
  validateObjectId(id, "invoice id");
  const filter = user.role === "admin" ? { _id: id } : {
    _id: id,
    customer: user._id,
  };
  if (!["admin", "customer"].includes(user.role)) {
    throw createError(403, "You do not have permission to view invoices");
  }
  const invoice = await Invoice.findOne(filter);
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
