const mongoose = require("mongoose");

const validateObjectId = (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error("Invalid MongoDB ObjectId");
    error.statusCode = 400;
    return next(error);
  }
  return next();
};

module.exports = validateObjectId;
