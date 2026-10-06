import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../services/api.js";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = "Enter a 10-digit phone number";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await registerCustomer(form);
      navigate("/login", { state: { registered: true } });
    } catch (error) {
      setServerError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Account</h2>
      <p className="subtitle">Join ShopKart and start shopping</p>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label>Full Name</label>
        <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" />
        {errors.fullName && <p className="field-error">{errors.fullName}</p>}

        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@gmail.com" />
        {errors.email && <p className="field-error">{errors.email}</p>}

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
        {errors.password && <p className="field-error">{errors.password}</p>}

        <label>Phone Number</label>
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
        {errors.phone && <p className="field-error">{errors.phone}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p className="switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
