const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const paymentMethods = ["bank_transfer", "card", "cash", "other"];
const paymentStatuses = ["completed", "pending"];

const createError = (statusCode, message, validationErrors) =>
  Object.assign(new Error(message), { statusCode, validationErrors });

const validatePayment = (body) => {
  const errors = [];
  const payment = {};
  const allowedFields = [
    "invoice",
    "amount",
    "paymentMethod",
    "paymentDate",
    "status",
  ];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { payment, errors: ["Request body must be a JSON object"] };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }
  if (body.invoice === undefined) {
    errors.push("invoice is required");
  } else if (!mongoose.isObjectIdOrHexString(body.invoice)) {
    errors.push("invoice must be a valid MongoDB ObjectId");
  } else {
    payment.invoice = body.invoice;
  }

  if (body.amount === undefined) {
    errors.push("amount is required");
  } else if (
    typeof body.amount !== "number" ||
    !Number.isFinite(body.amount) ||
    body.amount < 0
  ) {
    errors.push("amount must be a number greater than or equal to 0");
  } else {
    payment.amount = body.amount;
  }

  if (body.paymentMethod === undefined) {
    errors.push("paymentMethod is required");
  } else if (!paymentMethods.includes(body.paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${paymentMethods.join(", ")}`);
  } else {
    payment.paymentMethod = body.paymentMethod;
  }

  if (body.status !== undefined) {
    if (!paymentStatuses.includes(body.status)) {
      errors.push(`status must be one of: ${paymentStatuses.join(", ")}`);
    } else {
      payment.status = body.status;
    }
  }

  if (body.paymentDate !== undefined) {
    const paymentDate = new Date(body.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) {
      errors.push("paymentDate must be a valid date");
    } else {
      payment.paymentDate = paymentDate;
    }
  }

  return { payment, errors };
};

const createPayment = async (body, user) => {
  const { payment, errors } = validatePayment(body);
  if (errors.length > 0) {
    throw createError(400, "Invalid payment data", errors);
  }
  if (!["admin", "customer"].includes(user.role)) {
    throw createError(403, "You do not have permission to record payments");
  }

  const invoice = await Invoice.findById(payment.invoice);
  if (!invoice) {
    throw createError(404, "Invoice not found");
  }
  if (
    user.role === "customer" &&
    String(invoice.customer) !== String(user._id)
  ) {
    throw createError(404, "Invoice not found");
  }
  if (invoice.status === "paid") {
    throw createError(409, "Invoice has already been paid");
  }

  const paymentStatus = payment.status || "pending";
  if (user.role === "customer" && paymentStatus !== "pending") {
    throw createError(403, "Customers may only submit payments as pending");
  }
  if (paymentStatus === "completed") {
    const completedPayments = await Payment.find({
      invoice: invoice._id,
      status: "completed",
    });
    const paidAmount = completedPayments.reduce(
      (total, existingPayment) => total + existingPayment.amount,
      0,
    );
    const totalAfterPayment = Math.round((paidAmount + payment.amount) * 100) / 100;
    const invoiceAmount = Math.round(invoice.amount * 100) / 100;

    if (totalAfterPayment > invoiceAmount) {
      throw createError(409, "Payment exceeds the invoice's outstanding amount");
    }
  }

  const createdPayment = await Payment.create({
    ...payment,
    customer: invoice.customer,
    status: paymentStatus,
  });

  if (paymentStatus === "completed") {
    const completedPayments = await Payment.find({
      invoice: invoice._id,
      status: "completed",
    });
    const paidAmount = completedPayments.reduce(
      (total, completedPayment) => total + completedPayment.amount,
      0,
    );
    const totalPaid = Math.round(paidAmount * 100) / 100;
    const invoiceAmount = Math.round(invoice.amount * 100) / 100;

    if (totalPaid >= invoiceAmount) {
      const updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoice._id, status: { $ne: "paid" } },
        { $set: { status: "paid" } },
        { new: true, runValidators: true },
      );
      if (!updatedInvoice && invoice.status !== "paid") {
        const currentInvoice = await Invoice.findById(invoice._id);
        if (!currentInvoice || currentInvoice.status !== "paid") {
          throw createError(
            500,
            "Payment was recorded but invoice status could not be updated",
          );
        }
      }
    }
  }

  return createdPayment;
};

const getPayments = async (user) => {
  if (user.role === "admin") {
    return Payment.find().sort({ createdAt: -1 });
  }
  if (user.role === "customer") {
    return Payment.find({ customer: user._id }).sort({ createdAt: -1 });
  }
  throw createError(403, "You do not have permission to view payments");
};

const getPayment = async (id, user) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw createError(400, "Invalid payment id");
  }
  if (!["admin", "customer"].includes(user.role)) {
    throw createError(403, "You do not have permission to view payments");
  }
  const filter = user.role === "admin" ? { _id: id } : {
    _id: id,
    customer: user._id,
  };
  const payment = await Payment.findOne(filter);
  if (!payment) {
    throw createError(404, "Payment not found");
  }
  return payment;
};

module.exports = {
  createPayment,
  getPayments,
  getPayment,
};
