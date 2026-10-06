import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe } from "../services/api.js";

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    getMe()
      .then((res) => setCustomer(res.data))
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  if (!customer) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="card home-card">
      <h2>Welcome, {customer.fullName.split(" ")[0]}! 👋</h2>
      <p className="subtitle">You are logged in to ShopKart</p>

      <div className="profile">
        <div className="avatar">{customer.fullName.charAt(0).toUpperCase()}</div>
        <div className="profile-row">
          <span>Name</span>
          <strong>{customer.fullName}</strong>
        </div>
        <div className="profile-row">
          <span>Email</span>
          <strong>{customer.email}</strong>
        </div>
        <div className="profile-row">
          <span>Phone</span>
          <strong>{customer.phone}</strong>
        </div>
      </div>

      <Link to="/products" className="btn btn-primary btn-block">
        Start Shopping →
      </Link>
    </div>
  );
}

export default Home;
