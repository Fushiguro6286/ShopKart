import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// Every wishlist route is protected; there is intentionally no /wishlist/:userId
router.use(protect);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
