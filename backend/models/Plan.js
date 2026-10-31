const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    allowPause: { type: Boolean, default: false },
    allowRenewal: { type: Boolean, default: true },
    allowEarlyClose: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
