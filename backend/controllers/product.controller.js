import mongoose from "mongoose";
import Product from "../models/product.model.js";

// Escape special regex characters so user search text is matched literally
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /products
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !description || !category || !image || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ success: false, message: "Price must be a number greater than 0" });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must be a whole number, minimum 0" });
    }

    const product = await Product.create({ name, description, price, category, image, stock });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products?search=&category=
export const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    const products = await Product.find(query)
      .select("name price category image stock")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
