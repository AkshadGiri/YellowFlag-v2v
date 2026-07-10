import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (e2) {
      setError(e2.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h1>Join SafeSphere 🌸</h1>
          <p className="auth-subtitle">
            Create your account and stay connected with the people who matter
            most.
          </p>
        </div>

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Phone Number</label>
        <input
          type="text"
          placeholder="Enter your phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Minimum 6 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={6}
          required
        />

        {error && <p className="sos-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
