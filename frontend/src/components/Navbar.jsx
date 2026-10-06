import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { logoutCustomer } from "../services/api.js";

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLoggedInPage = ["/home", "/products", "/wishlist"].some((p) => pathname.startsWith(p));

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (error) {
      // Cookie may already be gone; still send the user to login
    }
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to={isLoggedInPage ? "/home" : "/login"} className="brand">
        Shop<span>Kart</span>
      </Link>

      <div className="nav-links">
        {isLoggedInPage ? (
          <>
            <NavLink to="/home" end>Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/wishlist">Wishlist</NavLink>
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
