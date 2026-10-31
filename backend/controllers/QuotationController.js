const quotationService = require("../services/quotationService");
const subscriptionService = require("../services/subscriptionService");

const acceptQuotation = async (req, res, next) => {
  try {
    const result = await subscriptionService.acceptQuotation(req.params.id);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation(req.body);
    return res.status(201).json(quotation);
  } catch (error) {
    return next(error);
  }
};

const getQuotations = async (req, res, next) => {
  try {
    const quotations = await quotationService.getQuotations();
    return res.status(200).json(quotations);
  } catch (error) {
    return next(error);
  }
};

const getQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotation(req.params.id);
    return res.status(200).json(quotation);
  } catch (error) {
    return next(error);
  }
};

const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.updateQuotation(
      req.params.id,
      req.body,
    );
    return res.status(200).json(quotation);
  } catch (error) {
    return next(error);
  }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    const quotation = await quotationService.updateQuotationStatus(
      req.params.id,
      req.body,
    );
    return res.status(200).json(quotation);
  } catch (error) {
    return next(error);
  }
};

const deleteQuotation = async (req, res, next) => {
  try {
    await quotationService.deleteQuotation(req.params.id);
    return res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  acceptQuotation,
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
};
