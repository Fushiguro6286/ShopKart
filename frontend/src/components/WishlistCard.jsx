import { Link } from "react-router-dom";
import { formatPrice, stockLabel } from "./ProductCard.jsx";

function WishlistCard({ product, removing, onRemove }) {
  const stock = stockLabel(product.stock);

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
            className="btn btn-remove"
            onClick={() => onRemove(product._id)}
            disabled={removing}
          >
            {removing ? "Removing..." : "Remove ♥"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WishlistCard;
