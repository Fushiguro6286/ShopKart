import express from "express";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} from "../controllers/cart.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// Every cart route is protected; the cart owner is always the logged-in user
router.use(protect);

router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);

export default router;
