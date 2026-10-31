const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isInvalidJson =
    error instanceof SyntaxError && error.status === 400 && "body" in error;
  let statusCode = 500;
  let message = "Internal server error";

  if (isInvalidJson) {
    statusCode = 400;
    message = "Invalid JSON request body";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    statusCode = 400;
    message = error.message;
  } else if (
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode < 600
  ) {
    statusCode = error.statusCode;
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error("Request error:", error);
  }

  const response = { message };
  if (Array.isArray(error.validationErrors)) {
    response.errors = error.validationErrors;
  }
  return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
