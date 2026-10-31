const subscriptionService = require("../services/subscriptionService");

const acceptQuotation = async (req, res, next) => {
  try {
    const result = await subscriptionService.acceptQuotation(req.params.id);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getSubscriptions(req.user);
    return res.status(200).json(subscriptions);
  } catch (error) {
    return next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscription(
      req.params.id,
      req.user,
    );
    return res.status(200).json(subscription);
  } catch (error) {
    return next(error);
  }
};

const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.updateSubscriptionStatus(
      req.params.id,
      req.body,
      req.user,
    );
    return res.status(200).json(subscription);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  acceptQuotation,
  getSubscriptions,
  getSubscription,
  updateSubscriptionStatus,
};
