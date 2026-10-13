import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "./ProductCard.jsx";

function CartItem({ item }) {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart, isPending } = useCart();
  const [error, setError] = useState("");
  // Only this row is disabled while its request runs; other rows stay usable
  const busy = isPending(product._id);

  const overStock = quantity > product.stock;
  // If stock dropped below the quantity, "-" jumps straight down to the available stock
  const decreaseTo = Math.min(quantity - 1, product.stock);

  const run = async (action) => {
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cart-item">
      <Link to={`/products/${product._id}`}>
        <img src={product.image} alt={product.name} className="cart-item-img" />
      </Link>

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <p className="cart-item-price">{formatPrice(product.price)}</p>

        {product.stock === 0 ? (
          <p className="stock stock-out">Out of stock. Please remove this item.</p>
        ) : overStock ? (
          <p className="stock stock-out">Only {product.stock} left. Please reduce the quantity.</p>
        ) : (
          quantity === product.stock && (
            <p className="stock stock-low">Maximum available quantity</p>
          )
        )}

        <div className="cart-item-controls">
          <div className="qty-control">
            <button
              aria-label="Decrease quantity"
              onClick={() => run(() => updateQuantity(product._id, decreaseTo))}
              disabled={busy || decreaseTo < 1}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => run(() => updateQuantity(product._id, quantity + 1))}
              disabled={busy || quantity >= product.stock}
            >
              +
            </button>
          </div>

          <button
            className="btn btn-remove btn-small"
            onClick={() => run(() => removeFromCart(product._id))}
            disabled={busy}
          >
            {busy ? "Updating..." : "Remove"}
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>

      <p className="cart-item-total">{formatPrice(product.price * quantity)}</p>
    </div>
  );
}

export default CartItem;
