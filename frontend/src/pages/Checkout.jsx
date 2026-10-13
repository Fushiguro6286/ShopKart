import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { createPaymentOrder, getMe, verifyPayment } from "../services/api.js";
import { loadRazorpayScript } from "../utils/razorpay.js";
import { shortOrderId } from "../utils/orders.js";
import { formatPrice } from "../components/ProductCard.jsx";
import CheckoutForm, { EMPTY_ADDRESS, validateAddress } from "../components/CheckoutForm.jsx";
import OrderSummary from "../components/OrderSummary.jsx";

const BUTTON_TEXT = {
  idle: "Pay with Razorpay",
  creating: "Creating order...",
  paying: "Waiting for payment...",
  verifying: "Verifying payment...",
};

const KEEP_CART = "Your cart has not been cleared.";

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, loading, error: cartError, subtotal, refreshCart, clearCart } = useCart();
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  // idle → creating (our API) → paying (Razorpay popup) → verifying (our API)
  const [phase, setPhase] = useState("idle");
  // Popup outcome flags: closing the popup must not overwrite a failure message
  // or interrupt verification of a successful payment
  const paymentFailed = useRef(false);
  const paymentSucceeded = useRef(false);
  const busy = phase !== "idle";

  // Latest prices and stock for the summary (the server recalculates anyway)
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Prefill name and phone from the profile; the user can still change them
  useEffect(() => {
    getMe()
      .then((res) =>
        setForm((f) => ({
          ...f,
          fullName: f.fullName || res.data.fullName,
          phone: f.phone || res.data.phone,
        }))
      )
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const confirmPayment = async (shopKartOrderId, response) => {
    setPhase("verifying");
    setError("");
    try {
      // The browser only forwards Razorpay's response; the server checks the signature
      await verifyPayment({
        shopKartOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      clearCart(); // the server emptied the cart; mirror it so the Navbar shows Cart (0)
      navigate(`/orders/${shopKartOrderId}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setError(
        `${err.response?.data?.message || "We could not verify your payment."} ${KEEP_CART} ` +
          `If money was deducted, contact support with payment ID ${response.razorpay_payment_id}.`
      );
      setPhase("idle");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const newErrors = validateAddress(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return; // no API call when basic checks fail

    setError("");
    setPhase("creating");

    if (!(await loadRazorpayScript())) {
      setError("Could not load Razorpay Checkout. Check your connection and try again.");
      setPhase("idle");
      return;
    }

    const shippingAddress = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    let data;
    try {
      ({ data } = await createPaymentOrder(shippingAddress));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start checkout. Please try again.");
      // Stock or availability changed: show the cart's latest state
      if (err.response?.status === 400) refreshCart();
      setPhase("idle");
      return;
    }

    paymentFailed.current = false;
    paymentSucceeded.current = false;
    setPhase("paying");

    const razorpay = new window.Razorpay({
      key: data.key,
      amount: data.amount, // in paise, decided by the server
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "ShopKart",
      description: `Order #${shortOrderId(data.shopKartOrderId)}`,
      prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
      theme: { color: "#4f46e5" },
      // Called by Razorpay after a successful payment. This is NOT proof of payment
      handler: (response) => {
        paymentSucceeded.current = true;
        confirmPayment(data.shopKartOrderId, response);
      },
      modal: {
        ondismiss: () => {
          if (paymentSucceeded.current) return;
          if (!paymentFailed.current) setError(`Payment cancelled. ${KEEP_CART}`);
          setPhase("idle");
        },
      },
    });

    razorpay.on("payment.failed", (response) => {
      paymentFailed.current = true;
      setPhase("idle");
      setError(
        `Payment failed. ${KEEP_CART} Please try again.` +
          (response.error?.description ? ` (${response.error.description})` : "")
      );
    });

    razorpay.open();
  };

  if (loading && cartItems.length === 0) {
    return <p className="state-msg">Loading checkout...</p>;
  }

  if (cartError && cartItems.length === 0) {
    return (
      <div className="state-box">
        <p className="state-title">Unable to load your cart.</p>
        <button className="btn btn-primary" onClick={refreshCart}>
          Try Again
        </button>
      </div>
    );
  }

  // Someone opened /checkout directly with nothing to buy
  if (cartItems.length === 0) {
    return (
      <div className="state-box">
        <p className="state-icon">🛒</p>
        <p className="state-title">Your cart is empty</p>
        <p className="state-text">Add something to your cart before checking out.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const hasStockProblem = cartItems.some((item) => item.quantity > item.product.stock);
  const lines = cartItems.map((item) => ({
    key: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Checkout</h2>
        <Link to="/cart">← Back to Cart</Link>
      </div>

      <form className="cart-layout" onSubmit={handleSubmit} noValidate>
        <section className="panel">
          <h3>Shipping Details</h3>
          <CheckoutForm form={form} errors={errors} disabled={busy} onChange={handleChange} />
        </section>

        <aside className="order-summary">
          <h3>Order Summary</h3>
          <OrderSummary lines={lines} total={subtotal} />

          {hasStockProblem && (
            <div className="alert alert-error">
              Some items exceed available stock. <Link to="/cart">Update your cart</Link>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy || hasStockProblem}>
            {phase === "idle" ? `${BUTTON_TEXT.idle} · ${formatPrice(subtotal)}` : BUTTON_TEXT[phase]}
          </button>
          <p className="summary-note">Test mode: no real money is charged.</p>
        </aside>
      </form>
    </div>
  );
}

export default Checkout;
