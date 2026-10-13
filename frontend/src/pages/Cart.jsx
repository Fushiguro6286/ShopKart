import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import CartItem from "../components/CartItem.jsx";
import { formatPrice } from "../components/ProductCard.jsx";

function Cart() {
  const { cartItems, loading, error, totalUnits, subtotal, refreshCart } = useCart();
  const navigate = useNavigate();

  // Reload from the server on open so prices and stock are the latest values
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Items already on screen stay visible during a background refresh
  if (loading && cartItems.length === 0) {
    return <p className="state-msg">Loading your cart...</p>;
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="state-box">
        <p className="state-title">Unable to load your cart.</p>
        <button className="btn btn-primary" onClick={refreshCart}>
          Try Again
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="state-box">
        <p className="state-icon">🛒</p>
        <p className="state-title">Your cart is empty</p>
        <p className="state-text">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const hasStockProblem = cartItems.some((item) => item.quantity > item.product.stock);

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h2>My Cart</h2>
          <p className="subtitle">
            {cartItems.length} {cartItems.length === 1 ? "product" : "products"} in your cart
          </p>
        </div>
        <Link to="/products">← Continue Shopping</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <div className="cart-list">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </div>

        <aside className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items</span>
            <strong>{totalUnits}</strong>
          </div>
          <div className="summary-row summary-total">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={hasStockProblem}
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
          {hasStockProblem && (
            <p className="field-error">Fix the highlighted quantities before checkout.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Cart;
