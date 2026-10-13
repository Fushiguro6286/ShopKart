import { formatPrice } from "./ProductCard.jsx";

// lines: [{ key, name, price, quantity }] from either cart items or saved order items
function OrderSummary({ lines, total, totalLabel = "Total" }) {
  return (
    <div className="summary-lines">
      {lines.map((line) => (
        <div key={line.key} className="summary-row">
          <span>
            {line.name} × {line.quantity}
          </span>
          <strong>{formatPrice(line.price * line.quantity)}</strong>
        </div>
      ))}
      <div className="summary-row summary-total">
        <span>{totalLabel}</span>
        <strong>{formatPrice(total)}</strong>
      </div>
    </div>
  );
}

export default OrderSummary;
