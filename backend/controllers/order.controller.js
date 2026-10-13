import crypto from "node:crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import getRazorpay, { isRazorpayConfigured } from "../config/razorpay.js";

// The current user always comes from the auth middleware (req.user), never from the request.
// The client sends only the shipping address: items, prices and the total are always
// rebuilt here from the user's saved cart and the latest Product documents.

const ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];

// Returns { address } with trimmed values, or { message } describing the first problem
const validateShippingAddress = (input) => {
  if (!input || typeof input !== "object") {
    return { message: "Shipping address is required" };
  }

  const address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = typeof input[field] === "string" ? input[field].trim() : "";
    if (!value) return { message: "All shipping fields are required" };
    address[field] = value;
  }

  if (!/^\d{10}$/.test(address.phone)) {
    return { message: "Phone number must contain 10 digits" };
  }
  if (!/^\d{6}$/.test(address.pincode)) {
    return { message: "Pincode must contain 6 digits" };
  }
  return { address };
};

// POST /orders/create-payment-order   body: { shippingAddress }
export const createPaymentOrder = async (req, res) => {
  try {
    const { address, message } = validateShippingAddress(req.body?.shippingAddress);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const customer = req.user;
    if (customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // Load the latest product data again; the cart may be hours old
    const productIds = customer.cart.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((p) => [p._id.toString(), p]));

    // Products deleted after being added to the cart: drop those rows and reject this attempt.
    // (The cart API already hides them, so the user could not remove them otherwise.)
    const available = customer.cart.filter((item) => productById.has(item.product.toString()));
    if (available.length < customer.cart.length) {
      customer.cart = available;
      await customer.save();
      return res.status(400).json({
        success: false,
        message: "Some products are no longer available and were removed from your cart. Please review your order.",
      });
    }

    const items = [];
    for (const cartItem of customer.cart) {
      const product = productById.get(cartItem.product.toString());
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });
      }
      // Snapshot purchase-time details instead of only referencing the product
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
    }

    // Any totalAmount in the request body is ignored; the server owns pricing
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: "Online payment is not configured" });
    }

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: address,
      totalAmount,
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Razorpay expects paise: ₹1 = 100
        currency: "INR",
        receipt: order._id.toString(),
      });
    } catch (error) {
      order.paymentStatus = "FAILED";
      await order.save();
      const reason = error.error?.description || error.message;
      return res
        .status(502)
        .json({ success: false, message: `Could not start payment: ${reason}` });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // The cart is intentionally untouched here; it is cleared only after verified payment
    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // the key ID is public; the secret never leaves the server
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const isValidSignature = (razorpayOrderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
  const received = Buffer.from(String(signature));
  const expectedBuffer = Buffer.from(expected);
  return (
    received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer)
  );
};

// POST /orders/verify-payment
// body: { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body ?? {};

    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (typeof razorpay_payment_id !== "string" || typeof razorpay_signature !== "string") {
      return res.status(400).json({ success: false, message: "Payment details are missing" });
    }
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ success: false, message: "Online payment is not configured" });
    }

    // Filtering by user means nobody can verify (or probe) another customer's order
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // A repeated verify call for an already-paid order just returns it
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    // The Razorpay order ID saved on our order is the trusted one, not the browser's copy
    if (!order.razorpayOrderId || (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Payment does not belong to this order" });
    }

    if (!isValidSignature(order.razorpayOrderId, razorpay_payment_id, razorpay_signature)) {
      // Order stays PENDING_PAYMENT and the cart is kept
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Reduce stock for what was bought (never below 0)
    await Product.bulkWrite(
      order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: [{ $set: { stock: { $max: [0, { $subtract: ["$stock", item.quantity] }] } } }],
        },
      })),
      { updatePipeline: true }
    );

    // Only now, after verified payment, is the cart emptied
    const customer = req.user;
    customer.cart = [];
    await customer.save();

    return res.status(200).json({ success: true, message: "Payment verified", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /orders  (newest first)
export const getMyOrders = async (req, res) => {
  try {
    // Unpaid checkout attempts were never placed, so they are not part of order history
    const orders = await Order.find({ user: req.user._id, status: { $ne: "PENDING_PAYMENT" } }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Another user's order gets the same 404 as a missing one, so IDs cannot be probed
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
