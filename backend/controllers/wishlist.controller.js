import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

// The current user always comes from the auth middleware (req.user), never from the request

// POST /wishlist/:productId
export const addToWishlist = async (req, res) => {
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
    if (customer.wishlist.some((id) => id.equals(productId))) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    });

    // populate() drops references to products that were deleted
    const wishlist = customer.wishlist;

    return res.status(200).json({ success: true, count: wishlist.length, wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = req.user;
    if (!customer.wishlist.some((id) => id.equals(productId))) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    customer.wishlist.pull(productId);
    await customer.save();

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
