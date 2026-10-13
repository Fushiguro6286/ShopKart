import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getOrderById } from "../services/api.js";
import { formatPrice } from "../components/ProductCard.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import { formatDate, shortOrderId, statusClass, statusLabel } from "../utils/orders.js";

// Order details, also used as the confirmation screen right after payment
function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = Boolean(location.state?.justPlaced);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = useCallback(() => {
    setLoading(true);
    setError("");
    getOrderById(id)
      .then((res) => setOrder(res.data.order))
      .catch((err) => {
        const status = err.response?.status;
        // Someone else's order also returns 404, so it looks exactly like a missing one
        if (status === 404 || status === 400) setError("Order not found.");
        else setError("Unable to load this order.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) return <p className="state-msg">Loading order...</p>;

  if (error) {
    return (
      <div className="state-box">
        <p className="state-title">{error}</p>
        {error === "Order not found." ? (
          <Link to="/orders" className="btn btn-primary">
            View My Orders
          </Link>
        ) : (
          <button className="btn btn-primary" onClick={loadOrder}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  const { shippingAddress: address } = order;
  const lines = order.items.map((item) => ({
    key: item.product,
    name: item.name,
    price: item.price, // price saved at purchase time
    quantity: item.quantity,
  }));

  return (
    <div className="products-page narrow-page">
      {justPlaced && (
        <div className="panel success-banner">
          <p className="state-icon">✅</p>
          <h2>Order Placed Successfully</h2>
          <p className="state-text">
            Your payment was verified and your order has been saved. Total paid:{" "}
            <strong>{formatPrice(order.totalAmount)}</strong>
          </p>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>Order #{shortOrderId(order._id)}</h2>
          <p className="subtitle">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${statusClass(order.status)}`}>{statusLabel(order.status)}</span>
      </div>

      <div className="details-grid">
        <section className="panel">
          <h3>Items</h3>
          <OrderSummary
            lines={lines}
            total={order.totalAmount} totalLabel={order.paymentStatus === "PAID" ? "Total paid" : "Total"}
          />
        </section>

        <section className="panel">
          <h3>Delivery Address</h3>
          <p>
            <strong>{address.fullName}</strong>
          </p>
          <p>{address.addressLine1}</p>
          <p>
            {address.city}, {address.state} {address.pincode}
          </p>
          <p>Phone: {address.phone}</p>

          <h3 className="panel-subhead">Payment</h3>
          <div className="summary-row">
            <span>Status</span>
            <strong>{order.paymentStatus}</strong>
          </div>
          {order.razorpayPaymentId && (
            <div className="summary-row">
              <span>Payment ID</span>
              <code>{order.razorpayPaymentId}</code>
            </div>
          )}
          <div className="summary-row">
            <span>Order ID</span>
            <code>{order._id}</code>
          </div>
        </section>
      </div>

      <div className="button-row">
        <Link to="/orders" className="btn btn-primary">
          View My Orders
        </Link>
        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderDetails;
