const paymentService = require("../services/paymentService");

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body, req.user);
    return res.status(201).json(payment);
  } catch (error) {
    return next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getPayments(req.user);
    return res.status(200).json(payments);
  } catch (error) {
    return next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPayment(req.params.id, req.user);
    return res.status(200).json(payment);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPayment,
};
