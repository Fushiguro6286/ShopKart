import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/api.js";
import WishlistCard from "../components/WishlistCard.jsx";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState("");

  const loadWishlist = useCallback(() => {
    setLoading(true);
    setError(false);
    getWishlist()
      .then((res) => setWishlist(res.data.wishlist))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    setRemoveError("");
    try {
      await removeFromWishlist(productId);
      setWishlist((items) => items.filter((item) => item._id !== productId));
    } catch (err) {
      if (err.response?.status === 404) {
        // Already gone on the server; keep the UI in sync
        setWishlist((items) => items.filter((item) => item._id !== productId));
      } else {
        setRemoveError("Unable to remove product. Please try again.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <p className="state-msg">Loading your wishlist...</p>;

  if (error) {
    return (
      <div className="state-box">
        <p className="state-title">Something went wrong.</p>
        <p className="state-text">We couldn't load your wishlist.</p>
        <button className="btn btn-primary" onClick={loadWishlist}>
          Try Again
        </button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="state-box">
        <p className="state-icon">❤️</p>
        <p className="state-title">Your wishlist is empty</p>
        <p className="state-text">Save products you love and find them here later.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h2>My Wishlist</h2>
          <p className="subtitle">
            {wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved
          </p>
        </div>
        <Link to="/products">← Continue Shopping</Link>
      </div>

      {removeError && <div className="alert alert-error">{removeError}</div>}

      <div className="product-grid">
        {wishlist.map((product) => (
          <WishlistCard
            key={product._id}
            product={product}
            removing={removingId === product._id}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
