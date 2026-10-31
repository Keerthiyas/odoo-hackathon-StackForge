const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userRoles = ["admin", "staff", "customer"];
const passwordRounds = 12;

const createError = (statusCode, message, validationErrors) =>
  Object.assign(new Error(message), { statusCode, validationErrors });

const safeUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  return result;
};

const matchesSecret = (providedSecret, expectedSecret) => {
  if (typeof providedSecret !== "string" || !expectedSecret) {
    return false;
  }
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);
  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
};

const validateRegistration = (body) => {
  const errors = [];
  const allowedFields = [
    "name",
    "email",
    "password",
    "role",
    "companyName",
    "registrationSecret",
  ];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createError(400, "Invalid registration data", [
      "Request body must be a JSON object",
    ]);
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("name is required");
  }
  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  ) {
    errors.push("A valid email is required");
  }
  if (typeof body.password !== "string" || body.password.length < 8) {
    errors.push("password must be at least 8 characters");
  }
  const role = body.role === undefined ? "customer" : body.role;
  if (!userRoles.includes(role)) {
    errors.push(`role must be one of: ${userRoles.join(", ")}`);
  }
  if (
    body.companyName !== undefined &&
    typeof body.companyName !== "string"
  ) {
    errors.push("companyName must be a string");
  }
  if (errors.length > 0) {
    throw createError(400, "Invalid registration data", errors);
  }

  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
    role,
    ...(body.companyName === undefined
      ? {}
      : { companyName: body.companyName.trim() }),
    registrationSecret: body.registrationSecret,
  };
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw createError(500, "JWT_SECRET must be configured with at least 32 characters");
  }
  return process.env.JWT_SECRET;
};

const register = async (body) => {
  const data = validateRegistration(body);

  if (data.role !== "customer") {
    const secretName =
      data.role === "admin"
        ? "ADMIN_REGISTRATION_SECRET"
        : "STAFF_REGISTRATION_SECRET";
    const expectedSecret = process.env[secretName];
    if (!expectedSecret) {
      throw createError(503, `${secretName} is not configured`);
    }
    if (!matchesSecret(data.registrationSecret, expectedSecret)) {
      throw createError(403, "Invalid registration secret");
    }
  }

  getJwtSecret();
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw createError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, passwordRounds);
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
    ...(data.companyName === undefined
      ? {}
      : { companyName: data.companyName }),
  });

  return { user: safeUser(user) };
};

const login = async (body) => {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    throw createError(400, "Email and password are required");
  }

  const secret = getJwtSecret();
  const user = await User.findOne({
    email: body.email.trim().toLowerCase(),
  });
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    throw createError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { sub: user._id.toString() },
    secret,
    { expiresIn: "1h", algorithm: "HS256" },
  );
  return { token, user: safeUser(user) };
};

module.exports = {
  register,
  login,
  safeUser,
};
