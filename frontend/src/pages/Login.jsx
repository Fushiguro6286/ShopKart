import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginCustomer } from "../services/api.js";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      await loginCustomer(form);
      navigate("/home");
    } catch (err) {
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Welcome Back</h2>
      <p className="subtitle">Login to your ShopKart account</p>

      {location.state?.registered && !error && (
        <div className="alert alert-success">Account created! Please log in.</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@gmail.com" />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Your password" />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="switch">
        New to ShopKart? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

export default Login;
