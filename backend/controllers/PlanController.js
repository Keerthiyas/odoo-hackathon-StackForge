const planService = require("../services/planService");

const createPlan = async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body);
    return res.status(201).json(plan);
  } catch (error) {
    return next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const plans = await planService.getPlans();
    return res.status(200).json(plans);
  } catch (error) {
    return next(error);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const plan = await planService.getPlan(req.params.id);
    return res.status(200).json(plan);
  } catch (error) {
    return next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return res.status(200).json(plan);
  } catch (error) {
    return next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    await planService.deletePlan(req.params.id);
    return res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,
};
