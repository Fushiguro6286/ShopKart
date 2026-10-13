import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";

// One shared copy of the cart for the whole app (Navbar, product cards, cart page).
// The server stays the source of truth: every mutation replaces cartItems with the
// cart returned by the API, so all components always show the same data.
const CartContext = createContext(null);

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // productId -> true while a request for that product is running (per-item loading)
  const [pending, setPending] = useState({});

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getCart();
      setCartItems(res.data.cart);
    } catch (err) {
      // 401 just means nobody is logged in yet: an empty cart, not an error
      if (err.response?.status === 401) setCartItems([]);
      else setError("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Runs one cart API call for a product and stores the cart the server sends back.
  // On failure it throws an Error with a user-friendly message for the calling component.
  const mutate = useCallback(
    async (productId, request, fallbackMessage) => {
      setPending((p) => ({ ...p, [productId]: true }));
      try {
        const res = await request();
        setCartItems(res.data.cart);
      } catch (err) {
        // The server and UI disagree (e.g. item removed in another tab); resync
        if (err.response?.status === 404) refreshCart();
        throw new Error(errorMessage(err, fallbackMessage));
      } finally {
        setPending((p) => {
          const next = { ...p };
          delete next[productId];
          return next;
        });
      }
    },
    [refreshCart]
  );

  const addToCart = useCallback(
    (productId) =>
      mutate(productId, () => api.addToCart(productId), "Unable to add to cart. Please try again."),
    [mutate]
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      mutate(
        productId,
        () => api.updateCartQuantity(productId, quantity),
        "Unable to update quantity. Please try again."
      ),
    [mutate]
  );

  const removeFromCart = useCallback(
    (productId) =>
      mutate(productId, () => api.removeFromCart(productId), "Unable to remove item. Please try again."),
    [mutate]
  );

  // Used on logout so the next user never sees the previous user's cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setError("");
  }, []);

  const value = useMemo(() => {
    // Derived values: calculated from cartItems on every change, never stored
    const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      cartItems,
      loading,
      error,
      totalUnits,
      subtotal,
      getQuantity: (productId) =>
        cartItems.find((item) => item.product._id === productId)?.quantity ?? 0,
      isPending: (productId) => Boolean(pending[productId]),
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    };
  }, [cartItems, loading, error, pending, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
