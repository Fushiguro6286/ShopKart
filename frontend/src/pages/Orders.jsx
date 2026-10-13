import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/api.js";
import OrderCard from "../components/OrderCard.jsx";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError(false);
    getOrders()
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) return <p className="state-msg">Loading your orders...</p>;

  if (error) {
    return (
      <div className="state-box">
        <p className="state-title">Unable to load your orders.</p>
        <button className="btn btn-primary" onClick={loadOrders}>
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="state-box">
        <p className="state-icon">📦</p>
        <p className="state-title">You have not placed any orders yet.</p>
        <Link to="/products" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="products-page narrow-page">
      <div className="page-header">
        <div>
          <h2>My Orders</h2>
          <p className="subtitle">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
        <Link to="/products">← Continue Shopping</Link>
      </div>

      <div className="cart-list">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}

export default Orders;
