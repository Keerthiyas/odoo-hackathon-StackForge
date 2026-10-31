const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authorization = req.get("Authorization");
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    return next(error);
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error("JWT_SECRET is not configured correctly");
    error.statusCode = 500;
    return next(error);
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload !== "object" ||
      typeof payload.sub !== "string" ||
      !mongoose.isObjectIdOrHexString(payload.sub)
    ) {
      const error = new Error("Invalid authentication token");
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      const error = new Error("Authentication account no longer exists");
      error.statusCode = 401;
      return next(error);
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      const authenticationError = new Error("Invalid or expired authentication token");
      authenticationError.statusCode = 401;
      return next(authenticationError);
    }
    return next(error);
  }
};

module.exports = authMiddleware;
