require("dotenv").config();

const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const planRoutes = require("./routes/planRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "StackForge API is running" });
});

app.use("/api/products", productRoutes);
app.use("/api/plans", planRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Request error:", error);
  const isBadRequest =
    error instanceof SyntaxError && error.status === 400 && "body" in error;
  const status = isBadRequest
    ? 400
    : Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
  res.status(status).json({
    message: isBadRequest ? "Invalid JSON request body" : "Internal server error",
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`StackForge API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
