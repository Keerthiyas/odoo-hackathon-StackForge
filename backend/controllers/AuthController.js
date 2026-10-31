const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = (req, res) =>
  res.status(200).json({ user: authService.safeUser(req.user) });

module.exports = {
  register,
  login,
  getCurrentUser,
};
