import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist } from "../services/api.js";

export const formatPrice = (price) => `₹${price.toLocaleString("en-IN")}`;

export const stockLabel = (stock) => {
  if (stock === 0) return { text: "Out of stock", className: "stock-out" };
  if (stock <= 5) return { text: `Only ${stock} left`, className: "stock-low" };
  return { text: `${stock} units left`, className: "stock-in" };
};

function ProductCard({ product, saved, onSaved }) {
  const stock = stockLabel(product.stock);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleWishlist = async () => {
    if (saving || saved) return; // block duplicate requests
    setSaving(true);
    setError("");
    try {
      await addToWishlist(product._id);
      onSaved(product._id);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) onSaved(product._id); // already saved earlier
      else if (status === 401) setError("Please log in again to save products.");
      else setError("Unable to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  let wishlistText = "♡ Add to Wishlist";
  if (saving) wishlistText = "⏳ Saving...";
  else if (saved) wishlistText = "♥ Added to Wishlist";

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} className="product-img" />
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="category">{product.category}</p>
        <p className="price">{formatPrice(product.price)}</p>
        <p className={`stock ${stock.className}`}>{stock.text}</p>

        <div className="card-actions">
          <Link to={`/products/${product._id}`} className="btn btn-primary btn-block">
            View Details
          </Link>
          <button
            className={`btn btn-wishlist ${saved ? "saved" : ""}`}
            onClick={handleWishlist}
            disabled={saving || saved}
          >
            {wishlistText}
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}

export default ProductCard;
