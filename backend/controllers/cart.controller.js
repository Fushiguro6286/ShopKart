import mongoose from "mongoose";
import Product from "../models/product.model.js";

// The current user always comes from the auth middleware (req.user), never from the request.
// Subtotal and item counts are never stored; the frontend derives them from the cart.

const PRODUCT_FIELDS = "name price category image stock";

const findCartItem = (customer, productId) =>
  customer.cart.find((item) => item.product.equals(productId));

// Populate products and send the cart, so every response carries the latest price and stock
const sendCart = async (res, customer, message) => {
  await customer.populate({ path: "cart.product", select: PRODUCT_FIELDS });
  // populate() leaves product as null when the product was deleted; hide those rows
  const cart = customer.cart.filter((item) => item.product);

  return res.status(200).json(message ? { success: true, message, cart } : { success: true, cart });
};

const stockMessage = (product) =>
  product.stock === 0
    ? `${product.name} is out of stock`
    : `Only ${product.stock} ${product.stock === 1 ? "unit" : "units"} of ${product.name} available`;

// POST /cart/:productId
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = req.user;
    const existing = findCartItem(customer, productId);
    const newQuantity = existing ? existing.quantity + 1 : 1;

    if (newQuantity > product.stock) {
      return res.status(400).json({ success: false, message: stockMessage(product) });
    }

    // Same product added again: increase quantity instead of adding a duplicate row
    if (existing) existing.quantity = newQuantity;
    else customer.cart.push({ product: productId, quantity: 1 });

    await customer.save();
    return sendCart(res, customer, "Cart updated");
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /cart
export const getCart = async (req, res) => {
  try {
    return sendCart(res, req.user);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /cart/:productId   body: { "quantity": 3 }
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body ?? {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = req.user;
    const item = findCartItem(customer, productId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    // Always check against the latest stock, not the stock when the item was added
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: stockMessage(product) });
    }

    item.quantity = quantity;
    await customer.save();
    return sendCart(res, customer, "Cart updated");
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = req.user;
    if (!findCartItem(customer, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    customer.cart = customer.cart.filter((item) => !item.product.equals(productId));
    await customer.save();
    return sendCart(res, customer, "Product removed from cart");
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
