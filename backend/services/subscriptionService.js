const Quotation = require("../models/Quotation");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");

const subscriptionStatuses = ["active", "paused", "closed"];

const createError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const ensureQuotationAccess = async (quotation, user) => {
  if (user.role === "admin") return;
  if (
    user.role === "customer" &&
    String(quotation.customer) === String(user._id)
  ) {
    return;
  }
  if (
    user.role === "staff" &&
    String(quotation.createdBy) === String(user._id)
  ) {
    return;
  }
  throw createError(404, "Quotation not found");
};

const ensureSubscriptionAccess = async (subscription, user) => {
  if (
    user.role === "admin" ||
    (user.role === "customer" &&
      String(subscription.customer) === String(user._id))
  ) {
    return;
  }
  if (user.role === "staff") {
    const managedQuotation = await Quotation.exists({
      _id: subscription.quotation,
      createdBy: user._id,
    });
    if (managedQuotation) return;
  }
  throw createError(404, "Subscription not found");
};

const getNextBillingDate = (startDate, billingCycle) => {
  const nextBillingDate = new Date(startDate);
  const dayOfMonth = nextBillingDate.getDate();

  if (billingCycle === "monthly") {
    nextBillingDate.setDate(1);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const lastDayOfMonth = new Date(
      nextBillingDate.getFullYear(),
      nextBillingDate.getMonth() + 1,
      0,
    ).getDate();
    nextBillingDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    return nextBillingDate;
  }

  if (billingCycle === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    if (nextBillingDate.getMonth() !== startDate.getMonth()) {
      nextBillingDate.setDate(0);
    }
    return nextBillingDate;
  }

  throw createError(400, "The quotation plan has an unsupported billing cycle");
};

const acceptQuotation = async (quotationId, user) => {
  const quotation = await Quotation.findById(quotationId);
  if (!quotation) {
    throw createError(404, "Quotation not found");
  }
  await ensureQuotationAccess(quotation, user);

  if (quotation.status === "accepted") {
    throw createError(409, "Quotation has already been accepted");
  }
  if (!["draft", "sent"].includes(quotation.status)) {
    throw createError(409, "Only draft or sent quotations can be accepted");
  }
  const previousStatus = quotation.status;

  const existingSubscription = await Subscription.findOne({
    quotation: quotationId,
  });
  if (existingSubscription) {
    throw createError(409, "A subscription already exists for this quotation");
  }

  const plan = await Plan.findById(quotation.plan);
  if (!plan) {
    throw createError(404, "Quotation plan not found");
  }

  const acceptedQuotation = await Quotation.findOneAndUpdate(
    { _id: quotationId, status: previousStatus },
    { $set: { status: "accepted" } },
    { new: true, runValidators: true },
  );
  if (!acceptedQuotation) {
    throw createError(409, "Quotation status changed; reload and try again");
  }

  const startDate = new Date();
  const subscriptionData = {
    customer: quotation.customer,
    product: quotation.product,
    plan: quotation.plan,
    quotation: quotation._id,
    quantity: quotation.quantity,
    startDate,
    nextBillingDate: getNextBillingDate(startDate, plan.billingCycle),
  };

  try {
    const subscription = await Subscription.create(subscriptionData);
    return { quotation: acceptedQuotation, subscription };
  } catch (error) {
    try {
      const subscriptionExists = await Subscription.exists({
        quotation: quotation._id,
      });
      if (!subscriptionExists) {
        const rollback = await Quotation.updateOne(
          { _id: quotation._id, status: "accepted" },
          { $set: { status: previousStatus } },
        );
        if (rollback.modifiedCount !== 1) {
          throw new Error("Quotation status could not be restored");
        }
      }
    } catch (rollbackError) {
      throw Object.assign(
        new Error("Subscription creation failed and quotation rollback failed"),
        { cause: rollbackError },
      );
    }
    throw error;
  }
};

const getSubscriptions = async (user) => {
  if (user.role === "admin") {
    return Subscription.find().sort({ createdAt: -1 });
  }
  if (user.role === "customer") {
    return Subscription.find({ customer: user._id }).sort({ createdAt: -1 });
  }
  if (user.role === "staff") {
    const managedQuotations = await Quotation.find({
      createdBy: user._id,
    }).select("_id");
    return Subscription.find({
      quotation: { $in: managedQuotations.map((quotation) => quotation._id) },
    }).sort({ createdAt: -1 });
  }
  throw createError(403, "You do not have permission to view subscriptions");
};

const getSubscription = async (id, user) => {
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw createError(404, "Subscription not found");
  }
  await ensureSubscriptionAccess(subscription, user);
  return subscription;
};

const updateSubscriptionStatus = async (id, body, user) => {
  if (!["admin", "staff"].includes(user.role)) {
    throw createError(403, "Only admins and staff can update subscription status");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createError(400, "Request body must be a JSON object");
  }

  const fields = Object.keys(body);
  if (fields.length !== 1 || fields[0] !== "status") {
    throw createError(400, "Request body must contain only the status field");
  }
  if (!subscriptionStatuses.includes(body.status)) {
    throw createError(
      400,
      `status must be one of: ${subscriptionStatuses.join(", ")}`,
    );
  }

  const existingSubscription = await Subscription.findById(id);
  if (!existingSubscription) {
    throw createError(404, "Subscription not found");
  }
  await ensureSubscriptionAccess(existingSubscription, user);

  const subscription = await Subscription.findByIdAndUpdate(
    existingSubscription._id,
    { $set: { status: body.status } },
    { new: true, runValidators: true },
  );
  if (!subscription) {
    throw createError(404, "Subscription not found");
  }
  return subscription;
};

module.exports = {
  acceptQuotation,
  getSubscriptions,
  getSubscription,
  updateSubscriptionStatus,
};
