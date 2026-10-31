const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: [
    path.join(__dirname, "..", ".env.local"),
    path.join(__dirname, "..", ".env"),
  ],
});

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Plan = require("../models/Plan");
const Quotation = require("../models/Quotation");
const Subscription = require("../models/Subscription");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const DEMO_DESCRIPTION = "StackForge demo seed data";
const DEMO_USERS = {
  admin: {
    name: "StackForge Demo Admin",
    email: "stackforge-demo-admin@example.test",
    role: "admin",
  },
  staff: {
    name: "StackForge Demo Staff",
    email: "stackforge-demo-staff@example.test",
    role: "staff",
  },
  customer: {
    name: "StackForge Demo Customer",
    email: "stackforge-demo-customer@example.test",
    role: "customer",
    companyName: "StackForge Demo Company",
  },
};

const clearDemoData = async () => {
  const demoUsers = await User.find({
    email: { $in: Object.values(DEMO_USERS).map(({ email }) => email) },
  }).select("_id email");
  const userIds = demoUsers.map((user) => user._id);
  const existingProducts = await Product.find({
    name: "StackForge CRM",
    description: DEMO_DESCRIPTION,
  }).select("_id");
  const productIds = existingProducts.map((product) => product._id);

  const planIds = (
    await Plan.find({
      product: { $in: productIds },
      name: "StackForge CRM Demo Monthly",
    }).select("_id")
  ).map((plan) => plan._id);

  const quotations = await Quotation.find({
    customer: { $in: userIds },
    product: { $in: productIds },
    plan: { $in: planIds },
    createdBy: { $in: userIds },
  }).select("_id");
  const quotationIds = quotations.map((quotation) => quotation._id);

  const subscriptions = await Subscription.find({
    quotation: { $in: quotationIds },
    customer: { $in: userIds },
  }).select("_id");
  const subscriptionIds = subscriptions.map(
    (subscription) => subscription._id,
  );

  const invoices = await Invoice.find({
    subscription: { $in: subscriptionIds },
    customer: { $in: userIds },
  }).select("_id");
  const invoiceIds = invoices.map((invoice) => invoice._id);

  await Payment.deleteMany({
    invoice: { $in: invoiceIds },
    customer: { $in: userIds },
  });
  await Invoice.deleteMany({ _id: { $in: invoiceIds } });
  await Subscription.deleteMany({ _id: { $in: subscriptionIds } });
  await Quotation.deleteMany({ _id: { $in: quotationIds } });
  await Plan.deleteMany({ _id: { $in: planIds } });

  await Product.deleteMany({ _id: { $in: productIds } });
  await User.deleteMany({
    _id: { $in: userIds },
    email: { $in: Object.values(DEMO_USERS).map(({ email }) => email) },
  });
};

const runSeed = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!mongoUri) {
    throw new Error("MONGODB_URI must be configured in the environment");
  }
  if (typeof demoPassword !== "string" || demoPassword.length < 12) {
    throw new Error(
      "SEED_DEMO_PASSWORD must be configured with at least 12 characters",
    );
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
  await clearDemoData();
  console.log("Cleared previous StackForge demo records only.");

  const hashedPassword = await bcrypt.hash(demoPassword, 12);
  const [admin, staff, customer] = await User.create(
    Object.values(DEMO_USERS).map((user) => ({
      ...user,
      password: hashedPassword,
    })),
  );

  const product = await Product.create({
    name: "StackForge CRM",
    description: DEMO_DESCRIPTION,
    basePrice: 49.99,
    isActive: true,
  });

  const plan = await Plan.create({
    product: product._id,
    name: "StackForge CRM Demo Monthly",
    billingCycle: "monthly",
    price: 49.99,
    allowPause: true,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
  });

  const quantity = 2;
  const unitPrice = plan.price;
  const quotation = await Quotation.create({
    customer: customer._id,
    product: product._id,
    plan: plan._id,
    quantity,
    unitPrice,
    totalAmount: quantity * unitPrice,
    status: "accepted",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdBy: staff._id,
  });

  const startDate = new Date();
  const nextBillingDate = new Date(startDate);
  const dayOfMonth = nextBillingDate.getDate();
  nextBillingDate.setDate(1);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const lastDayOfMonth = new Date(
    nextBillingDate.getFullYear(),
    nextBillingDate.getMonth() + 1,
    0,
  ).getDate();
  nextBillingDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
  const subscription = await Subscription.create({
    customer: customer._id,
    product: product._id,
    plan: plan._id,
    quotation: quotation._id,
    quantity,
    startDate,
    nextBillingDate,
    status: "active",
  });

  const invoice = await Invoice.create({
    customer: customer._id,
    subscription: subscription._id,
    amount: quotation.totalAmount,
    dueDate: nextBillingDate,
    status: "paid",
    generatedAt: new Date(),
  });

  const payment = await Payment.create({
    invoice: invoice._id,
    customer: customer._id,
    amount: invoice.amount,
    paymentMethod: "card",
    paymentDate: new Date(),
    status: "completed",
  });

  console.log("StackForge demo data seeded successfully:");
  console.log(`- Users: admin, staff, customer (${DEMO_USERS.admin.email}, ${DEMO_USERS.staff.email}, ${DEMO_USERS.customer.email})`);
  console.log(`- Product: ${product.name}`);
  console.log(`- Plan: ${plan.name} (${plan.billingCycle})`);
  console.log(`- Quotation: ${quotation._id} (accepted)`);
  console.log(`- Subscription: ${subscription._id} (active)`);
  console.log(`- Invoice: ${invoice._id} (paid)`);
  console.log(`- Payment: ${payment._id} (completed)`);
  console.log("All demo user passwords were hashed before storage.");
};

if (require.main === module) {
  runSeed()
    .catch((error) => {
      console.error("StackForge demo seed failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    });
}

module.exports = { runSeed, clearDemoData };
