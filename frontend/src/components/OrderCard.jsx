import { Link } from "react-router-dom";
import { formatPrice } from "./ProductCard.jsx";
import { formatDate, shortOrderId, statusClass, statusLabel } from "../utils/orders.js";

function OrderCard({ order }) {
  return (
    <div className="panel order-card">
      <div className="order-card-head">
        <div>
          <h3>Order #{shortOrderId(order._id)}</h3>
          <p className="category">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${statusClass(order.status)}`}>{statusLabel(order.status)}</span>
      </div>

      <ul className="order-card-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>

      <div className="order-card-foot">
        <strong>Total: {formatPrice(order.totalAmount)}</strong>
        <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-small">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default OrderCard;
