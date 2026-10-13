import axios from "axios";

// withCredentials makes the browser send/receive the HttpOnly auth cookie
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Customers
export const registerCustomer = (data) => api.post("/customers/register", data);
export const loginCustomer = (data) => api.post("/customers/login", data);
export const getMe = () => api.get("/customers/me");
export const logoutCustomer = () => api.post("/customers/logout");

// Products
export const getProducts = ({ search = "", category = "" } = {}) => {
  const params = {};
  if (search.trim()) params.search = search.trim();
  if (category) params.category = category;
  return api.get("/products", { params });
};
export const getProductById = (id) => api.get(`/products/${id}`);

// Wishlist (the server identifies the user from the auth cookie)
export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// Cart (every call returns the full, populated cart)
export const getCart = () => api.get("/cart");
export const addToCart = (productId) => api.post(`/cart/${productId}`);
export const updateCartQuantity = (productId, quantity) =>
  api.patch(`/cart/${productId}`, { quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);

// Orders (only the shipping address is sent; the server builds items and the total)
export const createPaymentOrder = (shippingAddress) =>
  api.post("/orders/create-payment-order", { shippingAddress });
export const verifyPayment = (data) => api.post("/orders/verify-payment", data);
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);

export default api;
