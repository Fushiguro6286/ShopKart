import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../services/api.js";
import { formatPrice, stockLabel } from "../components/ProductCard.jsx";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getProductById(id)
      .then((res) => setProduct(res.data.product))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 404 || status === 400) setError("Product not found.");
        else setError("Something went wrong while loading the product.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="state-msg">Loading product...</p>;

  if (error) {
    return (
      <div className="state-msg">
        <p className="state-error">{error}</p>
        <Link to="/products">← Back to products</Link>
      </div>
    );
  }

  const stock = stockLabel(product.stock);

  return (
    <div className="details-page">
      <Link to="/products" className="back-link">
        ← Back to products
      </Link>

      <div className="details">
        <img src={product.image} alt={product.name} className="details-img" />

        <div className="details-info">
          <p className="category">{product.category}</p>
          <h2>{product.name}</h2>
          <p className="price details-price">{formatPrice(product.price)}</p>
          <p className={`stock ${stock.className}`}>{stock.text}</p>
          <p className="description">{product.description}</p>

          <button
            className="btn btn-primary"
            disabled={product.stock === 0}
            onClick={() => setAdded(true)}
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
          {added && <p className="added-msg">Added to cart! (Cart coming in a later lab)</p>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
