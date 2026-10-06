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

export default api;
