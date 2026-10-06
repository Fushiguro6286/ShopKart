import { useEffect, useState } from "react";
import { getProducts, getWishlist } from "../services/api.js";
import SearchBar from "../components/SearchBar.jsx";
import ProductCard from "../components/ProductCard.jsx";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Load saved product IDs once so already-saved cards show "♥ Added to Wishlist"
  useEffect(() => {
    getWishlist()
      .then((res) => setWishlistIds(new Set(res.data.wishlist.map((p) => p._id))))
      .catch(() => {}); // not critical; cards still work and the server rejects duplicates
  }, []);

  const handleSaved = (productId) => {
    setWishlistIds((ids) => new Set(ids).add(productId));
  };

  useEffect(() => {
    // Wait until the user stops typing before calling the API
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      getProducts({ search, category })
        .then((res) => setProducts(res.data.products))
        .catch(() => setError("Something went wrong while loading products."))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [search, category]);

  const renderContent = () => {
    if (loading) return <p className="state-msg">Loading products...</p>;
    if (error) return <p className="state-msg state-error">{error}</p>;
    if (products.length === 0) return <p className="state-msg">No products found.</p>;

    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            saved={wishlistIds.has(product._id)}
            onSaved={handleSaved}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="products-page">
      <h2>Products</h2>
      <SearchBar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />
      {renderContent()}
    </div>
  );
}

export default Products;
