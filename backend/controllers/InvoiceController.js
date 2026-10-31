const invoiceService = require("../services/invoiceService");

const generateInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.generateInvoice(
      req.params.subscriptionId,
      req.user,
    );
    return res.status(201).json(invoice);
  } catch (error) {
    return next(error);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const invoices = await invoiceService.getInvoices(req.user);
    return res.status(200).json(invoices);
  } catch (error) {
    return next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id, req.user);
    return res.status(200).json(invoice);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateInvoice,
  getInvoices,
  getInvoice,
};
